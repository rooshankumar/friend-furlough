-- Create Cultural Events table
-- Issue #12: Cultural Events Feature

CREATE TABLE IF NOT EXISTS public.cultural_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL, -- 'cultural-celebration', 'language-meetup', 'cooking-class', etc.
  country_code TEXT, -- ISO country code
  language TEXT, -- Primary language of event
  location TEXT, -- Physical or virtual location
  is_virtual BOOLEAN DEFAULT false,
  virtual_link TEXT, -- Zoom, Meet, etc.
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  max_participants INTEGER,
  tags TEXT[], -- Array of tags
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create RSVPs table
CREATE TABLE IF NOT EXISTS public.event_rsvps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.cultural_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'going', -- 'going', 'maybe', 'not-going'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.cultural_events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.cultural_events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_country ON public.cultural_events(country_code);
CREATE INDEX IF NOT EXISTS idx_events_type ON public.cultural_events(event_type);
CREATE INDEX IF NOT EXISTS idx_rsvps_event ON public.event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_user ON public.event_rsvps(user_id);

-- RLS Policies
ALTER TABLE public.cultural_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

-- Everyone can read events
CREATE POLICY "Events are viewable by everyone" ON public.cultural_events
  FOR SELECT USING (true);

-- Only event creators can update/delete their events
CREATE POLICY "Users can update own events" ON public.cultural_events
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own events" ON public.cultural_events
  FOR DELETE USING (auth.uid() = created_by);

-- Authenticated users can create events
CREATE POLICY "Authenticated users can create events" ON public.cultural_events
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- RSVP policies
CREATE POLICY "Everyone can view RSVPs" ON public.event_rsvps
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their RSVPs" ON public.event_rsvps
  FOR ALL USING (auth.uid() = user_id);

-- Add comments
COMMENT ON TABLE public.cultural_events IS 'Cultural events and language meetups';
COMMENT ON TABLE public.event_rsvps IS 'Event RSVP tracking';
