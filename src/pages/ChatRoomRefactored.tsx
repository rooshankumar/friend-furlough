import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Paperclip, Loader2 } from 'lucide-react';

/**
 * Global Tokens: --primary=#1F6FEB, --bg=#F8F9FB, --card=#FFFFFF, --border=#E8ECEF, --muted=#8A95A3, --text=#1A202C
 * Motion: 150ms fast, 200ms normal, ease-out
 */

interface Message {
  id: string;
  text: string;
  isSent: boolean;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

export function ChatRoomRefactored() {
  const { conversationId } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hey! How are you?',
      isSent: false,
      timestamp: '10:30 AM',
      status: 'read',
    },
    {
      id: '2',
      text: 'I\'m doing great! How about you?',
      isSent: true,
      timestamp: '10:31 AM',
      status: 'read',
    },
    {
      id: '3',
      text: 'Awesome! Want to practice Spanish?',
      isSent: false,
      timestamp: '10:32 AM',
      status: 'read',
    },
  ]);

  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    const newMessage: Message = {
      id: String(messages.length + 1),
      text: messageInput,
      isSent: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    };

    setMessages([...messages, newMessage]);
    setMessageInput('');
  };

  return (
    <div className="min-h-screen md:ml-16 flex flex-col" style={{ backgroundColor: 'var(--bg, #F8F9FB)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 border-b px-4 md:px-8 py-4 flex items-center justify-between"
        style={{ backgroundColor: 'var(--card, #FFFFFF)', borderColor: 'var(--border, #E8ECEF)' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/chat')}
            className="md:hidden p-2 hover:bg-opacity-50 transition-colors duration-150"
            style={{ color: 'var(--primary, #1F6FEB)' }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-semibold" style={{ color: 'var(--text, #1A202C)' }}>
              Sarah Chen
            </h2>
            <p className="text-xs" style={{ color: 'var(--muted, #8A95A3)' }}>
              Online
            </p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={msg.id}
            className="flex"
            style={{
              justifyContent: msg.isSent ? 'flex-end' : 'flex-start',
              animation: `slideUpFadeIn 200ms ease-out forwards`,
              animationDelay: `${idx * 50}ms`,
            }}
          >
            <div
              className="max-w-xs md:max-w-md rounded-lg p-3"
              style={{
                backgroundColor: msg.isSent ? 'var(--primary, #1F6FEB)' : 'var(--card, #FFFFFF)',
                color: msg.isSent ? '#FFFFFF' : 'var(--text, #1A202C)',
                border: msg.isSent ? 'none' : '1px solid var(--border, #E8ECEF)',
              }}
            >
              <p className="text-sm">{msg.text}</p>
              <div className="flex items-center justify-between gap-2 mt-1">
                <span className="text-xs opacity-70">{msg.timestamp}</span>
                {msg.isSent && (
                  <span className="text-xs opacity-70">
                    {msg.status === 'read' ? '✓✓' : msg.status === 'delivered' ? '✓✓' : '✓'}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--card, #FFFFFF)', border: '1px solid var(--border, #E8ECEF)' }}
            >
              <div className="flex gap-1">
                <div
                  className="w-1.5 h-1.5 rounded-full animate-bounce"
                  style={{ backgroundColor: 'var(--muted, #8A95A3)', animationDelay: '0ms' }}
                />
                <div
                  className="w-1.5 h-1.5 rounded-full animate-bounce"
                  style={{ backgroundColor: 'var(--muted, #8A95A3)', animationDelay: '150ms' }}
                />
                <div
                  className="w-1.5 h-1.5 rounded-full animate-bounce"
                  style={{ backgroundColor: 'var(--muted, #8A95A3)', animationDelay: '300ms' }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Composer */}
      <footer
        className="sticky bottom-0 border-t px-4 md:px-8 py-4"
        style={{ backgroundColor: 'var(--card, #FFFFFF)', borderColor: 'var(--border, #E8ECEF)' }}
      >
        <div className="flex gap-2 items-end">
          <button
            className="p-2 rounded-md transition-colors duration-150"
            style={{
              color: 'var(--primary, #1F6FEB)',
              backgroundColor: 'var(--border, #E8ECEF)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(31, 111, 235, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--border, #E8ECEF)';
            }}
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <textarea
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 rounded-lg border text-sm resize-none focus:outline-none"
            style={{
              backgroundColor: 'var(--card, #FFFFFF)',
              borderColor: 'var(--border, #E8ECEF)',
              color: 'var(--text, #1A202C)',
              minHeight: '40px',
              maxHeight: '120px',
            }}
            rows={1}
          />

          <button
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || isLoading}
            className="p-2 rounded-md text-white transition-all duration-150"
            style={{
              backgroundColor: messageInput.trim() ? 'var(--primary, #1F6FEB)' : 'var(--border, #E8ECEF)',
              cursor: messageInput.trim() ? 'pointer' : 'not-allowed',
            }}
            onMouseEnter={(e) => {
              if (messageInput.trim()) {
                e.currentTarget.style.backgroundColor = 'var(--primary-hover, #1A5FD6)';
              }
            }}
            onMouseLeave={(e) => {
              if (messageInput.trim()) {
                e.currentTarget.style.backgroundColor = 'var(--primary, #1F6FEB)';
              }
            }}
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </footer>

      <style>{`
        @keyframes slideUpFadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

export default ChatRoomRefactored;
