// Google Books API utility
// Note: Google Books API doesn't require an API key for basic searches,
// but you can add EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY to your .env for higher rate limits

const GOOGLE_BOOKS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY || '';
const BASE_URL = 'https://www.googleapis.com/books/v1/volumes';

// Check if API key is valid (not a placeholder)
const isValidApiKey = GOOGLE_BOOKS_API_KEY && 
  GOOGLE_BOOKS_API_KEY !== 'your_api_key_here' && 
  GOOGLE_BOOKS_API_KEY.length > 10;

export interface GoogleBook {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    publishedDate?: string;
    description?: string;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
      small?: string;
      medium?: string;
      large?: string;
    };
    averageRating?: number;
    ratingsCount?: number;
    categories?: string[];
    pageCount?: number;
    language?: string;
    previewLink?: string;
    infoLink?: string;
  };
}

export interface GoogleBooksResponse {
  items?: GoogleBook[];
  totalItems: number;
}

/**
 * Search for books using Google Books API
 * @param query - Search query (book title, author, ISBN, etc.)
 * @param maxResults - Maximum number of results to return (default: 20)
 * @param orderBy - Sort order: 'relevance' (default) or 'newest'
 * @returns Promise with search results
 */
export async function searchBooks(
  query: string,
  maxResults: number = 20,
  orderBy: 'relevance' | 'newest' = 'relevance'
): Promise<GoogleBooksResponse> {
  if (!query.trim()) {
    return { totalItems: 0 };
  }

  try {
    const searchQuery = encodeURIComponent(query.trim());
    
    // Build URL with optional API key (only if valid)
    let url = `${BASE_URL}?q=${searchQuery}&maxResults=${maxResults}`;
    
    // Add orderBy parameter (works without API key)
    if (orderBy) {
      url += `&orderBy=${orderBy}`;
    }
    
    // Only add API key if it's valid
    if (isValidApiKey) {
      url += `&key=${GOOGLE_BOOKS_API_KEY}`;
    }

    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Books API error:', response.status, errorText);
      
      // If 400 error and we have an API key, try without it
      if (response.status === 400 && isValidApiKey) {
        console.log('Retrying without API key...');
        const retryUrl = `${BASE_URL}?q=${searchQuery}&maxResults=${maxResults}&orderBy=${orderBy}`;
        const retryResponse = await fetch(retryUrl);
        
        if (!retryResponse.ok) {
          throw new Error(`Google Books API error: ${retryResponse.status}`);
        }
        
        const retryData: GoogleBooksResponse = await retryResponse.json();
        return retryData;
      }
      
      throw new Error(`Google Books API error: ${response.status}`);
    }

    const data: GoogleBooksResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching books:', error);
    throw error;
  }
}

/**
 * Get book details by volume ID
 * @param volumeId - Google Books volume ID
 * @returns Promise with book details
 */
export async function getBookById(volumeId: string): Promise<GoogleBook | null> {
  try {
    let url = `${BASE_URL}/${volumeId}`;
    
    // Only add API key if it's valid
    if (isValidApiKey) {
      url += `?key=${GOOGLE_BOOKS_API_KEY}`;
    }

    const response = await fetch(url);
    
    if (!response.ok) {
      // If 400 error and we have an API key, try without it
      if (response.status === 400 && isValidApiKey) {
        const retryUrl = `${BASE_URL}/${volumeId}`;
        const retryResponse = await fetch(retryUrl);
        
        if (!retryResponse.ok) {
          throw new Error(`Google Books API error: ${retryResponse.status}`);
        }
        
        const retryData: GoogleBook = await retryResponse.json();
        return retryData;
      }
      
      throw new Error(`Google Books API error: ${response.status}`);
    }

    const data: GoogleBook = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching book:', error);
    return null;
  }
}

/**
 * Format Google Book data for app use
 */
export function formatBookForApp(book: GoogleBook) {
  const volumeInfo = book.volumeInfo;
  
  return {
    id: book.id,
    title: volumeInfo.title || 'Unknown Title',
    author: volumeInfo.authors?.join(', ') || 'Unknown Author',
    year: volumeInfo.publishedDate?.substring(0, 4) || 'Unknown',
    cover: volumeInfo.imageLinks?.thumbnail?.replace('http://', 'https://') || 
           volumeInfo.imageLinks?.smallThumbnail?.replace('http://', 'https://') ||
           'https://via.placeholder.com/150x225?text=No+Cover',
    synopsis: volumeInfo.description || 'No description available.',
    rating: volumeInfo.averageRating?.toFixed(1) || '0.0',
    ratingsCount: volumeInfo.ratingsCount || 0,
    averageRating: volumeInfo.averageRating || 0,
    categories: volumeInfo.categories || [],
    pageCount: volumeInfo.pageCount,
    language: volumeInfo.language,
    previewLink: volumeInfo.previewLink,
    infoLink: volumeInfo.infoLink,
  };
}

/**
 * Sort books by popularity
 * Popularity is calculated using a weighted formula that prioritizes:
 * 1. Books with high ratings AND many ratings (most popular)
 * 2. Books with many ratings (even if rating is lower)
 * 3. Books with high ratings (even if fewer ratings)
 * 4. Books without ratings (least popular)
 */
export function sortBooksByPopularity(books: ReturnType<typeof formatBookForApp>[]) {
  return [...books].sort((a, b) => {
    const aHasRatings = a.ratingsCount > 0 && a.averageRating > 0;
    const bHasRatings = b.ratingsCount > 0 && b.averageRating > 0;
    
    // Books with ratings always come before books without ratings
    if (!aHasRatings && !bHasRatings) {
      return 0; // Maintain original order for unrated books
    }
    if (!aHasRatings) return 1;  // b comes first
    if (!bHasRatings) return -1; // a comes first
    
    // Calculate popularity score using a weighted formula
    // Formula: (rating^2 * ratingsCount) + (ratingsCount * 2)
    // This heavily favors books with both high ratings AND many ratings
    // The rating^2 gives extra weight to higher ratings
    // The + (ratingsCount * 2) ensures books with many ratings rank high even with slightly lower ratings
    const scoreA = (Math.pow(a.averageRating, 2) * a.ratingsCount) + (a.ratingsCount * 2);
    const scoreB = (Math.pow(b.averageRating, 2) * b.ratingsCount) + (b.ratingsCount * 2);
    
    // If scores are very close, prioritize books with more ratings
    if (Math.abs(scoreA - scoreB) < 5) {
      return b.ratingsCount - a.ratingsCount;
    }
    
    // Sort by popularity score (descending)
    return scoreB - scoreA;
  });
}

/**
 * Format Google Book data for database insertion
 * Returns data in the format expected by the database BookInsert type
 */
export function formatBookForDatabase(book: GoogleBook) {
  const volumeInfo = book.volumeInfo;
  
  // Extract ISBN from industryIdentifiers
  const isbn = volumeInfo.industryIdentifiers?.find(
    (id) => id.type === 'ISBN_13' || id.type === 'ISBN_10'
  )?.identifier || null;
  
  return {
    title: volumeInfo.title || 'Unknown Title',
    author: volumeInfo.authors?.join(', ') || null,
    year: volumeInfo.publishedDate?.substring(0, 4) || null,
    cover_url: volumeInfo.imageLinks?.thumbnail?.replace('http://', 'https://') || 
               volumeInfo.imageLinks?.smallThumbnail?.replace('http://', 'https://') ||
               null,
    synopsis: volumeInfo.description || null,
    isbn: isbn,
    page_count: volumeInfo.pageCount || null,
    language: volumeInfo.language || null,
    categories: volumeInfo.categories || null,
  };
}
