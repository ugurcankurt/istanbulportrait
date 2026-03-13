import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        
        // Generate a secure, unique filename to prevent collisions and guessable URLs
        const uniqueId = crypto.randomUUID();
        const extension = file.name.split('.').pop() || 'jpg';
        const fileName = `${uniqueId}.${extension}`;

        const { data, error } = await supabaseAdmin.storage
            .from("print-uploads")
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: false,
            });

        if (error) {
            console.error("Supabase storage error:", error);
            return NextResponse.json({ error: "Failed to upload to storage." }, { status: 500 });
        }

        const { data: publicUrlData } = supabaseAdmin.storage
            .from("print-uploads")
            .getPublicUrl(fileName);

        return NextResponse.json({ url: publicUrlData.publicUrl });
    } catch (error) {
        console.error("Upload route error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
