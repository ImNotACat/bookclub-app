import { useTheme } from '@/contexts/ThemeContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import { formatBookForApp, searchBooks, sortBooksByPopularity } from '@/lib/googleBooks';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import '../global.css';

interface SearchResult {
  id: string;
  title: string;
  author: string;
  year: string;
  cover: string;
  synopsis: string;
  rating: string;
  ratingsCount: number;
  averageRating: number;
}

export default function SearchScreen() {
  const { theme, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounce search queries
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(false);
    
    const debounceTimer = setTimeout(async () => {
      try {
        // Request more results to have better data for sorting (max 40 from API)
        const response = await searchBooks(searchQuery, 40, 'relevance');
        if (response.items) {
          const formattedResults = response.items.map((book) => formatBookForApp(book));
          
          // Filter out books with no cover (often lower quality results)
          const booksWithCovers = formattedResults.filter(book => 
            book.cover && !book.cover.includes('placeholder')
          );
          
          // Sort by popularity (improved algorithm)
          const sortedResults = sortBooksByPopularity(booksWithCovers.length > 0 ? booksWithCovers : formattedResults);
          
          // Take top 20 most popular results
          setSearchResults(sortedResults.slice(0, 20));
        } else {
          setSearchResults([]);
        }
        setHasSearched(true);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
        setHasSearched(true);
      } finally {
        setIsSearching(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleBookPress = async (book: SearchResult) => {
    // Note: The book will be synced to database when user clicks "Add to Reading List"
    // For now, we just navigate with the Google Books ID
    router.push({
      pathname: '/book-details',
      params: {
        id: book.id, // This is the Google Books ID
        title: book.title,
        author: book.author,
        year: book.year,
        cover: book.cover,
        synopsis: book.synopsis,
        rating: book.rating,
      }
    });
  };

  const renderStars = (rating: string) => {
    const numRating = parseFloat(rating);
    const fullStars = Math.floor(numRating);
    const hasHalfStar = numRating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <View style={styles.starsContainer}>
        {[...Array(fullStars)].map((_, i) => (
          <FontAwesome key={`full-${i}`} name="star" size={12} color={theme.accent} />
        ))}
        {hasHalfStar && (
          <FontAwesome name="star-half-o" size={12} color={theme.accent} />
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <FontAwesome key={`empty-${i}`} name="star-o" size={12} color={theme.accent} />
        ))}
        {numRating > 0 && (
          <Text style={[styles.ratingText, { color: theme.secondaryText }]}>
            {rating}
          </Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.cardBackground} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.cardBackground }]}>
        <Text style={[styles.headerLabel, { color: theme.secondaryText }]}>SEARCH</Text>
        <Text style={[styles.headerTitle, { color: theme.primaryText }]}>Find Your Next Read</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <FontAwesome name="search" size={18} color={theme.secondaryText} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.primaryText }]}
            placeholder="Search books, authors, genres..."
            placeholderTextColor={theme.secondaryText}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <FontAwesome name="times-circle" size={18} color={theme.secondaryText} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {isSearching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={[styles.loadingText, { color: theme.secondaryText }]}>Searching...</Text>
          </View>
        ) : searchQuery.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome name="search" size={48} color={theme.secondaryText} style={styles.emptyIcon} />
            <Text style={[styles.emptyTitle, { color: theme.primaryText }]}>Start Searching</Text>
            <Text style={[styles.emptyDescription, { color: theme.secondaryText }]}>
              Enter a book title, author name, or genre to discover new reads
            </Text>
          </View>
        ) : hasSearched && searchResults.length === 0 ? (
          <View style={styles.noResultsContainer}>
            <FontAwesome name="book" size={48} color={theme.secondaryText} style={styles.emptyIcon} />
            <Text style={[styles.emptyTitle, { color: theme.primaryText }]}>No Results Found</Text>
            <Text style={[styles.emptyDescription, { color: theme.secondaryText }]}>
              Try a different search term or check your spelling
            </Text>
          </View>
        ) : (
          <View style={styles.resultsContainer}>
            <Text style={[styles.resultsLabel, { color: theme.secondaryText }]}>
              {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'} for "{searchQuery}"
            </Text>
            
            {searchResults.map((book) => (
              <TouchableOpacity
                key={book.id}
                style={[styles.bookCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                onPress={() => handleBookPress(book)}
                activeOpacity={0.7}
              >
                <Image 
                  source={{ uri: book.cover }} 
                  style={styles.bookCover}
                  resizeMode="cover"
                />
                
                <View style={styles.bookInfo}>
                  <Text style={[styles.bookTitle, { color: theme.primaryText }]} numberOfLines={2}>
                    {book.title}
                  </Text>
                  <Text style={[styles.bookAuthor, { color: theme.secondaryText }]} numberOfLines={1}>
                    by {book.author}
                  </Text>
                  {book.year !== 'Unknown' && (
                    <Text style={[styles.bookYear, { color: theme.secondaryText }]}>
                      {book.year}
                    </Text>
                  )}
                  
                  {parseFloat(book.rating) > 0 && (
                    <View style={styles.ratingContainer}>
                      {renderStars(book.rating)}
                    </View>
                  )}
                  
                  {book.synopsis && book.synopsis !== 'No description available.' && (
                    <Text style={[styles.bookSynopsis, { color: theme.secondaryText }]} numberOfLines={2}>
                      {book.synopsis}
                    </Text>
                  )}
                </View>
                
                <View style={styles.arrowContainer}>
                  <FontAwesome name="chevron-right" size={16} color={theme.secondaryText} />
                </View>
              </TouchableOpacity>
            ))}
            
            <View style={styles.bottomPadding} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerLabel: {
    fontSize: 11,
    color: '#8B7355',
    letterSpacing: 2,
    fontWeight: '600',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 36,
    fontFamily: 'Georgia',
    color: '#5C4A3D',
    fontWeight: '400',
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 48,
  },
  emptyIcon: {
    marginBottom: 24,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 24,
    fontFamily: 'Georgia',
    marginBottom: 8,
    fontWeight: '400',
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  resultsContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  resultsLabel: {
    fontSize: 12,
    letterSpacing: 1,
    fontWeight: '600',
    marginBottom: 16,
  },
  noResultsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 48,
  },
  noResultsText: {
    fontSize: 14,
    textAlign: 'center',
  },
  bookCard: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  bookCover: {
    width: 80,
    height: 120,
    borderRadius: 8,
    marginRight: 16,
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 18,
    fontFamily: 'Georgia',
    fontWeight: '400',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    marginBottom: 2,
  },
  bookYear: {
    fontSize: 12,
    marginBottom: 8,
  },
  ratingContainer: {
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  bookSynopsis: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  arrowContainer: {
    justifyContent: 'center',
    paddingLeft: 8,
  },
  bottomPadding: {
    height: 32,
  },
});
