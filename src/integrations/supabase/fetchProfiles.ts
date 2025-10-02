import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';

export async function fetchProfiles(): Promise<User[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('online', { ascending: false })
    .order('last_seen', { ascending: false });
  if (error) throw error;
  // Map DB fields to User type as needed
  return (data || []).map((profile: any) => ({
    id: profile.id,
    name: profile.name,
    email: '', // Not exposed in profiles table
    country: profile.country || '',
    countryCode: profile.country_code || '',
    countryFlag: profile.country_flag || '',
    city: '', // Not in DB
    nativeLanguages: [], // To be fetched separately
    learningLanguages: [], // To be fetched separately
    culturalInterests: [], // To be fetched separately
    bio: profile.bio || '',
    age: profile.age || 0,
    profilePhoto: profile.avatar_url || '',
    online: profile.online || false,
    lastSeen: profile.last_seen || '',
    joinedDate: profile.created_at || '',
    languageGoals: [], // Not in DB
    lookingFor: [], // Not in DB
    teachingExperience: false, // Not in DB
    countriesVisited: [], // Not in DB
  }));
}
