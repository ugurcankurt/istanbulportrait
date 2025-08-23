# Istanbul Portrait Photography Website

A modern, multilingual photography website built with Next.js 15, showcasing professional portrait photography services in Istanbul.

## 🌟 Features

- **Multilingual Support**: English, Arabic, Russian, and Spanish
- **Responsive Design**: Optimized for all devices using Tailwind CSS
- **Modern UI Components**: Built with shadcn/ui components
- **SEO Optimized**: Structured data, meta tags, and sitemap for search engines
- **Performance First**: Optimized images and lazy loading
- **Contact Forms**: Integrated contact form with validation
- **Professional Layout**: Hero sections, service packages, and about pages

## 🎯 Target Keywords

The website is optimized for Google search rankings with these target keywords:
- istanbul photographer
- istanbul photoshoot
- istanbul rooftop photoshoot
- portrait photographer istanbul
- couple photography istanbul

## 🛠 Tech Stack

- **Framework**: Next.js 15 with App Router and Turbopack
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom utilities
- **UI Components**: shadcn/ui with Radix UI primitives
- **Internationalization**: next-intl for multilingual support
- **Forms**: React Hook Form with Zod validation
- **Animations**: Framer Motion for smooth animations
- **Icons**: Lucide React
- **State Management**: Zustand (when needed)
- **Code Quality**: Biome for linting and formatting

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd istanbulportrait
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📝 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production application
- `npm start` - Start production server
- `npm run lint` - Run Biome linter checks
- `npm run format` - Format code with Biome

## 🌍 Multilingual Support

The website supports 4 languages with localized URLs:
- English: `/en`
- Arabic: `/ar` (RTL support)
- Russian: `/ru`
- Spanish: `/es`

Default language is English, and users can switch languages using the language selector in the navigation.

## 📱 Responsive Design

The website is fully responsive with breakpoints optimized for:
- Mobile devices (320px+)
- Tablets (768px+)
- Desktop (1024px+)
- Large screens (1280px+)

## 🔍 SEO Features

- **Structured Data**: JSON-LD markup for search engines
- **Meta Tags**: Optimized titles, descriptions, and Open Graph tags
- **Sitemap**: Automatically generated XML sitemap
- **Robots.txt**: Search engine crawling configuration
- **Image Optimization**: Next.js Image component with WebP/AVIF support
- **Performance**: Lighthouse-optimized for Core Web Vitals

## 🎨 Customization

### Colors and Theming
The design uses a professional color scheme defined in CSS variables. You can customize the theme in `app/globals.css`.

### Content Updates
All text content is stored in JSON files in the `messages/` directory:
- `messages/en.json` - English content
- `messages/ar.json` - Arabic content
- `messages/ru.json` - Russian content
- `messages/es.json` - Spanish content

### Images
Replace the Unsplash placeholder images with actual photography portfolio images:
- Hero background image
- About page photographer image
- Add portfolio gallery images

## 📋 Deployment on Vercel

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)

2. Visit [vercel.com](https://vercel.com) and sign up/login

3. Click "New Project" and import your repository

4. Configure the project:
   - Framework Preset: Next.js
   - Root Directory: `./` (if not detected automatically)
   - Build Command: `npm run build`
   - Output Directory: `.next` (default)

5. Add environment variables if needed

6. Click "Deploy"

7. Your site will be available at `https://your-project.vercel.app`

### Custom Domain Setup

To use `istanbulportrait.com`:

1. In Vercel dashboard, go to Project Settings > Domains
2. Add your custom domain
3. Configure DNS records as instructed by Vercel
4. SSL certificates will be automatically generated

## 📞 Contact Configuration

Update the contact information in the message files:
- Email: `info@istanbulportrait.com`
- Phone: Update with actual phone number
- Location: Verify Istanbul, Turkey address

For the contact form to work in production, you'll need to:
1. Set up a backend service (like Formspree, Netlify Forms, or custom API)
2. Update the form submission handler in `components/contact-section.tsx`

## 🚀 Performance Optimization

The website is already optimized for performance:
- Server-side rendering with Next.js App Router
- Image optimization with Next.js Image component
- Code splitting and tree shaking
- CSS optimization with Tailwind CSS
- Turbopack for faster development builds

## 📈 Analytics

To add analytics (recommended for SEO tracking):
1. Set up Google Analytics 4
2. Add the tracking code to the root layout
3. Consider adding Google Search Console for SEO monitoring

## 🛡 Security

The website follows security best practices:
- No sensitive data exposed in client-side code
- Proper form validation
- CSP headers (can be configured in next.config.ts)
- HTTPS enforced in production

## 📄 License

This project is proprietary software for Istanbul Portrait Photography.

---

Built with ❤️ using Next.js and modern web technologies.