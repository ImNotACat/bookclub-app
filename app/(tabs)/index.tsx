import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, Image, Modal } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
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

  const userName = user?.user_metadata?.full_name || 
                   user?.email?.split('@')[0] || 
                   'Reader';
  
  const profilePic = user?.user_metadata?.avatar_url;
  const initials = getInitials(userName);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.cardBackground} />
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.headerTop}>
            <Text style={[styles.brandText, { color: theme.secondaryText }]}>BOOKSAW</Text>
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
          
          <Text style={[styles.greeting, { color: theme.primaryText }]}>Hi {userName}</Text>
          <Text style={[styles.subtitle, { color: theme.secondaryText }]}>Welcome to your reading sanctuary</Text>
        </View>

        {/* Featured Section */}
        <View style={[styles.section, { backgroundColor: theme.background }]}>
          <Text style={[styles.sectionLabel, { color: theme.secondaryText }]}>CURRENT BOOK</Text>
          
          <View style={[styles.featuredCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <Text style={[styles.featuredTitle, { color: theme.primaryText }]}>Life Of The Wild</Text>
            <Text style={[styles.featuredDescription, { color: theme.secondaryText }]}>
              Discover the beauty of nature through captivating stories and stunning illustrations. A journey into the heart of wilderness awaits.
            </Text>
            <TouchableOpacity style={[styles.readMoreButton, { borderColor: theme.accent }]}>
              <Text style={[styles.readMoreText, { color: theme.accentDark }]}>View →</Text>
            </TouchableOpacity>
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

        {/* Book Club Section */}
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
                <Text style={[styles.menuUserName, { color: theme.primaryText }]}>{userName}</Text>
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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
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
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  greeting: {
    fontSize: 36,
    fontFamily: 'Georgia',
    color: '#5C4A3D',
    marginBottom: 8,
    fontWeight: '400',
  },
  subtitle: {
    fontSize: 15,
    color: '#8B7355',
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
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
  },
  featuredTitle: {
    fontSize: 28,
    fontFamily: 'Georgia',
    color: '#5C4A3D',
    marginBottom: 12,
    fontWeight: '400',
  },
  featuredDescription: {
    fontSize: 14,
    color: '#8B7355',
    lineHeight: 22,
    marginBottom: 16,
  },
  readMoreButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#8B7355',
    borderRadius: 8,
  },
  readMoreText: {
    fontSize: 10,
    color: '#5C4A3D',
    letterSpacing: 1,
    fontWeight: '600',
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
