# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Istanbul Portrait is a multilingual photography services and tour booking platform built with Next.js 15, featuring integrated payment processing (Iyzico), tour bookings (GetYourGuide), and comprehensive analytics tracking.

## Development Commands

```bash
# Development
npm run dev                    # Start dev server with Turbopack
npm run build                  # Type-check and build for production
npm run build:analyze          # Build with bundle analysis
npm run start                  # Start production server

# Code Quality
npm run lint                   # Check code with Biome
npm run lint:fix              # Auto-fix issues with Biome
npm run format                # Format code with Biome
npm run type-check            # Run TypeScript type checking

# Utilities
npm run clean                 # Remove .next and out directories
npm run check-translations    # Verify translation completeness
npm run health-check          # Run health check script
npm run production-test       # Run production test script
```

## Architecture

### App Structure

The project uses Next.js 15 App Router with internationalization:

- **`app/[locale]/`** - Localized public pages (en, ar, ru, es)
- **`app/admin/`** - Admin dashboard (separate layout, auth required)
- **`app/api/`** - API routes for bookings, payments, and admin operations

### Key Directories

- **`components/`** - React components organized by feature
  - `components/ui/` - Shadcn/UI components (Radix-based)
  - `components/analytics/` - Analytics tracking components
  - `components/reviews/` - Review display components
- **`lib/`** - Core utilities and integrations
  - `lib/supabase/` - Supabase client/server setup
  - `lib/structured-data/` - JSON-LD schema generators for SEO
- **`stores/`** - Zustand state management (auth, bookings, customers, payments, dashboard)
- **`i18n/`** - Internationalization config (next-intl)
- **`messages/`** - Translation files (en.json, ar.json, ru.json, es.json)
- **`types/`** - TypeScript type definitions

### Internationalization (i18n)

Uses `next-intl` with 4 locales: **en** (default), **ar**, **ru**, **es**

- Routing configured in `i18n/routing.ts` with localized pathnames
- All public pages follow `app/[locale]/` pattern
- Translation files in `messages/{locale}.json`
- Admin dashboard is NOT localized (outside `[locale]` structure)

### Third-Party Integrations

1. **Supabase** - Authentication and database
   - Server: `lib/supabase/server.ts` - `createServerSupabaseClient()` and `createServerSupabaseAdminClient()`
   - Client: `lib/supabase/client.ts`

2. **Iyzico** - Payment processing (Turkish payment gateway)
   - Integration: `lib/iyzico.ts`
   - Error handling: `lib/iyzico-errors.ts`

3. **GetYourGuide** - Tour bookings via widget-based integration
   - Config: `types/getyourguide.ts` - Tour IDs, categories, locale mapping
   - Utils: `lib/getyourguide.ts` and `lib/getyourguide-schema-mapper.ts`

4. **Analytics** - Multi-platform tracking
   - Google Analytics: `components/analytics/google-analytics.tsx`
   - Facebook Pixel: `components/analytics/facebook-pixel.tsx`
   - Yandex Metrica: `components/analytics/yandex-metrica.tsx`

### SEO and Schema.org

Comprehensive structured data implementation in `lib/structured-data/`:

- `generators.ts` - Schema generators (LocalBusiness, Tour, Package, FAQ, etc.)
- `types.ts` - Type-safe schema definitions
- `utils.ts` - Helper functions for schema manipulation

SEO configuration centralized in `lib/seo-config.ts`

### State Management

Zustand stores in `stores/`:
- `auth-store.ts` - Admin authentication state
- `bookings-store.ts` - Booking management
- `customers-store.ts` - Customer data
- `payments-store.ts` - Payment records
- `dashboard-store.ts` - Dashboard analytics

### Form Validation

Uses React Hook Form with Zod resolvers:
- Validation schemas: `lib/validations.ts`
- Forms: `components/booking-modal.tsx`, `components/checkout-form.tsx`, etc.

### Styling

- **Tailwind CSS v4** with custom configuration
- **Shadcn/UI** components (Radix-based primitives)
- Theme support via `next-themes`

## Environment Variables

Required in `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

# Base URLs
NEXT_PUBLIC_BASE_URL=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_ADMIN_EMAIL=

# Iyzico Payment
IYZICO_API_KEY=
IYZICO_SECRET_KEY=
IYZICO_BASE_URL=

# Email
RESEND_API_KEY=

# Analytics
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=
NEXT_PUBLIC_FACEBOOK_PIXEL_ID=
FACEBOOK_ACCESS_TOKEN=
FACEBOOK_DATASET_ID=
YANDEX_METRICA_ID=
```

## Important Patterns

### Server vs Client Components

