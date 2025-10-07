import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

interface CulturalEvent {
  id: string;
  created_by: string;
  title: string;
  description?: string;
  event_type: string;
  country_code?: string;
  language?: string;
  location?: string;
  is_virtual: boolean;
  virtual_link?: string;
  event_date: string;
  duration_minutes: number;
  max_participants?: number;
  tags?: string[];
  image_url?: string;
  created_at: string;
  updated_at: string;
  rsvp_count?: number;
  user_rsvp?: 'going' | 'maybe' | 'not-going' | null;
}

interface EventsState {
  events: CulturalEvent[];
  isLoading: boolean;
  
  // Actions
  loadEvents: () => Promise<void>;
  createEvent: (event: Partial<CulturalEvent>) => Promise<void>;
  rsvpToEvent: (eventId: string, status: 'going' | 'maybe' | 'not-going') => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
}

export const useEventsStore = create<EventsState>((set, get) => ({
  events: [],
  isLoading: false,
  
  loadEvents: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await (supabase as any)
        .from('cultural_events')
        .select(`
          *,
          event_rsvps(count)
        `)
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true });
      
      if (error) {
        console.error('Error loading events:', error);
        throw error;
      }
      
      set({ events: data || [], isLoading: false });
    } catch (error) {
      console.error('Error loading events:', error);
      set({ isLoading: false });
    }
  },
  
  createEvent: async (eventData) => {
    try {
      const { data, error } = await (supabase as any)
        .from('cultural_events')
        .insert(eventData)
        .select()
        .single();
      
      if (error) throw error;
      
      set(state => ({
        events: [data, ...state.events]
      }));
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  },
  
  rsvpToEvent: async (eventId, status) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await (supabase as any)
        .from('event_rsvps')
        .upsert({
          event_id: eventId,
          user_id: user.id,
          status
        });
      
      if (error) throw error;
      
      // Reload events to update RSVP counts
      get().loadEvents();
    } catch (error) {
      console.error('Error RSVPing to event:', error);
      throw error;
    }
  },
  
  deleteEvent: async (eventId) => {
    try {
      const { error } = await (supabase as any)
        .from('cultural_events')
        .delete()
        .eq('id', eventId);
      
      if (error) throw error;
      
      set(state => ({
        events: state.events.filter(e => e.id !== eventId)
      }));
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }
}));
