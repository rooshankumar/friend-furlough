import { supabase } from './client';
import { User } from '@/types';

export const fetchProfileById = async (id: string): Promise<User | null> => {
  try {
    console.log('Fetching profile for ID:', id);
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
      
    if (profileError) {
      console.error('Error fetching profile:', profileError);
      throw profileError;
    }
    
    if (!profile) {
      console.log('No profile found for ID:', id);
      return null;
    }

    console.log('Fetched profile data:', profile);

    // Map only the fields that exist in the database, use empty defaults for others
    const user: User = {
      id: profile.id,
      name: profile.name || '',
      email: '', // We'll need to get this from auth.user
      country: profile.country || '',
      countryCode: profile.country_code || '',
      countryFlag: profile.country_flag || '',
      bio: profile.bio || '',
      age: profile.age || 0,
      profilePhoto: profile.avatar_url || undefined,
      online: profile.online || false,
      lastSeen: profile.last_seen || '',
      joinedDate: profile.created_at || '',
      // Fields that don't exist in the database yet - use empty defaults
      city: '',
      nativeLanguages: [],
      learningLanguages: [],
      culturalInterests: [],
      languageGoals: [],
      lookingFor: [],
      teachingExperience: false,
      countriesVisited: [],
      posts: []
    };

    console.log('Mapped user data:', user);
    return user;
  } catch (error) {
    console.error('Error in fetchProfileById:', error);
    throw error;
  }
};