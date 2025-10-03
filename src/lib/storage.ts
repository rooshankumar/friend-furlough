import { supabase } from '@/integrations/supabase/client';

export const uploadAvatar = async (file: File, userId: string): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  return data.publicUrl;
};

export const uploadPostImage = async (file: File, userId: string): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('post_pic')
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('post_pic')
    .getPublicUrl(filePath);

  return data.publicUrl;
};

export const uploadChatAttachment = async (file: File, conversationId: string): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${conversationId}-${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('chat_attachments')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('chat_attachments')
    .getPublicUrl(filePath);

  return data.publicUrl;
};
