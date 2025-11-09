/**
 * Direct Database Insert via REST API
 * 
 * Alternative to Supabase client for when it hangs on mobile
 */

import { supabase } from '@/integrations/supabase/client';

interface MessageInsert {
  conversation_id: string;
  sender_id: string;
  content: string;
  type: string;
  client_id: string;
  media_url?: string;
}

/**
 * Insert message using direct REST API call
 * This bypasses the Supabase client which may have issues on mobile
 */
export async function insertMessageDirect(message: MessageInsert): Promise<any> {
  console.log('🔧 Getting auth session for REST API...');
  
  // Add timeout for getSession (it can hang on mobile too)
  const sessionPromise = supabase.auth.getSession();
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Auth session timeout')), 5000)
  );
  
  const session = await Promise.race([sessionPromise, timeoutPromise]) as any;
  const token = session.data?.session?.access_token;

  if (!token) {
    console.error('❌ No auth token available');
    throw new Error('No auth token available');
  }
  
  console.log('✅ Got auth token for REST API');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const url = `${supabaseUrl}/rest/v1/messages`;

  console.log('🔧 Using direct REST API insert:', {
    url,
    hasToken: !!token,
    messageData: {
      conversation_id: message.conversation_id,
      type: message.type,
      hasMediaUrl: !!message.media_url
    }
  });

  try {
    console.log('🚀 Making REST API request...');
    
    // Add timeout for fetch (mobile networks can be slow)
    const fetchPromise = fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(message)
    });
    
    const fetchTimeoutPromise = new Promise((_, reject) =>
      setTimeout(() => {
        console.error('⏱️ REST API fetch timeout (30s)');
        reject(new Error('REST API fetch timeout'));
      }, 30000)
    );
    
    const response = await Promise.race([fetchPromise, fetchTimeoutPromise]) as Response;

    console.log('📡 REST API response status:', response.status);

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ REST API error response:', {
        status: response.status,
        statusText: response.statusText,
        body: error
      });
      throw new Error(`REST API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    console.log('✅ REST API insert successful:', {
      id: data[0]?.id,
      type: data[0]?.type,
      hasMediaUrl: !!data[0]?.media_url
    });
    
    return data[0]; // Supabase returns array
  } catch (fetchError: any) {
    console.error('❌ Fetch error:', {
      message: fetchError.message,
      name: fetchError.name
    });
    throw fetchError;
  }
}

/**
 * Insert with automatic fallback
 * Tries Supabase client first, falls back to REST API
 */
export async function insertMessageWithFallback(message: MessageInsert): Promise<any> {
  try {
    console.log('🔄 Trying Supabase client insert...');
    
    // Try with timeout
    const insertPromise = supabase
      .from('messages')
      .insert(message)
      .select()
      .single();

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Supabase client timeout')), 10000)
    );

    const result = await Promise.race([insertPromise, timeoutPromise]) as any;
    
    if (result.error) {
      console.error('❌ Supabase client returned error:', result.error);
      throw result.error;
    }

    console.log('✅ Supabase client insert successful');
    return result.data;
  } catch (error: any) {
    console.warn('⚠️ Supabase client failed, trying REST API...', {
      message: error?.message,
      name: error?.name,
      code: error?.code
    });
    
    // Fallback to direct REST API
    try {
      const result = await insertMessageDirect(message);
      console.log('✅ REST API fallback successful!');
      return result;
    } catch (restError: any) {
      console.error('❌ REST API also failed:', {
        message: restError?.message,
        status: restError?.status
      });
      throw restError;
    }
  }
}
