import { supabase } from './supabase';
import { formatBookForDatabase, getBookById as getGoogleBookById } from './googleBooks';
import type { GoogleBook } from './googleBooks';
import type {
  Book,
  BookInsert,
  BookUpdate,
  UserBook,
  UserBookInsert,
  UserBookUpdate,
  BookRating,
  BookRatingInsert,
  BookRatingUpdate,
  BookQuote,
  BookQuoteInsert,
  BookQuoteUpdate,
  BookStatus,
} from './database.types';

// ==================== BOOKS ====================

/**
 * Get or create a book by Google Books ID
 * If book exists, return it; otherwise create and return
 */
export async function getOrCreateBook(googleBooksId: string, bookData?: BookInsert): Promise<Book | null> {
  try {
    // First, try to find existing book
    const { data: existingBook, error: findError } = await supabase
      .from('books')
      .select('*')
      .eq('google_books_id', googleBooksId)
      .single();

    if (existingBook && !findError) {
      return existingBook as Book;
    }

    // Book doesn't exist, need to create it
    // If bookData not provided, fetch from Google Books API
    let insertData: BookInsert;
    if (bookData) {
      insertData = bookData;
    } else {
      const googleBook = await getGoogleBookById(googleBooksId);
      if (!googleBook) {
        console.error('Could not fetch book from Google Books API');
        return null;
      }
      insertData = formatBookForDatabase(googleBook);
    }

    const { data: newBook, error: insertError } = await supabase
      .from('books')
      .insert({ ...insertData, google_books_id: googleBooksId })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating book:', insertError);
      return null;
    }

    return newBook as Book;
  } catch (error) {
    console.error('Error in getOrCreateBook:', error);
    return null;
  }
}

/**
 * Sync Google Books data with database
 * Fetches book from Google Books API and creates/updates it in the database
 */
export async function syncGoogleBookToDatabase(googleBooksId: string): Promise<Book | null> {
  try {
    const googleBook = await getGoogleBookById(googleBooksId);
    if (!googleBook) {
      return null;
    }

    const bookData = formatBookForDatabase(googleBook);
    return await getOrCreateBook(googleBooksId, bookData);
  } catch (error) {
    console.error('Error syncing Google Book to database:', error);
    return null;
  }
}

/**
 * Get book by ID
 */
export async function getBookById(bookId: string): Promise<Book | null> {
  try {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', bookId)
      .single();

    if (error) {
      console.error('Error fetching book:', error);
      return null;
    }

    return data as Book;
  } catch (error) {
    console.error('Error in getBookById:', error);
    return null;
  }
}

/**
 * Update book
 */
export async function updateBook(bookId: string, updates: BookUpdate): Promise<Book | null> {
  try {
    const { data, error } = await supabase
      .from('books')
      .update(updates)
      .eq('id', bookId)
      .select()
      .single();

    if (error) {
      console.error('Error updating book:', error);
      return null;
    }

    return data as Book;
  } catch (error) {
    console.error('Error in updateBook:', error);
    return null;
  }
}

// ==================== USER BOOKS (READING LIST) ====================

/**
 * Get user's reading list with book details
 */
