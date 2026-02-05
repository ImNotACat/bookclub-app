# Database Setup Instructions

This directory contains SQL migration files for setting up the BookClubApp database schema.

## Setup Steps

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor

2. **Run the Migration**
   - Copy the contents of `migrations/001_initial_schema.sql`
   - Paste it into the SQL Editor in Supabase
   - Click "Run" to execute the migration

3. **Verify Tables**
   - Go to the Table Editor in Supabase
   - You should see the following tables:
     - `books` - Stores book information
     - `user_books` - User reading lists with status and dates
     - `book_ratings` - User ratings/scores for books
     - `book_quotes` - User-added quotes from books

## Database Schema

### Books Table
Stores book information, can reference Google Books API:
- `id` (UUID, Primary Key)
- `google_books_id` (TEXT, Unique) - Google Books API volume ID
- `title`, `author`, `year`, `cover_url`, `synopsis`
- `isbn`, `page_count`, `language`, `categories`

### User Books Table
Tracks user's reading list with status and dates:
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key to auth.users)
- `book_id` (UUID, Foreign Key to books)
- `status` (TEXT) - One of: 'want_to_read', 'reading', 'read', 'abandoned'
- `started_at` (DATE) - When user started reading
- `finished_at` (DATE) - When user finished reading
- `current_page` (INTEGER) - Current reading progress
- `notes` (TEXT) - User notes

### Book Ratings Table
Stores user ratings/scores for books:
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key to auth.users)
- `book_id` (UUID, Foreign Key to books)
- `rating` (DECIMAL 0-5) - User's rating
- `review` (TEXT) - Optional review text

### Book Quotes Table
Stores quotes added by users:
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key to auth.users)
- `book_id` (UUID, Foreign Key to books)
- `quote_text` (TEXT) - The quote text
- `page_number` (INTEGER) - Page where quote was found
- `chapter` (TEXT) - Chapter name
- `notes` (TEXT) - User notes about the quote

## Row Level Security (RLS)

All tables have RLS enabled with the following policies:
- **Books**: Everyone can read, authenticated users can insert
- **User Books, Ratings, Quotes**: Users can only see/modify their own data

## Usage

After running the migration, you can use the database functions in `lib/database.ts`:

```typescript
import { 
  addToReadingList, 
  getUserReadingList, 
  setBookRating,
  addBookQuote 
} from '@/lib/database';
```

See `lib/database.ts` for all available functions.
