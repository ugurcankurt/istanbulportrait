import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import { generateEmbedding } from "../lib/ai/embedding";

dotenv.config({ path: ".env.local" });

const generateEmbeddings = async () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error("Missing Supabase environment variables");
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting embedding generation...");

    // 1. Clear existing documents
    // Note: specific removal logic can be added if needed, for now we might want to truncate or upsert
    // await supabase.from("documents").delete().neq("id", 0);

    // 2. Process Packages from DB
    console.log("Fetching packages from DB...");
    const { data: packages, error } = await supabase.from("packages").select("*");
    if (error) {
        console.error("Error fetching packages:", error);
    } else if (packages) {
        for (const pkg of packages) {
            // Assuming pkg.name and pkg.description are JSONB or strings. 
            // If they are JSONB with locales, we should serialize them or extract 'en'
            const content = `Package: ${JSON.stringify(pkg.name)}\nPrice: ${pkg.price}\nFeatures: ${JSON.stringify(pkg.features)}\nDescription: ${JSON.stringify(pkg.description)}`;

            try {
                const embedding = await generateEmbedding(content);
                await supabase.from("documents").insert({
                    content,
                    metadata: { type: "package", id: pkg.id },
                    embedding,
                });
                console.log(`Processed package: ${pkg.id}`);
            } catch (e) {
                console.error(`Failed to process package ${pkg.id}:`, e);
            }
        }
    }

    // 3. Process Static Content (JSON files)
    const locales = ["en", "ru", "ar", "es", "zh"];
    for (const locale of locales) {
        const filePath = path.join(process.cwd(), `messages/${locale}.json`);
        try {
            const fileContent = await fs.readFile(filePath, "utf-8");
            const messages = JSON.parse(fileContent);

            // Extract FAQs
            if (messages.faq && messages.faq.questions) {
                for (const [key, q] of Object.entries(messages.faq.questions as Record<string, any>)) {
                    const content = `Question: ${q.question}\nAnswer: ${q.answer}`;
                    const embedding = await generateEmbedding(content);
                    await supabase.from("documents").insert({
                        content,
                        metadata: { type: "faq", locale, key },
                        embedding,
                    });
                    console.log(`Processed FAQ: ${key} (${locale})`);
                }
            }

            // Extract About Info
            if (messages.about) {
                const content = `About Istanbul Portrait: ${messages.about.description}\nExperience: ${messages.about.experience}`;
                const embedding = await generateEmbedding(content);
                await supabase.from("documents").insert({
                    content,
                    metadata: { type: "about", locale },
                    embedding,
                });
                console.log(`Processed About section (${locale})`);
            }

            // Extract Static Packages info if distinct from DB
            if (messages.packages) {
                // General info
                const content = `General Package Info: ${messages.packages.intro || messages.packages.subtitle}`;
                await supabase.from("documents").insert({
                    content,
                    metadata: { type: "static_package_info", locale },
                    embedding: await generateEmbedding(content),
                });

                // Detailed items (Essential, Premium, etc.)
                // Structure: packages: { essential: { ... }, premium: { ... } }
                for (const [key, item] of Object.entries(messages.packages as Record<string, any>)) {
                    // Filter only package objects (must have a price)
                    if (item && typeof item === 'object' && item.price && item.title) {
                        const packageContent = `Package Name: ${item.title}\nPrice: ${item.price}\nDuration: ${item.duration}\nLocation: ${item.locations}\nFeatures: ${JSON.stringify(item.features)}\nDescription: ${item.description || item.title}`;

                        await supabase.from("documents").insert({
                            content: packageContent,
                            metadata: { type: "static_package_item", locale, key },
                            embedding: await generateEmbedding(packageContent),
                        });
                        console.log(`Processed Static Package Item: ${item.title} (${locale})`);
                    }
                }
            }

        } catch (e) {
            console.error(`Error processing locale ${locale}:`, e);
        }
    }

    console.log("Embedding generation complete!");
};

generateEmbeddings().catch(console.error);
