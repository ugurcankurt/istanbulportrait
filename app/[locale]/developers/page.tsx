import { Metadata } from "next";
import { getBaseUrl } from "@/lib/seo-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Terminal, Key, Zap, Code2, CheckCircle2, MessageCircle } from "lucide-react";
import { SchemaInjector } from "@/components/schema-injector";

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = getBaseUrl();
  return {
    title: "B2B Developer Portal & API Documentation",
    description: "Integrate with Istanbul Portrait's OCTO-compliant API. Access real-time availability, dynamic pricing, and instant booking for your travel agency.",
    alternates: {
      canonical: `${baseUrl}/en/developers`,
    },
  };
}

export default function DevelopersPage() {
  const whatsappNumber = "905367093724";
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=Hello!%20I%20would%20like%20to%20request%20an%20API%20Key%20for%20B2B%20integration.`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      <SchemaInjector schema={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "B2B Developer Portal & API Documentation",
        description: "Official OCTO API documentation for B2B partners of Istanbul Portrait.",
      }} />

      {/* Hero Section */}
      <div className="bg-slate-950 text-slate-50 pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 opacity-50" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-500/30 blur-3xl rounded-full pointer-events-none" />
        
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="inline-flex items-center rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-sm font-medium text-violet-300 mb-6">
            <Zap className="mr-2 h-4 w-4" />
            OCTO Specification v2.0
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Partner with Istanbul's Premier Photography Studio
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mb-10 leading-relaxed">
            Automate your bookings, access real-time availability, and get dynamic pricing with our fully OCTO-compliant B2B API. Built for OTAs, concierges, and travel agencies.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a 
              href={whatsappUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center rounded-4xl bg-white px-8 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-200"
            >
              <Key className="mr-2 h-5 w-5" />
              Request API Key
            </a>
            <a 
              href="#documentation"
              className="inline-flex h-12 items-center justify-center rounded-4xl border border-slate-700 bg-transparent px-8 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <Terminal className="mr-2 h-5 w-5" />
              Read the Docs
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div id="documentation" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 scroll-mt-24">
        
        {/* Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="border-none shadow-sm bg-white dark:bg-slate-950">
            <CardHeader>
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
              <CardTitle>100% Standardized</CardTitle>
              <CardDescription>Built on the global OCTO standard used by Viator and GetYourGuide.</CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-none shadow-sm bg-white dark:bg-slate-950">
            <CardHeader>
              <Zap className="h-8 w-8 text-amber-500 mb-2" />
              <CardTitle>Real-time Data</CardTitle>
              <CardDescription>Live availability and dynamic time surcharges synced instantly.</CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-none shadow-sm bg-white dark:bg-slate-950">
            <CardHeader>
              <Code2 className="h-8 w-8 text-violet-500 mb-2" />
              <CardTitle>Developer Friendly</CardTitle>
              <CardDescription>RESTful endpoints with JSON responses and Bearer token auth.</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Authentication Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-4 text-slate-900 dark:text-white">Authentication</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            All API requests must be authenticated using a Bearer token in the Authorization header.
            To get your unique API key, click the Request API Key button.
          </p>
          <div className="bg-slate-950 rounded-xl p-6 shadow-lg border border-slate-800">
            <div className="flex items-center mb-4 text-slate-400 text-sm font-mono">
              <span className="text-pink-500 mr-2">Header</span>
              Authorization: Bearer YOUR_API_KEY
            </div>
            <pre className="text-slate-300 font-mono text-sm overflow-x-auto">
              <code className="language-bash">
{`curl -X GET "https://istanbulportrait.com/api/octo/products" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}
              </code>
            </pre>
          </div>
        </div>

        {/* API Endpoints Tabs */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white">Core Endpoints</h2>
          
          <Tabs defaultValue="products" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent mb-8">
              <TabsTrigger 
                value="products" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-violet-600 data-[state=active]:shadow-none rounded-none py-3 px-6"
              >
                Products
              </TabsTrigger>
              <TabsTrigger 
                value="availability" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-violet-600 data-[state=active]:shadow-none rounded-none py-3 px-6"
              >
                Availability & Pricing
              </TabsTrigger>
              <TabsTrigger 
                value="bookings" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-violet-600 data-[state=active]:shadow-none rounded-none py-3 px-6"
              >
                Bookings
              </TabsTrigger>
            </TabsList>

            {/* Products Tab */}
            <TabsContent value="products" className="space-y-6">
              <div className="bg-white dark:bg-slate-950 border rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-bold px-3 py-1 rounded text-sm">GET</span>
                  <code className="text-slate-900 dark:text-slate-100 font-mono bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded">/api/octo/products</code>
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Returns a list of all active photography packages, including descriptions, inclusions, gallery images, and base pricing details.
                  <br /><br />
                  <strong className="text-slate-200">Localization Support:</strong> This endpoint fully supports the BCP 47 standard. You can pass an <code className="bg-slate-800 px-1 rounded text-sky-400">Accept-Language</code> header (e.g., <code>es</code>, <code>ru</code>, <code>tr</code>, <code>ar</code>) to receive localized package titles, descriptions, and features.
                </p>
                <div className="bg-slate-950 rounded-xl p-6 border border-slate-800">
                  <div className="text-slate-400 text-xs font-mono mb-2 uppercase tracking-wider">Example Response</div>
                  <pre className="text-emerald-400 font-mono text-sm overflow-x-auto">
{`[
  {
    "id": "package-uuid",
    "internalName": "Surprise Rooftop Proposal",
    "title": "Surprise Rooftop Marriage Proposal",
    "durationMinutesFrom": 120,
    "durationMinutesTo": 120,
    "deliveryMethods": ["TICKET"],
    "options": [
      {
        "id": "standard",
        "availabilityLocalStartTimes": [
          "06:00", "06:30", "07:00", "07:30"
        ],
        "pricingFrom": [{
          "retail": 30000,
          "net": 27000,
          "currency": "EUR"
        }]
      }
    ]
  }
]`}
                  </pre>
                </div>
              </div>
            </TabsContent>

            {/* Availability Tab */}
            <TabsContent value="availability" className="space-y-6">
              <div className="bg-white dark:bg-slate-950 border rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-bold px-3 py-1 rounded text-sm">POST</span>
                  <code className="text-slate-900 dark:text-slate-100 font-mono bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded">/api/octo/availability</code>
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Check real-time availability for a specific product and date range. The response dynamically includes specific time surcharges (e.g., sunrise shoots).
                </p>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-slate-950 rounded-xl p-6 border border-slate-800">
                    <div className="text-slate-400 text-xs font-mono mb-2 uppercase tracking-wider">Request Body</div>
                    <pre className="text-sky-400 font-mono text-sm overflow-x-auto">
{`{
  "productId": "package-uuid",
  "optionId": "standard",
  "localDateStart": "2026-05-10",
  "localDateEnd": "2026-05-10"
}`}
                    </pre>
                  </div>
                  
                  <div className="bg-slate-950 rounded-xl p-6 border border-slate-800">
                    <div className="text-slate-400 text-xs font-mono mb-2 uppercase tracking-wider">Response</div>
                    <pre className="text-emerald-400 font-mono text-sm overflow-x-auto">
{`[
  {
    "id": "2026-05-10T06:00:00+03:00",
    "localDateTimeStart": "2026-05-10T06:00:00+03:00",
    "status": "AVAILABLE",
    "vacancies": 1,
    "pricing": {
      "retail": 36000, 
      "net": 32400,
      "currency": "EUR"
    }
  }
]`}
                    </pre>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Bookings Tab */}
            <TabsContent value="bookings" className="space-y-6">
              <div className="bg-white dark:bg-slate-950 border rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-bold px-3 py-1 rounded text-sm">POST</span>
                  <code className="text-slate-900 dark:text-slate-100 font-mono bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded">/api/octo/bookings</code>
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Create a booking. We support two different payment models depending on your agency type:
                  <br /><br />
                  <strong className="text-slate-200">1. Global Agencies (OTAs):</strong> Bookings are instantly marked as <code className="bg-slate-800 px-1 rounded text-emerald-400">CONFIRMED</code>. You collect the payment from the customer and remit the net amount.
                  <br /><br />
                  <strong className="text-slate-200">2. Local Agencies:</strong> Bookings are marked as <code className="bg-slate-800 px-1 rounded text-amber-400">ON_HOLD</code>. A <code className="bg-slate-800 px-1 rounded text-blue-400">paymentUrl</code> will be returned in the response. You must visit this URL to pay the Net Price via credit card to instantly confirm the booking.
                </p>
                <div className="bg-slate-950 rounded-xl p-6 border border-slate-800">
                  <div className="text-slate-400 text-xs font-mono mb-2 uppercase tracking-wider">Request Body</div>
                  <pre className="text-sky-400 font-mono text-sm overflow-x-auto">
{`{
  "uuid": "unique-booking-id",
  "productId": "package-uuid",
  "optionId": "standard",
  "availabilityId": "2026-05-10T06:00:00+03:00",
  "unitItems": [
    { "unitId": "unit_package-uuid_adult" }
  ],
  "contact": {
    "fullName": "John Doe",
    "emailAddress": "john@example.com",
    "phoneNumber": "+1234567890"
  },
  "resellerReference": "B2B-12345"
}`}
                  </pre>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* CTA Bottom */}
        <div className="bg-violet-600 text-white rounded-3xl p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-4">Ready to start building?</h2>
            <p className="text-violet-100 mb-8 max-w-2xl mx-auto text-lg">
              Get your API key today and start offering Istanbul's best photography experiences directly to your customers.
            </p>
            <a 
              href={whatsappUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex h-14 items-center justify-center rounded-xl bg-white px-10 text-lg font-bold text-violet-600 transition-colors hover:bg-slate-100"
            >
              <MessageCircle className="mr-2 h-6 w-6" />
              Contact us on WhatsApp
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
