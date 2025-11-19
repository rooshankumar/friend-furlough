import { useState } from 'react';
import { MessageCircle, Flag, Edit2 } from 'lucide-react';

/**
 * Global Tokens: --primary=#1F6FEB, --bg=#F8F9FB, --card=#FFFFFF, --border=#E8ECEF, --muted=#8A95A3, --text=#1A202C
 * Motion: 150ms fast, 200ms normal, ease-out
 */

export function ProfileRefactored() {
  const [isOwnProfile] = useState(true);

  return (
    <div className="min-h-screen md:ml-16 pb-16 md:pb-0" style={{ backgroundColor: 'var(--bg, #F8F9FB)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 border-b px-4 md:px-8 py-4"
        style={{ backgroundColor: 'var(--card, #FFFFFF)', borderColor: 'var(--border, #E8ECEF)' }}
      >
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text, #1A202C)' }}>
          Profile
        </h1>
      </header>

      {/* Content */}
      <main className="px-4 md:px-8 py-6 max-w-2xl mx-auto">
        {/* Avatar & Info */}
        <div className="text-center mb-8">
          <img
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"
            alt="Profile"
            className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
          />
          <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text, #1A202C)' }}>
            Sarah Chen
          </h2>
          <p className="text-sm mb-4" style={{ color: 'var(--muted, #8A95A3)' }}>
            🇺🇸 USA • 24 years old
          </p>
          <p className="text-sm mb-6" style={{ color: 'var(--muted, #8A95A3)' }}>
            Learning Spanish, native English speaker. Love traveling and meeting new people!
          </p>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            {isOwnProfile ? (
              <button
                className="px-6 py-2 rounded-md font-semibold text-sm text-white transition-all duration-150"
                style={{ backgroundColor: 'var(--primary, #1F6FEB)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--primary-hover, #1A5FD6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--primary, #1F6FEB)';
                }}
              >
                <Edit2 className="w-4 h-4 inline mr-2" />
                Edit Profile
              </button>
            ) : (
              <>
                <button
                  className="px-6 py-2 rounded-md font-semibold text-sm text-white transition-all duration-150"
                  style={{ backgroundColor: 'var(--primary, #1F6FEB)' }}
                >
                  <MessageCircle className="w-4 h-4 inline mr-2" />
                  Message
                </button>
                <button
                  className="px-6 py-2 rounded-md font-semibold text-sm border transition-all duration-150"
                  style={{
                    borderColor: 'var(--error, #D32F2F)',
                    color: 'var(--error, #D32F2F)',
                  }}
                >
                  <Flag className="w-4 h-4 inline mr-2" />
                  Report
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Connections', value: '42' },
            { label: 'Messages', value: '156' },
            { label: 'Posts', value: '18' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border p-4 text-center"
              style={{
                backgroundColor: 'var(--card, #FFFFFF)',
                borderColor: 'var(--border, #E8ECEF)',
              }}
            >
              <p className="text-2xl font-bold" style={{ color: 'var(--primary, #1F6FEB)' }}>
                {stat.value}
              </p>
              <p className="text-xs" style={{ color: 'var(--muted, #8A95A3)' }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Languages */}
        <div
          className="rounded-lg border p-4 mb-6"
          style={{
            backgroundColor: 'var(--card, #FFFFFF)',
            borderColor: 'var(--border, #E8ECEF)',
          }}
        >
          <h3 className="font-semibold mb-3" style={{ color: 'var(--text, #1A202C)' }}>
            Languages
          </h3>
          <div className="flex flex-wrap gap-2">
            {['English (Native)', 'Spanish (Learning)', 'French (Basic)'].map((lang) => (
              <span
                key={lang}
                className="px-3 py-1 rounded-full text-sm"
                style={{
                  backgroundColor: 'var(--primary, #1F6FEB)',
                  color: '#FFFFFF',
                }}
              >
                {lang}
              </span>
            ))}
          </div>
        </div>

        {/* Interests */}
        <div
          className="rounded-lg border p-4"
          style={{
            backgroundColor: 'var(--card, #FFFFFF)',
            borderColor: 'var(--border, #E8ECEF)',
          }}
        >
          <h3 className="font-semibold mb-3" style={{ color: 'var(--text, #1A202C)' }}>
            Interests
          </h3>
          <div className="flex flex-wrap gap-2">
            {['Travel', 'Culture', 'Food', 'Music', 'Art'].map((interest) => (
              <span
                key={interest}
                className="px-3 py-1 rounded-full text-sm border"
                style={{
                  borderColor: 'var(--border, #E8ECEF)',
                  color: 'var(--text, #1A202C)',
                }}
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default ProfileRefactored;
