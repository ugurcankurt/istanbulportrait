export const generateEmbedding = async (text: string): Promise<number[]> => {
    const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!GEMINI_API_KEY) {
        throw new Error("API Key not found");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            content: {
                parts: [
                    {
                        text: text.replaceAll("\\n", " "),
                    },
                ],
            },
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Gemini API Error: ${response.status} - ${errorBody}`);
    }

    const data = await response.json();
    return data.embedding.values;
};

export const generateEmbeddings = async (
    values: string[],
): Promise<number[][]> => {
    // Gemini doesn't support batch embeddings in the same way via simple REST easily for mixed content without complex batching.
    // For simplicity and robustness in this script context, we'll map them strictly.
    // Ideally, we'd use batchEmbedContents but let's stick to simple sequential for the script for now to minimize complexity.
    const results = [];
    for (const value of values) {
        results.push(await generateEmbedding(value));
    }
    return results;
};
