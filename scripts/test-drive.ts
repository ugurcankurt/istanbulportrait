import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createDriveFolder } from "../lib/google-drive";

async function run() {
  try {
    console.log("Testing Google Drive connection...");
    const folder = await createDriveFolder("Test Folder API");
    console.log("Success! Folder created:", folder);
  } catch (err: any) {
    console.error("Failed:", err.message);
    if (err.response) {
       console.error(err.response.data);
    }
  }
}
run();
