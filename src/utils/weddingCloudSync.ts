import { AvatarClassId, GuestbookEntry } from '../data/weddingConfig';

export interface CloudSyncStatus {
  mode: 'cloud' | 'local';
  syncedAt: string;
}

const VALID_AVATARS: AvatarClassId[] = [
  'knight',
  'mage',
  'archer',
  'bard',
  'healer',
  'cat',
];

function getConfiguredApiBase(): string | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get('api');
    if (fromQuery && fromQuery.startsWith('http')) {
      return fromQuery.replace(/\/+$/, '');
    }
    const envObj = (
      import.meta as unknown as { env?: { VITE_WORKER_URL?: string } }
    ).env;
    if (envObj?.VITE_WORKER_URL) {
      return envObj.VITE_WORKER_URL.replace(/\/+$/, '');
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Fetches remote guestbook entries from a Cloudflare Worker D1 endpoint if configured,
 * merging them cleanly with local entries.
 */
export async function fetchSyncedGuestbook(
  localEntries: GuestbookEntry[]
): Promise<{ entries: GuestbookEntry[]; status: CloudSyncStatus }> {
  const apiBase = getConfiguredApiBase();
  const nowStr = new Date().toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (!apiBase) {
    return {
      entries: localEntries,
      status: { mode: 'local', syncedAt: nowStr },
    };
  }

  try {
    const res = await fetch(`${apiBase}/api/guestbook`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error('Non-200 response');
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('Invalid payload');

    const remoteMapped: GuestbookEntry[] = data.map((row: Record<string, unknown>, i: number) => {
      const rawAvatar = String(row.avatar || 'knight') as AvatarClassId;
      return {
        id: String(row.id || `remote-${i}`),
        name: String(row.name || '하객'),
        avatar: VALID_AVATARS.includes(rawAvatar) ? rawAvatar : 'knight',
        side:
          row.side === 'groom' || row.side === 'bride' || row.side === 'both'
            ? row.side
            : 'both',
        titleBadge: String(row.titleBadge || '하객 축복단'),
        message: String(row.message || ''),
        createdAt: String(row.createdAt || '방금 전'),
      };
    });

    // Merge unique entries by id or name+message
    const seen = new Set<string>();
    const merged: GuestbookEntry[] = [];
    for (const item of [...remoteMapped, ...localEntries]) {
      const sig = `${item.name}::${item.message}`;
      if (!seen.has(sig)) {
        seen.add(sig);
        merged.push(item);
      }
    }

    return {
      entries: merged,
      status: { mode: 'cloud', syncedAt: nowStr },
    };
  } catch {
    return {
      entries: localEntries,
      status: { mode: 'local', syncedAt: nowStr },
    };
  }
}

/**
 * Publishes a new guestbook/RSVP entry to both BroadcastChannel (instant multi-tab sync)
 * and the Cloudflare Worker D1 endpoint (`POST /api/guestbook` & `POST /api/rsvp`) if configured.
 */
export async function publishGuestbookEntry(entry: GuestbookEntry): Promise<boolean> {
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('pixel_wedding_quest_live_channel');
      bc.postMessage({ type: 'NEW_GUESTBOOK_ENTRY', entry });
      bc.close();
    }
  } catch {
    // ignore
  }

  const apiBase = getConfiguredApiBase();
  if (!apiBase) return false;

  try {
    await fetch(`${apiBase}/api/guestbook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: entry.name,
        avatar: entry.avatar,
        side: entry.side,
        titleBadge: entry.titleBadge,
        message: entry.message,
      }),
    });

    if (entry.attendance) {
      await fetch(`${apiBase}/api/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: entry.name,
          side: entry.side === 'both' ? 'groom' : entry.side,
          attendance: entry.attendance,
          companions: entry.companions ?? 1,
          meal: entry.meal ?? 'yes',
          message: entry.message,
        }),
      });
    }
    return true;
  } catch {
    return false;
  }
}
