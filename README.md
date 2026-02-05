# BookClubApp

## Tech Stack
- React Native (Expo)
- Expo Router (file-based routing)
- NativeWind (Tailwind CSS for React Native)
- Supabase Auth (Google OAuth)
- TanStack Query (React Query)
- TypeScript

## Setup
1. Copy `.env` and add your Supabase project URL and anon key.
2. Run `npm install` to install dependencies.
3. Start the app with `npm start` or `expo start`.

## Authentication
- The app redirects to `/auth` if the user is not authenticated.
- Google OAuth is handled via Supabase Auth.

## Styling
- Uses NativeWind (Tailwind CSS for React Native).
- Tailwind config is set up for the app and components directories.

---
Replace placeholder values in `.env` and `auth.tsx` (redirectTo) with your actual Supabase and app scheme values.
