export interface User {
  id: string;
  name: string;
  email: string;
  country: string;
  countryCode: string;
  countryFlag: string;
  city?: string;
  nativeLanguages: string[];
  learningLanguages: string[];
  culturalInterests: string[];
  bio: string;
  age: number;
  profilePhoto?: string;
  online: boolean;
  lastSeen?: string;
  joinedDate: string;
  languageGoals?: string[];
  lookingFor?: string[];
  teachingExperience?: boolean;
  countriesVisited?: string[];
  posts?: any[]; // Add posts array
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: string;
  type: 'text' | 'voice' | 'image' | 'cultural-context';
  language?: string;
  translation?: string;
  readBy: string[];
  reactions?: MessageReaction[];
}

export interface MessageReaction {
  userId: string;
  emoji: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  language?: string;
  isLanguageExchange: boolean;
}

export interface Post {
  id: string;
  authorId: string;
  content: string;
  images?: string[];
  type: 'cultural-moment' | 'language-progress' | 'cultural-question' | 'photo-story' | 'language-exchange';
  culturalTags: string[];
  languageTags: string[];
  location?: string;
  timestamp: string;
  reactions: PostReaction[];
  comments: Comment[];
  shareCount: number;
  savedBy: string[];
}

export interface PostReaction {
  userId: string;
  type: 'appreciate' | 'learn' | 'support' | 'love';
  timestamp: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  timestamp: string;
  replies?: Comment[];
  reactions: PostReaction[];
}

export interface CulturalInterest {
  id: string;
  name: string;
  icon: string;
  category: 'food' | 'music' | 'traditions' | 'travel' | 'art' | 'festivals' | 'sports' | 'literature';
}

export interface Country {
  code: string;
  name: string;
  flag: string;
  region: string;
  languages?: string[];
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag?: string;
}

export interface LanguageProficiency {
  language: string;
  level: 'native' | 'fluent' | 'intermediate' | 'beginner' | 'learning';
}

export interface Notification {
  id: string;
  userId: string;
  type: 'message' | 'cultural-match' | 'post-reaction' | 'comment' | 'cultural-event';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  timestamp: string;
}

export interface CulturalEvent {
  id: string;
  name: string;
  country: string;
  date: string;
  description: string;
  type: 'holiday' | 'festival' | 'tradition';
}