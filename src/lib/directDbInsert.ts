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
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;

  if (!token) {
    throw new Error('No auth token available');
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const url = `${supabaseUrl}/rest/v1/messages`;

  console.log('🔧 Using direct REST API insert:', url);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(message)
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ REST API error:', error);
    throw new Error(`REST API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  console.log('✅ REST API insert successful:', data);
  
  return data[0]; // Supabase returns array
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
      throw result.error;
    }

    console.log('✅ Supabase client insert successful');
    return result.data;
  } catch (error) {
    console.warn('⚠️ Supabase client failed, trying REST API...', error);
    
    // Fallback to direct REST API
    return await insertMessageDirect(message);
  }
}
