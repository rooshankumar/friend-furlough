/**
 * Format a timestamp to relative time like "last seen X ago"
 * @param timestamp - ISO timestamp or Date object
 * @returns Formatted string like "last seen 5 min ago", "last seen 2 hours ago", etc.
 */
export function formatLastSeen(timestamp: string | Date | null | undefined): string {
  if (!timestamp) return 'Offline';

  const now = new Date();
  const lastSeen = new Date(timestamp);
  const diffMs = now.getTime() - lastSeen.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Less than 1 minute = Online
  if (diffMinutes < 1) {
    return 'Online';
  }

  // 1-59 minutes
  if (diffMinutes < 60) {
    return `last seen ${diffMinutes} min ago`;
  }

  // 1-23 hours
  if (diffHours < 24) {
    return `last seen ${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  }

  // 1+ days
  return `last seen ${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

/**
 * Check if a user is currently online (last seen within 1 minute)
 * @param timestamp - ISO timestamp or Date object
 * @returns true if online, false otherwise
 */
export function isUserOnline(timestamp: string | Date | null | undefined): boolean {
  if (!timestamp) return false;

  const now = new Date();
  const lastSeen = new Date(timestamp);
  const diffMs = now.getTime() - lastSeen.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  return diffMinutes < 1;
}
