import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import '../global.css';

export default function HomeScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const { theme, isDark, toggleTheme } = useTheme();

  useEffect(() => {
    // Get current user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    
    getUser();
  }, []);

  const handleSignOut = async () => {
    setMenuVisible(false);
    await supabase.auth.signOut();
    router.replace('/auth');
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  const fullName = user?.user_metadata?.full_name || 
                   user?.email?.split('@')[0] || 
                   'Reader';
  
  // Get first name only
  const firstName = fullName.split(' ')[0];
  
  // Random greeting in different languages
  const greetings = ['Hi', 'Hello', 'Ciao', 'Hola', 'Bonjour', 'Hej', 'Olá', 'Hallo', 'Привет', 'こんにちは'];
  const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
  
  const profilePic = user?.user_metadata?.avatar_url;
  const initials = getInitials(fullName);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.cardBackground} />
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={[styles.greeting, { color: theme.secondaryText }]}>{randomGreeting} {firstName}</Text>
              <TouchableOpacity 
                onPress={() => setMenuVisible(true)}
                style={styles.avatarButton}
              >
                {profilePic ? (
                  <Image source={{ uri: profilePic }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: theme.accent }]}> 
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Current Book Section */}
        <View style={[styles.section, { backgroundColor: theme.background }]}>
          <Text style={[styles.sectionLabel, { color: theme.secondaryText }]}>CURRENT BOOK</Text>
          
          <View style={[styles.featuredCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <View style={styles.currentBookContent}>
              <View style={styles.currentBookText}>
                <Text style={[styles.featuredTitle, { color: theme.primaryText }]}>Life Of The Wild</Text>
                <Text style={[styles.featuredAuthor, { color: theme.secondaryText }]}>by Samuel Handy</Text>
              </View>
              <TouchableOpacity style={styles.arrowButton}>
                <FontAwesome name="chevron-right" size={16} color={theme.accent} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={[styles.section, { backgroundColor: theme.background }]}>
          <Text style={[styles.sectionLabel, { color: theme.secondaryText }]}>YOUR STATS</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.primaryText }]}>12</Text>
              <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Books Read</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.primaryText }]}>3</Text>
              <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Currently Reading</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.primaryText }]}>45</Text>
              <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Want to Read</Text>
            </View>
          </View>
        </View>

        {/* Categories Section */}
        <View style={[styles.section, { backgroundColor: theme.background }]}>
          <Text style={[styles.sectionLabel, { color: theme.secondaryText }]}>EXPLORE CATEGORIES</Text>
          
          <View style={styles.categoriesGrid}>
            {['Fiction', 'Non-Fiction', 'Mystery', 'Biography'].map((category) => (
              <TouchableOpacity 
                key={category}
                style={[styles.categoryCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
              >
                <Text style={[styles.categoryTitle, { color: theme.primaryText }]}>{category}</Text>
                <Text style={[styles.categoryLink, { color: theme.secondaryText }]}>Explore →</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

          {/* Book Club Section removed for now. Styling preserved below for later reuse. */}
          {/*
          <View style={[styles.section, { backgroundColor: theme.background }]}>
            <View style={[styles.communityCard, { backgroundColor: theme.accent }]}>
              <Text style={[styles.communityTitle, { color: theme.cardBackground }]}>Join Our Community</Text>
              <Text style={[styles.communityDescription, { color: theme.tertiaryText }]}>
                Connect with fellow readers, share reviews, and discover your next favorite book together.
              </Text>
              <TouchableOpacity style={[styles.communityButton, { backgroundColor: theme.cardBackground }]}>
                <Text style={[styles.communityButtonText, { color: theme.accentDark }]}>GET STARTED</Text>
              </TouchableOpacity>
            </View>
          </View>
          */}
        {/* Quote of the Day Section */}
        <View style={[styles.section, { backgroundColor: theme.background }]}> 
          <View style={[styles.communityCard, { backgroundColor: theme.accent }]}> 
            <Text style={[styles.communityTitle, { color: theme.cardBackground }]}>Quote of the Day</Text>
            <Text style={[styles.communityDescription, { color: theme.tertiaryText }]}> 
              "It is only with the heart that one can see rightly; what is essential is invisible to the eye."
            </Text>
            <Text style={{ color: theme.cardBackground, fontWeight: '600', marginBottom: 8 }}>
              — The Little Prince
            </Text>
            <Text style={{ color: theme.cardBackground, fontStyle: 'italic', fontSize: 12 }}>
              Antoine de Saint-Exupéry
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Profile Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={[styles.menuContainer, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.menuHeader}>
              {profilePic ? (
                <Image source={{ uri: profilePic }} style={styles.menuAvatar} />
              ) : (
                <View style={[styles.menuAvatarPlaceholder, { backgroundColor: theme.accent }]}>
                  <Text style={styles.menuAvatarText}>{initials}</Text>
                </View>
              )}
              <View style={styles.menuUserInfo}>
                <Text style={[styles.menuUserName, { color: theme.primaryText }]}>{fullName}</Text>
                <Text style={[styles.menuUserEmail, { color: theme.secondaryText }]}>{user?.email}</Text>
              </View>
            </View>

            <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                // TODO: Navigate to settings
              }}
            >
              <Text style={[styles.menuItemText, { color: theme.primaryText }]}>⚙️  Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                toggleTheme();
                setMenuVisible(false);
              }}
            >
              <Text style={[styles.menuItemText, { color: theme.primaryText }]}>
                {isDark ? '☀️' : '🌙'}  {isDark ? 'Light' : 'Dark'} Mode
              </Text>
            </TouchableOpacity>

            <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={handleSignOut}
            >
              <Text style={[styles.menuItemText, { color: theme.danger }]}>🚪  Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 8,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 0,
  },
  brandText: {
    fontSize: 11,
    color: '#8B7355',
    letterSpacing: 2,
    fontWeight: '600',
  },
  avatarButton: {
    width: 40,
    height: 40,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8E2D8',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  greeting: {
    fontSize: 15,
    fontWeight: '400',
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  sectionLabel: {
    fontSize: 10,
    color: '#8B7355',
    letterSpacing: 2,
    fontWeight: '600',
    marginBottom: 16,
  },
  featuredCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
  },
  currentBookContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currentBookText: {
    flex: 1,
    marginRight: 12,
  },
  featuredTitle: {
    fontSize: 28,
    fontFamily: 'Georgia',
    color: '#5C4A3D',
    marginBottom: 4,
    fontWeight: '400',
  },
  featuredAuthor: {
    fontSize: 14,
    color: '#8B7355',
    fontWeight: '400',
  },
  arrowButton: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontFamily: 'Georgia',
    color: '#5C4A3D',
    fontWeight: '400',
  },
  statLabel: {
    fontSize: 10,
    color: '#8B7355',
    letterSpacing: 1,
    marginTop: 4,
    fontWeight: '600',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
  },
  categoryTitle: {
    fontSize: 18,
    fontFamily: 'Georgia',
    color: '#5C4A3D',
    fontWeight: '400',
  },
  categoryLink: {
    fontSize: 11,
    color: '#8B7355',
    marginTop: 4,
  },
  communityCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
  },
  communityTitle: {
    fontSize: 24,
    fontFamily: 'Georgia',
    color: '#FFFFFF',
    marginBottom: 8,
    fontWeight: '400',
  },
  communityDescription: {
    fontSize: 14,
    color: '#D4CFC5',
    lineHeight: 22,
    marginBottom: 16,
  },
  communityButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  communityButtonText: {
    fontSize: 10,
    color: '#5C4A3D',
    letterSpacing: 1,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: 20,
  },
  menuContainer: {
    borderRadius: 16,
    width: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  menuAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8E2D8',
  },
  menuAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuAvatarText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  menuUserInfo: {
    marginLeft: 12,
    flex: 1,
  },
  menuUserName: {
    fontSize: 16,
    fontFamily: 'Georgia',
    color: '#5C4A3D',
    fontWeight: '400',
    marginBottom: 2,
  },
  menuUserEmail: {
    fontSize: 12,
    color: '#8B7355',
  },
  menuDivider: {
    height: 1,
    marginHorizontal: 12,
  },
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
