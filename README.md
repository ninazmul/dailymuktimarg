# 📰 Daily Muktimarg (দৈনিক মুক্তি মার্গ)

![Daily Muktimarg Platform](/public/assets/images/logo.png)

A modern, high-performance, enterprise-grade News & Media Content Management System (CMS) and Public Portal built with **Next.js 16 (App Router)**, **TypeScript**, **MongoDB/Mongoose**, and **Clerk Authentication** with granular **Role-Based Access Control (RBAC)**.

---

## 🌟 Key Features

### 📰 News & Editorial Workflow
- **Full Article CRUD**: Rich-text article editor powered by **TipTap** with embedded media, image captions, and custom formatting.
- **Publishing Control**: Support for `Draft`, `Review`, `Published`, and `Archived` statuses with scheduled publishing capabilities.
- **Lead & Breaking News**: Highlight breaking news tickers and pin lead stories (positions 1–12) on the homepage.
- **Rich Taxonomy**: Hierarchical category & nested category structure, tag system, and author/reporter attribution.
- **Metrics & Engagement**: Real-time article view counters and trending news ranking algorithms.

### 📅 "Today's News" Portal (আজকের পত্রিকা)
- **Dedicated Daily News Hub**: `/todays-news` page displaying all news published on the current day.
- **Dual Date Display**: Real-time Bengali date engine rendering Gregorian dates alongside the official Bangladesh **Bangla Era (BS)** calendar (e.g. `বৃহস্পতিবার, ২৩ জুলাই ২০২৬, ৭ শ্রাবণ ১৪৩৩`).
- **Dashboard Layout Manager**: Admins can customize title, subtitle, layout style (`Lead Story + Grid`, `Standard Grid`, `List View`), post limits, and category filter bars from `/dashboard/todays-news`.

### 📸 Photo Gallery & Lightbox (ক্লিকস্মৃতি)
- **Photo Albums**: Public photo gallery showcase at `/gallery` and homepage showcase.
- **Multi-Photo Captions**: Main cover photo plus multiple secondary high-resolution photos with individual captions.
- **Full-Screen Lightbox**: Interactive Lightbox modal viewer with keyboard navigation and fullscreen preview.

### 🌐 Dynamic Social Media Management
- **Flexible Social Handles**: Dynamically add, edit, or remove social profiles from `/dashboard/settings` (Facebook, Twitter/X, YouTube, Instagram, LinkedIn, WhatsApp, Telegram, TikTok, Pinterest, Threads, etc.).
- **Header & Footer Integration**: Automatic brand icon rendering in the global header dropdown and footer.

### 🎨 Homepage Layout Builder
- **Dynamic Section Manager**: Configure homepage layout modules (`Hero Banner`, `Lead Stories Grid`, `Category News Grid`, `Trending Now`, `Video Gallery`, `Photo Gallery`, `Widgets Row`) from `/dashboard/builder`.
- **Reordering & Toggle**: Reorder sections and toggle visibility without code deployment.

### 🔐 Multi-Tier Granular Permission Control (RBAC)
- **Pre-Registered Admins**: Super-admins can pre-register new admin emails.
- **Per-Module Permissions**: Assign read, create, update, delete, and publish permissions for each module:
  - `news`, `categories`, `tags`, `homepage-builder`, `todays-news`, `media`, `gallery`, `reporters`, `authors`, `ads`, `polls`, `pages`, `users`, `audit-logs`, `settings`.
- **Audit Logging**: Comprehensive activity tracking for administrative actions.

### 📊 Advertisements & Interactive Polls
- **Ad Management**: Position-based ad manager for `header`, `sidebar`, `footer`, `popup`, `sticky`, `inline`, and `mobile` slots.
- **Interactive Polls**: Public voting widgets with real-time percentage progress bars and voter deduplication.

---

## 🏗️ Tech Stack & Architecture

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Actions, React 19)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [MongoDB](https://www.mongodb.com/) via [Mongoose 9](https://mongoosejs.com/)
- **Authentication**: [Clerk Auth](https://clerk.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Radix UI Primitives](https://www.radix-ui.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Rich Text**: [TipTap Editor](https://tiptap.dev/)
- **Media Uploads**: [UploadThing](https://uploadthing.com/)
- **Notifications**: [React Hot Toast](https://react-hot-toast.com/)

---

## 📁 Directory Structure

```
dailymuktimarg/
├── app/
│   ├── (root)/                 # Public Client Pages
│   │   ├── page.tsx            # Homepage
│   │   ├── gallery/            # Photo Gallery Showcase & Detail Page
│   │   ├── todays-news/        # Today's News Portal
│   │   ├── category/[slug]/    # Category News Listing
│   │   ├── news/[slug]/        # News Detail Page
│   │   └── search/             # Advanced Search Page
│   └── dashboard/              # Admin CMS Dashboard
│       ├── builder/            # Homepage Layout Builder
│       ├── todays-news/        # Today's News Layout Manager
│       ├── gallery/            # Photo Gallery Management
│       ├── news/               # News Article Management
│       ├── settings/           # Site Settings & Dynamic Social Links
│       ├── users/              # RBAC Permission Management
│       └── components/         # Admin Sidebar & Header Components
├── components/
│   ├── shared/                 # Reusable UI (Header, Footer, MediaLibraryModal, etc.)
│   └── ui/                     # Radix UI Core Components
├── constants/
│   └── permissions.ts          # Central Module Permission Definitions & Routes
├── lib/
│   ├── actions/                # Server Actions (news, gallery, setting, rbac, etc.)
│   ├── auth/                   # RBAC Protection Middleware & Authorization Rules
│   ├── database/               # Mongoose DB Connection & Models
│   │   └── models/             # Schema definitions (News, Setting, Gallery, User, etc.)
│   └── utils.ts                # Helper utilities & slug generators
├── types/                      # TypeScript Form Params & Interfaces
└── public/                     # Static Assets & Logos
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js `18.x` or `20.x`
- npm, yarn, or pnpm
- MongoDB connection URI
- Clerk account credentials

### 2. Environment Setup
Create a `.env.local` file in the root directory:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/dailymuktimarg

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# UploadThing (Media Library)
UPLOADTHING_SECRET=sk_live_...
UPLOADTHING_APP_ID=...
```

### 3. Installation

```bash
# Clone the repository
git clone https://github.com/ninazmul/dailymuktimarg.git
cd dailymuktimarg

# Install dependencies
npm install
```

### 4. Running Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 🧪 Build & Verification

```bash
# TypeScript type check
npx tsc --noEmit

# Production build
npm run build

# Start production server
npm run start
```

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).
