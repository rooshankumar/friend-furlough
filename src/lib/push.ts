import { supabase } from '@/integrations/supabase/client';

// VAPID public key (safe to be public). Private key must be used on the server only.
const VAPID_PUBLIC_KEY = 'BPvIDTz3JEy0Ta_pNGTtXlczVKZRCLVxBuwWmC4OEd3TOi6FiBujyLpfaJ6yDpWidJNLLkaSkkkTrbo-2rMRJuU';

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}

async function ensureServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const existing = await navigator.serviceWorker.getRegistration();
    if (existing) return existing;
    const reg = await navigator.serviceWorker.register('/sw.js');
    return reg;
  } catch (e) {
    console.warn('Service worker registration failed', e);
    return null;
  }
}

async function subscribePush(reg: ServiceWorkerRegistration): Promise<PushSubscription | null> {
  if (!('PushManager' in window)) return null;
  try {
    const existing = await reg.pushManager.getSubscription();
    if (existing) return existing;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    return sub;
  } catch (e) {
    console.warn('Push subscribe failed', e);
    return null;
  }
}

async function saveSubscription(userId: string, sub: PushSubscription) {
  try {
    const json = sub.toJSON();
    const endpoint = sub.endpoint;
    const p256dh = json.keys?.p256dh || null;
    const auth = json.keys?.auth || null;

    // Upsert into a push_subscriptions table (create it if missing; see SQL below)
    const { error } = await (supabase as any)
      .from('push_subscriptions')
      .upsert(
        {
          user_id: userId,
          endpoint,
          p256dh,
          auth,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,endpoint' }
      );
    if (error) {
      console.warn('Failed to save push subscription', error);
    }
  } catch (e) {
    console.warn('Save subscription failed', e);
  }
}

export async function registerPushNotifications(userId: string) {
  try {
    if (!userId) return;
    if (!('Notification' in window)) return;

    // Avoid re-register spamming per user
    const stampKey = `push_registered_${userId}`;
    const last = localStorage.getItem(stampKey);

    // Request permission if not granted
    let perm = Notification.permission;
    if (perm === 'default') {
      perm = await Notification.requestPermission();
    }
    if (perm !== 'granted') {
      return; // user denied
    }

    const reg = await ensureServiceWorker();
    if (!reg) return;

    const sub = await subscribePush(reg);
    if (!sub) return;

    await saveSubscription(userId, sub);
    localStorage.setItem(stampKey, String(Date.now()));
  } catch (e) {
    console.warn('registerPushNotifications error', e);
  }
}

/*
SQL to create table (run in Supabase SQL editor):

create table if not exists public.push_subscriptions (
  user_id uuid references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text,
  auth text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (user_id, endpoint)
);

-- RLS
alter table public.push_subscriptions enable row level security;
create policy "owner can manage own push subscription" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
*/