- Use `lib/supabase/server.ts` for Server Components and API routes
- Use `lib/supabase/client.ts` for Client Components only
- Admin operations require `createServerSupabaseAdminClient()` with service key

### API Routes

- Booking: `/api/booking` and `/api/booking/create-confirmed`
- Payment: `/api/payment/initialize`
- Admin: `/api/admin/{bookings,customers,payments,stats}`
- Utilities: `/api/health`, `/api/indexnow`, `/api/facebook/conversions`

### Localized Navigation

Always use the navigation helpers from `i18n/routing.ts`:

```typescript
import { Link, redirect, usePathname, useRouter } from "@/i18n/routing";
```

These handle locale prefixes automatically.

### Error Handling

- Iyzico errors: Use `mapIyzicoError()` from `lib/iyzico-errors.ts`
- General errors: `lib/errors.ts` provides custom error classes
- User feedback: `sonner` toast notifications via `components/ui/sonner.tsx`

## Code Quality

- **Linter**: Biome (not ESLint) - configuration in package.json
- **Type checking**: Run `npm run type-check` before builds
- **Path aliases**: `@/*` maps to project root (configured in `tsconfig.json`)

## Key Configuration Files

- **`next.config.ts`** - Next.js config with security headers, image optimization, i18n setup
- **`tsconfig.json`** - TypeScript with strict mode enabled
- **`postcss.config.mjs`** - PostCSS for Tailwind
- **`i18n/routing.ts`** - Locale routing and pathnames

## Business Workflows

### 1. Booking Flow (Without Payment)

**User Journey:** Package selection → Booking details → Pending status

1. **Package Selection** (`components/booking-modal.tsx`)
   - User selects package and fills booking form
   - Form data validated with Zod schema from `lib/validations.ts`
   - Data stored in `sessionStorage` for checkout page

2. **Booking Creation** (`app/api/booking/route.ts`)
   - **Rate limiting**: 10 requests/minute per IP (`lib/rate-limit.ts`)
   - **Duplicate check**: Prevents same booking within 5 minutes
   - **Database operations** (in order):
     - Validate package exists and price matches
     - Create/update customer record in `customers` table
     - Create booking with `status: "pending"`
   - Returns booking ID for reference

**Key Pattern**: This endpoint creates bookings WITHOUT payment - used for inquiry/reservation workflow

### 2. Payment & Confirmed Booking Flow

**User Journey:** Package selection → Booking modal → Checkout page → Payment → Confirmed booking

1. **Booking Modal** (`components/booking-modal.tsx`)
   - User fills customer details, selects date/time
   - Time slots: 6:00 AM - 6:00 PM (30-minute intervals)
   - Form stored in `sessionStorage`, navigates to `/checkout`

2. **Checkout Page** (`components/checkout-form.tsx`)
   - Loads booking data from `sessionStorage`
   - Shows package summary with **tax breakdown** (`lib/pricing.ts`)
   - Displays payment form (`components/payment-form.tsx`)

3. **Payment Processing** (`app/api/payment/initialize/route.ts`)
   - **Critical**: Payment is initialized FIRST (before booking creation)
   - **Rate limiting**: 5 requests/minute per IP
   - Validates amount matches package price (including tax)
   - Calls Iyzico payment gateway with:
     - Customer data, payment card details
     - Package as basket item
     - Locale-specific error messages (`lib/iyzico-errors.ts`)
   - Returns `paymentId` and `conversationId` if successful

4. **Confirmed Booking Creation** (`app/api/booking/create-confirmed/route.ts`)
   - **Only called after successful payment**
   - Creates booking with `status: "confirmed"`
   - Records payment in `payments` table (linked to booking)
   - Sends confirmation email via Resend (`lib/resend.ts`)
   - Returns booking details

5. **Analytics & Notifications** (client-side in `checkout-form.tsx`)
   - Tracks Google Analytics conversion (`lib/analytics.ts`)
   - Tracks Facebook Pixel Purchase event (`lib/facebook.ts`)
   - Submits URL to IndexNow for search engine indexing
   - Shows success page (`components/booking-success.tsx`)
   - Clears `sessionStorage`

**Critical Flow Pattern**:
```
Payment Initialize → Success? → Create Confirmed Booking → Send Email → Track Analytics
                  → Failure? → Show error, allow retry (no booking created)
```

### 3. Admin Dashboard Workflow

**Authentication**: Admin routes protected by `requireServerAdmin()` (`lib/auth-server.ts`)

1. **Admin Login** (`app/admin/login/page.tsx`)
   - Supabase authentication
   - State managed by `stores/auth-store.ts`

