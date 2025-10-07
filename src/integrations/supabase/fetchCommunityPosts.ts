import { supabase } from '@/integrations/supabase/client';

interface CommunityPost {
  id: string;
  user_id: string;
  content: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    name: string;
    avatar_url?: string;
    country_flag?: string;
  };
}

/**
 * Fetch community posts from the community_posts table
 * Note: Using community_posts table for now. The 'posts' table exists with more features
 * (reactions, comments, tags) but would require migration. Consider migrating later.
 */
export async function fetchCommunityPosts(): Promise<CommunityPost[]> {
  const { data, error } = await supabase
    .from('community_posts')
    .select(`
      *,
      profiles!community_posts_user_id_fkey (
        name,
        avatar_url,
        country_flag
      )
    `)
    .order('created_at', { ascending: false })
    .limit(50);
    
  if (error) {
    console.error('Error fetching community posts:', error);
    throw error;
  }
  
  return (data || []) as CommunityPost[];
}
