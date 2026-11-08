import { AvatarClassId, GuestbookEntry, WeddingConfig } from '../data/weddingConfig';

export interface CloudSyncStatus {
  mode: 'cloud' | 'local';
  syncedAt: string;
  apiBase?: string;
}

export interface GuestbookSummaryStats {
  totalCount: number;
  attendingParties: number;
  attendingGuests: number;
  mealGuests: number;
}

export interface AdminOverviewStats {
  totalEntries: number;
  attendingParties: number;
  absentParties: number;
  undecidedParties: number;
  attendingGuests: number;
  groomSideGuests: number;
  brideSideGuests: number;
  mealYesGuests: number;
}

export interface AdminGuestbookRow extends GuestbookEntry {
  phone?: string;
  isHidden?: boolean;
  createdAtISO?: string;
}

const DEFAULT_WORKER_URL = 'https://pixel-wedding-quest-api.happyugn.workers.dev';
const STORAGE_EDIT_TOKENS_KEY = 'pixel_wedding_quest_edit_tokens_v1';

const VALID_AVATARS: AvatarClassId[] = [
  'knight',
  'mage',
  'archer',
  'bard',
  'healer',
  'cat',
];

export function getConfiguredApiBase(): string {
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
  return DEFAULT_WORKER_URL;
}

function getStoredEditTokens(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_EDIT_TOKENS_KEY);
    if (raw) return JSON.parse(raw) as Record<string, string>;
  } catch {
    // ignore
  }
  return {};
}

function saveEditToken(entryId: string, editToken: string): void {
  try {
    const current = getStoredEditTokens();
    current[entryId] = editToken;
    localStorage.setItem(STORAGE_EDIT_TOKENS_KEY, JSON.stringify(current));
  } catch {
    // ignore
  }
}

export function canEditOwnGuestbookEntry(entryId: string): boolean {
  const tokens = getStoredEditTokens();
  return Boolean(tokens[entryId]);
}

function mapRawEntry(row: Record<string, unknown>, i: number): GuestbookEntry {
  const rawAvatar = String(row.avatar || 'knight') as AvatarClassId;
  const rawAttendance = String(row.attendance || 'attend');
  const rawMeal = String(row.meal || 'yes');
  return {
    id: String(row.id || `remote-${i}`),
    name: String(row.name || '하객'),
    avatar: VALID_AVATARS.includes(rawAvatar) ? rawAvatar : 'knight',
    side:
      row.side === 'groom' || row.side === 'bride' || row.side === 'both'
        ? row.side
        : 'both',
    titleBadge: String(row.titleBadge || '🌸 봄날의 하객'),
    message: String(row.message || ''),
    createdAt: String(row.createdAt || '방금 전'),
    attendance:
      rawAttendance === 'absent' || rawAttendance === 'unable'
        ? 'unable'
        : rawAttendance === 'undecided' || rawAttendance === 'maybe'
        ? 'maybe'
        : 'attend',
    companions: Number(row.companions) || 1,
    meal:
      rawMeal === 'no' ? 'no' : rawMeal === 'tbd' || rawMeal === 'undecided' ? 'undecided' : 'yes',
  };
}

/**
 * Fetches live guestbook entries, RSVP summary, and reaction counts from Cloudflare D1.
 */
