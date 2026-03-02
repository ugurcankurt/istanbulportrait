import { getTranslations } from "next-intl/server";
import {
  createSchemaConfig,
  type FAQData,
  generateFAQPageSchema,
  JsonLd,
} from "@/lib/structured-data";
import { FAQSection } from "./faq-section";

/**
 * FAQ Section with JSON-LD Schema
 * Server component wrapper for FAQ with structured data
 */
export async function FAQSectionWithSchema({
  locale = "en",
}: {
  locale?: string;
}) {
  const t = await getTranslations("faq");

  // Create schema configuration
  const schemaConfig = createSchemaConfig(locale);

  // Define FAQ data from translations
  const faqData: FAQData[] = [
    {
      question: t("questions.best-istanbul-photographer.question"),
      answer: t("questions.best-istanbul-photographer.answer"),
    },
    {
      question: t("questions.photoshoot-locations.question"),
      answer: t("questions.photoshoot-locations.answer"),
    },
    {
      question: t("questions.session-duration.question"),
      answer: t("questions.session-duration.answer"),
    },
    {
      question: t("questions.best-time-photoshoot.question"),
      answer: t("questions.best-time-photoshoot.answer"),
    },
    {
      question: t("questions.photo-delivery.question"),
      answer: t("questions.photo-delivery.answer"),
    },
    {
      question: t("questions.weather-backup.question"),
      answer: t("questions.weather-backup.answer"),
    },
    {
      question: t("questions.couple-vs-individual.question"),
      answer: t("questions.couple-vs-individual.answer"),
    },
    {
      question: t("questions.booking-advance.question"),
      answer: t("questions.booking-advance.answer"),
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
