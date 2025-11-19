# Istanbul Portrait

[![Next.js](https://img.shields.io/badge/Next.js-15.5.0-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38bdf8)](https://tailwindcss.com/)
[![GDPR Compliant](https://img.shields.io/badge/GDPR-Compliant-green)](https://gdpr.eu/)

Professional photography portfolio and booking platform for Istanbul Portrait, featuring a modern, multilingual interface with GDPR-compliant consent management.

🌐 **Live Site:** [istanbulportrait.com](https://istanbulportrait.com)

## ✨ Features

### 🎨 Core Features
- **Multilingual Support**: Full internationalization (i18n) with support for English, Turkish, Arabic, Spanish, Russian, and Chinese
- **Modern UI/UX**: Built with Radix UI components and Tailwind CSS for a premium user experience
- **Responsive Design**: Fully optimized for mobile, tablet, and desktop devices
- **Dark Mode**: Theme switching with next-themes
- **Image Gallery**: Optimized image display with lazy loading and intersection observer
- **Blog System**: Markdown-based blog with syntax highlighting and reading time estimates

### 🔒 Privacy & Compliance
- **GDPR Compliant**: Full cookie consent management system
- **Secure Consent Storage**: httpOnly cookies with 12-month expiration
- **Consent Logging**: Audit trail with IP hashing stored in Supabase
- **Conditional Analytics**: Scripts load only after explicit user consent
  - Google Analytics
  - Facebook Pixel
  - Yandex Metrica
  - Microsoft Clarity
- **Privacy Controls**: User-friendly consent management and withdrawal

### 📅 Booking & Payments
- **Online Booking**: Integrated booking system for photography sessions
- **Payment Processing**: Secure payment integration
- **Session Management**: Track and manage photography appointments

### 📊 Analytics & Performance
- **Vercel Analytics**: Built-in performance monitoring
- **Speed Insights**: Real-time performance metrics
- **Web Vitals**: Core Web Vitals tracking
- **Bundle Analysis**: Optimized build size monitoring

## 🚀 Tech Stack

### Frontend
- **Framework**: Next.js 15.5.0 with App Router and Turbopack
- **UI Library**: React 19.1.0
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 4.x
- **Components**: Radix UI primitives
- **Animations**: Framer Motion
- **Forms**: React Hook Form + Zod validation
- **State Management**: Zustand

### Backend & Database
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Email**: Resend

### Developer Tools
- **Linting & Formatting**: Biome
- **Type Checking**: TypeScript
- **Bundle Analysis**: @next/bundle-analyzer
- **Package Manager**: npm/pnpm

## 📦 Installation

### Prerequisites
- Node.js 20.x or higher
- npm or pnpm
- Supabase account
- Environment variables (see `.env.example`)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/ugurcankurt/istanbulportrait.git
   cd istanbulportrait
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables:
   - Supabase credentials
   - Analytics IDs (Google Analytics, Facebook Pixel, etc.)
   - Email service credentials
   - Payment gateway credentials

4. **Set up Supabase**
   ```bash
   npm run setup:supabase
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🛠️ Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Build production bundle with type checking |
| `npm run build:analyze` | Build with bundle size analysis |
| `npm run start` | Start production server |
| `npm run lint` | Run Biome linter |
| `npm run lint:fix` | Fix linting issues automatically |
| `npm run format` | Format code with Biome |
| `npm run type-check` | Run TypeScript type checking |
| `npm run setup:supabase` | Initialize Supabase database |
| `npm run test:db` | Test database connection |
| `npm run test:payment` | Test payment integration |
| `npm run health-check` | Run health checks |
| `npm run check-translations` | Verify translation completeness |
| `npm run clean` | Clean build artifacts |

## 🌍 Internationalization

The project supports the following languages:
- 🇬🇧 English (en)
- 🇹🇷 Turkish (tr)
- 🇸🇦 Arabic (ar)
- 🇪🇸 Spanish (es)
- 🇷🇺 Russian (ru)
- 🇨🇳 Chinese (zh)

Translation files are located in `/messages/[locale].json`

## 🗄️ Database Schema

The project uses Supabase with the following main tables:
- **consent_logs**: GDPR consent audit trail
- **bookings**: Photography session bookings
- **users**: User profiles and authentication
- **blog_posts**: Blog content management

Migration files are in `/supabase/migrations/`

## 🔐 Security & Privacy

### GDPR Compliance
- ✅ Cookie consent before analytics loading
- ✅ Secure consent storage (httpOnly cookies)
- ✅ Consent audit logging with IP hashing
- ✅ User consent withdrawal capability
- ✅ Privacy policy and cookie information
- ✅ 12-month consent expiration

### Security Features
- Environment variable protection
- Secure authentication with Supabase
- HTTPS enforcement
- Content Security Policy
- Rate limiting on API routes

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🚀 Deployment

The project is optimized for deployment on Vercel:

1. **Connect your repository** to Vercel
2. **Configure environment variables** in Vercel dashboard
3. **Deploy** - Vercel will automatically build and deploy

Custom deployment configuration is available in `vercel.json`

## 📄 License

This project is private and proprietary. All rights reserved.

## 🤝 Contributing

This is a private project. For contribution guidelines, please see [CONTRIBUTING.md](.github/CONTRIBUTING.md)

## 📧 Contact

For inquiries, please visit [istanbulportrait.com](https://istanbulportrait.com)

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Database by [Supabase](https://supabase.com/)
- Deployed on [Vercel](https://vercel.com/)

---

**Made with ❤️ in Istanbul**