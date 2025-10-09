import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { uploadChatAttachment } from '@/lib/storage';

export const AttachmentTest: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);
  const { user } = useAuthStore();

  const testAttachmentUpload = async () => {
    if (!user) {
      setTestResult('❌ No user logged in');
      return;
    }

    setTestResult('🔄 Testing attachment upload...\n');
    let result = '';

    try {
      // Test 1: Check if bucket exists
      result += '1. Checking chat_attachments bucket...\n';
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      
      if (bucketError) {
        result += `❌ Error listing buckets: ${bucketError.message}\n`;
      } else {
        const chatBucket = buckets.find(b => b.id === 'chat_attachments');
        if (chatBucket) {
          result += `✅ chat_attachments bucket exists (public: ${chatBucket.public})\n`;
        } else {
          result += '❌ chat_attachments bucket not found\n';
        }
      }

      // Test 2: Check storage policies
      result += '2. Testing storage permissions...\n';
      try {
        const { data: files, error: listError } = await supabase.storage
          .from('chat_attachments')
          .list('', { limit: 1 });
        
        if (listError) {
          result += `❌ Cannot list files: ${listError.message}\n`;
        } else {
          result += '✅ Can list files in chat_attachments bucket\n';
        }
      } catch (error: any) {
        result += `❌ Storage list error: ${error.message}\n`;
      }

      // Test 3: Try to upload a small test file
      result += '3. Testing file upload...\n';
      try {
        // Create a small test file
        const testContent = 'This is a test file for attachment upload';
        const testBlob = new Blob([testContent], { type: 'text/plain' });
        const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });
        
        result += `📁 Test file: ${testFile.name} (${testFile.size} bytes)\n`;
        
        // Try direct upload to storage
        const testPath = `test/${Date.now()}_test.txt`;
        const { error: uploadError } = await supabase.storage
          .from('chat_attachments')
          .upload(testPath, testFile);
        
        if (uploadError) {
          result += `❌ Direct upload failed: ${uploadError.message}\n`;
        } else {
          result += '✅ Direct upload successful\n';
          
          // Try to get public URL
          const { data: urlData } = supabase.storage
            .from('chat_attachments')
            .getPublicUrl(testPath);
          
          result += `📎 Public URL: ${urlData.publicUrl}\n`;
          
          // Clean up test file
          await supabase.storage
            .from('chat_attachments')
            .remove([testPath]);
          result += '🗑️ Test file cleaned up\n';
        }
      } catch (error: any) {
        result += `❌ Upload test error: ${error.message}\n`;
      }

      // Test 4: Try using the uploadChatAttachment function
      result += '4. Testing uploadChatAttachment function...\n';
      try {
        const testContent2 = 'Test content for chat attachment function';
        const testBlob2 = new Blob([testContent2], { type: 'text/plain' });
        const testFile2 = new File([testBlob2], 'chat_test.txt', { type: 'text/plain' });
        
        const testConversationId = 'test-conversation-id';
        const uploadUrl = await uploadChatAttachment(testFile2, testConversationId);
        
        result += `✅ uploadChatAttachment successful: ${uploadUrl}\n`;
      } catch (error: any) {
        result += `❌ uploadChatAttachment failed: ${error.message}\n`;
        result += `   Stack: ${error.stack}\n`;
      }

    } catch (error: any) {
      result += `❌ Test failed: ${error.message}\n`;
    }

    setTestResult(result);
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-32 right-4 z-50">
        <Button 
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="bg-blue-500 text-white hover:bg-blue-600"
        >
          📎 Test Attachments
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-4 z-50 overflow-auto">
      <Card className="max-w-3xl mx-auto bg-white shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Attachment Upload Test</CardTitle>
          <div className="flex gap-2">
            <Button onClick={testAttachmentUpload} size="sm" variant="outline">
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
                <div>User ID: {user?.id || 'None'}</div>
              </div>
            </div>

            {testResult && (
              <div className="border rounded p-3 bg-gray-50">
                <h3 className="font-semibold mb-2">Test Results</h3>
                <pre className="text-xs whitespace-pre-wrap font-mono">{testResult}</pre>
              </div>
            )}

            <div className="border border-blue-200 rounded p-3 bg-blue-50">
              <h3 className="font-semibold text-blue-800 mb-2">Instructions</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <div>1. Click "Run Test" to check attachment upload functionality</div>
                <div>2. If bucket doesn't exist, run the fix_attachment_upload.sql script</div>
                <div>3. Check browser console for detailed error logs</div>
                <div>4. Try uploading a small file in chat after fixing issues</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
