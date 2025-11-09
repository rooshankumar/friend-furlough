/**
 * Simple Direct Insert - No Supabase Client
 * 
 * This is the most basic approach - direct HTTP POST to Supabase REST API
 * Uses localStorage to cache auth token to avoid getSession() hanging
 */

interface MessageInsert {
  conversation_id: string;
  sender_id: string;
  content: string;
  type: string;
  client_id: string;
  media_url?: string;
}

/**
 * Get cached auth token from localStorage
 * This avoids calling supabase.auth.getSession() which hangs on mobile
 */
function getCachedAuthToken(): string | null {
  try {
    console.log('🔍 Looking for cached auth token...');
    
    // Supabase stores session with this key pattern
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const projectRef = supabaseUrl?.split('//')[1]?.split('.')[0]; // Extract project ref from URL
    
    // Try multiple possible key patterns
    const possibleKeys = [
      `sb-${projectRef}-auth-token`,
      `supabase.auth.token`,
      'sb-auth-token'
    ];
    
    console.log('🔍 Checking keys:', possibleKeys);
    
    // Also check all localStorage keys
    const allKeys = Object.keys(localStorage);
    console.log('📦 All localStorage keys:', allKeys.filter(k => k.includes('auth') || k.includes('sb-')));
    
    // Try to find any key with auth token
    for (const key of allKeys) {
      if (key.includes('auth-token') || key.includes('supabase')) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            
            // Try different token paths
            const token = 
              parsed?.access_token || 
              parsed?.currentSession?.access_token ||
              parsed?.session?.access_token ||
              parsed?.user?.access_token;
            
            if (token && typeof token === 'string' && token.length > 20) {
              console.log('✅ Found cached auth token in key:', key);
              return token;
            }
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
    
    console.warn('⚠️ No cached auth token found in localStorage');
    console.warn('Available keys:', allKeys);
    return null;
  } catch (error) {
    console.error('❌ Error getting cached token:', error);
    return null;
  }
}

/**
 * Insert message using direct REST API with cached token
 * This is the most reliable method for mobile
 */
export async function insertMessageSimple(message: MessageInsert): Promise<any> {
  console.log('🔧 Using simple direct insert...');
  
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const url = `${supabaseUrl}/rest/v1/messages`;
  
  // Get cached token (avoids hanging getSession call)
  const token = getCachedAuthToken();
  
  if (!token) {
    throw new Error('No auth token available');
  }
  
  console.log('📡 Making direct REST API call:', {
    url,
    hasToken: !!token,
    messageData: {
      conversation_id: message.conversation_id,
      type: message.type,
      hasMediaUrl: !!message.media_url
    }
  });
  
  try {
    // Simple fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
    
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    console.log('📡 Request headers:', {
      hasAnonKey: !!anonKey,
      hasToken: !!token,
      anonKeyLength: anonKey?.length
    });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${token}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(message),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ REST API error:', {
        status: response.status,
        body: error
      });
      throw new Error(`REST API error: ${response.status}`);
    }
    
    const data = await response.json();
    const result = Array.isArray(data) ? data[0] : data;
    
    console.log('✅ Simple insert successful:', {
      id: result.id,
      type: result.type,
      hasMediaUrl: !!result.media_url
    });
    
    return result;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('⏱️ Request timeout (15s)');
      throw new Error('Request timeout');
    }
    console.error('❌ Simple insert failed:', error);
    throw error;
  }
}
