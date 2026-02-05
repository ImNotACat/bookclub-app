// TypeScript types for Supabase database tables

export type BookStatus = 'want_to_read' | 'reading' | 'read' | 'abandoned';

export interface Book {
  id: string;
  google_books_id: string | null;
  title: string;
  author: string | null;
  year: string | null;
  cover_url: string | null;
  synopsis: string | null;
  isbn: string | null;
  page_count: number | null;
  language: string | null;
  categories: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface UserBook {
  id: string;
  user_id: string;
  book_id: string;
  status: BookStatus;
  started_at: string | null;
  finished_at: string | null;
  current_page: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  book?: Book;
}

export interface BookRating {
  id: string;
  user_id: string;
  book_id: string;
  rating: number; // 0-5
  review: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  book?: Book;
}

export interface BookQuote {
  id: string;
  user_id: string;
  book_id: string;
  quote_text: string;
  page_number: number | null;
  chapter: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  book?: Book;
}

// Helper type for inserting (without timestamps and IDs)
export type BookInsert = Omit<Book, 'id' | 'created_at' | 'updated_at'>;
export type UserBookInsert = Omit<UserBook, 'id' | 'created_at' | 'updated_at'>;
export type BookRatingInsert = Omit<BookRating, 'id' | 'created_at' | 'updated_at'>;
export type BookQuoteInsert = Omit<BookQuote, 'id' | 'created_at' | 'updated_at'>;

// Helper type for updating (all fields optional except ID)
export type BookUpdate = Partial<Omit<Book, 'id' | 'created_at'>>;
export type UserBookUpdate = Partial<Omit<UserBook, 'id' | 'user_id' | 'created_at'>>;
export type BookRatingUpdate = Partial<Omit<BookRating, 'id' | 'user_id' | 'created_at'>>;
export type BookQuoteUpdate = Partial<Omit<BookQuote, 'id' | 'user_id' | 'created_at'>>;
