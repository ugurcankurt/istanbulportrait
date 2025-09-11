import { getTranslations } from "next-intl/server";
import { FAQSection } from "./faq-section";
import { 
  JsonLd, 
  generateFAQPageSchema, 
  createSchemaConfig,
  type FAQData
} from "@/lib/structured-data";

/**
 * FAQ Section with JSON-LD Schema
 * Server component wrapper for FAQ with structured data
 */
export async function FAQSectionWithSchema({ 
  locale = "en" 
}: { 
  locale?: string 
}) {
  const t = await getTranslations("faq");
  
  // Create schema configuration
  const schemaConfig = createSchemaConfig(locale);
  
  // Define FAQ data from translations
  const faqData: FAQData[] = [
    {
      question: t("best-istanbul-photographer.question"),
      answer: t("best-istanbul-photographer.answer"),
    },
    {
      question: t("photoshoot-locations.question"),
      answer: t("photoshoot-locations.answer"),
    },
    {
      question: t("session-duration.question"),
      answer: t("session-duration.answer"),
    },
    {
      question: t("best-time-photoshoot.question"),
      answer: t("best-time-photoshoot.answer"),
    },
    {
      question: t("what-to-wear.question"),
      answer: t("what-to-wear.answer"),
    },
    {
      question: t("photo-editing.question"),
      answer: t("photo-editing.answer"),
    },
    {
      question: t("booking-process.question"),
      answer: t("booking-process.answer"),
    },
    {
      question: t("payment-methods.question"),
      answer: t("payment-methods.answer"),
    },
    {
      question: t("cancellation-policy.question"),
      answer: t("cancellation-policy.answer"),
    },
    {
      question: t("group-shoots.question"),
      answer: t("group-shoots.answer"),
    },
  ];
  
  // Generate FAQ Page schema
  const faqPageSchema = generateFAQPageSchema(faqData, schemaConfig);
  
  return (
    <>
      {/* JSON-LD Schema for FAQ */}
      <JsonLd data={faqPageSchema} />
      
      {/* Original FAQ Section */}
      <FAQSection />
    </>
  );
}