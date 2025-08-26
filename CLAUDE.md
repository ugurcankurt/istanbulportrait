# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Istanbul Portrait Photography Website** - a modern, multilingual Next.js 15 application built for a professional photography business in Istanbul. It features a booking system with payment processing, multilingual support (EN/AR/RU/ES), and SEO optimization for photography-related keywords.

## Development Commands

### Core Development
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production application (includes type-check)
- `npm run start` - Start production server
- `npm run type-check` - Run TypeScript type checking

### Code Quality
- `npm run lint` - Run Biome linter checks 
- `npm run lint:fix` - Fix auto-fixable linting issues
- `npm run format` - Format code with Biome

### Testing & Health Checks
- `npm run test:db` - Test database connection
- `npm run test:payment` - Test payment integration
- `npm run health-check` - Run comprehensive health checks
- `npm run health-check:ssl` - SSL-only health check
- `npm run health-check:perf` - Performance-only health check
- `npm run production-test` - Full production test suite

### Utilities
- `npm run clean` - Remove build artifacts (.next, out)
- `npm run check-translations` - Validate translation files
- `npm run setup:supabase` - Initialize Supabase setup

## Architecture

### Next.js App Router Structure
- Uses Next.js 15 App Router with internationalized routing
- Layout: `app/[locale]/layout.tsx` handles locale-specific layouts
- Middleware: `middleware.ts` manages i18n routing via next-intl

### Internationalization (i18n)
- **Locales**: English (en), Arabic (ar), Russian (ru), Spanish (es)
- **Configuration**: `i18n/routing.ts` defines routes and locales
- **Translations**: JSON files in `messages/` directory
- **RTL Support**: Arabic locale uses RTL layout automatically

### Database & Backend
- **Database**: Supabase with TypeScript definitions in `lib/supabase.ts`
- **Tables**: bookings, payments, customers, packages, rate_limits
- **API Routes**: Located in `app/api/` for booking and payment endpoints
- **Payment**: Iyzico payment gateway integration in `lib/iyzico.ts`

### UI Components
- **Design System**: shadcn/ui components in `components/ui/`
- **Styling**: Tailwind CSS with custom configuration
- **Components**: Custom business components in `components/`
- **Theme**: Next-themes for dark/light mode support

### SEO & Analytics
- **Structured Data**: JSON-LD schemas in `components/seo/structured-data.tsx`
- **Meta Tags**: Automated meta generation per locale
- **Analytics**: Google Analytics integration in `components/analytics/`
- **Sitemap**: Auto-generated via `app/sitemap.ts`

## Key Libraries & Integrations

### Core Framework
- Next.js 15 with App Router and Turbopack
- TypeScript with strict mode
- React 19 with RSC (React Server Components)

### Internationalization
- next-intl for comprehensive i18n support
- Localized URLs and content management

### UI & Styling
- Tailwind CSS v4 for styling
- shadcn/ui component library
- Radix UI primitives for accessibility
- Framer Motion for animations
- Lucide React for icons

### Forms & Validation
- React Hook Form for form handling
- Zod for schema validation
- Input validation for phone numbers and payments

### Database & Backend
- Supabase for database and real-time features
- Rate limiting implementation
- Payment processing with Iyzico

## Development Notes

### Environment Variables Required
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase public key
- `SUPABASE_SERVICE_KEY` - Supabase service role key
- `IYZICO_API_KEY` & `IYZICO_SECRET_KEY` - Payment processing
- `RESEND_API_KEY` - Email service

### Code Style
- Uses Biome for linting and formatting (not ESLint/Prettier)
- 2-space indentation
- TypeScript strict mode enabled
- Component organization follows shadcn/ui patterns

### Special Considerations
- **Payment Testing**: Uses test card `5528790000000008` in demo mode
- **Image Optimization**: Configured for Unsplash and local images
- **Security Headers**: Comprehensive CSP and security headers configured
- **Performance**: Optimized with bundle analyzer and Turbopack
- **RTL Support**: Full RTL layout support for Arabic locale

### Database Schema
The application uses Supabase with these main tables:
- `bookings` - Customer booking records
- `payments` - Payment transaction logs  
- `customers` - Customer information
- `packages` - Photography packages
- `rate_limits` - API rate limiting

### Deployment
- Optimized for Vercel deployment
- Static asset optimization
- Security headers configured
- Performance monitoring ready