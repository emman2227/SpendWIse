# SpendWise — New Device Migration & Setup Manual

This document provides all details required to restore the full **SpendWise** development environment on your new laptop after cloning from Git.

---

## 1. System Prerequisites

Install the following tools before running project installation commands:

| Tool          | Required Version                   | Install Command / Link                                                       |
| :------------ | :--------------------------------- | :--------------------------------------------------------------------------- |
| **Node.js**   | `>= 20.11.0` (v22 LTS recommended) | [Node.js Official](https://nodejs.org) or `winget install OpenJS.NodeJS.LTS` |
| **pnpm**      | `9.15.4`                           | `npm install -g pnpm@9.15.4` or `corepack enable`                            |
| **Git**       | Latest                             | [git-scm.com](https://git-scm.com)                                           |
| **Turbo CLI** | Optional global                    | `npm install -g turbo`                                                       |
| **Nest CLI**  | Optional global                    | `npm install -g @nestjs/cli`                                                 |

---

## 2. Git-Ignored Environment Files (`.env`)

Recreate the following 4 `.env` files in their respective folders:

### 2.1. Root Workspace Environment

**File path:** `SpendWise/.env`

```env
# Workspace-level defaults
NODE_ENV=development
PORT=4000
API_PORT=4000
WEB_PORT=3000
MOBILE_API_URL=http://localhost:4000/api/v1
API_BASE_URL=http://localhost:4000/api/v1

# Google SMTP Email Verification
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-smtp-email@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM_EMAIL=your-smtp-email@gmail.com
SMTP_FROM_NAME=SpendWise
EMAIL_VERIFICATION_CODE_TTL_MINUTES=10
EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS=60
```

---

### 2.2. Backend API Environment

**File path:** `SpendWise/apps/api/.env`

```env
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb+srv://<username>:<password>@spendwise.c2i5amu.mongodb.net/
JWT_ACCESS_SECRET=change-me-access-secret
JWT_REFRESH_SECRET=change-me-refresh-secret
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
AI_PROVIDER=gemini
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-generative-ai-api-key
```

---

### 2.3. Web Frontend (Next.js) Environment

**File path:** `SpendWise/apps/web/.env`

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:4000/api/v1
NEXT_PUBLIC_APP_NAME=SpendWise
AUTH_COOKIE_NAME=spendwise_access_token
BETTER_AUTH_SECRET=replace-with-a-long-random-string
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_GENERATIVE_AI_API_KEY=
```

---

### 2.4. Mobile App (Expo) Environment

**File path:** `SpendWise/apps/mobile/.env`

```env
EXPO_PUBLIC_API_URL=http://localhost:4000/api/v1
EXPO_PUBLIC_APP_NAME=SpendWise
```

> **Note:** When previewing on a physical device using Expo Go, replace `localhost` with your computer's local Wi-Fi IP address (e.g. `http://192.168.1.50:4000/api/v1`).

---

## 3. Step-by-Step Restoration & Dev Commands

Run these terminal commands in order in the root folder:

```bash
# 1. Install all monorepo dependencies across all packages and apps
pnpm install

# 2. Build internal shared packages (types, AI SDK, design tokens)
pnpm --filter @spendwise/shared build
pnpm --filter @spendwise/ai build

# 3. (Optional) Run full build verification across all apps
pnpm build

# 4. (Optional) Seed the MongoDB database with initial sample data & categories
pnpm --filter @spendwise/api seed

# 5. Start all apps concurrently (API on 4000, Web on 3000, Mobile on Expo)
pnpm dev
```

### Individual Service Commands:

- **Backend API only (Port 4000):** `pnpm --filter @spendwise/api dev`
- **Web Dashboard only (Port 3000):** `pnpm --filter @spendwise/web dev`
- **Mobile App only (Expo):** `pnpm --filter @spendwise/mobile dev`

---

## 4. Complete Libraries & Dependencies Matrix

### Backend API (`apps/api/package.json`)

- `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express` (`^10.4.15`): NestJS framework
- `@nestjs/mongoose`, `mongoose` (`^10.1.0` / `^8.9.4`): MongoDB Atlas connection and ORM
- `@nestjs/jwt`, `passport`, `passport-jwt` (`^10.2.0` / `^4.0.1`): JWT authentication & guard strategies
- `@node-rs/bcrypt` (`^1.10.7`): Password hashing
- `nodemailer` (`^8.0.4`): Gmail SMTP mailer for OTP verification codes
- `@nestjs/schedule` (`^6.1.3`): Scheduled cron jobs
- `zod` (`^3.24.1`): Request DTO validation
- `@spendwise/ai`, `@spendwise/shared`: Internal workspace packages

### Web Frontend (`apps/web/package.json`)

- `next` (`^15.1.6`), `react`, `react-dom` (`^18.3.1`): Next.js 15 App Router frontend
- `tailwindcss` (`^3.4.16`), `postcss`, `autoprefixer`: CSS styling engine
- `@tanstack/react-query` (`^5.62.9`): Server state management & caching
- `zustand` (`^5.0.2`): Client-side state store
- `lucide-react` (`^1.7.0`): Icon system
- `recharts` (`^3.8.1`): Financial charts & graphs
- `motion` (`^12.42.2`): Interactive UI animations
- `@radix-ui/*`, `@base-ui/react`: Accessible UI primitives
- `better-auth` (`^1.5.6`): Auth client
- `next-themes` (`^0.4.6`): Dark/Light theme switching

### Mobile App (`apps/mobile/package.json`)

- `expo` (`~52.0.20`), `react-native` (`0.76.5`): React Native mobile runtime
- `zustand` (`^5.0.2`), `@tanstack/react-query` (`^5.62.9`): Mobile state & queries

### Shared Packages & AI (`packages/*`)

- `@spendwise/ai`: Vercel AI SDK (`ai` `^6.0.142`) + `@ai-sdk/google` (`^3.0.55`) for Gemini AI
- `@spendwise/shared`: Shared interfaces, types, constants, schemas
- `@spendwise/ui`: Shared design components
- `@spendwise/config`: Shared ESLint, Prettier, TypeScript presets
- `turbo` (`^2.3.3`): Turborepo build pipeline orchestrator
