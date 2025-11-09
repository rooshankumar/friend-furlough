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
  
  console.log('📡 Calling Edge Function:', {
    url: functionUrl,
    messageData: {
      conversation_id: message.conversation_id,
      type: message.type,
      hasMediaUrl: !!message.media_url
    }
  });
  
  try {
    // Add timeout for Edge Function call
    const fetchPromise = fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(message)
    });
    
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => {
        console.error('⏱️ Edge Function timeout (30s)');
        reject(new Error('Edge Function timeout'));
      }, 30000)
    );
    
    const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
    
    console.log('📡 Edge Function response status:', response.status);
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Edge Function error:', {
        status: response.status,
        statusText: response.statusText,
        body: error
      });
      throw new Error(`Edge Function error: ${response.status} - ${error}`);
    }
    
    const data = await response.json();
    console.log('✅ Edge Function insert successful:', {
      id: data.id,
      type: data.type,
      hasMediaUrl: !!data.media_url
    });
    return data;
  } catch (error: any) {
    console.error('❌ Edge Function failed:', {
      message: error.message,
      name: error.name
    });
    throw error;
  }
}
