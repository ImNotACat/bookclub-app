import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionEstablished, setSessionEstablished] = useState(false);

  useEffect(() => {
    console.log('🔵 AuthCallback: Component mounted');
    
    const handleCallback = async () => {
      try {
        if (typeof window === 'undefined') {
          setLoading(false);
          return;
        }

        const hash = window.location.hash;
        console.log('🔵 AuthCallback: URL hash:', hash.substring(0, 150));

        // Parse tokens from hash manually
        if (hash && hash.includes('access_token')) {
          console.log('🔵 AuthCallback: Found access_token in hash, parsing...');
          
          const params: Record<string, string> = {};
          hash.substring(1).split('&').forEach((param) => {
            const [key, value] = param.split('=');
            if (key && value) {
              params[decodeURIComponent(key)] = decodeURIComponent(value);
            }
          });

          console.log('🔵 AuthCallback: Parsed params:', {
            hasAccessToken: !!params.access_token,
            hasRefreshToken: !!params.refresh_token,
            tokenType: params.token_type,
            expiresIn: params.expires_in,
          });

          const accessToken = params.access_token;
          const refreshToken = params.refresh_token;

          if (!accessToken || !refreshToken) {
            console.error('🔴 AuthCallback: Missing tokens in hash');
            setError('Missing authentication tokens');
            setLoading(false);
            return;
          }

          // Set the session manually
          console.log('🔵 AuthCallback: Setting session with tokens...');
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            console.error('🔴 AuthCallback: Error setting session:', sessionError);
            setError(sessionError.message);
            setLoading(false);
            return;
          }

          if (data.session) {
            console.log('✅ AuthCallback: Session set successfully!', {
              userId: data.session.user?.id,
              email: data.session.user?.email,
            });

            // Verify it was persisted
            await new Promise(resolve => setTimeout(resolve, 200));
            const { data: { session: verifiedSession } } = await supabase.auth.getSession();
            
            if (verifiedSession) {
              console.log('✅ AuthCallback: Session verified in storage');
              
              // Clear hash
              try {
                window.history.replaceState(null, '', window.location.pathname);
              } catch (e) {
                console.warn('⚠️ AuthCallback: Could not clear hash:', e);
              }
              
              setSessionEstablished(true);
              setLoading(false);
              return;
            } else {
              console.error('🔴 AuthCallback: Session not persisted');
              setError('Session not persisted');
              setLoading(false);
              return;
            }
          } else {
            console.error('🔴 AuthCallback: No session in setSession response');
            setError('Failed to create session');
            setLoading(false);
            return;
          }
        }

        // Check for errors in URL
        const searchParams = new URLSearchParams(window.location.search);
        if (hash.includes('error=') || searchParams.has('error')) {
          const errorParam = hash.includes('error=')
            ? hash.match(/error=([^&]*)/)?.[1]
            : searchParams.get('error');
          const errorMsg = errorParam ? decodeURIComponent(errorParam) : 'Authentication failed';
          console.error('🔴 AuthCallback: Error in URL:', errorMsg);
          setError(errorMsg);
          setLoading(false);
          return;
        }

        // No tokens or errors found
        console.log('🔵 AuthCallback: No tokens in URL, checking existing session...');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log('✅ AuthCallback: Existing session found');
          setSessionEstablished(true);
          setLoading(false);
          return;
        }

        console.error('🔴 AuthCallback: No tokens, no session, no errors');
        setError('No authentication data found');
        setLoading(false);
      } catch (err: any) {
        console.error('🔴 AuthCallback: Exception:', err);
        setError(err.message || 'Authentication failed');
        setLoading(false);
      }
    };

    handleCallback();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={{ color: '#cbd5e1', marginTop: 16, fontSize: 16 }}>Completing sign in...</Text>
      </View>
    );
  }

  if (sessionEstablished) {
    console.log('✅ AuthCallback: Redirecting to /(tabs)');
    return <Redirect href="/(tabs)" />;
  }

  if (error) {
    console.log('🔴 AuthCallback: Error - redirecting to /auth:', error);
    return <Redirect href="/auth" />;
  }

  return <Redirect href="/" />;
}
