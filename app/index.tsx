import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';

export default function Index() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    console.log('🟢 Index: Component mounted');
    let mounted = true;

    // Check session immediately
    console.log('🟢 Index: Checking session...');
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) {
        console.log('🟢 Index: Component unmounted, ignoring session check');
        return;
      }
      if (error) {
        console.error('🔴 Index: Session check error:', error);
      }
      console.log('🟢 Index: Session check result:', session 
        ? `Found session - User: ${session.user?.email || session.user?.id}` 
        : 'No session');
      setSession(session);
      setChecked(true);
      // Give a small delay to ensure session is fully established
      setTimeout(() => {
        if (mounted) {
          console.log('🟢 Index: Setting loading=false');
          setLoading(false);
        }
      }, 100);
    });

    // Listen for auth state changes
    console.log('🟢 Index: Setting up auth state listener');
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) {
        console.log('🟢 Index: Component unmounted, ignoring auth state change');
        return;
      }
      console.log('🟢 Index: Auth state changed:', {
        event: _event,
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email,
      });
      setSession(session);
      // If we get a session update, we're no longer loading
      if (session) {
        console.log('🟢 Index: Session received, setting loading=false');
        setLoading(false);
      }
    });

    return () => {
      console.log('🟢 Index: Component unmounting, cleaning up');
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // Show loading while checking session
  if (loading || !checked) {
    console.log('🟢 Index: Rendering loading state', { loading, checked });
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Use Redirect component instead of router.replace()
  if (session) {
    console.log('✅ Index: Session found, redirecting to /(tabs)');
    return <Redirect href="/(tabs)" />;
  }

  console.log('🔴 Index: No session, redirecting to /auth');
  return <Redirect href="/auth" />;
}
