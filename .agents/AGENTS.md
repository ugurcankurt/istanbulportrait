# Antigravity IDE Agents Configuration for istanbulportrait.com

This file provides workspace-scoped rules and context for Antigravity IDE agents.

## Tech Stack Overview
- **Framework**: Next.js 16.3.0 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui (Radix UI)
- **Database / Auth**: Supabase (with `@supabase/ssr`)
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod
- **Internationalization (i18n)**: next-intl
- **Linting & Formatting**: Biome
- **Package Manager**: pnpm

## General Rules
1. **Always use App Router**: Do NOT use the `pages` directory. All routes should be in the `app/` directory following Next.js App Router conventions (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`).
2. **Server and Client Components**: 
   - By default, components in the App Router are Server Components.
   - Use the `"use client"` directive ONLY when necessary (e.g., when using hooks like `useState`, `useEffect`, event listeners, or browser APIs).
   - Try to keep Client Components as leaves in the component tree to maximize Server Component usage.
3. **Data Fetching**:
   - Prefer fetching data in Server Components natively with `async/await`.
   - Do not use `useEffect` for data fetching unless absolutely required in a Client Component.
4. **TypeScript**: 
   - Strictly use TypeScript (`.ts`, `.tsx`). 
   - Avoid `any`. Prefer explicit types or `zod` schemas.

## UI and Styling
1. **Tailwind CSS**: 
   - This project uses Tailwind CSS v4. Use utility classes for styling.
   - Do not use arbitrary CSS values unless absolutely necessary.
2. **shadcn/ui**: 
   - Radix UI is heavily used here via shadcn. Prefer using existing shadcn components in the `components/ui` or `components/` directory before building custom UI elements from scratch.
3. **Icons**: 
   - The project uses multiple icon libraries (`lucide-react`, `@phosphor-icons/react`, `@hugeicons/react`, `@remixicon/react`). Be consistent or use the one requested specifically.

## Database and Authentication (Supabase)
1. **Server-Side Rendering (SSR)**: 
   - When accessing Supabase from Server Components, Route Handlers, or Server Actions, always use `@supabase/ssr` methods to create the Supabase client.
   - Be mindful of cookie management when dealing with Supabase auth on the server.
2. **Client-Side**:
   - For client-side Supabase interactions, use the appropriate browser client initialized with `@supabase/ssr`.

## Forms and Validation
1. Use **React Hook Form** coupled with **Zod** for schema validation.
2. Server Actions should validate inputs using the same Zod schemas before processing.

## State Management
1. **Zustand**: Use Zustand for global client-side state. It is located in the `stores/` directory.

## Internationalization (i18n)
1. **next-intl**: The project is localized using `next-intl`. 
   - When adding user-facing text, ensure it uses the translation function (e.g., `useTranslations` in client components or `getTranslations` in server components/actions).
   - Keys should be added to the appropriate JSON files in the `messages/` directory.

## Code Quality
1. **Biome**: 
   - The project uses Biome instead of ESLint/Prettier. 
   - Make sure your generated code adheres to standard Biome formatting (or run `pnpm run lint:fix` / `pnpm run format` if unsure).
   - Do not add `.eslintrc` or `.prettierrc` files.

## Scripts & Tools
- Always use `pnpm` instead of `npm` or `yarn` for managing dependencies.
- You can run `pnpm dev` to start the server. Note that `next dev --turbopack` is used.