export async function getUserReadingList(userId: string, status?: BookStatus): Promise<UserBook[]> {
  try {
    let query = supabase
      .from('user_books')
      .select(`
        *,
        book:books(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching reading list:', error);
      return [];
    }

    return (data || []) as UserBook[];
  } catch (error) {
    console.error('Error in getUserReadingList:', error);
    return [];
  }
}

/**
 * Add book to user's reading list
 */
export async function addToReadingList(
  userId: string,
  bookId: string,
  status: BookStatus = 'want_to_read',
  startedAt?: Date
): Promise<UserBook | null> {
  try {
    const insertData: UserBookInsert = {
      user_id: userId,
      book_id: bookId,
      status,
      started_at: startedAt ? startedAt.toISOString().split('T')[0] : null,
    };

    const { data, error } = await supabase
      .from('user_books')
      .insert(insertData)
      .select(`
        *,
        book:books(*)
      `)
      .single();

    if (error) {
      // If it's a unique constraint error, update instead
      if (error.code === '23505') {
        return updateReadingListStatus(userId, bookId, status, startedAt);
      }
      console.error('Error adding to reading list:', error);
      return null;
    }

    return data as UserBook;
  } catch (error) {
    console.error('Error in addToReadingList:', error);
    return null;
  }
}

/**
 * Update reading list item status
 */
export async function updateReadingListStatus(
  userId: string,
  bookId: string,
  status: BookStatus,
  startedAt?: Date,
  finishedAt?: Date
): Promise<UserBook | null> {
  try {
    const updates: UserBookUpdate = {
      status,
      started_at: startedAt ? startedAt.toISOString().split('T')[0] : undefined,
      finished_at: finishedAt ? finishedAt.toISOString().split('T')[0] : undefined,
    };

    // If marking as finished, set finished_at if not already set
    if (status === 'read' && !updates.finished_at) {
      updates.finished_at = new Date().toISOString().split('T')[0];
    }

    const { data, error } = await supabase
      .from('user_books')
      .update(updates)
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .select(`
        *,
        book:books(*)
      `)
      .single();

    if (error) {
      console.error('Error updating reading list:', error);
      return null;
    }

    return data as UserBook;
  } catch (error) {
    console.error('Error in updateReadingListStatus:', error);
    return null;
  }
}

/**
 * Update reading list item (general update)
 */
export async function updateReadingListItem(
  userId: string,
  userBookId: string,
  updates: UserBookUpdate
): Promise<UserBook | null> {
  try {
    const { data, error } = await supabase
      .from('user_books')
      .update(updates)
      .eq('id', userBookId)
      .eq('user_id', userId)
      .select(`
        *,
        book:books(*)
      `)
      .single();

    if (error) {
      console.error('Error updating reading list item:', error);
      return null;
    }

    return data as UserBook;
  } catch (error) {
    console.error('Error in updateReadingListItem:', error);
    return null;
  }
}

/**
 * Remove book from reading list
 */
export async function removeFromReadingList(userId: string, bookId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_books')
      .delete()
      .eq('user_id', userId)
      .eq('book_id', bookId);

    if (error) {
      console.error('Error removing from reading list:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in removeFromReadingList:', error);
    return false;
  }
}

/**
 * Get user's reading statistics
 */
export async function getUserReadingStats(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_books')
      .select('status')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching reading stats:', error);
      return { read: 0, reading: 0, wantToRead: 0, abandoned: 0 };
    }

    const stats = {
      read: data?.filter((item) => item.status === 'read').length || 0,
      reading: data?.filter((item) => item.status === 'reading').length || 0,
      wantToRead: data?.filter((item) => item.status === 'want_to_read').length || 0,
      abandoned: data?.filter((item) => item.status === 'abandoned').length || 0,
    };

    return stats;
  } catch (error) {
    console.error('Error in getUserReadingStats:', error);
    return { read: 0, reading: 0, wantToRead: 0, abandoned: 0 };
  }
}

// ==================== BOOK RATINGS ====================

/**
 * Get user's rating for a book
 */
export async function getUserBookRating(userId: string, bookId: string): Promise<BookRating | null> {
  try {
    const { data, error } = await supabase
      .from('book_ratings')
      .select(`
        *,
        book:books(*)
      `)
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rating found
        return null;
      }
      console.error('Error fetching rating:', error);
      return null;
    }

    return data as BookRating;
  } catch (error) {
    console.error('Error in getUserBookRating:', error);
    return null;
  }
}

/**
 * Add or update book rating
 */
export async function setBookRating(
  userId: string,
  bookId: string,
  rating: number,
  review?: string
): Promise<BookRating | null> {
  try {
    // Check if rating exists
    const existingRating = await getUserBookRating(userId, bookId);

    if (existingRating) {
      // Update existing rating
      const { data, error } = await supabase
        .from('book_ratings')
        .update({ rating, review: review || null })
        .eq('id', existingRating.id)
        .select(`
          *,
          book:books(*)
        `)
        .single();

      if (error) {
        console.error('Error updating rating:', error);
        return null;
      }

      return data as BookRating;
    } else {
      // Create new rating
      const insertData: BookRatingInsert = {
        user_id: userId,
        book_id: bookId,
        rating,
        review: review || null,
      };

      const { data, error } = await supabase
        .from('book_ratings')
        .insert(insertData)
        .select(`
          *,
          book:books(*)
        `)
        .single();

      if (error) {
        console.error('Error creating rating:', error);
        return null;
      }

      return data as BookRating;
    }
  } catch (error) {
    console.error('Error in setBookRating:', error);
    return null;
  }
}

/**
 * Delete book rating
 */
export async function deleteBookRating(userId: string, bookId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('book_ratings')
      .delete()
      .eq('user_id', userId)
      .eq('book_id', bookId);

    if (error) {
      console.error('Error deleting rating:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteBookRating:', error);
    return false;
  }
}

/**
 * Get all user's ratings
 */
export async function getUserRatings(userId: string): Promise<BookRating[]> {
  try {
    const { data, error } = await supabase
      .from('book_ratings')
      .select(`
        *,
        book:books(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching ratings:', error);
      return [];
    }

    return (data || []) as BookRating[];
  } catch (error) {
    console.error('Error in getUserRatings:', error);
    return [];
  }
}

// ==================== BOOK QUOTES ====================

/**
 * Get user's quotes for a book
 */
export async function getBookQuotes(userId: string, bookId: string): Promise<BookQuote[]> {
  try {
    const { data, error } = await supabase
      .from('book_quotes')
      .select(`
        *,
        book:books(*)
      `)
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .order('page_number', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching quotes:', error);
      return [];
    }

    return (data || []) as BookQuote[];
  } catch (error) {
    console.error('Error in getBookQuotes:', error);
    return [];
  }
}

/**
 * Get all user's quotes
 */
export async function getUserQuotes(userId: string): Promise<BookQuote[]> {
  try {
    const { data, error } = await supabase
      .from('book_quotes')
      .select(`
        *,
        book:books(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching quotes:', error);
      return [];
    }

    return (data || []) as BookQuote[];
  } catch (error) {
    console.error('Error in getUserQuotes:', error);
    return [];
  }
}

/**
 * Add quote to book
 */
export async function addBookQuote(
  userId: string,
  bookId: string,
  quoteText: string,
  pageNumber?: number,
  chapter?: string,
  notes?: string
): Promise<BookQuote | null> {
  try {
    const insertData: BookQuoteInsert = {
      user_id: userId,
      book_id: bookId,
      quote_text: quoteText,
      page_number: pageNumber || null,
      chapter: chapter || null,
      notes: notes || null,
    };

    const { data, error } = await supabase
      .from('book_quotes')
      .insert(insertData)
      .select(`
        *,
        book:books(*)
      `)
      .single();

    if (error) {
      console.error('Error adding quote:', error);
      return null;
    }

    return data as BookQuote;
  } catch (error) {
    console.error('Error in addBookQuote:', error);
    return null;
  }
}

/**
 * Update book quote
 */
export async function updateBookQuote(
  userId: string,
  quoteId: string,
  updates: BookQuoteUpdate
): Promise<BookQuote | null> {
  try {
    const { data, error } = await supabase
      .from('book_quotes')
      .update(updates)
      .eq('id', quoteId)
      .eq('user_id', userId)
      .select(`
        *,
        book:books(*)
      `)
      .single();

    if (error) {
      console.error('Error updating quote:', error);
      return null;
    }

    return data as BookQuote;
  } catch (error) {
    console.error('Error in updateBookQuote:', error);
    return null;
  }
}

/**
 * Delete book quote
 */
export async function deleteBookQuote(userId: string, quoteId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('book_quotes')
      .delete()
      .eq('id', quoteId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting quote:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteBookQuote:', error);
    return false;
  }
}

// ==================== BOOK CLUB SUGGESTIONS ====================

// ==================== CURRENT BOOK CLUB BOOK ====================

/**
 * Get the current book club book
 */
export async function getCurrentBookClubBook(): Promise<{
  id: string;
  book_id: string;
  set_by: string;
  set_at: string;
  notes: string | null;
  book: Book | null;
} | null> {
  try {
    const { data, error } = await supabase
      .from('current_book_club_book')
      .select(`
        *,
        book:books(*)
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No current book set
        return null;
      }
      console.error('Error fetching current book club book:', error);
      return null;
    }

    return data as any;
  } catch (error) {
    console.error('Error in getCurrentBookClubBook:', error);
    return null;
  }
}

