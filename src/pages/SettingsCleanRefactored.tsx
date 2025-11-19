import { useState } from 'react';
import { ChevronRight, LogOut, Trash2, Bell, Lock, Palette } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';

/**
 * Global Tokens: --primary=#1F6FEB, --bg=#F8F9FB, --card=#FFFFFF, --border=#E8ECEF, --muted=#8A95A3, --text=#1A202C, --error=#D32F2F
 * Motion: 150ms fast, 200ms normal, ease-out
 * 
 * Clean 2-tab Settings:
 * Tab 1: Preferences (Notifications, Theme, Privacy)
 * Tab 2: Account (Email, Phone, Password, Logout, Delete)
 */

export function SettingsCleanRefactored() {
  const navigate = useNavigate();
  const { signOut } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'preferences' | 'account'>('preferences');
  const [settings, setSettings] = useState({
    pushNotifications: true,
    messageNotifications: true,
    emailNotifications: false,
    theme: 'system',
    profileVisibility: 'public',
    showOnlineStatus: true,
  });

  const handleToggle = (key: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSelectChange = (key: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await signOut();
      navigate('/auth/signin');
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure? This action cannot be undone. All your data will be permanently deleted.')) {
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

      {/* Tabs */}
      <div
        className="sticky top-16 z-10 border-b flex"
        style={{ backgroundColor: 'var(--card, #FFFFFF)', borderColor: 'var(--border, #E8ECEF)' }}
      >
        <button
          onClick={() => setActiveTab('preferences')}
          className="flex-1 px-4 md:px-8 py-4 font-semibold text-sm border-b-2 transition-all duration-150"
          style={{
            borderColor: activeTab === 'preferences' ? 'var(--primary, #1F6FEB)' : 'transparent',
            color: activeTab === 'preferences' ? 'var(--primary, #1F6FEB)' : 'var(--muted, #8A95A3)',
          }}
        >
          <Bell className="w-4 h-4 inline mr-2" />
          Preferences
        </button>
        <button
          onClick={() => setActiveTab('account')}
          className="flex-1 px-4 md:px-8 py-4 font-semibold text-sm border-b-2 transition-all duration-150"
          style={{
            borderColor: activeTab === 'account' ? 'var(--primary, #1F6FEB)' : 'transparent',
            color: activeTab === 'account' ? 'var(--primary, #1F6FEB)' : 'var(--muted, #8A95A3)',
          }}
        >
          <Lock className="w-4 h-4 inline mr-2" />
          Account
        </button>
      </div>

      {/* Content */}
      <main className="px-4 md:px-8 py-6 max-w-2xl mx-auto">
        {/* PREFERENCES TAB */}
        {activeTab === 'preferences' && (
          <div className="space-y-6">
            {/* Notifications Section */}
            <div>
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
                  { key: 'pushNotifications', label: 'Push Notifications', desc: 'Get alerts on your device' },
                  { key: 'messageNotifications', label: 'Message Notifications', desc: 'Notify when you receive messages' },
                  { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive email digests' },
                ].map((item, idx) => (
                  <div
                    key={item.key}
                    className="px-4 py-4 flex items-center justify-between border-b last:border-b-0"
                    style={{ borderColor: 'var(--border, #E8ECEF)' }}
                  >
                    <div>
                      <p style={{ color: 'var(--text, #1A202C)' }} className="font-semibold text-sm">
                        {item.label}
                      </p>
                      <p style={{ color: 'var(--muted, #8A95A3)' }} className="text-xs mt-1">
                        {item.desc}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings[item.key as keyof typeof settings] as boolean}
                      onChange={() => handleToggle(item.key)}
                      className="w-5 h-5 rounded cursor-pointer"
                      style={{
                        accentColor: 'var(--primary, #1F6FEB)',
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Privacy Section */}
            <div>
              <h2 className="text-sm font-semibold mb-4 uppercase" style={{ color: 'var(--muted, #8A95A3)' }}>
                Privacy
              </h2>
              <div
                className="rounded-lg border overflow-hidden space-y-4 p-4"
                style={{
                  backgroundColor: 'var(--card, #FFFFFF)',
                  borderColor: 'var(--border, #E8ECEF)',
                }}
              >
                {/* Profile Visibility */}
                <div>
                  <label className="text-sm font-semibold block mb-2" style={{ color: 'var(--text, #1A202C)' }}>
                    Profile Visibility
                  </label>
                  <select
                    value={settings.profileVisibility}
                    onChange={(e) => handleSelectChange('profileVisibility', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border text-sm"
                    style={{
                      backgroundColor: 'var(--card, #FFFFFF)',
                      borderColor: 'var(--border, #E8ECEF)',
                      color: 'var(--text, #1A202C)',
                    }}
                  >
                    <option value="public">Public - Everyone can see your profile</option>
                    <option value="friends">Friends Only - Only connections can see</option>
                    <option value="private">Private - Only you can see</option>
                  </select>
                </div>

                {/* Show Online Status */}
                <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border, #E8ECEF)' }}>
                  <div>
                    <p style={{ color: 'var(--text, #1A202C)' }} className="font-semibold text-sm">
                      Show Online Status
                    </p>
                    <p style={{ color: 'var(--muted, #8A95A3)' }} className="text-xs mt-1">
                      Let others know when you're online
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showOnlineStatus}
                    onChange={() => handleToggle('showOnlineStatus')}
                    className="w-5 h-5 rounded cursor-pointer"
                    style={{
                      accentColor: 'var(--primary, #1F6FEB)',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Appearance Section */}
            <div>
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
                  <Palette className="w-4 h-4 inline mr-2" />
                  Theme
                </label>
                <select
                  value={settings.theme}
                  onChange={(e) => handleSelectChange('theme', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border text-sm"
                  style={{
                    backgroundColor: 'var(--card, #FFFFFF)',
                    borderColor: 'var(--border, #E8ECEF)',
                    color: 'var(--text, #1A202C)',
                  }}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System (Auto)</option>
                </select>
              </div>
            </div>

            {/* Help Links */}
            <div>
              <h2 className="text-sm font-semibold mb-4 uppercase" style={{ color: 'var(--muted, #8A95A3)' }}>
                Help & Support
              </h2>
              <div
                className="rounded-lg border overflow-hidden"
                style={{
                  backgroundColor: 'var(--card, #FFFFFF)',
                  borderColor: 'var(--border, #E8ECEF)',
                }}
              >
                {[
                  { label: 'Privacy Policy', href: '/privacy-policy' },
                  { label: 'Terms of Service', href: '/terms-of-service' },
                  { label: 'Contact Support', href: 'mailto:support@roshlingua.com' },
                ].map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target={item.href.startsWith('mailto') ? undefined : '_blank'}
                    rel="noopener noreferrer"
                    className="w-full px-4 py-3 text-left font-semibold text-sm border-b last:border-b-0 transition-colors duration-150 flex items-center justify-between"
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
                    <ChevronRight className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ACCOUNT TAB */}
        {activeTab === 'account' && (
          <div className="space-y-6">
            {/* Account Information */}
            <div>
              <h2 className="text-sm font-semibold mb-4 uppercase" style={{ color: 'var(--muted, #8A95A3)' }}>
                Account Information
              </h2>
              <div
                className="rounded-lg border overflow-hidden"
                style={{
                  backgroundColor: 'var(--card, #FFFFFF)',
                  borderColor: 'var(--border, #E8ECEF)',
                }}
              >
                {[
                  { label: 'Email', value: 'user@example.com' },
                  { label: 'Phone', value: '+1 (555) 123-4567' },
                  { label: 'Member Since', value: 'November 2024' },
                ].map((item, idx) => (
                  <div
                    key={item.label}
                    className="px-4 py-3 flex items-center justify-between border-b last:border-b-0"
                    style={{ borderColor: 'var(--border, #E8ECEF)' }}
                  >
                    <span style={{ color: 'var(--text, #1A202C)' }} className="font-semibold text-sm">
                      {item.label}
                    </span>
                    <span style={{ color: 'var(--muted, #8A95A3)' }} className="text-sm">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Security */}
            <div>
              <h2 className="text-sm font-semibold mb-4 uppercase" style={{ color: 'var(--muted, #8A95A3)' }}>
                Security
              </h2>
              <div
                className="rounded-lg border overflow-hidden"
                style={{
                  backgroundColor: 'var(--card, #FFFFFF)',
                  borderColor: 'var(--border, #E8ECEF)',
                }}
              >
                <button
                  className="w-full px-4 py-3 text-left font-semibold text-sm transition-colors duration-150 flex items-center justify-between"
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
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div>
              <h2 className="text-sm font-semibold mb-4 uppercase" style={{ color: 'var(--error, #D32F2F)' }}>
                Danger Zone
              </h2>
              <div className="space-y-3">
                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-150 border"
                  style={{
                    backgroundColor: 'var(--card, #FFFFFF)',
                    borderColor: 'var(--border, #E8ECEF)',
                    color: 'var(--muted, #8A95A3)',
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

                {/* Delete Account Button */}
                <button
                  onClick={handleDeleteAccount}
                  className="w-full px-4 py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-150 border"
                  style={{
                    backgroundColor: 'var(--card, #FFFFFF)',
                    borderColor: 'var(--error, #D32F2F)',
                    color: 'var(--error, #D32F2F)',
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
          </div>
        )}
      </main>
    </div>
  );
}

export default SettingsCleanRefactored;
