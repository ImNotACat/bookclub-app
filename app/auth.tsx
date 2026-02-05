import { Session } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Button, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'your-app-scheme://auth/callback', // Replace with your app scheme
      },
    });
    if (error) alert(error.message);
    setLoading(false);
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
  };

  if (loading) return <Text>Loading...</Text>;

  if (!session) {
    return (
      <View className="flex-1 items-center justify-center">
        <Button title="Sign in with Google" onPress={signInWithGoogle} />
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center">
      <Text>Welcome, {session.user.email}</Text>
      <Button title="Sign Out" onPress={signOut} />
    </View>
  );
}