export async function fetchSyncedGuestbook(
  localFallbackEntries: GuestbookEntry[]
): Promise<{
  entries: GuestbookEntry[];
  summary?: GuestbookSummaryStats;
  reactions?: { blessingCount: number; snapCount: number };
  status: CloudSyncStatus;
}> {
  const apiBase = getConfiguredApiBase();
  const nowStr = new Date().toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  try {
    const res = await fetch(`${apiBase}/api/guestbook`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error('Non-200 response');
    const data = (await res.json()) as {
      entries?: Record<string, unknown>[];
      summary?: GuestbookSummaryStats;
      reactions?: { blessingCount: number; snapCount: number };
    };

    const rawList = Array.isArray(data) ? data : data.entries || [];
    const entries = rawList.map((row, idx) => mapRawEntry(row, idx));

    return {
      entries: entries.length > 0 ? entries : localFallbackEntries,
      summary: data.summary,
      reactions: data.reactions,
      status: { mode: 'cloud', syncedAt: nowStr, apiBase },
    };
  } catch {
    return {
      entries: localFallbackEntries,
      status: { mode: 'local', syncedAt: nowStr, apiBase },
    };
  }
}

/**
 * Publishes a new guestbook & RSVP entry to Cloudflare D1 (`POST /api/guestbook`)
 * and broadcasts it via BroadcastChannel for instant multi-tab updates.
 */
export async function publishGuestbookEntry(
  entry: GuestbookEntry
): Promise<{ ok: boolean; savedEntry: GuestbookEntry }> {
  const apiBase = getConfiguredApiBase();
  const mappedAttendance =
    entry.attendance === 'unable'
      ? 'absent'
      : entry.attendance === 'maybe'
      ? 'undecided'
      : 'attend';
  const mappedMeal =
    entry.meal === 'no' ? 'no' : entry.meal === 'undecided' ? 'tbd' : 'yes';

  try {
    const res = await fetch(`${apiBase}/api/guestbook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: entry.name,
        avatar: entry.avatar,
        side: entry.side,
        titleBadge: entry.titleBadge,
        message: entry.message,
        attendance: mappedAttendance,
        companions: entry.companions ?? 1,
        meal: mappedMeal,
      }),
    });

    if (!res.ok) throw new Error('Failed to post guestbook');
    const data = (await res.json()) as {
      entry?: Record<string, unknown>;
      credential?: { id: string; editToken: string };
    };

    const savedEntry = data.entry ? mapRawEntry(data.entry, 0) : entry;
    if (data.credential?.id && data.credential?.editToken) {
      saveEditToken(data.credential.id, data.credential.editToken);
    }

    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('pixel_wedding_quest_live_channel');
        bc.postMessage({ type: 'NEW_GUESTBOOK_ENTRY', entry: savedEntry });
        bc.close();
      }
    } catch {
      // ignore
    }

    return { ok: true, savedEntry };
  } catch {
    return { ok: false, savedEntry: entry };
  }
}

/**
 * Deletes a guest's own guestbook entry using the editToken stored on their device.
 */
export async function deleteOwnGuestbookEntry(entryId: string): Promise<boolean> {
  const tokens = getStoredEditTokens();
  const editToken = tokens[entryId];
  if (!editToken) return false;

  const apiBase = getConfiguredApiBase();
  try {
    const res = await fetch(`${apiBase}/api/guestbook/${encodeURIComponent(entryId)}`, {
      method: 'DELETE',
      headers: { 'X-Edit-Token': editToken },
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Increments the live blessing or photobooth snap counter in Cloudflare D1.
 */
export async function incrementReactionCounter(
  kind: 'blessing' | 'snap' = 'blessing'
): Promise<{ blessingCount: number; snapCount: number } | null> {
  const apiBase = getConfiguredApiBase();
  try {
    const res = await fetch(`${apiBase}/api/reactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind }),
    });
    if (!res.ok) return null;
    return (await res.json()) as { blessingCount: number; snapCount: number };
  } catch {
    return null;
  }
}

/**
 * Fetches cloud-saved WeddingConfig from Cloudflare D1 if an admin has published changes.
 */
export async function fetchCloudWeddingConfig(): Promise<WeddingConfig | null> {
  const apiBase = getConfiguredApiBase();
  try {
    const res = await fetch(`${apiBase}/api/config`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { config: WeddingConfig | null };
    return data.config || null;
  } catch {
    return null;
  }
}

/**
 * Admin APIs (Backed by Cloudflare D1)
 */
export async function adminLogin(
  password: string
): Promise<{ ok: boolean; token?: string; expiresAt?: string }> {
  const apiBase = getConfiguredApiBase();
  try {
    const res = await fetch(`${apiBase}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) return { ok: false };
    return (await res.json()) as { ok: boolean; token: string; expiresAt: string };
  } catch {
    return { ok: false };
  }
}

export async function fetchAdminOverview(
  token: string
): Promise<{ entries: AdminGuestbookRow[]; stats: AdminOverviewStats } | null> {
  const apiBase = getConfiguredApiBase();
  try {
    const res = await fetch(`${apiBase}/api/admin/overview`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as {
      entries: AdminGuestbookRow[];
      stats: AdminOverviewStats;
    };
  } catch {
    return null;
  }
}

export async function saveCloudWeddingConfig(
  token: string,
  config: WeddingConfig
): Promise<boolean> {
  const apiBase = getConfiguredApiBase();
  try {
    const res = await fetch(`${apiBase}/api/admin/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ config }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function adminDeleteGuestbookEntry(
  token: string,
  entryId: string
): Promise<boolean> {
  const apiBase = getConfiguredApiBase();
  try {
    const res = await fetch(`${apiBase}/api/guestbook/${encodeURIComponent(entryId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function adminToggleGuestbookHidden(
  token: string,
  entryId: string,
  isHidden: boolean
): Promise<boolean> {
  const apiBase = getConfiguredApiBase();
  try {
    const res = await fetch(`${apiBase}/api/guestbook/${encodeURIComponent(entryId)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isHidden }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function adminChangePassword(
  token: string,
  newPassword: string
): Promise<boolean> {
  const apiBase = getConfiguredApiBase();
  try {
    const res = await fetch(`${apiBase}/api/admin/password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ newPassword }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
