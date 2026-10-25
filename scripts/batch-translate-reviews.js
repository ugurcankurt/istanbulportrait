const { createClient } = require("@supabase/supabase-js");
const fs = require("node:fs");
const path = require("node:path");

// Load .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf8");

function getEnv(key) {
  const match = envContent.match(new RegExp(`${key}=([^\\r\\n]+)`));
  return match ? match[1].replace(/[\x27\x22]/g, "").trim() : "";
}

const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
const supabaseKey =
  getEnv("SUPABASE_SERVICE_KEY") || getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const nvidiaKey = getEnv("NVIDIA_API_KEY");

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

if (!nvidiaKey) {
  console.error("Missing NVIDIA_API_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const LOCALES = ["tr", "de", "fr", "es", "ru", "ar", "ro", "zh"];

async function translateTextWithAI(text, locale) {
  const prompt = `You are a professional localization expert. Translate the following customer review into language code "${locale}". Maintain the original positive, authentic and natural tone. Return ONLY the translation, with no explanation or extra quotes:\n\n${text}`;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(
        "https://integrate.api.nvidia.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${nvidiaKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "meta/llama-3.2-11b-vision-instruct",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1,
            max_tokens: 350,
          }),
          signal: controller.signal,
        },
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const output = data.choices?.[0]?.message?.content?.trim();
        if (output) {
          return output.replace(/^["'\x60]|["'\x60]$/g, "").trim();
        }
      } else if (res.status === 429) {
        // Rate limit, backoff
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
      }
    } catch (_err) {
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  return text;
}

async function run() {
  console.log("=== BATCH TRANSLATING ALL GOOGLE REVIEWS FOR ALL LOCALES ===");

  // 1. Fetch from Featurable
  const featurableRes = await fetch(
    "https://featurable.com/api/v1/widgets/ce950623-57ec-498e-8b11-c6d2d84fd5ef?minRating=3&sortBy=newest&hideEmptyReviews=false",
  );
  if (!featurableRes.ok) {
    throw new Error(`Featurable error: ${featurableRes.status}`);
  }
  const featurableData = await featurableRes.json();
  const rawReviews = featurableData.reviews || [];

  // Filter reviews with text
  const reviewsWithText = rawReviews
    .map((r, idx) => {
      const id = String(
        r.reviewId ||
          r.id ||
          `review-${r.reviewer?.displayName || "anon"}-${r.createTime || idx}`,
      );
      return {
        id,
        author: r.reviewer?.displayName || "Anonymous",
        text: (r.comment || "").trim(),
      };
    })
    .filter((r) => r.text.length > 0);

  console.log(`Found ${reviewsWithText.length} reviews with text comments.`);

  // 2. Fetch current DB record
  const { data: pageRecord, error: pageErr } = await supabase
    .from("pages")
    .select("id, content")
    .eq("slug", "home-reviews")
    .single();

  if (pageErr || !pageRecord) {
    throw new Error(`Failed to load home-reviews page: ${pageErr?.message}`);
  }

  const currentContent = pageRecord.content || {};
  const translations = currentContent.review_translations || {};

  // Find all missing translation jobs: { reviewId, text, locale, author }
  const jobs = [];
  for (const review of reviewsWithText) {
    if (!translations[review.id]) {
      translations[review.id] = {};
    }
    for (const locale of LOCALES) {
      if (!translations[review.id][locale]) {
        jobs.push({
          reviewId: review.id,
          text: review.text,
          author: review.author,
          locale,
        });
      }
    }
  }

  console.log(`Remaining translation jobs to process: ${jobs.length}`);

  if (jobs.length === 0) {
    console.log("All reviews are already translated and cached in Supabase!");
    return;
  }

  // 3. Process jobs with concurrency
  const CONCURRENCY = 4;
  let completed = 0;
  let hasPendingWrites = false;

  async function saveProgress() {
    console.log(
      `--> Saving progress to Supabase (${completed}/${jobs.length} done)...`,
    );
    const { error: saveErr } = await supabase
      .from("pages")
      .update({
        content: {
          ...currentContent,
          review_translations: translations,
        },
      })
      .eq("id", pageRecord.id);

    if (saveErr) {
      console.error("Error saving progress to Supabase:", saveErr.message);
    } else {
      hasPendingWrites = false;
    }
  }

  async function worker(queue) {
    while (queue.length > 0) {
      const job = queue.shift();
      try {
        const translated = await translateTextWithAI(job.text, job.locale);
        translations[job.reviewId][job.locale] = translated;
        completed++;
        hasPendingWrites = true;

        if (completed % 10 === 0) {
          console.log(`Progress: ${completed}/${jobs.length} jobs completed.`);
          await saveProgress();
        }
      } catch (err) {
        console.error(
          `Error translating for ${job.reviewId} (${job.locale}):`,
          err.message,
        );
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker(jobs));
  await Promise.all(workers);

  if (hasPendingWrites) {
    await saveProgress();
  }

  console.log("\n=== ALL TRANSLATIONS COMPLETED AND SAVED TO SUPABASE! ===");
  console.log(`Total reviews in cache: ${Object.keys(translations).length}`);
  LOCALES.forEach((loc) => {
    const count = Object.values(translations).filter((t) =>
      Boolean(t[loc]),
    ).length;
    console.log(`- Locale [${loc}]: ${count} reviews ready in Supabase`);
  });
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
