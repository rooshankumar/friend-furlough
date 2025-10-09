import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const ChatQuickFix: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);
  const { user } = useAuthStore();
  const { conversations, messages, loadConversations, loadMessages, sendMessage } = useChatStore();

  const runQuickTest = async () => {
    if (!user) {
      setTestResult('❌ No user logged in');
      return;
    }

    setTestResult('🔄 Running tests...\n');
    let result = '';

    try {
      // Test 1: Load conversations
      result += '1. Loading conversations...\n';
      await loadConversations(user.id);
      result += `✅ Loaded ${conversations.length} conversations\n`;

      if (conversations.length > 0) {
        const firstConv = conversations[0];
        result += `📋 First conversation: ${firstConv.id}\n`;

        // Test 2: Load messages for first conversation
        result += '2. Loading messages...\n';
        await loadMessages(firstConv.id);
        const convMessages = messages[firstConv.id] || [];
        result += `✅ Loaded ${convMessages.length} messages\n`;

        // Test 3: Try to send a test message
        result += '3. Testing message send...\n';
        try {
          await sendMessage(firstConv.id, user.id, `Test message ${Date.now()}`);
          result += '✅ Message sent successfully\n';
        } catch (error: any) {
          result += `❌ Message send failed: ${error.message}\n`;
        }
      } else {
        result += '⚠️ No conversations found\n';
        
        // Test creating a conversation
        result += '4. Testing conversation creation...\n';
        try {
          const { data: newConv, error } = await supabase
            .from('conversations')
            .insert({
              is_language_exchange: false,
              language: null
            })
            .select()
            .single();

          if (error) throw error;

          result += `✅ Created conversation: ${newConv.id}\n`;

          // Add user as participant
          const { error: partError } = await supabase
            .from('conversation_participants')
            .insert({
              conversation_id: newConv.id,
              user_id: user.id,
              unread_count: 0
            });

          if (partError) throw partError;
          result += '✅ Added user as participant\n';

          // Reload conversations
          await loadConversations(user.id);
          result += `✅ Reloaded conversations: ${conversations.length}\n`;

        } catch (error: any) {
          result += `❌ Conversation creation failed: ${error.message}\n`;
        }
      }

    } catch (error: any) {
      result += `❌ Test failed: ${error.message}\n`;
    }

    setTestResult(result);
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-16 right-4 z-50">
        <Button 
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="bg-green-500 text-white hover:bg-green-600"
        >
          🔧 Quick Fix
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-4 z-50 overflow-auto">
      <Card className="max-w-2xl mx-auto bg-white shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Chat Quick Fix</CardTitle>
          <div className="flex gap-2">
            <Button onClick={runQuickTest} size="sm" variant="outline">
              🧪 Run Test
            </Button>
            <Button onClick={() => setIsVisible(false)} size="sm" variant="outline">
              ✕ Close
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Current Status</h3>
              <div className="text-sm space-y-1">
                <div>User: {user ? '✅ Logged in' : '❌ Not logged in'}</div>
                <div>Conversations: {conversations.length}</div>
                <div>Message Groups: {Object.keys(messages).length}</div>
              </div>
            </div>

            {testResult && (
              <div className="border rounded p-3 bg-gray-50">
                <h3 className="font-semibold mb-2">Test Results</h3>
                <pre className="text-xs whitespace-pre-wrap">{testResult}</pre>
              </div>
            )}

            <div className="border border-blue-200 rounded p-3 bg-blue-50">
              <h3 className="font-semibold text-blue-800 mb-2">Instructions</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <div>1. Click "Run Test" to diagnose chat issues</div>
                <div>2. Check browser console for detailed logs</div>
                <div>3. Try clicking on a conversation in the list</div>
                <div>4. Try sending a message</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
