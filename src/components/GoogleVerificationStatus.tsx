import React from 'react';
import { CheckCircle, AlertCircle, Mail, Globe, Shield, FileText, Users, Star } from 'lucide-react';

interface VerificationItem {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'pending' | 'not-applicable';
  icon: React.ReactNode;
  url?: string;
}

const GoogleVerificationStatus = () => {
  const verificationItems: VerificationItem[] = [
    {
      id: 'homepage',
      title: 'Professional Homepage',
      description: 'Clear app description, features, and branding',
      status: 'completed',
      icon: <Globe className="h-5 w-5" />,
      url: '/'
    },
    {
      id: 'privacy-policy',
      title: 'Privacy Policy',
      description: 'Comprehensive privacy policy covering data collection and usage',
      status: 'completed',
      icon: <Shield className="h-5 w-5" />,
      url: '/privacy-policy'
    },
    {
      id: 'terms-of-service',
      title: 'Terms of Service',
      description: 'Clear terms of service and user agreements',
      status: 'completed',
      icon: <FileText className="h-5 w-5" />,
      url: '/terms-of-service'
    },
    {
      id: 'contact-info',
      title: 'Contact Information',
      description: 'Valid contact email and support information',
      status: 'completed',
      icon: <Mail className="h-5 w-5" />,
      url: 'mailto:roshlingua@gmail.com'
    },
    {
      id: 'app-functionality',
      title: 'Core App Functionality',
      description: 'Working chat, user profiles, and cultural exchange features',
      status: 'completed',
      icon: <Users className="h-5 w-5" />,
      url: '/explore'
    },
    {
      id: 'content-moderation',
      title: 'Content Moderation',
      description: 'AI-powered safety features and community guidelines',
      status: 'completed',
      icon: <Shield className="h-5 w-5" />,
      url: '/community-guidelines'
    },
    {
      id: 'user-experience',
      title: 'User Experience',
      description: 'Intuitive navigation, onboarding, and mobile optimization',
      status: 'completed',
      icon: <Star className="h-5 w-5" />
    },
    {
      id: 'oauth-integration',
      title: 'Google OAuth Integration',
      description: 'Secure Google Sign-In implementation',
      status: 'completed',
      icon: <CheckCircle className="h-5 w-5" />
    }
  ];

  const completedItems = verificationItems.filter(item => item.status === 'completed').length;
  const totalItems = verificationItems.length;
  const completionPercentage = Math.round((completedItems / totalItems) * 100);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'pending':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Google Verification Status</h1>
        <p className="text-gray-600 mb-6">
          RoshLingua is ready for Google verification and Play Store submission
        </p>
        
        {/* Progress */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-semibold">Verification Progress</span>
            <span className="text-2xl font-bold text-green-600">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-green-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {completedItems} of {totalItems} requirements completed
          </p>
        </div>
      </div>

      {/* Verification Items */}
      <div className="grid gap-4">
        {verificationItems.map((item) => (
          <div
            key={item.id}
            className={`p-6 rounded-lg border ${getStatusColor(item.status)} transition-all hover:shadow-md`}
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 p-2 bg-white rounded-lg">
                {item.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  {getStatusIcon(item.status)}
                </div>
                <p className="text-gray-600 mt-1">{item.description}</p>
                {item.url && (
                  <a
                    href={item.url}
                    target={item.url.startsWith('http') ? '_blank' : '_self'}
                    rel={item.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="inline-flex items-center mt-3 text-primary hover:underline"
                  >
                    View Details
                    <Globe className="h-4 w-4 ml-1" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <h2 className="text-xl font-semibold text-green-800">Ready for Verification!</h2>
        </div>
        <p className="text-green-700 mb-4">
          RoshLingua meets all Google verification requirements and is ready for:
        </p>
        <ul className="list-disc list-inside space-y-2 text-green-700">
          <li>Google OAuth verification and approval</li>
          <li>Google Play Store submission</li>
          <li>Production deployment</li>
          <li>Public release</li>
        </ul>
        
        <div className="mt-6 p-4 bg-white rounded-lg">
          <h3 className="font-semibold mb-2">Contact Information:</h3>
          <p className="text-gray-700">
            <strong>Developer Email:</strong> roshlingua@gmail.com<br />
            <strong>App Name:</strong> RoshLingua<br />
            <strong>Category:</strong> Social & Communication<br />
            <strong>Target Audience:</strong> Language learners and cultural exchange enthusiasts
          </p>
        </div>
      </div>
    </div>
  );
};

export default GoogleVerificationStatus;
