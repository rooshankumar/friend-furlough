import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  ArrowLeft, 
  Globe, 
  MessageCircle, 
  Users, 
  UserPlus,
  Settings,
  Shield,
  Heart,
  CheckCircle,
  X
} from 'lucide-react';

interface AppFlowStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  image?: string;
  tips: string[];
}

const AppFlowGuide = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const flowSteps: AppFlowStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to RoshLingua!',
      description: 'Your journey to cultural exchange and language learning starts here.',
      icon: <Globe className="h-8 w-8 text-primary" />,
      tips: [
        'Connect with people from 195+ countries',
        'Practice 50+ languages with native speakers',
        'Share your culture and learn about others',
        'Build meaningful international friendships'
      ]
    },
    {
      id: 'profile',
      title: 'Create Your Profile',
      description: 'Tell the world about yourself, your culture, and what you want to learn.',
      icon: <UserPlus className="h-8 w-8 text-blue-600" />,
      tips: [
        'Add a friendly profile photo',
        'Share your cultural background',
        'List languages you speak and want to learn',
        'Describe your interests and hobbies'
      ]
    },
    {
      id: 'explore',
      title: 'Discover Language Partners',
      description: 'Browse and connect with people who share your learning goals.',
      icon: <Users className="h-8 w-8 text-green-600" />,
      tips: [
        'Use filters to find compatible partners',
        'Check online status for instant connections',
        'Read profiles to find common interests',
        'Send friendly introduction messages'
      ]
    },
    {
      id: 'chat',
      title: 'Start Conversations',
      description: 'Practice languages and share cultures through meaningful conversations.',
      icon: <MessageCircle className="h-8 w-8 text-purple-600" />,
      tips: [
        'Start with simple greetings in their language',
        'Share photos of your culture and city',
        'Ask about their traditions and customs',
        'Be patient and helpful with language learning'
      ]
    },
    {
      id: 'community',
      title: 'Join the Community',
      description: 'Participate in cultural events and share your experiences.',
      icon: <Heart className="h-8 w-8 text-red-600" />,
      tips: [
        'Share cultural photos and stories',
        'Join language learning challenges',
        'Participate in cultural events',
        'Help others learn about your culture'
      ]
    },
    {
      id: 'safety',
      title: 'Stay Safe & Respectful',
      description: 'Our community thrives on respect, kindness, and cultural understanding.',
      icon: <Shield className="h-8 w-8 text-orange-600" />,
      tips: [
        'Always be respectful and kind',
        'Report inappropriate behavior',
        'Keep personal information private',
        'Focus on learning and cultural exchange'
      ]
    }
  ];

  const handleNext = () => {
    if (currentStep < flowSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('app-flow-guide-completed', 'true');
  };

  const handleSkip = () => {
    setIsVisible(false);
    localStorage.setItem('app-flow-guide-skipped', 'true');
  };

  // Don't show if user has already seen it
  React.useEffect(() => {
    const completed = localStorage.getItem('app-flow-guide-completed');
    const skipped = localStorage.getItem('app-flow-guide-skipped');
    if (completed || skipped) {
      setIsVisible(false);
    }
  }, []);

  if (!isVisible) return null;

  const currentStepData = flowSteps[currentStep];
  const isLastStep = currentStep === flowSteps.length - 1;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              {currentStepData.icon}
            </div>
            <div>
              <h2 className="text-xl font-bold">{currentStepData.title}</h2>
              <p className="text-sm text-gray-600">
                Step {currentStep + 1} of {flowSteps.length}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / flowSteps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div>
            <p className="text-gray-700 text-lg leading-relaxed">
              {currentStepData.description}
            </p>
          </div>

          {/* Tips */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              Key Tips:
            </h3>
            <ul className="space-y-2">
              {currentStepData.tips.map((tip, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span className="text-gray-700">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Step Indicators */}
          <div className="flex justify-center space-x-2">
            {flowSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentStep 
                    ? 'bg-primary' 
                    : index < currentStep 
                      ? 'bg-green-500' 
                      : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="flex space-x-2">
            <Button variant="ghost" onClick={handleSkip}>
              Skip Guide
            </Button>
            {currentStep > 0 && (
              <Button variant="outline" onClick={handlePrevious}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
            )}
          </div>

          <div className="flex space-x-2">
            {!isLastStep ? (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleClose} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Get Started!
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppFlowGuide;
