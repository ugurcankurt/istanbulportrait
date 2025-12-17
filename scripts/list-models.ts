import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error("Error: GOOGLE_GENERATIVE_AI_API_KEY not found in .env.local");
    process.exit(1);
}

async function listModels() {
    console.log("Fetching available models...");
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            console.error("Error fetching models:", data);
            return;
        }

        console.log("Available Models:");
        if (data.models) {
            data.models.forEach((model: any) => {
                if (model.supportedGenerationMethods && model.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${model.name} (Supported: generateContent)`);
                } else {
                    console.log(`- ${model.name}`);
                }
            });
        } else {
            console.log("No models found in response:", data);
        }

    } catch (error) {
        console.error("Network error:", error);
    }
}

listModels();
