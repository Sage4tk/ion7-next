# ion7

A domain registration and management platform built with Next.js.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript, React 19
- **Database:** PostgreSQL (Neon serverless) via Prisma 7
- **Auth:** NextAuth v5 (credentials provider, JWT sessions)
- **Payments:** Stripe (subscriptions, checkout, customer portal)
- **UI:** shadcn/ui, Tailwind CSS v4, Radix UI, Lucide icons, Recharts
- **State:** Zustand
- **Validation:** Zod v4, React Hook Form

## Features

- User registration and authentication
- Subscription plan selection with Stripe checkout
- Domain availability checking
- Domain registration and management
- User dashboard with domain overview

## Project Structure

```
app/
├── api/
│   ├── auth/          # NextAuth routes, registration, current user
│   ├── domains/       # Domain check & registration endpoints
│   └── stripe/        # Checkout, portal, and webhook routes
├── choose-plan/       # Plan selection page
├── dashboard/         # Protected dashboard & domain management
├── login/             # Login page
├── register/          # Registration page
└── subscription-success/
prisma/
└── schema.prisma      # User and Domain models
lib/
├── auth.ts            # NextAuth configuration
├── prisma.ts          # Prisma client singleton
└── generated/prisma/  # Generated Prisma client
components/ui/         # shadcn/ui components
middleware.ts          # Route protection for /dashboard
```

## Getting Started

### Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech) PostgreSQL database
- A [Stripe](https://stripe.com) account

### Environment Variables

Create a `.env.local` file:

```env
DATABASE_URL=           # Neon PostgreSQL connection string
AUTH_SECRET=            # NextAuth secret (generate with `openssl rand -base64 32`)
STRIPE_SECRET_KEY=      # Stripe secret key
STRIPE_WEBHOOK_SECRET=  # Stripe webhook signing secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=  # Stripe publishable key
```

### Setup

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

| Command         | Description              |
| --------------- | ------------------------ |
| `npm run dev`   | Start dev server         |
| `npm run build` | Production build         |
| `npm run start` | Start production server  |
| `npm run lint`  | Run ESLint               |
