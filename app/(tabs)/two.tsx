import { Text, View, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ActivityIndicator, Image } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { getUserReadingList } from '@/lib/database';
import type { UserBook, BookStatus } from '@/lib/database.types';
import { useEffect, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import '../global.css';

export default function LibraryScreen() {
  const { theme, isDark } = useTheme();
  const [books, setBooks] = useState<UserBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (userId) {
      loadBooks();
    } else {
      setLoading(false);
    }
  }, [userId, selectedFilter]);

  const loadBooks = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      let status: BookStatus | undefined;
      
      // Map filter names to status values
      if (selectedFilter === 'Reading') {
        status = 'reading';
      } else if (selectedFilter === 'Completed') {
        status = 'read';
      } else if (selectedFilter === 'Want to Read') {
        status = 'want_to_read';
      }
      // 'All' means status is undefined

      const readingList = await getUserReadingList(userId, status);
      setBooks(readingList);
    } catch (error) {
      console.error('Error loading books:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: BookStatus): string => {
    const statusMap: Record<BookStatus, string> = {
      'want_to_read': 'Want to Read',
      'reading': 'Reading',
      'read': 'Completed',
      'abandoned': 'Abandoned',
    };
    return statusMap[status] || status;
  };

  const handleBookPress = (book: UserBook) => {
    if (!book.book) return;
    
    router.push({
      pathname: '/book-details',
      params: {
        id: book.book.id,
        title: book.book.title,
        author: book.book.author || '',
        year: book.book.year || '',
        cover: book.book.cover_url || '',
        synopsis: book.book.synopsis || '',
        rating: '0.0',
      }
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.cardBackground} />
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.headerLabel, { color: theme.secondaryText }]}>MY LIBRARY</Text>
          <Text style={[styles.headerTitle, { color: theme.primaryText }]}>Your Collection</Text>
        </View>

        {/* Filter Tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
            {['All', 'Reading', 'Completed', 'Want to Read'].map((tab) => (
              <TouchableOpacity 
                key={tab}
                onPress={() => setSelectedFilter(tab)}
                style={[
                  styles.tab, 
                  { backgroundColor: selectedFilter === tab ? theme.accent : theme.cardBackground },
                  { borderColor: theme.border }
                ]}
              >
                <Text style={[
                  styles.tabText, 
                  { color: selectedFilter === tab ? '#FFFFFF' : theme.secondaryText }
                ]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Books List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={[styles.loadingText, { color: theme.secondaryText }]}>Loading your library...</Text>
          </View>
        ) : books.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome name="book" size={48} color={theme.secondaryText} style={styles.emptyIcon} />
            <Text style={[styles.emptyTitle, { color: theme.primaryText }]}>No Books Yet</Text>
            <Text style={[styles.emptyDescription, { color: theme.secondaryText }]}>
              {selectedFilter === 'All' 
                ? 'Start building your library by adding books from search'
                : `You don't have any books with status "${selectedFilter}" yet`}
            </Text>
          </View>
        ) : (
          <View style={styles.booksContainer}>
            {books.map((userBook) => {
              const book = userBook.book;
              if (!book) return null;
              
              return (
                <TouchableOpacity
                  key={userBook.id}
                  style={[styles.bookCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                  onPress={() => handleBookPress(userBook)}
                  activeOpacity={0.7}
                >
                  {book.cover_url && (
                    <Image 
                      source={{ uri: book.cover_url }} 
                      style={styles.bookCover}
                      resizeMode="cover"
                    />
                  )}
                  <View style={styles.bookCardContent}>
                    <View style={styles.bookInfo}>
                      <Text style={[styles.bookTitle, { color: theme.primaryText }]}>{book.title}</Text>
                      <Text style={[styles.bookAuthor, { color: theme.secondaryText }]}>
                        by {book.author || 'Unknown Author'}
                      </Text>
                      {book.year && (
                        <Text style={[styles.bookYear, { color: theme.secondaryText }]}>{book.year}</Text>
                      )}
                      <View style={[styles.statusBadge, { backgroundColor: theme.border }]}>
                        <Text style={[styles.statusText, { color: theme.accentDark }]}>
                          {getStatusLabel(userBook.status)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.arrowContainer}>
                      <FontAwesome name="chevron-right" size={16} color={theme.secondaryText} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Add Book Button */}
        <View style={styles.addButtonContainer}>
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: theme.accent }]}
            onPress={() => router.push('/(tabs)/search')}
            activeOpacity={0.8}
          >
            <Text style={styles.addButtonText}>+ ADD NEW BOOK</Text>
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
  scrollView: {
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
  tabsContainer: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  tabsScroll: {
    flexDirection: 'row',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  tabText: {
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: '600',
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
  booksContainer: {
    paddingHorizontal: 24,
    marginTop: 24,
    paddingBottom: 16,
  },
  bookCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    flexDirection: 'row',
  },
  bookCover: {
    width: 60,
    height: 90,
    borderRadius: 8,
    marginRight: 16,
  },
  bookCardContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bookYear: {
    fontSize: 12,
    marginBottom: 8,
  },
  arrowContainer: {
    justifyContent: 'center',
    paddingLeft: 8,
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 20,
    fontFamily: 'Georgia',
    color: '#5C4A3D',
    marginBottom: 4,
    fontWeight: '400',
  },
  bookAuthor: {
    fontSize: 14,
    color: '#8B7355',
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 10,
    color: '#5C4A3D',
    letterSpacing: 1,
    fontWeight: '600',
  },
  menuButton: {
    marginLeft: 16,
  },
  menuIcon: {
    fontSize: 24,
    color: '#8B7355',
  },
  addButtonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  addButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: '600',
  },
});
