import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "demo-resend-key");

export interface BookingConfirmationData {
  customerName: string;
  customerEmail: string;
  packageName: string;
  bookingDate: string;
  bookingTime: string;
  totalAmount: number;
  bookingId: string;
}

export const sendBookingConfirmation = async (
  data: BookingConfirmationData,
) => {
  try {
    // Check if we have a valid API key
    if (
      !process.env.RESEND_API_KEY ||
      process.env.RESEND_API_KEY === "demo-resend-key"
    ) {
      throw new Error("Resend API key is not configured properly");
    }

    const result = await resend.emails.send({
      from: "Photographer in Istanbul <info@istanbulportrait.com>",
      to: [data.customerEmail],
      subject: `Booking Confirmation - ${data.packageName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; text-align: center;">Booking Confirmation</h1>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #333; margin-top: 0;">Dear ${data.customerName},</h2>
            <p>Thank you for booking with Istanbul Portrait! Your booking has been confirmed.</p>
          </div>

          <div style="border: 1px solid #e5e5e5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Booking Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Booking ID:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${data.bookingId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Package:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${data.packageName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Date:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${data.bookingDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Time:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${data.bookingTime}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Total Amount:</strong></td>
                <td style="padding: 8px 0; font-weight: bold; color: #2563eb;">€${data.totalAmount}</td>
              </tr>
            </table>
          </div>

          <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #1e40af; margin-top: 0;">What's Next?</h4>
            <p style="margin: 0; color: #1e40af;">We will contact you 24 hours before your session to confirm the location and any special requirements.</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <p>Have questions? Contact us at <a href="mailto:info@istanbulportrait.com">info@istanbulportrait.com</a></p>
            <p style="color: #666; font-size: 14px;">Istanbul Photographer<br/>Istanbul, Turkey</p>
          </div>
        </div>
      `,
    });

    return result;
  } catch (error) {
    console.error("Error sending confirmation email:", error);
    throw error;
  }
};