2. **Dashboard Data** (`app/api/admin/*`)
   - **Bookings**: Filter by status, search, sort, paginate
   - **Payments**: View payment records linked to bookings
   - **Customers**: Customer management
   - **Stats**: Aggregate statistics
   - All use `createServerAdminClient()` with service key

### 4. Email Notifications

**Implementation**: Resend API (`lib/resend.ts`)

**Booking Confirmation Email**:
- Sent only for confirmed bookings (after payment)
- Contains: booking ID, package, date/time, total amount
- HTML template with booking details table
- Non-blocking: Email failure doesn't fail booking creation

### 5. Error Handling Patterns

**Rate Limiting** (`lib/rate-limit.ts`):
- IP-based rate limiting on all API routes
- Returns 429 with `Retry-After` header

**Validation Errors**:
- Zod schemas in `lib/validations.ts`
- Translated error messages via `next-intl`
- Returns 400 with validation details (dev only)

**Payment Errors** (`lib/iyzico-errors.ts`):
- Maps Iyzico error codes to localized messages
- Provides user-friendly suggestions
- Locale-aware (en, ar, ru, es)

**Database Errors** (`lib/errors.ts`):
- Custom error classes: `DatabaseConnectionError`, `ValidationError`, `PaymentError`
- `sanitizeErrorForProduction()` - hides sensitive info in production
- `logError()` - structured logging with context

### 6. Analytics & Tracking

**Multi-Platform Tracking**:

1. **Google Analytics** (`lib/analytics.ts`):
   - Page views, booking events, payment events
   - Enhanced Ecommerce: purchase tracking with transaction ID

2. **Facebook Pixel** (`lib/facebook.ts`):
   - ViewContent, InitiateCheckout, Purchase
   - Conversions API integration (`app/api/facebook/conversions/route.ts`)
   - Server-side event tracking with user data hashing

3. **Yandex Metrica**:
   - Page views and goals
   - Russian market tracking

**Event Flow**:
- Package view → ViewContent
- Checkout page load → InitiateCheckout
- Payment success → Purchase (both GA & FB)

### 7. Data Flow Summary

```
┌─────────────────┐
│  User selects   │
│    package      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      sessionStorage      ┌─────────────────┐
│ Booking Modal   │─────────────────────────▶│ Checkout Page   │
│ (customer info) │                          │ (payment form)  │
└─────────────────┘                          └────────┬────────┘
                                                      │
                                                      ▼
                                             ┌─────────────────┐
                                             │ Payment Init    │
                                             │ (Iyzico API)    │
                                             └────────┬────────┘
                                                      │
                                        Success?      │      Failure?
                            ┌─────────────────────────┴──────────────┐
                            ▼                                        ▼
                   ┌─────────────────┐                    ┌──────────────┐
                   │ Create Booking  │                    │ Show Error   │
                   │ (confirmed)     │                    │ Allow Retry  │
                   └────────┬────────┘                    └──────────────┘
                            │
                    ┌───────┴────────┬──────────────┬──────────────┐
                    ▼                ▼              ▼              ▼
            ┌──────────────┐  ┌───────────┐  ┌──────────┐  ┌──────────┐
            │ Save Payment │  │Send Email │  │ Track GA │  │Track FB  │
            │   Record     │  │  (Resend) │  │          │  │  Pixel   │
            └──────────────┘  └───────────┘  └──────────┘  └──────────┘
```

### 8. Database Schema (Supabase)

**Key Tables**:

- **`customers`**: email (PK), name, phone
- **`packages`**: id, name, price, description
- **`bookings`**:
  - id, package_id, user_name, user_email, user_phone
  - booking_date, booking_time, status (pending/confirmed)
  - total_amount, notes, created_at
- **`payments`**:
  - id, booking_id (FK), payment_id, conversation_id
  - status, amount, currency, provider, created_at

**Foreign Key Pattern**: Customer must exist before booking (upsert pattern in API routes)

### 9. Session & State Management

**Client-Side State**:
- **sessionStorage**: Temporary booking data during checkout flow
- **Zustand stores**: Admin dashboard state (bookings, payments, customers, auth)

**Server-Side State**:
- **Supabase Auth**: Session cookies managed by `@supabase/ssr`
- **Admin auth**: Server-only validation with service key

### 10. SEO & Indexing

**Structured Data** (`lib/structured-data/`):
- JSON-LD schemas for packages, tours, FAQs, galleries
- LocalBusiness, Service, Tour schemas
- Breadcrumbs, Reviews, HowTo schemas

**IndexNow Integration** (`lib/hooks/use-indexnow.ts`):
- Automatic URL submission to search engines after booking creation
- `/api/indexnow` endpoint for Bing/Yandex instant indexing