import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';

export async function fetchProfiles(): Promise<User[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      languages(*),
      cultural_interests(*)
    `)
    .order('online', { ascending: false })
    .order('last_seen', { ascending: false });
    
  if (error) {
    console.error('Error fetching profiles:', error);
    throw error;
  }
  
  // Map DB fields to User type with joined data
  return (data || []).map((profile: any) => {
    // Extract native and learning languages from joined data
    const nativeLanguages = (profile.languages || [])
      .filter((lang: any) => lang.is_native)
      .map((lang: any) => lang.language_name);
    
    const learningLanguages = (profile.languages || [])
      .filter((lang: any) => lang.is_learning)
      .map((lang: any) => lang.language_name);
    
    // Extract cultural interests from joined data
    const culturalInterests = (profile.cultural_interests || [])
      .map((interest: any) => interest.interest);
    
    return {
      id: profile.id,
      name: profile.name,
      email: '', // Not exposed in profiles table for privacy
      country: profile.country || '',
      countryCode: profile.country_code || '',
      countryFlag: profile.country_flag || '',
      city: profile.city || '',
      nativeLanguages,
      learningLanguages,
      culturalInterests,
      bio: profile.bio || '',
      age: profile.age || 0,
      gender: profile.gender,
      profilePhoto: profile.avatar_url || '',
      avatar_url: profile.avatar_url || '',
      online: profile.online || false,
      lastSeen: profile.last_seen || '',
      joinedDate: profile.created_at || '',
      languageGoals: profile.language_goals || [],
      lookingFor: profile.looking_for || [],
      teachingExperience: profile.teaching_experience || false,
      countriesVisited: profile.countries_visited || [],
    };
  });
}
