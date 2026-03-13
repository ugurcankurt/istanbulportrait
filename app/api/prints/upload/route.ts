import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
    try {
        const { fileName, fileType } = await request.json();

        if (!fileName || !fileType) {
            return NextResponse.json({ error: "File name and type are required" }, { status: 400 });
        }

        // Generate a secure, unique filename to prevent collisions and guessable URLs
        const uniqueId = crypto.randomUUID();
        const extension = fileName.split('.').pop() || 'jpg';
        const path = `${uniqueId}.${extension}`;

        // Create a signed upload URL (valid for 60 seconds)
        const { data, error } = await supabaseAdmin.storage
            .from("print-uploads")
            .createSignedUploadUrl(path);

        if (error) {
            console.error("Supabase signed URL error:", error);
            return NextResponse.json({ error: "Failed to generate upload URL." }, { status: 500 });
        }

        const { data: publicUrlData } = supabaseAdmin.storage
            .from("print-uploads")
            .getPublicUrl(path);

        return NextResponse.json({ 
            signedUrl: data.signedUrl, 
            path: path,
            token: data.token,
            publicUrl: publicUrlData.publicUrl 
        });
    } catch (error) {
        console.error("Upload route error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
