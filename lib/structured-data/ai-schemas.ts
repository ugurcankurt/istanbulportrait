/**
 * AI-Optimized Schema Generators
 * Enhanced structured data for Google AI Overview, AI Mode, Voice Search
 * 
 * These schemas help AI systems (Google AI Overview, ChatGPT, Claude, Perplexity)
 * better understand and cite your content.
 */

import { SEO_CONFIG, AI_SEARCH_CONFIG } from "@/lib/seo-config";
import type { SchemaConfig, FAQData } from "./types";

/**
 * Generate WebSite schema with SearchAction
 * Enables Sitelinks Search Box in Google Search results
 */
export function generateWebSiteSchema(config: SchemaConfig) {
    const { baseUrl, locale } = config;

    return {
        "@context": "https://schema.org" as const,
        "@type": "WebSite" as const,
        "@id": `${baseUrl}/#website`,
        name: SEO_CONFIG.site.name,
        alternateName: SEO_CONFIG.site.alternateName,
        url: baseUrl,
        description: SEO_CONFIG.site.description,
        publisher: {
            "@type": "Organization" as const,
            "@id": `${baseUrl}/#organization`,
            name: SEO_CONFIG.organization.name,
        },
        inLanguage: ["en", "ar", "ru", "es", "zh"],
        potentialAction: {
            "@type": "SearchAction" as const,
            target: {
                "@type": "EntryPoint" as const,
                urlTemplate: `${baseUrl}/${locale}/blog?q={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
        },
    };
}

/**
 * Generate SpeakableSpecification for voice search optimization
 * Tells voice assistants which parts of the page to read aloud
 */
export function generateSpeakableSchema(
    headline: string,
    summary: string,
    config: SchemaConfig,
) {
    return {
        "@type": "SpeakableSpecification" as const,
        cssSelector: [
            "article h1",
            "article h2",
            ".blog-summary",
            "[data-speakable='true']",
        ],
        // Alternative: use xpath for more precise selection
        // xpath: ["//h1", "//article//p[position()<=3]"],
    };
}

/**
 * Generate AI-Optimized Article schema with enhanced properties
 * Includes speakable, mainEntity, and AI-friendly metadata
 */
export function generateAIOptimizedArticleSchema(
    article: {
        headline: string;
        description: string;
        content: string;
        image: string;
        datePublished: string;
        dateModified: string;
        slug: string;
        keywords?: string[];
        wordCount?: number;
        readingTimeMinutes?: number;
    },
    config: SchemaConfig,
) {
    const { baseUrl, locale } = config;
    const articleUrl = `${baseUrl}/${locale}/blog/${article.slug}`;

    return {
        "@context": "https://schema.org" as const,
        "@type": "BlogPosting" as const,
        "@id": `${articleUrl}#article`,
        headline: article.headline,
        description: article.description,
        image: article.image || `${baseUrl}${SEO_CONFIG.images.ogImage}`,
        author: {
            "@type": "Person" as const,
            name: SEO_CONFIG.person.name,
            url: `${baseUrl}/${locale}/about`,
            image: SEO_CONFIG.person.image,
            jobTitle: SEO_CONFIG.person.jobTitle,
        },
        publisher: {
            "@type": "Organization" as const,
            "@id": `${baseUrl}/#organization`,
            name: SEO_CONFIG.organization.name,
            logo: {
                "@type": "ImageObject" as const,
                url: SEO_CONFIG.organization.logo,
            },
        },
        datePublished: article.datePublished,
        dateModified: article.dateModified,
        mainEntityOfPage: {
            "@type": "WebPage" as const,
            "@id": articleUrl,
        },
        // AI-specific enhancements
        speakable: {
            "@type": "SpeakableSpecification" as const,
            cssSelector: [
                "article h1",
                "article h2",
                ".blog-summary p",
                "article > div.prose > p:first-of-type",
            ],
        },
        // Keywords for AI understanding
        keywords: article.keywords?.join(", ") || "",
        wordCount: article.wordCount || 0,
        timeRequired: article.readingTimeMinutes
            ? `PT${article.readingTimeMinutes}M`
            : undefined,
        inLanguage: locale,
        // About entity for AI context
        about: {
            "@type": "Thing" as const,
            name: "Istanbul Photography",
            sameAs: AI_SEARCH_CONFIG.primaryEntity.sameAs,
        },
        // Mentions for entity linking
        mentions: AI_SEARCH_CONFIG.entityRelationships.mentions.map((mention) => ({
            "@type": "Place" as const,
            name: mention,
        })),
    };
}

/**
 * Generate AI-Optimized FAQ schema
 * Enhanced with about, mainEntity and structured answers
 */
export function generateAIOptimizedFAQSchema(
    faqs: FAQData[],
    topic: string,
    config: SchemaConfig,
) {
    const { baseUrl } = config;

    return {
        "@context": "https://schema.org" as const,
        "@type": "FAQPage" as const,
        "@id": `${baseUrl}/#faqpage`,
        name: config.t ? config.t("faqTitle", { topic }) : `Frequently Asked Questions about ${topic}`,
        about: {
            "@type": "Thing" as const,
            name: topic,
            description: AI_SEARCH_CONFIG.primaryEntity.description,
        },
        mainEntity: faqs.map((faq, index) => ({
            "@type": "Question" as const,
            "@id": `${baseUrl}/#faq-${index}`,
            name: faq.question,
            acceptedAnswer: {
                "@type": "Answer" as const,
                text: faq.answer,
                // Add dateCreated for freshness signals
                dateCreated: new Date().toISOString().split("T")[0],
            },
            // Link questions to main entity
            about: {
                "@type": "LocalBusiness" as const,
                "@id": `${baseUrl}/#localbusiness`,
            },
        })),
    };
}

/**
 * Generate AI-Optimized Local Business schema
 * Enhanced with AI-specific properties for better AI Overview visibility
 */
export function generateAILocalBusinessSchema(config: SchemaConfig) {
    const { baseUrl } = config;

    return {
        "@context": "https://schema.org" as const,
        "@type": "ProfessionalService" as const, // More specific than LocalBusiness
        "@id": `${baseUrl}/#localbusiness`,
        name: SEO_CONFIG.organization.name,
        description: config.t ? config.t("description") : AI_SEARCH_CONFIG.primaryEntity.description,
        url: baseUrl,
        telephone: SEO_CONFIG.organization.contactPoint.telephone,
        email: "info@istanbulportrait.com",
        priceRange: SEO_CONFIG.business.priceRange,
        image: [
            SEO_CONFIG.person.image,
            SEO_CONFIG.organization.logo,
            `${baseUrl}/gallery/istanbul_photographer_1.webp`,
        ],
        logo: SEO_CONFIG.organization.logo,
        address: {
            "@type": "PostalAddress" as const,
            streetAddress: SEO_CONFIG.organization.address.streetAddress,
            addressLocality: SEO_CONFIG.organization.address.addressLocality,
            addressRegion: SEO_CONFIG.organization.address.addressRegion,
            postalCode: SEO_CONFIG.organization.address.postalCode,
            addressCountry: SEO_CONFIG.organization.address.addressCountry,
        },
        geo: {
            "@type": "GeoCoordinates" as const,
            latitude: 41.0082,
            longitude: 28.9784,
        },
        // AI-Enhanced properties
        knowsAbout: config.t
            ? config.t("knowsAbout")
                .split(",")
                .map((s: string) => s.trim())
            : AI_SEARCH_CONFIG.conversationContext.serviceAreas,
        knowsLanguage: SEO_CONFIG.organization.contactPoint.availableLanguage,
        slogan: config.t ? config.t("slogan") : "Capturing Your Istanbul Story",
        // Service offerings for AI understanding
        hasOfferCatalog: {
            "@type": "OfferCatalog" as const,
            name: config.t ? config.t("serviceType") : "Photography Services",
            itemListElement: SEO_CONFIG.services.offers.map((offer) => ({
                "@type": "Offer" as const,
                name: offer.name,
                description: config.t ? `${offer.description}. ${config.t("offerDescription")}` : offer.description,
                price: offer.price,
                priceCurrency: offer.priceCurrency,
                availability: "https://schema.org/InStock",
            })),
        },
        // Area served for local AI queries
        areaServed: {
            "@type": "City" as const,
            name: "Istanbul",
            "@id": "https://en.wikipedia.org/wiki/Istanbul",
        },
        // Awards and credentials for E-E-A-T
        award: SEO_CONFIG.organization.awards,
        foundingDate: SEO_CONFIG.organization.foundingDate,
        sameAs: SEO_CONFIG.organization.sameAs,
        // Opening hours
        openingHoursSpecification: {
            "@type": "OpeningHoursSpecification" as const,
            dayOfWeek: [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
            ],
            opens: "09:00",
            closes: "18:00",
        },
        // Payment and booking
        paymentAccepted: SEO_CONFIG.business.paymentAccepted,
        currenciesAccepted: SEO_CONFIG.business.currenciesAccepted,
        // Contact for AI-powered queries
        contactPoint: {
            "@type": "ContactPoint" as const,
            telephone: SEO_CONFIG.organization.contactPoint.telephone,
            contactType: config.t ? "customer service" : "customer service", // Ideally this should be localized too but standard schema types are usually English/Standard
            availableLanguage: SEO_CONFIG.organization.contactPoint.availableLanguage,
            areaServed: config.t ? "Worldwide" : "Worldwide", // Keeping standard for now, but could be localized
        },
    };
}

/**
 * Generate precomputed AI answers as structured data
 * These can be used by AI systems to provide direct answers
 */
export function generateAIAnswersSchema(config: SchemaConfig) {
    const { baseUrl } = config;

    return {
        "@context": "https://schema.org" as const,
        "@type": "WebPage" as const,
        "@id": `${baseUrl}/#webpage`,
        name: config.t ? config.t("title") : "Istanbul Photographer - Professional Photography Services",
        description: config.t ? config.t("description") : SEO_CONFIG.site.description,
        mainEntity: {
            "@type": "LocalBusiness" as const,
            "@id": `${baseUrl}/#localbusiness`,
        },
        // Precomputed answers for common queries
        speakable: {
            "@type": "SpeakableSpecification" as const,
            cssSelector: [
                "#pricing-section",
                "#faq-section",
                "#packages-section",
                ".hero-description",
            ],
        },
        // Breadcrumb for context
        breadcrumb: {
            "@type": "BreadcrumbList" as const,
            itemListElement: [
                {
                    "@type": "ListItem" as const,
                    position: 1,
                    name: "Home",
                    item: baseUrl,
                },
            ],
        },
    };
}
