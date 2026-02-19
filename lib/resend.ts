import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "demo-resend-key");

export interface BookingConfirmationData {
  customerName: string;
  customerEmail: string;
  packageName: string;
  bookingDate: string;
  bookingTime: string;
  totalAmount: number;
  originalAmount?: number;
  discountAmount?: number;
  bookingId: string;
  peopleCount?: number;
  depositAmount?: number;
  remainingAmount?: number;
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
              ${data.peopleCount && data.peopleCount > 1
          ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Number of People:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${data.peopleCount}</td>
              </tr>
              `
          : ""
        }
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Date:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${data.bookingDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Time:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${data.bookingTime}</td>
              </tr>
                <td style="padding: 8px 0;"><strong>Total Amount:</strong></td>
                <td style="padding: 8px 0; font-weight: bold; color: #2563eb;">
                  ${data.originalAmount &&
          data.originalAmount > data.totalAmount
          ? `<span style="text-decoration: line-through; color: #666; font-weight: normal; font-size: 0.9em; margin-right: 8px;">€${data.originalAmount}</span>`
          : ""
        }
                  €${data.totalAmount}
                </td>
              </tr>
              ${data.discountAmount && data.discountAmount > 0
          ? `
              <tr>
                <td style="padding: 8px 0; color: #16a34a; font-size: 0.9em;"><strong>Seasonal Discount:</strong></td>
                <td style="padding: 8px 0; color: #16a34a; font-size: 0.9em;">-€${data.discountAmount}</td>
              </tr>
              `
          : ""
        }
            </table>
            
            <div style="margin-top: 15px; border-top: 1px dashed #eee; padding-top: 15px;">
              <table style="width: 100%; border-collapse: collapse;">
                 ${data.depositAmount
          ? `
                <tr>
                  <td style="padding: 8px 0; color: #059669;"><strong>Deposit Paid (30%):</strong></td>
                  <td style="padding: 8px 0; color: #059669; font-weight: bold;">€${data.depositAmount}</td>
                </tr>
                `
          : ""
        }
                 ${data.remainingAmount
          ? `
                <tr>
                  <td style="padding: 8px 0; color: #b91c1c;"><strong>Remaining Balance (Cash):</strong></td>
                  <td style="padding: 8px 0; color: #b91c1c; font-weight: bold;">€${data.remainingAmount}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 8px 0; font-size: 0.85em; color: #666; font-style: italic;">
                    * Please pay the remaining balance in cash on the day of your photoshoot.
                  </td>
                </tr>
                `
          : ""
        }
              </table>
            </div>
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

export const addContactToAudience = async (
  email: string,
  firstName: string,
  lastName?: string,
  audienceId: string = process.env.RESEND_AUDIENCE_ID || "",
) => {
  try {
    if (
      !process.env.RESEND_API_KEY ||
      process.env.RESEND_API_KEY === "demo-resend-key"
    ) {
      console.warn("Resend API key missing, skipping contact creation");
      return;
    }

    // Prepare contact data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contactData: any = {
      email,
      firstName,
      lastName,
      unsubscribed: false,
    };

    // Only add audienceId if it's explicitly provided/set in env
    if (audienceId) {
      contactData.audienceId = audienceId;
    }

    await resend.contacts.create(contactData);
    console.log(`Successfully added contact ${email} to Resend Audience`);
  } catch (error) {
    // We log the error but don't throw it, as this is a non-critical background task
    // Often fails if contact already exists, which is fine
    console.error("Failed to add contact to Resend Audience:", error);
  }
};
