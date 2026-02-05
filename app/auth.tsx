import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

type AuthMode = 'signin' | 'signup' | 'forgot';

export default function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Get redirect URL - for web, use the callback route (Supabase will redirect back here)
  // For native, use deep link
  const redirectUrl = Platform.OS === 'web' 
    ? (typeof window !== 'undefined' 
        ? `${window.location.origin}/auth/callback` 
        : '')
    : Linking.createURL('auth/callback');

  useEffect(() => {
    console.log('🟡 AuthScreen: Component mounted', {
      platform: Platform.OS,
      redirectUrl,
      currentUrl: typeof window !== 'undefined' ? window.location.href : 'N/A',
    });
    
    // Check if we already have a session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        console.log('🟡 AuthScreen: Already have a session, user should be redirected', {
          userId: session.user?.id,
          email: session.user?.email,
        });
      } else {
        console.log('🟡 AuthScreen: No existing session');
      }
    });
  }, [redirectUrl]);

  // Handle OAuth callback on web
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleOAuthCallback = async () => {
        try {
          // Check both hash and query params for OAuth tokens
          const hash = window.location.hash;
          const searchParams = new URLSearchParams(window.location.search);
          
          // Check hash first (most common for Supabase PKCE flow)
          if (hash && (hash.includes('access_token') || hash.includes('error'))) {
            setLoading(true);
            
            // Check for errors first
            if (hash.includes('error=')) {
              const errorMatch = hash.match(/error=([^&]*)/);
              const errorDescription = hash.match(/error_description=([^&]*)/);
              if (errorMatch) {
                const errorMsg = errorDescription 
                  ? decodeURIComponent(errorDescription[1])
                  : decodeURIComponent(errorMatch[1]);
                Alert.alert('Authentication Error', errorMsg);
                setLoading(false);
                // Clear the hash
                try {
                  window.history.replaceState(null, '', window.location.pathname);
                } catch (e) {
                  console.warn('Could not update history:', e);
                }
                return;
              }
            }

            // Parse the hash parameters
            const params: Record<string, string> = {};
            hash.substring(1).split('&').forEach((param) => {
              const [key, value] = param.split('=');
              if (key && value) {
                params[decodeURIComponent(key)] = decodeURIComponent(value);
              }
            });

            const accessToken = params.access_token;
            const refreshToken = params.refresh_token;

            if (accessToken && refreshToken) {
              const { error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });

              if (error) {
                Alert.alert('Error', error.message);
              } else {
                // Successfully authenticated - clear the hash and redirect will happen via index.tsx
                try {
                  window.history.replaceState(null, '', window.location.pathname);
                } catch (e) {
                  console.warn('Could not update history:', e);
                }
              }
            }
            setLoading(false);
          }
          // Also check query params (fallback)
          else if (searchParams.has('code') || searchParams.has('error')) {
            // If we have a code, Supabase should handle it automatically
            // But if there's an error, show it
            if (searchParams.has('error')) {
              const errorMsg = searchParams.get('error_description') || searchParams.get('error') || 'Authentication failed';
              Alert.alert('Authentication Error', errorMsg);
              try {
                window.history.replaceState(null, '', window.location.pathname);
              } catch (e) {
                console.warn('Could not update history:', e);
              }
            }
          }
        } catch (error: any) {
          console.error('OAuth callback error:', error);
          Alert.alert('Error', error.message || 'Failed to complete authentication');
          setLoading(false);
        }
      };

      handleOAuthCallback();
    }
  }, []);

  const signInWithGoogle = async () => {
    console.log('🟡 AuthScreen: Google sign-in initiated');
    setLoading(true);
    try {
      // Log the redirect URL for debugging
      if (Platform.OS === 'web') {
        console.log('🟡 AuthScreen: OAuth redirect URL:', redirectUrl);
        console.log('🟡 AuthScreen: Current URL:', typeof window !== 'undefined' ? window.location.href : 'N/A');
        console.log('🟡 AuthScreen: Make sure this URL is added to Supabase Dashboard > Authentication > URL Configuration > Redirect URLs');
        
        // Check localStorage for PKCE verifier storage
        if (typeof window !== 'undefined' && window.localStorage) {
          const storageKeys = Object.keys(window.localStorage);
          const pkceKeys = storageKeys.filter(key => key.includes('pkce') || key.includes('code-verifier'));
          console.log('🟡 AuthScreen: PKCE-related storage keys before OAuth:', pkceKeys);
        }
      }

      // For web, let Supabase handle the redirect naturally
      // For native, we'll handle it manually
      console.log('🟡 AuthScreen: Calling supabase.auth.signInWithOAuth...');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: Platform.OS !== 'web',
          queryParams: {
            // Ensure we get the tokens in the hash for web
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      
      // After calling signInWithOAuth, check if verifier was stored
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        setTimeout(() => {
          const storageKeys = Object.keys(window.localStorage);
          const pkceKeys = storageKeys.filter(key => key.includes('pkce') || key.includes('code-verifier') || key.includes('supabase'));
          console.log('🟡 AuthScreen: PKCE-related storage keys after OAuth call:', pkceKeys);
        }, 100);
      }

      if (error) {
        console.error('🔴 AuthScreen: OAuth error:', error);
        throw error;
      }

      console.log('🟡 AuthScreen: OAuth response received', {
        hasUrl: !!data?.url,
        url: data?.url?.substring(0, 100) + '...',
      });

      // On web, Supabase will redirect automatically, so we don't need to handle it here
      if (Platform.OS === 'web') {
        console.log('🟡 AuthScreen: Web platform - redirecting to Google OAuth');
        // The redirect will happen automatically, and our useEffect will catch the callback
        // Note: Make sure the redirect URL is added to Supabase Dashboard
        return;
      }

      if (data?.url && Platform.OS !== 'web') {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );

        if (result.type === 'success' && result.url) {
          // Parse the callback URL to extract tokens
          const url = result.url;
          const hash = url.split('#')[1];
          if (hash) {
            const params: Record<string, string> = {};
            hash.split('&').forEach((param) => {
              const [key, value] = param.split('=');
              if (key && value) {
                params[decodeURIComponent(key)] = decodeURIComponent(value);
              }
            });

            const accessToken = params.access_token;
            const refreshToken = params.refresh_token;

            if (accessToken && refreshToken) {
              await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
            }
          }
        } else if (result.type === 'cancel') {
          // User cancelled, just stop loading
        }
      }
    } catch (error: any) {
      console.error('🔴 AuthScreen: Google sign-in error:', error);
      Alert.alert('Error', error.message || 'Failed to sign in with Google');
    } finally {
      console.log('🟡 AuthScreen: Google sign-in finished, setting loading=false');
      setLoading(false);
    }
  };

  const signInWithEmail = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      Alert.alert('Sign In Error', error.message);
    }
    setLoading(false);
  };

  const signUpWithEmail = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      Alert.alert('Sign Up Error', error.message);
    } else {
      Alert.alert(
        'Check Your Email',
        'We sent you a confirmation link. Please check your email to verify your account.',
        [{ text: 'OK', onPress: () => setMode('signin') }]
      );
    }
    setLoading(false);
  };

  const resetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: redirectUrl,
    });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert(
        'Check Your Email',
        'We sent you a password reset link. Please check your email.',
        [{ text: 'OK', onPress: () => setMode('signin') }]
      );
    }
    setLoading(false);
  };

  const handleSubmit = () => {
    if (mode === 'signin') {
      signInWithEmail();
    } else if (mode === 'signup') {
      signUpWithEmail();
    } else {
      resetPassword();
    }
  };

  const clearForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
  };

  const switchMode = (newMode: AuthMode) => {
    clearForm();
    setMode(newMode);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-slate-900"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6 py-12">
          {/* Header */}
          <View className="items-center mb-10">
            <View className="w-20 h-20 bg-indigo-600 rounded-2xl items-center justify-center mb-4">
              <Ionicons name="book" size={40} color="white" />
            </View>
            <Text className="text-3xl font-bold text-white">Book Club</Text>
            <Text className="text-slate-400 mt-2">
              {mode === 'signin' && 'Welcome back! Sign in to continue'}
              {mode === 'signup' && 'Create an account to get started'}
              {mode === 'forgot' && 'Reset your password'}
            </Text>
          </View>

          {/* Form Container */}
          <View className="bg-slate-800 rounded-3xl p-6 mb-6">
            {/* Email Input */}
            <View className="mb-4">
              <Text className="text-slate-300 text-sm font-medium mb-2">
                Email
              </Text>
              <View className="flex-row items-center bg-slate-700 rounded-xl px-4">
                <Ionicons name="mail-outline" size={20} color="#94a3b8" />
                <TextInput
                  className="flex-1 py-4 px-3 text-white"
                  placeholder="your@email.com"
                  placeholderTextColor="#64748b"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
              </View>
            </View>

            {/* Password Input - hidden for forgot mode */}
            {mode !== 'forgot' && (
              <View className="mb-4">
                <Text className="text-slate-300 text-sm font-medium mb-2">
                  Password
                </Text>
                <View className="flex-row items-center bg-slate-700 rounded-xl px-4">
                  <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" />
                  <TextInput
                    className="flex-1 py-4 px-3 text-white"
                    placeholder="••••••••"
                    placeholderTextColor="#64748b"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#94a3b8"
                    />
                  </Pressable>
                </View>
              </View>
            )}

            {/* Confirm Password Input - only for signup */}
            {mode === 'signup' && (
              <View className="mb-4">
                <Text className="text-slate-300 text-sm font-medium mb-2">
                  Confirm Password
                </Text>
                <View className="flex-row items-center bg-slate-700 rounded-xl px-4">
                  <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" />
                  <TextInput
                    className="flex-1 py-4 px-3 text-white"
                    placeholder="••••••••"
                    placeholderTextColor="#64748b"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="new-password"
                  />
                </View>
              </View>
            )}

            {/* Forgot Password Link */}
            {mode === 'signin' && (
              <Pressable onPress={() => switchMode('forgot')} className="mb-4">
                <Text className="text-indigo-400 text-sm text-right">
                  Forgot password?
                </Text>
              </Pressable>
            )}

            {/* Submit Button */}
            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              className={`py-4 rounded-xl items-center ${
                loading ? 'bg-indigo-800' : 'bg-indigo-600'
              }`}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-base">
                  {mode === 'signin' && 'Sign In'}
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'forgot' && 'Send Reset Link'}
                </Text>
              )}
            </Pressable>

            {/* Back to Sign In - for forgot mode */}
            {mode === 'forgot' && (
              <Pressable
                onPress={() => switchMode('signin')}
                className="mt-4 py-3"
              >
                <Text className="text-slate-400 text-center">
                  Back to Sign In
                </Text>
              </Pressable>
            )}
          </View>

          {/* Divider - only for signin/signup */}
          {mode !== 'forgot' && (
            <View className="flex-row items-center mb-6">
              <View className="flex-1 h-px bg-slate-700" />
              <Text className="text-slate-500 px-4">or continue with</Text>
              <View className="flex-1 h-px bg-slate-700" />
            </View>
          )}

          {/* Google Sign In - only for signin/signup */}
          {mode !== 'forgot' && (
            <Pressable
              onPress={signInWithGoogle}
              disabled={loading}
              className="flex-row items-center justify-center bg-white py-4 rounded-xl mb-6"
            >
              <Ionicons name="logo-google" size={20} color="#4285F4" />
              <Text className="text-slate-800 font-semibold text-base ml-3">
                Continue with Google
              </Text>
            </Pressable>
          )}

          {/* Toggle Sign In / Sign Up */}
          {mode !== 'forgot' && (
            <View className="flex-row justify-center">
              <Text className="text-slate-400">
                {mode === 'signin'
                  ? "Don't have an account? "
                  : 'Already have an account? '}
              </Text>
              <Pressable
                onPress={() =>
                  switchMode(mode === 'signin' ? 'signup' : 'signin')
                }
              >
                <Text className="text-indigo-400 font-semibold">
                  {mode === 'signin' ? 'Sign Up' : 'Sign In'}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
