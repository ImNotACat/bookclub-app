import { useTheme } from '@/contexts/ThemeContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { supabase } from '@/lib/supabase';
import { syncGoogleBookToDatabase, addToReadingList, suggestBookForClub, setCurrentBookClubBook, getCurrentBookClubBook } from '@/lib/database';
import { useEffect, useState } from 'react';
import { useCustomAlert } from '@/components/CustomAlert';
import './global.css';

export default function BookDetailsScreen() {
  const { theme, isDark } = useTheme();
  const params = useLocalSearchParams();
  const [userId, setUserId] = useState<string | null>(null);
  const [isAddingToList, setIsAddingToList] = useState(false);
  const [isSettingCurrentBook, setIsSettingCurrentBook] = useState(false);
  const [isCurrentBook, setIsCurrentBook] = useState(false);
  const { showAlert, AlertComponent } = useCustomAlert();
  
  useEffect(() => {
    // Get current user ID
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
    
    // Check if this book is the current book club book
    checkIfCurrentBook();
  }, []);

  const checkIfCurrentBook = async () => {
    try {
      const currentBook = await getCurrentBookClubBook();
      if (currentBook) {
        const bookId = getParam('id', '1');
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bookId);
        
        if (isUUID) {
          setIsCurrentBook(currentBook.book_id === bookId);
        } else {
          // If it's a Google Books ID, we need to check if the synced book matches
          const syncedBook = await syncGoogleBookToDatabase(bookId);
          if (syncedBook) {
            setIsCurrentBook(currentBook.book_id === syncedBook.id);
          }
        }
      }
    } catch (error) {
      console.error('Error checking current book:', error);
    }
  };
  
  // Helper to safely get string from params (handles arrays)
  const getParam = (key: string, defaultValue: string = ''): string => {
    const value = params[key];
    return Array.isArray(value) ? value[0] || defaultValue : value || defaultValue;
  };
  
  // Mock book data - in a real app, this would come from params or a database
  const book = {
    id: getParam('id', '1'),
    title: getParam('title', 'Life Of The Wild'),
    author: getParam('author', 'Samuel Handy'),
    year: getParam('year', '2023'),
    cover: getParam('cover', 'https://via.placeholder.com/300x450?text=Book+Cover'),
    synopsis: getParam('synopsis', 'A captivating journey through the untamed wilderness, exploring the delicate balance between nature and humanity. This profound narrative follows the adventures of explorers who discover that the wild holds secrets far beyond what civilization has taught us. Through vivid descriptions and compelling characters, the author weaves a tale that challenges our understanding of the natural world and our place within it.'),
    rating: getParam('rating', '4.5'),
    quotes: [
      {
        text: "The wild does not belong to us; we belong to it.",
        page: 42
      },
      {
        text: "In the silence of nature, we find the loudest truths.",
        page: 128
      },
      {
        text: "Every step into the unknown is a step toward understanding ourselves.",
        page: 203
      }
    ]
  };

  const handleAddToReadingList = async () => {
    if (!userId) {
      showAlert('Error', 'Please sign in to add books to your reading list', 'error');
      return;
    }

    setIsAddingToList(true);
    try {
      const bookId = getParam('id', '1');
      
      // Check if it's a UUID (database ID) or Google Books ID
      // UUIDs have format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (36 chars with dashes)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bookId);
      let dbBookId = bookId;

      // If it's a Google Books ID (not a UUID), sync it to database first
      if (!isUUID) {
        const syncedBook = await syncGoogleBookToDatabase(bookId);
        if (syncedBook) {
          dbBookId = syncedBook.id;
        } else {
          showAlert('Error', 'Could not add book to database. Please try again.', 'error');
          setIsAddingToList(false);
          return;
        }
      }

      // Add to reading list
      const result = await addToReadingList(userId, dbBookId, 'want_to_read');
      
      if (result) {
        showAlert('Success', `"${book.title}" has been added to your reading list!`, 'success');
      } else {
        showAlert('Info', 'This book is already in your reading list.', 'info');
      }
    } catch (error: any) {
      console.error('Error adding to reading list:', error);
      const errorMessage = error?.message || 'Something went wrong. Please try again.';
      showAlert('Error', errorMessage, 'error');
    } finally {
      setIsAddingToList(false);
    }
  };

  const handleSuggestForBookClub = async () => {
    if (!userId) {
      showAlert('Error', 'Please sign in to suggest books for book club', 'error');
      return;
    }

    try {
      const bookId = getParam('id', '1');
      
      // Check if it's a UUID (database ID) or Google Books ID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bookId);
      let dbBookId = bookId;

      // If it's a Google Books ID, sync it to database first
      if (!isUUID) {
        const syncedBook = await syncGoogleBookToDatabase(bookId);
        if (syncedBook) {
          dbBookId = syncedBook.id;
        } else {
          showAlert('Error', 'Could not add book to database. Please try again.', 'error');
          return;
        }
      }

      // Add to book club suggestions
      const result = await suggestBookForClub(userId, dbBookId);
      
      if (result) {
        showAlert('Success', `"${book.title}" has been suggested for book club reading!`, 'success');
      } else {
        showAlert('Info', 'This book has already been suggested.', 'info');
      }
    } catch (error: any) {
      console.error('Error suggesting book for club:', error);
      const errorMessage = error?.message || 'Something went wrong. Please try again.';
      showAlert('Error', errorMessage, 'error');
    }
  };

  const handleSetAsCurrentBook = async () => {
    if (!userId) {
      showAlert('Error', 'Please sign in to set the current book club book', 'error');
      return;
    }

    setIsSettingCurrentBook(true);
    try {
      const bookId = getParam('id', '1');
      
      // Check if it's a UUID (database ID) or Google Books ID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bookId);
      let dbBookId = bookId;

      // If it's a Google Books ID, sync it to database first
      if (!isUUID) {
        const syncedBook = await syncGoogleBookToDatabase(bookId);
        if (syncedBook) {
          dbBookId = syncedBook.id;
        } else {
          showAlert('Error', 'Could not add book to database. Please try again.', 'error');
          setIsSettingCurrentBook(false);
          return;
        }
      }

      // Set as current book club book
      const result = await setCurrentBookClubBook(userId, dbBookId);
      
      if (result) {
        setIsCurrentBook(true);
        showAlert('Success', `"${book.title}" is now the current book club book!`, 'success');
      } else {
        showAlert('Error', 'Could not set current book. Please try again.', 'error');
      }
    } catch (error: any) {
      console.error('Error setting current book:', error);
      const errorMessage = error?.message || 'Something went wrong. Please try again.';
      showAlert('Error', errorMessage, 'error');
    } finally {
      setIsSettingCurrentBook(false);
    }
  };

  const renderStars = (rating: string) => {
    const numRating = parseFloat(rating);
    const fullStars = Math.floor(numRating);
    const hasHalfStar = numRating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <View style={styles.starsContainer}>
        {[...Array(fullStars)].map((_, i) => (
          <FontAwesome key={`full-${i}`} name="star" size={16} color={theme.accent} />
        ))}
        {hasHalfStar && (
          <FontAwesome name="star-half-o" size={16} color={theme.accent} />
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <FontAwesome key={`empty-${i}`} name="star-o" size={16} color={theme.accent} />
        ))}
        <Text style={[styles.ratingText, { color: theme.secondaryText }]}>
          {rating} / 5.0
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.cardBackground} />
      <AlertComponent />
      
      {/* Header with back button */}
      <View style={[styles.header, { backgroundColor: theme.cardBackground }]}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <FontAwesome name="arrow-left" size={20} color={theme.primaryText} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.primaryText }]}>Book Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Book Cover and Basic Info */}
        <View style={styles.coverSection}>
          <View style={[styles.coverContainer, { backgroundColor: theme.cardBackground }]}>
            <Image 
              source={{ uri: book.cover }} 
              style={styles.coverImage}
              resizeMode="cover"
            />
          </View>
          
          <View style={styles.titleSection}>
            <Text style={[styles.bookTitle, { color: theme.primaryText }]}>{book.title}</Text>
            <Text style={[styles.bookAuthor, { color: theme.secondaryText }]}>by {book.author}</Text>
            <Text style={[styles.bookYear, { color: theme.secondaryText }]}>{book.year}</Text>
            
            {/* Rating */}
            <View style={styles.ratingSection}>
              {renderStars(book.rating)}
            </View>
          </View>
        </View>

        {/* Synopsis Section */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>Synopsis</Text>
          <Text style={[styles.synopsisText, { color: theme.secondaryText }]}>
            {book.synopsis}
          </Text>
        </View>

        {/* Quotes Section */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>Quotes</Text>
          {book.quotes.map((quote, index) => (
            <View key={index} style={[styles.quoteCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <Text style={[styles.quoteText, { color: theme.primaryText }]}>
                "{quote.text}"
              </Text>
              <Text style={[styles.quotePage, { color: theme.secondaryText }]}>
                — Page {quote.page}
              </Text>
            </View>
          ))}
        </View>

        {/* Call to Action Section */}
        <View style={[styles.ctaSection, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.ctaTitle, { color: theme.primaryText }]}>What would you like to do?</Text>
          
          {isCurrentBook && (
            <View style={[styles.currentBookBadge, { backgroundColor: theme.accent }]}>
              <FontAwesome name="star" size={16} color="#FFFFFF" />
              <Text style={[styles.currentBookBadgeText, { color: '#FFFFFF' }]}>
                Current Book Club Book
              </Text>
            </View>
          )}
          
          {!isCurrentBook && (
            <TouchableOpacity 
              style={[styles.ctaButton, { backgroundColor: theme.accent, opacity: isSettingCurrentBook ? 0.6 : 1 }]}
              onPress={handleSetAsCurrentBook}
              activeOpacity={0.8}
              disabled={isSettingCurrentBook}
            >
              <FontAwesome name="star" size={20} color="#FFFFFF" />
              <Text style={styles.ctaButtonText}>
                {isSettingCurrentBook ? 'Setting...' : 'Mark as Current Book Club Book'}
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.ctaButton, { backgroundColor: theme.accent, opacity: isAddingToList ? 0.6 : 1 }]}
            onPress={handleAddToReadingList}
            activeOpacity={0.8}
            disabled={isAddingToList}
          >
            <FontAwesome name="bookmark" size={20} color="#FFFFFF" />
            <Text style={styles.ctaButtonText}>
              {isAddingToList ? 'Adding...' : 'Add to My Reading List'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.ctaButton, styles.ctaButtonSecondary, { backgroundColor: theme.cardBackground, borderColor: theme.accent }]}
            onPress={handleSuggestForBookClub}
            activeOpacity={0.8}
          >
            <FontAwesome name="users" size={20} color={theme.accent} />
            <Text style={[styles.ctaButtonText, styles.ctaButtonTextSecondary, { color: theme.accent }]}>
              Suggest for Book Club Reading
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Georgia',
    fontWeight: '400',
  },
  placeholder: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  coverSection: {
    paddingHorizontal: 24,
    paddingTop: 32,
    alignItems: 'center',
  },
  coverContainer: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 24,
  },
  coverImage: {
    width: 200,
    height: 300,
    borderRadius: 12,
  },
  titleSection: {
    alignItems: 'center',
    width: '100%',
  },
  bookTitle: {
    fontSize: 32,
    fontFamily: 'Georgia',
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 8,
  },
  bookAuthor: {
    fontSize: 18,
    marginBottom: 4,
  },
  bookYear: {
    fontSize: 14,
    marginBottom: 16,
  },
  ratingSection: {
    marginTop: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginHorizontal: 24,
    marginTop: 24,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Georgia',
    fontWeight: '400',
    marginBottom: 12,
  },
  synopsisText: {
    fontSize: 15,
    lineHeight: 24,
  },
  quoteCard: {
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
  },
  quoteText: {
    fontSize: 16,
    fontStyle: 'italic',
    lineHeight: 24,
    marginBottom: 8,
  },
  quotePage: {
    fontSize: 12,
    textAlign: 'right',
  },
  ctaSection: {
    marginHorizontal: 24,
    marginTop: 24,
    marginBottom: 32,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  ctaTitle: {
    fontSize: 18,
    fontFamily: 'Georgia',
    fontWeight: '400',
    marginBottom: 20,
    textAlign: 'center',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 10,
  },
  ctaButtonSecondary: {
    borderWidth: 2,
    marginBottom: 0,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  ctaButtonTextSecondary: {
    color: '#5C4A3D',
  },
  currentBookBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  currentBookBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
