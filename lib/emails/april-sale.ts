import { COLORS, renderEmailLayout, BRAND } from "../resend";

export const APRIL_SALE_TEMPLATE = {
  subject: "Spring in Istanbul: Your Exclusive 30% April Discount! 🌷📸",
  title: "Exclusive Spring Sale",
  content: `
    <h2 style="color: ${COLORS.text}; margin-top: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Beyond the Ordinary. 👋</h2>
    <p style="font-size: 18px; line-height: 1.7; color: ${COLORS.text}; margin-bottom: 24px; font-weight: 400;">
      Istanbul has officially awakened. From the vibrant tulip gardens of Emirgan to the soft pink Judas trees lining the Bosphorus, the city is a living masterpiece this April.
    </p>
    
    <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 1px solid ${COLORS.success}; border-radius: 20px; padding: 40px 30px; text-align: center; margin: 35px 0; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);">
      <span style="text-transform: uppercase; letter-spacing: 2px; font-size: 12px; font-weight: 700; color: ${COLORS.success}; display: block; margin-bottom: 10px;">Limited Time Offer</span>
      <h3 style="color: ${COLORS.text}; font-size: 42px; margin: 0; font-weight: 800; line-height: 1.1;">33% OFF</h3>
      <p style="color: ${COLORS.textMuted}; font-size: 16px; margin: 10px 0 0; font-weight: 500;">All Professional Collections in April</p>
    </div>

    <p style="font-size: 16px; line-height: 1.6; color: ${COLORS.textMuted}; margin-bottom: 30px;">
      Whether you're dreaming of a romantic session at the Galata Tower or a high-fashion editorial in the hidden streets of Balat, our team is ready to capture your story with timeless elegance.
    </p>

    <div style="text-align: center; margin: 45px 0;">
      <a href="${BRAND.url}/packages" 
         style="background-color: ${COLORS.primary}; color: #ffffff; padding: 20px 48px; text-decoration: none; border-radius: 14px; font-weight: 700; display: inline-block; font-size: 18px; box-shadow: 0 10px 20px rgba(79, 70, 229, 0.25); transition: all 0.3s ease;">
        RESERVE YOUR SESSION
      </a>
    </div>

    <div style="background: ${COLORS.background}; padding: 30px; border-radius: 16px; margin: 35px 0; border-left: 5px solid ${COLORS.success};">
      <h4 style="color: ${COLORS.text}; margin-top: 0; font-size: 18px; font-weight: 700;">The April Aesthetic</h4>
      <p style="margin: 0; color: ${COLORS.textMuted}; font-size: 15px; line-height: 1.6;">
        April provides the most sought-after natural lighting conditions in the region—soft, diffused, and golden. It's the preferred choice for celebrity and luxury brand campaigns in the city.
      </p>
    </div>

    <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid ${COLORS.border};">
       <p style="font-size: 14px; color: ${COLORS.textMuted}; font-style: italic;">
         *This offer applies to all bookings scheduled between April 1st and April 30th. Limited availability.
       </p>
    </div>
  `,
};

export const getAprilSaleEmailHtml = () => {
  return renderEmailLayout(APRIL_SALE_TEMPLATE.content, APRIL_SALE_TEMPLATE.title, "en");
};
