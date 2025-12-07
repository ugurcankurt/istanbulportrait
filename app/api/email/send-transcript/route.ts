import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
    try {
        const { messages, userEmail, userPhone, customerName, subject } = await req.json();

        const formattedChat = messages.map((m: any) =>
            `<strong>${m.role === 'user' ? 'User' : 'Emily'}:</strong> ${m.content}`
        ).join('<br/><br/>');

        const { data, error } = await resend.emails.send({
            from: 'Istanbul Portrait AI <onboarding@resend.dev>', // Update this if verified domain exists, else use onboarding
            to: ['razor.girdap@gmail.com'], // Updated to authorized testing email
            subject: subject || 'New Chat Transcript - Istanbul Portrait',
            html: `
        <h2>New Chat Session</h2>
        <p><strong>Customer Name:</strong> ${customerName || 'N/A'}</p>
        <p><strong>Email:</strong> ${userEmail || 'N/A'}</p>
        <p><strong>Phone:</strong> ${userPhone || 'N/A'}</p>
        <hr/>
        <h3>Transcript:</h3>
        <div style="background:#f9f9f9; padding:20px; border-radius:5px;">
          ${formattedChat}
        </div>
      `,
        });

        if (error) {
            console.error('Resend Error:', error);
            return NextResponse.json({ error }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Email Error:', error);
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }
}
