import { useEffect } from 'react';
import { useEventsStore } from '@/stores/eventsStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, MapPin, Globe, Users, Clock, Video } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function EventsPage() {
  const { events, isLoading, loadEvents, rsvpToEvent } = useEventsStore();

  useEffect(() => {
    loadEvents();
  }, []);

  const handleRSVP = async (eventId: string, status: 'going' | 'maybe' | 'not-going') => {
    try {
      await rsvpToEvent(eventId, status);
      toast.success(`RSVP updated to "${status}"!`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to RSVP. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen md:ml-16 bg-gradient-subtle pb-16 md:pb-0 overflow-auto pt-4 md:pt-0">
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-6 w-96 mb-8" />
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen md:ml-16 bg-gradient-subtle pb-16 md:pb-0 overflow-auto pt-4 md:pt-0">
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Cultural Events</h1>
          <p className="text-muted-foreground">
            Discover and join cultural celebrations, language meetups, and more
          </p>
        </div>

        {events.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No upcoming events</h3>
            <p className="text-muted-foreground mb-4">
              Check back later for exciting cultural events and language meetups!
            </p>
          </Card>
        ) : (
          <div className="grid gap-6">
            {events.map((event) => (
              <Card key={event.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2">{event.title}</CardTitle>
                      <CardDescription className="text-base">
                        {event.description}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="ml-4">
                      {event.event_type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(event.event_date), 'PPP')}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{format(new Date(event.event_date), 'p')} ({event.duration_minutes} min)</span>
                    </div>
                    
                    {event.is_virtual ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Video className="h-4 w-4" />
                        <span>Virtual Event</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location || 'Location TBA'}</span>
                      </div>
                    )}
                    
                    {event.language && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Globe className="h-4 w-4" />
                        <span>{event.language}</span>
                      </div>
                    )}
                  </div>

                  {event.tags && event.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {event.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{event.rsvp_count || 0} attending</span>
                      {event.max_participants && (
                        <span className="text-xs">
                          (max {event.max_participants})
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant={event.user_rsvp === 'going' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleRSVP(event.id, 'going')}
                      >
                        Going
                      </Button>
                      <Button
                        variant={event.user_rsvp === 'maybe' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleRSVP(event.id, 'maybe')}
                      >
                        Maybe
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
