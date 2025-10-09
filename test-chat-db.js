// Test script to verify chat database tables and functionality
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bblrxervgwkphkctdghe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJibHJ4ZXJ2Z3drcGhrY3RkZ2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1MjQ1NjYsImV4cCI6MjA3NDEwMDU2Nn0.BBzc0XFxI5c7BkfRQrNLW-pBCeS60NjvXPpRcXmlfR0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabase() {
  console.log('🔍 Testing database connection and tables...');
  
  try {
    // Test 1: Check if tables exist by querying them
    console.log('\n📋 Testing table existence...');
    
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('count')
      .limit(1);
    
    if (convError) {
      console.error('❌ Conversations table error:', convError);
    } else {
      console.log('✅ Conversations table exists');
    }
    
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('count')
      .limit(1);
    
    if (msgError) {
      console.error('❌ Messages table error:', msgError);
    } else {
      console.log('✅ Messages table exists');
    }
    
    const { data: participants, error: partError } = await supabase
      .from('conversation_participants')
      .select('count')
      .limit(1);
    
    if (partError) {
      console.error('❌ Conversation participants table error:', partError);
    } else {
      console.log('✅ Conversation participants table exists');
    }
    
    // Test 2: Check current user authentication
    console.log('\n👤 Testing authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Auth error:', authError);
      console.log('ℹ️  User not authenticated - this is expected for testing');
    } else if (user) {
      console.log('✅ User authenticated:', user.email);
      
      // Test 3: Try to fetch user's conversations
      console.log('\n💬 Testing conversation loading...');
      const { data: userConversations, error: userConvError } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          unread_count,
          conversations!inner (
            id,
            created_at,
            updated_at,
            is_language_exchange,
            language
          )
        `)
        .eq('user_id', user.id);
      
      if (userConvError) {
        console.error('❌ Error loading user conversations:', userConvError);
      } else {
        console.log('✅ User conversations loaded:', userConversations?.length || 0, 'conversations');
        if (userConversations && userConversations.length > 0) {
          console.log('📊 Sample conversation:', userConversations[0]);
        }
      }
    } else {
      console.log('ℹ️  No user session found');
    }
    
    // Test 4: Check if profiles table exists (required for foreign keys)
    console.log('\n👥 Testing profiles table...');
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (profileError) {
      console.error('❌ Profiles table error:', profileError);
    } else {
      console.log('✅ Profiles table exists');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testDatabase().then(() => {
  console.log('\n🏁 Database test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});
