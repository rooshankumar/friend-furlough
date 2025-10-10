import React from 'react';
import { MessageCircle, Globe, Users, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface EmptyStateProps {
  otherParticipant?: {
    profiles?: {
      name?: string;
      country?: string;
      country_flag?: string;
    };
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ otherParticipant }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 relative z-10">
      <div className="mb-6 relative">
        {/* Animated Message Icon */}
        <div className="relative">
          <MessageCircle className="h-16 w-16 text-primary/60 animate-pulse" />
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center animate-bounce">
            <Heart className="h-3 w-3 text-white" />
          </div>
        </div>
      </div>

      <h3 className="text-xl font-semibold text-foreground mb-2">
        {otherParticipant?.profiles?.name 
          ? `Start chatting with ${otherParticipant.profiles.name}!`
          : 'Start your conversation!'
        }
      </h3>
      
      <p className="text-muted-foreground mb-6 max-w-md">
        {otherParticipant?.profiles?.country 
          ? `Connect with ${otherParticipant.profiles.name} from ${otherParticipant.profiles.country_flag} ${otherParticipant.profiles.country} and share your cultures!`
          : 'Share languages, cultures, and make new friends from around the world.'
        }
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          onClick={() => {
            // Get a random greeting
            const greetings = [
              "Hello! 👋",
              "Hi there! 😊", 
              "Hey! How are you?",
              "Greetings! 🌟",
              "Hello from my country! 🌍"
            ];
            const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
            
            // Find the message input and set the greeting
            const messageInput = document.querySelector('input[placeholder="Type a message..."]') as HTMLInputElement;
            if (messageInput) {
              messageInput.value = randomGreeting;
              messageInput.focus();
              // Trigger change event
              const event = new Event('input', { bubbles: true });
              messageInput.dispatchEvent(event);
            }
          }}
          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
        >
          <Globe className="h-4 w-4 mr-2" />
          Say Hello
        </Button>
        
        <Button 
          variant="outline"
          onClick={() => navigate('/explore')}
        >
          <Users className="h-4 w-4 mr-2" />
          Find More Friends
        </Button>
      </div>

      {/* Fun cultural tips */}
      <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-100 max-w-md">
        <p className="text-sm text-blue-700 font-medium mb-1">💡 Cultural Tip</p>
        <p className="text-xs text-blue-600">
          Start with "Hello" in their language! It's a great way to show respect and interest in their culture.
        </p>
      </div>
    </div>
  );
};

export default EmptyState;
