"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface FAQItem {
  id: string;
  keywords: string[];
}

export function FAQSection() {
  const t = useTranslations("faq");

  const faqIds: FAQItem[] = [
    {
      id: "best-istanbul-photographer",
      keywords: [
        "best istanbul photographer",
        "experienced photographer istanbul",
        "professional photography istanbul",
      ],
    },
    {
      id: "photoshoot-locations",
      keywords: [
        "istanbul photoshoot locations",
        "best photography spots istanbul",
        "rooftop photoshoot istanbul",
      ],
    },
    {
      id: "session-duration",
      keywords: [
        "istanbul photography session duration",
        "photoshoot time istanbul",
      ],
    },
    {
      id: "best-time-photoshoot",
      keywords: [
        "best time istanbul photoshoot",
        "golden hour photography istanbul",
        "sunset photoshoot istanbul",
      ],
    },
    {
      id: "photo-delivery",
      keywords: [
        "photo delivery time istanbul",
        "edited photos istanbul photographer",
      ],
    },
    {
      id: "weather-backup",
      keywords: [
        "weather backup istanbul photoshoot",
        "rainy day photography istanbul",
      ],
    },
    {
      id: "couple-vs-individual",
      keywords: [
        "couple photography istanbul",
        "individual portrait istanbul",
        "wedding photographer istanbul",
      ],
    },
    {
      id: "booking-advance",
      keywords: [
        "booking istanbul photographer",
        "advance booking photoshoot istanbul",
      ],
    },
  ];

  return (
    <>
      <section className="py-8 sm:py-12 lg:py-16 bg-gradient-to-b from-muted/20 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8 sm:mb-12 lg:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
              {t("title")}
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto px-2">
              {t("subtitle")}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-6xl mx-auto"
          >
            <Card>
              <CardHeader className="pb-4">
                <h3 className="text-xl font-semibold text-center">
                  {t("section_title")}
                </h3>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {faqIds.map((faq, index) => (
                    <motion.div
                      key={faq.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                    >
                      <AccordionItem value={faq.id}>
                        <AccordionTrigger className="text-left hover:text-primary">
                          <span className="font-medium">
                            {t(`questions.${faq.id}.question`)}
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground leading-relaxed">
                          <p>{t(`questions.${faq.id}.answer`)}</p>
                          {/* Hidden keywords for SEO - not visible to users */}
                          <div className="sr-only">
                            {faq.keywords.join(", ")}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </motion.div>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </>
  );
}
