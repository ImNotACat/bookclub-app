import { useTheme } from '@/contexts/ThemeContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import { ScrollView, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View, Image, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import { getBookClubSuggestionsSimple } from '@/lib/database';
import { useEffect, useState } from 'react';
import './global.css';

export default function BookClubSuggestionsScreen() {
  const { theme, isDark } = useTheme();
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const data = await getBookClubSuggestionsSimple();
      setSuggestions(data);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserDisplayName = (userId: string, userMetadata: any) => {
    if (userMetadata?.full_name) return userMetadata.full_name;
    if (userMetadata?.email) return userMetadata.email.split('@')[0];
    return userId.substring(0, 8) + '...';
  };

  const handleBookPress = (suggestion: any) => {
    if (!suggestion.book) return;
    
    const book = suggestion.book;
    router.push({
      pathname: '/book-details',
      params: {
        id: book.id,
        title: book.title,
        author: book.author || '',
        year: book.year || '',
        cover: book.cover_url || '',
        synopsis: book.synopsis || '',
        rating: '0.0',
      }
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.cardBackground} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.cardBackground }]}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <FontAwesome name="arrow-left" size={20} color={theme.primaryText} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: theme.primaryText }]}>Book Club Suggestions</Text>
          <Text style={[styles.headerSubtitle, { color: theme.secondaryText }]}>
            {loading ? 'Loading...' : `${suggestions.length} ${suggestions.length === 1 ? 'book' : 'books'} suggested`}
          </Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={[styles.loadingText, { color: theme.secondaryText }]}>Loading suggestions...</Text>
          </View>
        ) : suggestions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome name="users" size={48} color={theme.secondaryText} style={styles.emptyIcon} />
            <Text style={[styles.emptyTitle, { color: theme.primaryText }]}>No Suggestions Yet</Text>
            <Text style={[styles.emptyDescription, { color: theme.secondaryText }]}>
              Be the first to suggest a book for your book club!
            </Text>
          </View>
        ) : (
          <>
            {suggestions.map((suggestion) => {
              const book = suggestion.book;
              if (!book) return null;
              
              return (
                <TouchableOpacity
                  key={suggestion.id}
                  style={[styles.bookCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                  onPress={() => handleBookPress(suggestion)}
                  activeOpacity={0.7}
                >
                  <Image 
                    source={{ uri: book.cover_url || 'https://via.placeholder.com/150x225?text=No+Cover' }} 
                    style={styles.bookCover}
                    resizeMode="cover"
                  />
                  
                  <View style={styles.bookInfo}>
                    <Text style={[styles.bookTitle, { color: theme.primaryText }]} numberOfLines={2}>
                      {book.title}
                    </Text>
                    <Text style={[styles.bookAuthor, { color: theme.secondaryText }]} numberOfLines={1}>
                      by {book.author || 'Unknown Author'}
                    </Text>
                    {book.year && (
                      <Text style={[styles.bookYear, { color: theme.secondaryText }]}>
                        {book.year}
                      </Text>
                    )}
                    
                    {book.synopsis && (
                      <Text style={[styles.bookSynopsis, { color: theme.secondaryText }]} numberOfLines={2}>
                        {book.synopsis}
                      </Text>
                    )}
                    
                    <View style={styles.bookMeta}>
                      <View style={styles.suggestedBy}>
                        <FontAwesome name="user" size={12} color={theme.secondaryText} />
                        <Text style={[styles.metaText, { color: theme.secondaryText }]}>
                          Suggested by {getUserDisplayName(suggestion.suggested_by, null)}
                        </Text>
                      </View>
                      <View style={styles.votes}>
                        <FontAwesome name="thumbs-up" size={12} color={theme.accent} />
                        <Text style={[styles.votesText, { color: theme.accent }]}>
                          {suggestion.vote_count} {suggestion.vote_count === 1 ? 'vote' : 'votes'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.arrowContainer}>
                    <FontAwesome name="chevron-right" size={16} color={theme.secondaryText} />
                  </View>
                </TouchableOpacity>
              );
            })}
            <View style={styles.bottomPadding} />
          </>
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
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Georgia',
    fontWeight: '400',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  placeholder: {
    width: 36,
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
  bookCard: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginTop: 16,
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
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 8,
  },
  ratingText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  bookSynopsis: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  bookMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  suggestedBy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
  },
  votes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  votesText: {
    fontSize: 11,
    fontWeight: '600',
  },
  arrowContainer: {
    justifyContent: 'center',
    paddingLeft: 8,
  },
  bottomPadding: {
    height: 32,
  },
});
