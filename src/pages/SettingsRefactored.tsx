import { useState } from 'react';
import { ChevronRight, LogOut, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';

/**
 * Global Tokens: --primary=#1F6FEB, --bg=#F8F9FB, --card=#FFFFFF, --border=#E8ECEF, --muted=#8A95A3, --text=#1A202C, --error=#D32F2F
 * Motion: 150ms fast, 200ms normal, ease-out
 */

interface SettingItem {
  label: string;
  value?: string | boolean;
  type: 'toggle' | 'link' | 'button';
  icon?: React.ReactNode;
  isDanger?: boolean;
}

export function SettingsRefactored() {
  const navigate = useNavigate();
  const { signOut } = useAuthStore();

  const [settings, setSettings] = useState({
    notifications: true,
    messageNotifications: true,
    emailNotifications: false,
    theme: 'system',
  });

  const handleToggle = (key: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await signOut();
      navigate('/auth/signin');
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure? This cannot be undone.')) {
      alert('Account deletion initiated. Check your email for confirmation.');
    }
  };

  return (
    <div className="min-h-screen md:ml-16 pb-16 md:pb-0" style={{ backgroundColor: 'var(--bg, #F8F9FB)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 border-b px-4 md:px-8 py-4"
        style={{ backgroundColor: 'var(--card, #FFFFFF)', borderColor: 'var(--border, #E8ECEF)' }}
      >
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text, #1A202C)' }}>
          Settings
        </h1>
      </header>

      {/* Content */}
      <main className="px-4 md:px-8 py-6 max-w-2xl mx-auto">
        {/* Account Section */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold mb-4 uppercase" style={{ color: 'var(--muted, #8A95A3)' }}>
            Account
          </h2>
          <div
            className="rounded-lg border overflow-hidden"
            style={{
              backgroundColor: 'var(--card, #FFFFFF)',
              borderColor: 'var(--border, #E8ECEF)',
            }}
          >
            {[
              { label: 'Email', value: 'sarah@example.com' },
              { label: 'Phone', value: '+1 (555) 123-4567' },
            ].map((item, idx) => (
              <div
                key={item.label}
                className="px-4 py-3 flex items-center justify-between border-b last:border-b-0"
                style={{ borderColor: 'var(--border, #E8ECEF)' }}
              >
                <span style={{ color: 'var(--text, #1A202C)' }}>{item.label}</span>
                <span style={{ color: 'var(--muted, #8A95A3)' }}>{item.value}</span>
              </div>
            ))}
            <button
              className="w-full px-4 py-3 text-left font-semibold text-sm transition-colors duration-150"
              style={{
                color: 'var(--primary, #1F6FEB)',
                backgroundColor: 'var(--card, #FFFFFF)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(31, 111, 235, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--card, #FFFFFF)';
              }}
            >
              Change Password
              <ChevronRight className="w-4 h-4 inline float-right" />
            </button>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold mb-4 uppercase" style={{ color: 'var(--muted, #8A95A3)' }}>
            Notifications
          </h2>
          <div
            className="rounded-lg border overflow-hidden"
            style={{
              backgroundColor: 'var(--card, #FFFFFF)',
              borderColor: 'var(--border, #E8ECEF)',
            }}
          >
            {[
              { key: 'notifications', label: 'Push Notifications' },
              { key: 'messageNotifications', label: 'Message Notifications' },
              { key: 'emailNotifications', label: 'Email Notifications' },
            ].map((item) => (
              <div
                key={item.key}
                className="px-4 py-3 flex items-center justify-between border-b last:border-b-0"
                style={{ borderColor: 'var(--border, #E8ECEF)' }}
              >
                <span style={{ color: 'var(--text, #1A202C)' }}>{item.label}</span>
                <input
                  type="checkbox"
                  checked={settings[item.key as keyof typeof settings] as boolean}
                  onChange={() => handleToggle(item.key)}
                  className="w-5 h-5 rounded"
                  style={{
                    accentColor: 'var(--primary, #1F6FEB)',
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Appearance Section */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold mb-4 uppercase" style={{ color: 'var(--muted, #8A95A3)' }}>
            Appearance
          </h2>
          <div
            className="rounded-lg border p-4"
            style={{
              backgroundColor: 'var(--card, #FFFFFF)',
              borderColor: 'var(--border, #E8ECEF)',
            }}
          >
            <label className="text-sm font-semibold block mb-3" style={{ color: 'var(--text, #1A202C)' }}>
              Theme
            </label>
            <select
              value={settings.theme}
              onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border text-sm"
              style={{
                backgroundColor: 'var(--card, #FFFFFF)',
                borderColor: 'var(--border, #E8ECEF)',
                color: 'var(--text, #1A202C)',
              }}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>
        </div>

        {/* Help Section */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold mb-4 uppercase" style={{ color: 'var(--muted, #8A95A3)' }}>
            Help
          </h2>
          <div
            className="rounded-lg border overflow-hidden"
            style={{
              backgroundColor: 'var(--card, #FFFFFF)',
              borderColor: 'var(--border, #E8ECEF)',
            }}
          >
            {[
              { label: 'Privacy Policy' },
              { label: 'Terms of Service' },
              { label: 'Contact Support' },
            ].map((item) => (
              <button
                key={item.label}
                className="w-full px-4 py-3 text-left font-semibold text-sm border-b last:border-b-0 transition-colors duration-150"
                style={{
                  color: 'var(--primary, #1F6FEB)',
                  borderColor: 'var(--border, #E8ECEF)',
                  backgroundColor: 'var(--card, #FFFFFF)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(31, 111, 235, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--card, #FFFFFF)';
                }}
              >
                {item.label}
                <ChevronRight className="w-4 h-4 inline float-right" />
              </button>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        <div>
          <h2 className="text-sm font-semibold mb-4 uppercase" style={{ color: 'var(--error, #D32F2F)' }}>
            Danger Zone
          </h2>
          <div className="space-y-3">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-150"
              style={{
                backgroundColor: 'var(--card, #FFFFFF)',
                borderColor: 'var(--border, #E8ECEF)',
                color: 'var(--muted, #8A95A3)',
                border: '1px solid var(--border, #E8ECEF)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(31, 111, 235, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--card, #FFFFFF)';
              }}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>

            <button
              onClick={handleDeleteAccount}
              className="w-full px-4 py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-150"
              style={{
                backgroundColor: 'var(--card, #FFFFFF)',
                borderColor: 'var(--error, #D32F2F)',
                color: 'var(--error, #D32F2F)',
                border: '1px solid var(--error, #D32F2F)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(211, 47, 47, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--card, #FFFFFF)';
              }}
            >
              <Trash2 className="w-4 h-4" />
              Delete Account
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default SettingsRefactored;
