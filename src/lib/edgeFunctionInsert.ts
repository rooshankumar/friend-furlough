/**
 * Insert via Supabase Edge Function
 * 
 * This bypasses the Supabase client entirely and uses a simple HTTP call
 * to a serverless function that does the database insert
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
 * Insert message via Edge Function
 * This is more reliable on mobile than direct Supabase client
 */
export async function insertViaEdgeFunction(message: MessageInsert): Promise<any> {
  console.log('🔧 Using Edge Function insert...');
  
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const functionUrl = `${supabaseUrl}/functions/v1/insert-message`;
  
  console.log('📡 Calling Edge Function:', functionUrl);
  
  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(message)
    });
    
    console.log('📡 Edge Function response:', response.status);
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Edge Function error:', error);
      throw new Error(`Edge Function error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Edge Function insert successful:', data);
    return data;
  } catch (error: any) {
    console.error('❌ Edge Function failed:', error);
    throw error;
  }
}
