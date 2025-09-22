import { User, Post, Conversation, Message, Country, Language, CulturalInterest } from '@/types';

export const mockCountries: Country[] = [
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', region: 'South America', languages: ['Portuguese'] },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', region: 'East Asia', languages: ['Japanese'] },
  { code: 'FR', name: 'France', flag: '🇫🇷', region: 'Europe', languages: ['French'] },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', region: 'Europe', languages: ['German'] },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', region: 'Europe', languages: ['Spanish'] },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', region: 'North America', languages: ['Spanish'] },
  { code: 'IN', name: 'India', flag: '🇮🇳', region: 'South Asia', languages: ['Hindi', 'English'] },
  { code: 'CN', name: 'China', flag: '🇨🇳', region: 'East Asia', languages: ['Mandarin'] },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', region: 'East Asia', languages: ['Korean'] },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', region: 'Europe', languages: ['Italian'] },
  { code: 'RU', name: 'Russia', flag: '🇷🇺', region: 'Eastern Europe', languages: ['Russian'] },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', region: 'South America', languages: ['Spanish'] },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', region: 'Western Asia', languages: ['Turkish'] },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', region: 'North Africa', languages: ['Arabic'] },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', region: 'West Africa', languages: ['English', 'Yoruba', 'Igbo'] },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', region: 'Southeast Asia', languages: ['Thai'] },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳', region: 'Southeast Asia', languages: ['Vietnamese'] },
  { code: 'PL', name: 'Poland', flag: '🇵🇱', region: 'Europe', languages: ['Polish'] },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', region: 'Europe', languages: ['Dutch'] },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', region: 'Europe', languages: ['Swedish'] },
];

export const mockLanguages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
];

export const mockCulturalInterests: CulturalInterest[] = [
  { id: 'food', name: 'Food & Cuisine', icon: '🍜', category: 'food' },
  { id: 'music', name: 'Music', icon: '🎵', category: 'music' },
  { id: 'festivals', name: 'Festivals', icon: '🎉', category: 'festivals' },
  { id: 'traditions', name: 'Traditions', icon: '🏮', category: 'traditions' },
  { id: 'travel', name: 'Travel', icon: '✈️', category: 'travel' },
  { id: 'art', name: 'Art & Crafts', icon: '🎨', category: 'art' },
  { id: 'sports', name: 'Sports', icon: '⚽', category: 'sports' },
  { id: 'literature', name: 'Literature', icon: '📚', category: 'literature' },
  { id: 'dance', name: 'Dance', icon: '💃', category: 'traditions' },
  { id: 'cinema', name: 'Cinema', icon: '🎬', category: 'art' },
  { id: 'photography', name: 'Photography', icon: '📸', category: 'art' },
  { id: 'history', name: 'History', icon: '🏛️', category: 'traditions' },
  { id: 'fashion', name: 'Fashion', icon: '👘', category: 'art' },
  { id: 'nature', name: 'Nature', icon: '🌸', category: 'travel' },
  { id: 'architecture', name: 'Architecture', icon: '🏯', category: 'art' },
];

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Maria Santos',
    email: 'maria@example.com',
    country: 'Brazil',
    countryCode: 'BR',
    countryFlag: '🇧🇷',
    city: 'São Paulo',
    nativeLanguages: ['Portuguese'],
    learningLanguages: ['English', 'Spanish'],
    culturalInterests: ['music', 'food', 'festivals', 'dance'],
    bio: 'Love sharing Brazilian culture and learning about others! Passionate about samba and cooking traditional dishes.',
    age: 25,
    online: true,
    joinedDate: '2024-01-15',
    languageGoals: ['Business English', 'Travel Spanish'],
    lookingFor: ['Language exchange', 'Cultural friends'],
    teachingExperience: true,
    countriesVisited: ['Argentina', 'Uruguay', 'Chile']
  },
  {
    id: '2',
    name: 'Hiroshi Tanaka',
    email: 'hiroshi@example.com',
    country: 'Japan',
    countryCode: 'JP',
    countryFlag: '🇯🇵',
    city: 'Tokyo',
    nativeLanguages: ['Japanese'],
    learningLanguages: ['English', 'Portuguese'],
    culturalInterests: ['traditions', 'art', 'photography', 'nature'],
    bio: 'Tea ceremony enthusiast sharing Japanese culture. Love helping others learn Japanese while exploring world cultures.',
    age: 28,
    online: false,
    lastSeen: '2 hours ago',
    joinedDate: '2024-02-10',
    languageGoals: ['Academic English', 'Brazilian Portuguese'],
    lookingFor: ['Language practice', 'Cultural exchange'],
    teachingExperience: true,
    countriesVisited: ['South Korea', 'Taiwan', 'Thailand']
  },
  {
    id: '3',
    name: 'Sophie Laurent',
    email: 'sophie@example.com',
    country: 'France',
    countryCode: 'FR',
    countryFlag: '🇫🇷',
    city: 'Lyon',
    nativeLanguages: ['French'],
    learningLanguages: ['Japanese', 'Korean'],
    culturalInterests: ['food', 'art', 'photography', 'travel'],
    bio: 'French chef passionate about Asian cultures. Love sharing French cooking secrets and learning new culinary traditions.',
    age: 30,
    online: true,
    joinedDate: '2024-01-20',
    languageGoals: ['Conversational Japanese', 'K-pop Korean'],
    lookingFor: ['Cultural friends', 'Cooking exchange'],
    teachingExperience: false,
    countriesVisited: ['Italy', 'Spain', 'Belgium', 'Japan']
  },
  {
    id: '4',
    name: 'Ahmed Al-Rashid',
    email: 'ahmed@example.com',
    country: 'UAE',
    countryCode: 'AE',
    countryFlag: '🇦🇪',
    city: 'Dubai',
    nativeLanguages: ['Arabic'],
    learningLanguages: ['German', 'Italian'],
    culturalInterests: ['architecture', 'traditions', 'travel', 'history'],
    bio: 'Sharing Middle Eastern hospitality and business culture. Passionate about architecture and cultural bridges.',
    age: 32,
    online: true,
    joinedDate: '2024-03-01',
    languageGoals: ['Business German', 'Travel Italian'],
    lookingFor: ['Professional network', 'Cultural exchange'],
    teachingExperience: true,
    countriesVisited: ['Germany', 'Italy', 'Turkey', 'Egypt']
  },
  {
    id: '5',
    name: 'Priya Sharma',
    email: 'priya@example.com',
    country: 'India',
    countryCode: 'IN',
    countryFlag: '🇮🇳',
    city: 'Mumbai',
    nativeLanguages: ['Hindi', 'English'],
    learningLanguages: ['French', 'Portuguese'],
    culturalInterests: ['dance', 'music', 'festivals', 'cinema'],
    bio: 'Bollywood choreographer excited to share Indian festivals and learn about Latin cultures. Love connecting through dance!',
    age: 26,
    online: false,
    lastSeen: '1 day ago',
    joinedDate: '2024-02-28',
    languageGoals: ['French cinema', 'Brazilian Portuguese'],
    lookingFor: ['Art collaboration', 'Cultural exchange'],
    teachingExperience: true,
    countriesVisited: ['Nepal', 'Sri Lanka', 'Thailand']
  }
];

