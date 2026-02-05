import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('⚠️ Supabase: URL or Anon Key is missing. Please check your .env file.');
} else {
  // Validate key format (should be a JWT starting with 'eyJ' or a valid Supabase key)
  const isValidKeyFormat = SUPABASE_ANON_KEY.startsWith('eyJ') || 
                           SUPABASE_ANON_KEY.startsWith('sb-') ||
                           SUPABASE_ANON_KEY.length > 50; // Basic length check
  
  if (!isValidKeyFormat) {
    console.warn('⚠️ Supabase: Anon key format looks suspicious. Please verify it\'s correct.');
    console.warn('⚠️ Supabase: Key should be from: Project Settings > API > anon/public key');
  }
  
  console.log('✅ Supabase: Client initialized', {
    url: SUPABASE_URL,
    hasKey: !!SUPABASE_ANON_KEY,
    keyLength: SUPABASE_ANON_KEY.length,
    keyPrefix: SUPABASE_ANON_KEY.substring(0, 10) + '...',
  });
}

// Create Supabase client for web (uses localStorage by default)
// Using implicit flow instead of PKCE - tokens come directly in URL hash
// This avoids the code exchange issues we were having with PKCE
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true, // Let Supabase detect tokens in URL hash
    flowType: 'implicit', // Use implicit flow (tokens in hash, no code exchange)
  },
});

console.log('✅ Supabase: Client created with config', {
  detectSessionInUrl: true,
  flowType: 'implicit',
  autoRefreshToken: true,
  persistSession: true,
});
