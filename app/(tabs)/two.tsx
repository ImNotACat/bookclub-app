import { Text, View, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import '../global.css';

export default function LibraryScreen() {
  const { theme, isDark } = useTheme();
  const books = [
    { title: 'Life Of The Wild', author: 'Samuel Handy', status: 'Reading' },
    { title: 'Great Travel At Desert', author: 'John Smith', status: 'Want to Read' },
    { title: 'The Lady Beauty Secrets', author: 'Emily Rose', status: 'Completed' },
    { title: 'Simple Way Of Peace Life', author: 'David Chen', status: 'Reading' },
  ];

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
            {['All', 'Reading', 'Completed', 'Want to Read'].map((tab, index) => (
              <TouchableOpacity 
                key={tab}
                style={[
                  styles.tab, 
                  { backgroundColor: index === 0 ? theme.accent : theme.cardBackground },
                  { borderColor: theme.border }
                ]}
              >
                <Text style={[
                  styles.tabText, 
                  { color: index === 0 ? '#FFFFFF' : theme.secondaryText }
                ]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Books List */}
        <View style={styles.booksContainer}>
          {books.map((book, index) => (
            <View key={index} style={[styles.bookCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
              <View style={styles.bookCardContent}>
                <View style={styles.bookInfo}>
                  <Text style={[styles.bookTitle, { color: theme.primaryText }]}>{book.title}</Text>
                  <Text style={[styles.bookAuthor, { color: theme.secondaryText }]}>by {book.author}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: theme.border }]}>
                    <Text style={[styles.statusText, { color: theme.accentDark }]}>{book.status}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.menuButton}>
                  <Text style={[styles.menuIcon, { color: theme.secondaryText }]}>⋯</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Add Book Button */}
        <View style={styles.addButtonContainer}>
          <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.accent }]}>
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
  booksContainer: {
    paddingHorizontal: 24,
    marginTop: 24,
    paddingBottom: 16,
  },
  bookCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
  },
  bookCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
