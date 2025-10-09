import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const ChatDebugPanel: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isVisible, setIsVisible] = useState(false);
  const { user, profile } = useAuthStore();
  const { conversations, messages, isLoading } = useChatStore();

  const runDiagnostics = async () => {
    const info: any = {
      timestamp: new Date().toLocaleTimeString(),
      user: user ? { id: user.id, email: user.email } : null,
      profile: profile ? { id: profile.id, name: profile.name } : null,
      conversationsCount: conversations.length,
      messagesCount: Object.keys(messages).length,
      isLoading,
      errors: []
    };

    if (user) {
      try {
        // Test 1: Direct conversation_participants query
        const { data: participants, error: partError } = await supabase
          .from('conversation_participants')
          .select('*')
          .eq('user_id', user.id);
        
        info.participantsQuery = { data: participants, error: partError };

        // Test 2: Conversations with participants
        const { data: convWithParts, error: convError } = await supabase
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

        info.conversationsQuery = { data: convWithParts, error: convError };

        // Test 3: All participants for user's conversations
        if (convWithParts && convWithParts.length > 0) {
          const conversationIds = convWithParts.map(c => c.conversation_id);
          
          const { data: allParticipants, error: allPartError } = await supabase
            .from('conversation_participants')
            .select(`
              conversation_id,
              user_id,
              profiles!inner (
                id,
                name,
                avatar_url,
                country_flag
              )
            `)
            .in('conversation_id', conversationIds);

          info.allParticipantsQuery = { data: allParticipants, error: allPartError };

          // Test 4: Messages for first conversation
          if (conversationIds.length > 0) {
            const { data: msgs, error: msgError } = await supabase
              .from('messages')
              .select('*')
              .eq('conversation_id', conversationIds[0])
              .order('created_at', { ascending: false })
              .limit(10);

            info.messagesQuery = { data: msgs, error: msgError };
          }
        }

        // Test 5: Simple table existence check
        try {
          const { count } = await supabase
            .from('conversations')
            .select('*', { count: 'exact', head: true });
          info.tablesExist = { conversations: true, count };
        } catch (error) {
          info.tablesExist = { conversations: false, error };
        }

      } catch (error) {
        info.errors.push(error);
      }
    }

    setDebugInfo(info);
  };

  useEffect(() => {
    if (user) {
      runDiagnostics();
    }
  }, [user, conversations.length]);

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="bg-red-500 text-white hover:bg-red-600"
        >
          🐛 Debug Chat
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-4 z-50 overflow-auto">
      <Card className="max-w-4xl mx-auto bg-white shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Chat Debug Panel</CardTitle>
          <div className="flex gap-2">
            <Button onClick={runDiagnostics} size="sm" variant="outline">
              🔄 Refresh
            </Button>
            <Button onClick={() => setIsVisible(false)} size="sm" variant="outline">
              ✕ Close
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Authentication</h3>
              <div className="text-sm space-y-1">
                <div>User: {debugInfo.user ? '✅ Logged in' : '❌ Not logged in'}</div>
                <div>Profile: {debugInfo.profile ? '✅ Loaded' : '❌ Missing'}</div>
                {debugInfo.user && (
                  <div className="text-xs text-gray-600">
                    ID: {debugInfo.user.id}<br/>
                    Email: {debugInfo.user.email}
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Store State</h3>
              <div className="text-sm space-y-1">
                <div>Conversations: <Badge variant="outline">{debugInfo.conversationsCount}</Badge></div>
                <div>Message Groups: <Badge variant="outline">{debugInfo.messagesCount}</Badge></div>
                <div>Loading: {debugInfo.isLoading ? '🔄 Yes' : '✅ No'}</div>
              </div>
            </div>
          </div>

          {/* Database Queries */}
          <div className="space-y-3">
            <h3 className="font-semibold">Database Query Results</h3>
            
            {debugInfo.participantsQuery && (
              <div className="border rounded p-3">
                <h4 className="font-medium text-sm">Participants Query</h4>
                <div className="text-xs mt-1">
                  {debugInfo.participantsQuery.error ? (
                    <div className="text-red-600">❌ Error: {debugInfo.participantsQuery.error.message}</div>
                  ) : (
                    <div className="text-green-600">✅ Found {debugInfo.participantsQuery.data?.length || 0} records</div>
                  )}
                </div>
                <pre className="text-xs bg-gray-100 p-2 mt-1 rounded overflow-auto max-h-20">
                  {JSON.stringify(debugInfo.participantsQuery.data?.slice(0, 2), null, 2)}
                </pre>
              </div>
            )}

            {debugInfo.conversationsQuery && (
              <div className="border rounded p-3">
                <h4 className="font-medium text-sm">Conversations Query</h4>
                <div className="text-xs mt-1">
                  {debugInfo.conversationsQuery.error ? (
                    <div className="text-red-600">❌ Error: {debugInfo.conversationsQuery.error.message}</div>
                  ) : (
                    <div className="text-green-600">✅ Found {debugInfo.conversationsQuery.data?.length || 0} conversations</div>
                  )}
                </div>
                <pre className="text-xs bg-gray-100 p-2 mt-1 rounded overflow-auto max-h-20">
                  {JSON.stringify(debugInfo.conversationsQuery.data?.slice(0, 1), null, 2)}
                </pre>
              </div>
            )}

            {debugInfo.messagesQuery && (
              <div className="border rounded p-3">
                <h4 className="font-medium text-sm">Messages Query</h4>
                <div className="text-xs mt-1">
                  {debugInfo.messagesQuery.error ? (
                    <div className="text-red-600">❌ Error: {debugInfo.messagesQuery.error.message}</div>
                  ) : (
                    <div className="text-green-600">✅ Found {debugInfo.messagesQuery.data?.length || 0} messages</div>
                  )}
                </div>
                <pre className="text-xs bg-gray-100 p-2 mt-1 rounded overflow-auto max-h-20">
                  {JSON.stringify(debugInfo.messagesQuery.data?.slice(0, 2), null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Errors */}
          {debugInfo.errors && debugInfo.errors.length > 0 && (
            <div className="border border-red-200 rounded p-3 bg-red-50">
              <h3 className="font-semibold text-red-800 mb-2">Errors</h3>
              {debugInfo.errors.map((error: any, index: number) => (
                <div key={index} className="text-sm text-red-600 mb-1">
                  {error.message || JSON.stringify(error)}
                </div>
              ))}
            </div>
          )}

          {/* Instructions */}
          <div className="border border-blue-200 rounded p-3 bg-blue-50">
            <h3 className="font-semibold text-blue-800 mb-2">Next Steps</h3>
            <div className="text-sm text-blue-700 space-y-1">
              {!debugInfo.user && <div>• Please log in to test chat functionality</div>}
              {debugInfo.user && debugInfo.conversationsCount === 0 && (
                <div>• No conversations found. Run the setup-test-chat-data.sql script in Supabase</div>
              )}
              {debugInfo.user && debugInfo.conversationsCount > 0 && (
                <div>• ✅ Conversations loaded successfully!</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
