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
    // Supabase stores session in localStorage with this key pattern
    const keys = Object.keys(localStorage);
    const authKey = keys.find(key => key.includes('supabase.auth.token'));
    
    if (authKey) {
      const authData = localStorage.getItem(authKey);
      if (authData) {
        const parsed = JSON.parse(authData);
        const token = parsed?.access_token || parsed?.currentSession?.access_token;
        console.log('✅ Found cached auth token');
        return token;
      }
    }
    
    console.warn('⚠️ No cached auth token found');
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
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
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
