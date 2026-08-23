import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBlogData() {
  console.log("Connecting to Supabase project:", supabaseUrl);

  const results = {
    authors: 0,
    posts: 0,
    categories: 0,
    tags: 0,
  };

  // 1. Check blog posts
  const { data: posts, error: postsError } = await supabase
    .from("blog_posts")
    .select("id, status, is_featured, created_at, updated_at");

  if (postsError) {
    console.error("Error fetching posts:", postsError.message);
  } else {
    results.posts = posts?.length || 0;
    console.log(`Found ${results.posts} blog posts.`);
    if (posts && posts.length > 0) {
      console.log("Sample post:", posts[0]);
    }
  }

  // 2. Check authors
  const { data: authors, error: authorsError } = await supabase
    .from("blog_authors")
    .select("id, name, bio");

  if (authorsError) {
    console.error("Error fetching authors:", authorsError.message);
  } else {
    results.authors = authors?.length || 0;
    console.log(`Found ${results.authors} authors.`);
  }

  // 3. Check categories
  const { data: categories, error: catError } = await supabase
    .from("blog_categories")
    .select("id, slug");

  if (catError) {
    console.error("Error fetching categories:", catError.message);
  } else {
    results.categories = categories?.length || 0;
    console.log(`Found ${results.categories} categories.`);
  }

  console.log("\nLive Database Check Completed.");
}

checkBlogData();
