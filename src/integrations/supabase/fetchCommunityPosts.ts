import { supabase } from '@/integrations/supabase/client';
import { Post } from '@/types';

// @ts-ignore: 'posts' table may not be in generated types, but exists in DB
export async function fetchCommunityPosts(): Promise<Post[]> {
  // Use any to bypass type error if posts is not in generated types
  const { data, error } = await (supabase as any)
    .from('posts')
    .select('*')
    .order('timestamp', { ascending: false });
  if (error) throw error;
  return (data || []) as Post[];
}