export const mockMessages: Message[] = [
  {
    id: '1',
    conversationId: '1',
    senderId: '2',
    content: 'こんにちは! How do you celebrate New Year in Brazil?',
    timestamp: '2025-01-15T10:30:00Z',
    type: 'text',
    language: 'japanese',
    translation: 'Hello! How do you celebrate New Year in Brazil?',
    readBy: ['1'],
    reactions: [{ userId: '1', emoji: '🌍', timestamp: '2025-01-15T10:35:00Z' }]
  },
  {
    id: '2',
    conversationId: '1',
    senderId: '1',
    content: 'Olá! We have big parties on Copacabana beach with fireworks! What about Japan?',
    timestamp: '2025-01-15T10:35:00Z',
    type: 'text',
    language: 'portuguese',
    readBy: []
  }
];

export const mockConversations: Conversation[] = [
  {
    id: '1',
    participants: ['1', '2'],
    lastMessage: mockMessages[1],
    unreadCount: 1,
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-15T10:35:00Z',
    language: 'mixed',
    isLanguageExchange: true
  }
];

export const mockPosts: Post[] = [
  {
    id: '1',
    authorId: '1',
    content: 'Celebrating Festa Junina with traditional quadrilha dance! 🇧🇷 Anyone familiar with similar harvest festivals in their culture?',
    images: [],
    type: 'cultural-moment',
    culturalTags: ['brazil', 'festival', 'dance'],
    languageTags: ['portuguese'],
    location: 'São Paulo, Brazil',
    timestamp: '2025-01-15T14:00:00Z',
    reactions: [
      { userId: '2', type: 'appreciate', timestamp: '2025-01-15T14:05:00Z' },
      { userId: '3', type: 'learn', timestamp: '2025-01-15T14:10:00Z' }
    ],
    comments: [
      {
        id: '1',
        postId: '1',
        authorId: '2',
        content: 'In Japan we have Obon festival for honoring ancestors! Very different but equally meaningful.',
        timestamp: '2025-01-15T14:15:00Z',
        reactions: [{ userId: '1', type: 'love', timestamp: '2025-01-15T14:20:00Z' }]
      }
    ],
    shareCount: 3,
    savedBy: ['2', '3']
  }
];