/**
 * Set the current book club book (replaces any existing current book)
 */
export async function setCurrentBookClubBook(
  userId: string,
  bookId: string,
  notes?: string
): Promise<boolean> {
  try {
    // First, delete any existing current book
    await supabase
      .from('current_book_club_book')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (this condition is always true)

    // Insert new current book
    const { error } = await supabase
      .from('current_book_club_book')
      .insert({
        book_id: bookId,
        set_by: userId,
        notes: notes || null,
      });

    if (error) {
      console.error('Error setting current book club book:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in setCurrentBookClubBook:', error);
    return false;
  }
}

/**
 * Clear the current book club book
 */
export async function clearCurrentBookClubBook(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('current_book_club_book')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (error) {
      console.error('Error clearing current book club book:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in clearCurrentBookClubBook:', error);
    return false;
  }
}

// ==================== BOOK CLUB SUGGESTIONS ====================

/**
 * Suggest a book for book club reading
 * Creates a suggestion if it doesn't exist, or returns existing suggestion
 */
export async function suggestBookForClub(userId: string, bookId: string): Promise<boolean> {
  try {
    // Check if suggestion already exists
    const { data: existing } = await supabase
      .from('book_club_suggestions')
      .select('id')
      .eq('book_id', bookId)
      .eq('suggested_by', userId)
      .single();

    if (existing) {
      // Already suggested by this user
      return false;
    }

    // Create new suggestion
    const { error } = await supabase
      .from('book_club_suggestions')
      .insert({
        book_id: bookId,
        suggested_by: userId,
      });

    if (error) {
      // If it's a unique constraint error, it means someone else already suggested it
      if (error.code === '23505') {
        return false;
      }
      console.error('Error suggesting book for club:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in suggestBookForClub:', error);
    return false;
  }
}

/**
 * Get all book club suggestions with book details and user info
 */
export async function getBookClubSuggestions(): Promise<Array<{
  id: string;
  book_id: string;
  suggested_by: string;
  created_at: string;
  book: Book;
  suggested_by_user: {
    email: string;
    user_metadata: any;
  } | null;
  vote_count: number;
}>> {
  try {
    const { data, error } = await supabase
      .from('book_club_suggestions')
      .select(`
        id,
        book_id,
        suggested_by,
        created_at,
        book:books(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching book club suggestions:', error);
      return [];
    }

    // Get user info for each suggestion and count votes
    const suggestionsWithUsers = await Promise.all(
      (data || []).map(async (suggestion) => {
        // Get user info
        const { data: userData } = await supabase.auth.admin.getUserById(suggestion.suggested_by).catch(() => ({ data: null }));
        
        // Count votes (for now, each suggestion counts as 1 vote)
        // In the future, you could add a separate votes table
        const { count } = await supabase
          .from('book_club_suggestions')
          .select('*', { count: 'exact', head: true })
          .eq('book_id', suggestion.book_id);

        return {
          ...suggestion,
          suggested_by_user: userData?.user ? {
            email: userData.user.email,
            user_metadata: userData.user.user_metadata,
          } : null,
          vote_count: count || 1,
        };
      })
    );

    return suggestionsWithUsers;
  } catch (error) {
    console.error('Error in getBookClubSuggestions:', error);
    return [];
  }
}

/**
 * Simplified version that doesn't require admin access
 */
export async function getBookClubSuggestionsSimple(): Promise<Array<{
  id: string;
  book_id: string;
  suggested_by: string;
  created_at: string;
  book: Book | null;
  vote_count: number;
}>> {
  try {
    const { data, error } = await supabase
      .from('book_club_suggestions')
      .select(`
        id,
        book_id,
        suggested_by,
        created_at,
        book:books(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching book club suggestions:', error);
      return [];
    }

    // Group by book_id to count votes
    const bookVoteCounts: Record<string, number> = {};
    (data || []).forEach((suggestion) => {
      bookVoteCounts[suggestion.book_id] = (bookVoteCounts[suggestion.book_id] || 0) + 1;
    });

    // Get unique books with vote counts
    const uniqueBooks = new Map<string, any>();
    (data || []).forEach((suggestion) => {
      if (!uniqueBooks.has(suggestion.book_id)) {
        uniqueBooks.set(suggestion.book_id, {
          id: suggestion.id,
          book_id: suggestion.book_id,
          suggested_by: suggestion.suggested_by,
          created_at: suggestion.created_at,
          book: suggestion.book,
          vote_count: bookVoteCounts[suggestion.book_id],
        });
      }
    });

    return Array.from(uniqueBooks.values());
  } catch (error) {
    console.error('Error in getBookClubSuggestionsSimple:', error);
    return [];
  }
}
