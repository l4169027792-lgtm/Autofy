# Autofy Frontend

A transparency-first used car marketplace built with Next.js and connected to Supabase.

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Create a `.env.local` file with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Open http://localhost:3000

## Deployment to Vercel

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

## Database Setup

Run the SQL from `supabase-setup.sql` in your Supabase SQL Editor to create all required tables.

## Features

- ✅ Homepage with featured vehicles
- ✅ Inventory page with filters
- ✅ Vehicle detail pages with disclosure tabs
- ✅ Contact form → saves to Supabase
- ✅ Reserve modal → saves to Supabase
- ✅ Responsive design
- ✅ Mobile-friendly
