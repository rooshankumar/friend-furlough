import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';

export async function fetchProfileById(userId: string): Promise<User | null> {
  try {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select(`
        *,
        languages(*),
        cultural_interests(*)
      `)
      .eq('id', userId)
      .single();
      
    if (profileError) {
      console.error("Error fetching profile:", profileError);
      throw profileError;
    }
    
    if (!profileData) {
      return null;
    }

    // Extract native and learning languages from joined data
    const nativeLanguages = (profileData.languages || [])
      .filter((lang: any) => lang.is_native)
      .map((lang: any) => lang.language_name);
    
    const learningLanguages = (profileData.languages || [])
      .filter((lang: any) => lang.is_learning)
      .map((lang: any) => lang.language_name);
    
    // Extract cultural interests from joined data
    const culturalInterests = (profileData.cultural_interests || [])
      .map((interest: any) => interest.interest);

    // Transform database profile to User type
    const user: User = {
      id: profileData.id,
      name: profileData.name,
      email: '', // Not exposed for privacy
      country: profileData.country || '',
      countryCode: profileData.country_code || '',
      countryFlag: profileData.country_flag || '',
      city: (profileData as any).city || '',
      nativeLanguages,
      learningLanguages,
      culturalInterests,
      bio: profileData.bio || '',
      age: profileData.age || 0,
      gender: (profileData as any).gender,
      profilePhoto: profileData.avatar_url || '',
      avatar_url: profileData.avatar_url || '',
      online: profileData.online || false,
      lastSeen: profileData.last_seen || '',
      joinedDate: profileData.created_at || '',
      languageGoals: (profileData as any).language_goals || [],
      lookingFor: (profileData as any).looking_for || [],
      teachingExperience: (profileData as any).teaching_experience || false,
      countriesVisited: (profileData as any).countries_visited || [],
      posts: []
    };

    console.log("Mapped user data:", user);
    return user;
  } catch (error) {
    console.error("Error in fetchProfileById:", error);
    throw error;
  }
};
