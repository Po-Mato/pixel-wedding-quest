export interface Env {
  DB: D1Database;
  ALLOWED_ORIGINS?: string;
  DEFAULT_INVITATION_ID?: string;
  ADMIN_SESSION_SECRET?: string;
}

type AvatarClassId = 'knight' | 'mage' | 'archer' | 'bard' | 'healer' | 'cat';
type GuestSide = 'groom' | 'bride' | 'both';
type AttendanceType = 'attend' | 'absent' | 'undecided';
type MealType = 'yes' | 'no' | 'tbd';

const VALID_AVATARS = new Set<AvatarClassId>([
  'knight',
  'mage',
  'archer',
  'bard',
  'healer',
  'cat',
]);
const VALID_SIDES = new Set<GuestSide>(['groom', 'bride', 'both']);
const VALID_ATTENDANCE = new Set<AttendanceType>(['attend', 'absent', 'undecided']);
const VALID_MEALS = new Set<MealType>(['yes', 'no', 'tbd']);

const INVITATION_ID_REGEX = /^[a-z0-9_-]{1,32}$/;
const ADMIN_TOKEN_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours
const PBKDF2_ITERATIONS = 100_000;
const MAX_CONFIG_PAYLOAD_BYTES = 512 * 1024; // 512 KB

interface GuestbookRow {
  id: string;
  invitation_id: string;
  name: string;
  avatar: string;
  side: string;
  title_badge: string;
  message: string;
  attendance: string;
  companions: number;
  meal: string;
  phone: string;
  is_hidden: number;
  edit_token_hash: string | null;
  client_hash: string | null;
  created_at: string;
  updated_at: string;
}

function sanitizeText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, maxLength);
}

function sanitizeInvitationId(raw: string | null | undefined, fallback = 'default'): string {
  const trimmed = (raw || '').trim();
  if (INVITATION_ID_REGEX.test(trimmed)) return trimmed;
  return INVITATION_ID_REGEX.test(fallback) ? fallback : 'default';
}

/**
 * Sanitizes URLs in config payloads to prevent javascript:, vbscript:, or data:text/html XSS.
 */
function sanitizeSafeUrl(value: unknown, allowDataImage = false): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.replace(/[\u0000-\u001f\u007f]/g, '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) {
    return trimmed.slice(0, 2048);
  }
  if (
    allowDataImage &&
    /^data:image\/(jpeg|jpg|png|webp|gif);base64,[a-zA-Z0-9+/=]+$/i.test(trimmed)
  ) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return trimmed.slice(0, 2048);
    }
  } catch {
    // invalid URL
  }
  return '';
}

function sanitizeWeddingConfigObject(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const clone = JSON.parse(JSON.stringify(raw)) as Record<string, unknown>;

  // Sanitize gallery imageUrls
  if (Array.isArray(clone.gallery)) {
    clone.gallery = clone.gallery.slice(0, 30).map((item) => {
      if (!item || typeof item !== 'object') return item;
      const obj = item as Record<string, unknown>;
      return {
        ...obj,
        id: sanitizeText(obj.id, 64),
        title: sanitizeText(obj.title, 80),
        subtitle: sanitizeText(obj.subtitle, 120),
        seasonTag: sanitizeText(obj.seasonTag, 40),
        description: sanitizeText(obj.description, 300),
        imageUrl: sanitizeSafeUrl(obj.imageUrl, true),
      };
    });
  }

  // Sanitize bank accounts kakaoPayUrl
  if (clone.accounts && typeof clone.accounts === 'object') {
    const accObj = clone.accounts as Record<string, unknown>;
    for (const sideKey of ['groomSide', 'brideSide']) {
      if (Array.isArray(accObj[sideKey])) {
        accObj[sideKey] = (accObj[sideKey] as unknown[]).slice(0, 12).map((acc) => {
          if (!acc || typeof acc !== 'object') return acc;
          const a = acc as Record<string, unknown>;
          return {
            ...a,
            role: sanitizeText(a.role, 32),
            name: sanitizeText(a.name, 32),
            bank: sanitizeText(a.bank, 32),
            accountNumber: sanitizeText(a.accountNumber, 64),
            kakaoPayUrl: sanitizeSafeUrl(a.kakaoPayUrl, false),
          };
        });
      }
    }
  }

  return clone;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) return new Uint8Array(0);
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/**
 * Constant-time string/hex comparison to prevent timing side-channel attacks.
 */
function timingSafeEqualStr(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const aBytes = enc.encode(a);
  const bBytes = enc.encode(b);
  if (aBytes.byteLength !== bBytes.byteLength) return false;
  let diff = 0;
  for (let i = 0; i < aBytes.byteLength; i++) {
    diff |= aBytes[i] ^ bBytes[i];
  }
  return diff === 0;
}

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return bytesToHex(new Uint8Array(digest));
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return bytesToHex(new Uint8Array(sig));
}

/**
 * PBKDF2-HMAC-SHA256 password hashing with random 16-byte salt.
 * Format: pbkdf2$<iterations>$<saltHex>$<hashHex>
 */
async function hashPasswordPbkdf2(
  password: string,
  saltBytes?: Uint8Array,
  iterations = PBKDF2_ITERATIONS
): Promise<string> {
  const salt = saltBytes || crypto.getRandomValues(new Uint8Array(16));
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt,
      iterations,
    },
    baseKey,
    256
  );
  const hashHex = bytesToHex(new Uint8Array(derivedBits));
  return `pbkdf2$${iterations}$${bytesToHex(salt)}$${hashHex}`;
}

async function verifyPasswordAgainstStoredHash(
  password: string,
  storedHash: string
): Promise<{ valid: boolean; needsRehash: boolean }> {
  if (storedHash.startsWith('pbkdf2$')) {
    const parts = storedHash.split('$');
    if (parts.length !== 4) return { valid: false, needsRehash: false };
    const iterations = Number(parts[1]);
    const saltBytes = hexToBytes(parts[2]);
    if (!Number.isFinite(iterations) || iterations < 10_000 || saltBytes.length < 8) {
      return { valid: false, needsRehash: false };
    }
    const computed = await hashPasswordPbkdf2(password, saltBytes, iterations);
    return {
      valid: timingSafeEqualStr(computed, storedHash),
      needsRehash: false,
    };
  }

  // Legacy unsalted SHA-256 hash support (transparently upgrades to PBKDF2 on match)
  const legacyHash = await sha256Hex(password);
  const valid = timingSafeEqualStr(legacyHash, storedHash);
  return { valid, needsRehash: valid };
}

function getRequiredSessionSecret(env: Env): string | null {
  const secret = (env.ADMIN_SESSION_SECRET || '').trim();
  return secret.length >= 32 ? secret : null;
}

async function createAdminToken(
  invitationId: string,
  pwHash: string,
  secret: string
): Promise<{ token: string; expiresAt: string }> {
  const expMs = Date.now() + ADMIN_TOKEN_TTL_MS;
  const pwFingerprint = (await sha256Hex(pwHash)).slice(0, 16);
  const payload = `v1:${invitationId}:${expMs}:${pwFingerprint}`;
  const sig = await hmacSha256Hex(secret, payload);
  const token = btoa(`${payload}:${sig}`);
  return { token, expiresAt: new Date(expMs).toISOString() };
}

async function verifyAdminToken(
  token: string | null,
  invitationId: string,
  env: Env
): Promise<boolean> {
  if (!token) return false;
  const secret = getRequiredSessionSecret(env);
  if (!secret) return false;

  try {
    const decoded = atob(token);
    const parts = decoded.split(':');
    if (parts.length !== 5) return false;
    const [version, invId, expStr, pwFp, sig] = parts;
    if (version !== 'v1' || invId !== invitationId) return false;

    const expMs = Number(expStr);
    if (!Number.isFinite(expMs) || Date.now() > expMs) return false;

    const payload = `${version}:${invId}:${expStr}:${pwFp}`;
    const expectedSig = await hmacSha256Hex(secret, payload);
    if (!timingSafeEqualStr(sig, expectedSig)) return false;

    // Verify password fingerprint so changing password immediately revokes old tokens
    const currentHash = await getAdminPasswordHash(env.DB, invitationId, env);
    if (!currentHash) return false;
    const expectedFp = (await sha256Hex(currentHash)).slice(0, 16);
    return timingSafeEqualStr(pwFp, expectedFp);
  } catch {
    return false;
  }
}

function readBearerToken(request: Request): string | null {
  const auth = request.headers.get('authorization');
  if (!auth) return null;
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

async function getClientFingerprint(request: Request, env: Env): Promise<string> {
  const ip = request.headers.get('cf-connecting-ip') || '127.0.0.1';
  const pepper = env.ADMIN_SESSION_SECRET || 'rate-limit-pepper';
  return (await sha256Hex(`${ip}:${pepper}`)).slice(0, 32);
}

let rateTableReady = false;

async function ensureRateLimitsTable(db: D1Database): Promise<void> {
  if (rateTableReady) return;
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS rate_limits (
        rate_key TEXT PRIMARY KEY,
        hit_count INTEGER NOT NULL DEFAULT 1,
        window_start_ms INTEGER NOT NULL,
        blocked_until_ms INTEGER NOT NULL DEFAULT 0
      )`
    )
    .run();
  rateTableReady = true;
}

/**
 * D1-backed Sliding/Fixed Window Rate Limiter with Brute-Force Lockout.
 */
async function checkRateLimit(
  db: D1Database,
  rateKey: string,
  maxHits: number,
  windowMs: number,
  blockDurationMs = windowMs
): Promise<{ allowed: boolean; retryAfterSec: number }> {
  const now = Date.now();
  try {
    await ensureRateLimitsTable(db);
    const row = await db
      .prepare(
        'SELECT hit_count, window_start_ms, blocked_until_ms FROM rate_limits WHERE rate_key = ?'
      )
      .bind(rateKey)
      .first<{ hit_count: number; window_start_ms: number; blocked_until_ms: number }>();

    if (row && row.blocked_until_ms > now) {
      return {
        allowed: false,
        retryAfterSec: Math.max(1, Math.ceil((row.blocked_until_ms - now) / 1000)),
      };
    }

    if (!row || now - row.window_start_ms >= windowMs) {
      await db
        .prepare(
          `INSERT INTO rate_limits (rate_key, hit_count, window_start_ms, blocked_until_ms)
           VALUES (?, 1, ?, 0)
           ON CONFLICT(rate_key) DO UPDATE SET
             hit_count = 1,
             window_start_ms = excluded.window_start_ms,
             blocked_until_ms = 0`
        )
        .bind(rateKey, now)
        .run();
      return { allowed: true, retryAfterSec: 0 };
    }

    const nextCount = row.hit_count + 1;
    const blockedUntil = nextCount > maxHits ? now + blockDurationMs : 0;

    await db
      .prepare(
        `UPDATE rate_limits
         SET hit_count = ?, blocked_until_ms = ?
         WHERE rate_key = ?`
      )
      .bind(nextCount, blockedUntil, rateKey)
      .run();

    if (nextCount > maxHits) {
      return {
        allowed: false,
        retryAfterSec: Math.max(1, Math.ceil(blockDurationMs / 1000)),
      };
    }

    return { allowed: true, retryAfterSec: 0 };
  } catch {
    // If rate_limits table is not migrated yet, fail open for public reads/writes
    return { allowed: true, retryAfterSec: 0 };
  }
}

async function clearRateLimit(db: D1Database, rateKey: string): Promise<void> {
  try {
    await db.prepare('DELETE FROM rate_limits WHERE rate_key = ?').bind(rateKey).run();
  } catch {
    // ignore
  }
}

function formatRelativeKo(isoStr: string): string {
  const ts = Date.parse(isoStr);
  if (!Number.isFinite(ts)) return isoStr;
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 60) return '방금 전';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}시간 전`;
  const d = new Date(ts);
  return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, '0')}. ${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

function mapGuestbookRow(row: GuestbookRow, includeAdminFields = false) {
  const base = {
    id: row.id,
    name: row.name,
    avatar: VALID_AVATARS.has(row.avatar as AvatarClassId) ? row.avatar : 'knight',
    side: VALID_SIDES.has(row.side as GuestSide) ? row.side : 'both',
    titleBadge: row.title_badge || '🌸 봄날의 하객',
    message: row.message,
    attendance: VALID_ATTENDANCE.has(row.attendance as AttendanceType)
      ? row.attendance
      : 'attend',
    companions: Number(row.companions) || 1,
    meal: VALID_MEALS.has(row.meal as MealType) ? row.meal : 'yes',
    createdAt: formatRelativeKo(row.created_at),
    createdAtISO: row.created_at,
  };
  if (!includeAdminFields) return base;
  return {
    ...base,
    phone: row.phone || '',
    isHidden: Boolean(row.is_hidden),
  };
}

function getAllowedOriginsList(env: Env): string[] {
  return (env.ALLOWED_ORIGINS || 'https://po-mato.github.io')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function isOriginAllowed(origin: string | null, env: Env): boolean {
  if (!origin) return true; // Non-browser or same-origin requests without Origin header
  const allowedList = getAllowedOriginsList(env);
  return allowedList.includes(origin);
}

function corsHeaders(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get('origin');
  const allowedList = getAllowedOriginsList(env);
  const allowOrigin =
    origin && allowedList.includes(origin) ? origin : allowedList[0] || 'https://po-mato.github.io';

  return {
    'access-control-allow-origin': allowOrigin,
    'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'access-control-allow-headers': 'Content-Type, Authorization, X-Edit-Token, X-Invitation-Id',
    'access-control-max-age': '86400',
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'content-security-policy': "default-src 'none'; frame-ancestors 'none'",
    vary: 'Origin',
  };
}

function jsonResponse(
  body: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...extraHeaders,
    },
  });
}

async function getAdminPasswordHash(
  db: D1Database,
  invitationId: string,
  _env?: Env
): Promise<string | null> {
  const row = await db
    .prepare('SELECT password_hash FROM admin_settings WHERE invitation_id = ?')
    .bind(invitationId)
    .first<{ password_hash: string }>();
  return row?.password_hash || null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const cors = corsHeaders(request, env);
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    // Strict Origin validation on state-changing requests
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      const origin = request.headers.get('origin');
      if (origin && !isOriginAllowed(origin, env)) {
        return jsonResponse({ error: 'origin_not_allowed' }, 403, cors);
      }
    }

    const url = new URL(request.url);
    const invitationId = sanitizeInvitationId(
      url.searchParams.get('invitationId') || request.headers.get('x-invitation-id'),
      env.DEFAULT_INVITATION_ID || 'default'
    );

    try {
      // 1. Root & Health Check
      if (url.pathname === '/' || url.pathname === '/api/health') {
        return jsonResponse(
          {
            ok: true,
            service: 'pixel-wedding-quest-api',
            database: 'cloudflare-d1',
          },
          200,
          cors
        );
      }

      // 2. GET /api/guestbook - List visible guestbook entries + summary + reaction counters
      if (url.pathname === '/api/guestbook' && request.method === 'GET') {
        const { results } = await env.DB.prepare(
          `SELECT * FROM guestbook_entries
           WHERE invitation_id = ? AND is_hidden = 0
           ORDER BY created_at DESC
           LIMIT 200`
        )
          .bind(invitationId)
          .all<GuestbookRow>();

        const rows = results || [];
        const entries = rows.map((r) => mapGuestbookRow(r, false));

        const reactionRow = await env.DB.prepare(
          'SELECT blessing_count, snap_count FROM reaction_counters WHERE invitation_id = ?'
        )
          .bind(invitationId)
          .first<{ blessing_count: number; snap_count: number }>();

        let attendingParties = 0;
        let attendingGuests = 0;
        let mealGuests = 0;
        for (const r of rows) {
          if (r.attendance === 'attend') {
            attendingParties += 1;
            const c = Math.max(1, Number(r.companions) || 1);
            attendingGuests += c;
            if (r.meal === 'yes') mealGuests += c;
          }
        }

        return jsonResponse(
          {
            entries,
            summary: {
              totalCount: entries.length,
              attendingParties,
              attendingGuests,
              mealGuests,
            },
            reactions: {
              blessingCount: reactionRow?.blessing_count ?? 128,
              snapCount: reactionRow?.snap_count ?? 12,
            },
          },
          200,
          cors
        );
      }

      // 3. POST /api/guestbook - Create new guestbook + RSVP entry in D1 (Rate limited)
      if (url.pathname === '/api/guestbook' && request.method === 'POST') {
        const clientFp = await getClientFingerprint(request, env);
        const rate = await checkRateLimit(
          env.DB,
          `guestbook_post:${invitationId}:${clientFp}`,
          5,
          10 * 60 * 1000, // 5 posts per 10 minutes per IP
          10 * 60 * 1000
        );
        if (!rate.allowed) {
          return jsonResponse(
            { error: 'rate_limit_exceeded', retryAfterSec: rate.retryAfterSec },
            429,
            { ...cors, 'retry-after': String(rate.retryAfterSec) }
          );
        }

        const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
        if (!body) {
          return jsonResponse({ error: 'invalid_json' }, 400, cors);
        }

        const name = sanitizeText(body.name, 24);
        const message = sanitizeText(body.message, 300);
        if (!name || !message) {
          return jsonResponse({ error: 'name_and_message_required' }, 400, cors);
        }

        const rawAvatar = sanitizeText(body.avatar, 16) as AvatarClassId;
        const avatar: AvatarClassId = VALID_AVATARS.has(rawAvatar) ? rawAvatar : 'knight';

        const rawSide = sanitizeText(body.side, 16) as GuestSide;
        const side: GuestSide = VALID_SIDES.has(rawSide) ? rawSide : 'both';

        const titleBadge = sanitizeText(body.titleBadge, 32) || '🌸 봄날의 하객';

        const rawAttendance = sanitizeText(body.attendance, 16) as AttendanceType;
        const attendance: AttendanceType = VALID_ATTENDANCE.has(rawAttendance)
          ? rawAttendance
          : 'attend';

        const companions =
          attendance === 'absent'
            ? 0
            : Math.min(10, Math.max(1, Number(body.companions) || 1));

        const rawMeal = sanitizeText(body.meal, 16) as MealType;
        const meal: MealType = VALID_MEALS.has(rawMeal) ? rawMeal : 'yes';
        const phone = sanitizeText(body.phone, 24);

        const id = `gb-${crypto.randomUUID()}`;
        const editToken = (crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, '');
        const editTokenHash = await sha256Hex(editToken);
        const now = new Date().toISOString();

        await env.DB.prepare(
          `INSERT INTO guestbook_entries (
            id, invitation_id, name, avatar, side, title_badge, message,
            attendance, companions, meal, phone, is_hidden, edit_token_hash, client_hash, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`
        )
          .bind(
            id,
            invitationId,
            name,
            avatar,
            side,
            titleBadge,
            message,
            attendance,
            companions,
            meal,
            phone,
            editTokenHash,
            clientFp,
            now,
            now
          )
          .run();

        await env.DB.prepare(
          `INSERT INTO reaction_counters (invitation_id, blessing_count, snap_count, updated_at)
           VALUES (?, 129, 12, ?)
           ON CONFLICT(invitation_id) DO UPDATE SET
             blessing_count = blessing_count + 1,
             updated_at = excluded.updated_at`
        )
          .bind(invitationId, now)
          .run();

        const createdRow: GuestbookRow = {
          id,
          invitation_id: invitationId,
          name,
          avatar,
          side,
          title_badge: titleBadge,
          message,
          attendance,
          companions,
          meal,
          phone,
          is_hidden: 0,
          edit_token_hash: editTokenHash,
          client_hash: clientFp,
          created_at: now,
          updated_at: now,
        };

        return jsonResponse(
          {
            entry: mapGuestbookRow(createdRow, false),
            credential: { id, editToken },
          },
          201,
          cors
        );
      }

      // 4. PATCH or DELETE /api/guestbook/:id (by author editToken OR Admin token)
      const itemMatch = url.pathname.match(/^\/api\/guestbook\/([^/]+)$/);
      if (itemMatch && (request.method === 'DELETE' || request.method === 'PATCH')) {
        const clientFp = await getClientFingerprint(request, env);
        const rate = await checkRateLimit(
          env.DB,
          `guestbook_mod:${invitationId}:${clientFp}`,
          15,
          5 * 60 * 1000,
          5 * 60 * 1000
        );
        if (!rate.allowed) {
          return jsonResponse(
            { error: 'rate_limit_exceeded', retryAfterSec: rate.retryAfterSec },
            429,
            { ...cors, 'retry-after': String(rate.retryAfterSec) }
          );
        }

        const entryId = sanitizeText(decodeURIComponent(itemMatch[1]), 64);
        const existing = await env.DB.prepare(
          'SELECT * FROM guestbook_entries WHERE id = ? AND invitation_id = ?'
        )
          .bind(entryId, invitationId)
          .first<GuestbookRow>();

        if (!existing) {
          return jsonResponse({ error: 'not_found' }, 404, cors);
        }

        const adminBearer = readBearerToken(request);
        const isAdmin = await verifyAdminToken(adminBearer, invitationId, env);
        const editToken = request.headers.get('x-edit-token') || '';
        const editTokenHash = editToken ? await sha256Hex(editToken) : '';
        const isOwner =
          Boolean(editTokenHash) &&
          Boolean(existing.edit_token_hash) &&
          timingSafeEqualStr(editTokenHash, existing.edit_token_hash!);

        if (!isAdmin && !isOwner) {
          return jsonResponse({ error: 'unauthorized' }, 401, cors);
        }

        if (request.method === 'DELETE') {
          await env.DB.prepare(
            'DELETE FROM guestbook_entries WHERE id = ? AND invitation_id = ?'
          )
            .bind(entryId, invitationId)
            .run();
          return jsonResponse({ ok: true, deletedId: entryId }, 200, cors);
        }

        const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
        if (!body) return jsonResponse({ error: 'invalid_json' }, 400, cors);

        const nextMessage =
          typeof body.message === 'string'
            ? sanitizeText(body.message, 300)
            : existing.message;
        const nextName =
          typeof body.name === 'string' ? sanitizeText(body.name, 24) : existing.name;
        const nextHidden =
          isAdmin && typeof body.isHidden === 'boolean'
            ? body.isHidden
              ? 1
              : 0
            : existing.is_hidden;
        const now = new Date().toISOString();

        await env.DB.prepare(
          `UPDATE guestbook_entries
           SET name = ?, message = ?, is_hidden = ?, updated_at = ?
           WHERE id = ? AND invitation_id = ?`
        )
          .bind(nextName, nextMessage, nextHidden, now, entryId, invitationId)
          .run();

        const updated = await env.DB.prepare(
          'SELECT * FROM guestbook_entries WHERE id = ? AND invitation_id = ?'
        )
          .bind(entryId, invitationId)
          .first<GuestbookRow>();

        return jsonResponse(
          { entry: updated ? mapGuestbookRow(updated, isAdmin) : null },
          200,
          cors
        );
      }

      // 5. GET & POST /api/reactions (Live blessing hearts & photobooth snap counter)
      if (url.pathname === '/api/reactions') {
        if (request.method === 'GET') {
          const row = await env.DB.prepare(
            'SELECT blessing_count, snap_count FROM reaction_counters WHERE invitation_id = ?'
          )
            .bind(invitationId)
            .first<{ blessing_count: number; snap_count: number }>();
          return jsonResponse(
            {
              blessingCount: row?.blessing_count ?? 128,
              snapCount: row?.snap_count ?? 12,
            },
            200,
            cors
          );
        }

        if (request.method === 'POST') {
          const clientFp = await getClientFingerprint(request, env);
          const rate = await checkRateLimit(
            env.DB,
            `reaction_post:${invitationId}:${clientFp}`,
            30,
            60 * 1000, // max 30 reactions per minute per IP
            60 * 1000
          );
          if (!rate.allowed) {
            return jsonResponse(
              { error: 'rate_limit_exceeded', retryAfterSec: rate.retryAfterSec },
              429,
              { ...cors, 'retry-after': String(rate.retryAfterSec) }
            );
          }

          const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
          const kind = body.kind === 'snap' ? 'snap' : 'blessing';
          const now = new Date().toISOString();

          if (kind === 'snap') {
            await env.DB.prepare(
              `INSERT INTO reaction_counters (invitation_id, blessing_count, snap_count, updated_at)
               VALUES (?, 128, 13, ?)
               ON CONFLICT(invitation_id) DO UPDATE SET
                 snap_count = snap_count + 1,
                 updated_at = excluded.updated_at`
            )
              .bind(invitationId, now)
              .run();
          } else {
            await env.DB.prepare(
              `INSERT INTO reaction_counters (invitation_id, blessing_count, snap_count, updated_at)
               VALUES (?, 129, 12, ?)
               ON CONFLICT(invitation_id) DO UPDATE SET
                 blessing_count = blessing_count + 1,
                 updated_at = excluded.updated_at`
            )
              .bind(invitationId, now)
              .run();
          }

          const row = await env.DB.prepare(
            'SELECT blessing_count, snap_count FROM reaction_counters WHERE invitation_id = ?'
          )
            .bind(invitationId)
            .first<{ blessing_count: number; snap_count: number }>();

          return jsonResponse(
            {
              blessingCount: row?.blessing_count ?? 129,
              snapCount: row?.snap_count ?? 12,
            },
            200,
            cors
          );
        }
      }

      // 6. GET /api/config - Public cloud wedding config (if saved via Admin Console)
      if (url.pathname === '/api/config' && request.method === 'GET') {
        const row = await env.DB.prepare(
          'SELECT config_json, revision, updated_at FROM invitation_configs WHERE invitation_id = ?'
        )
          .bind(invitationId)
          .first<{ config_json: string; revision: number; updated_at: string }>();

        if (!row) {
          return jsonResponse({ config: null, revision: 0, updatedAt: null }, 200, cors);
        }

        return jsonResponse(
          {
            config: sanitizeWeddingConfigObject(JSON.parse(row.config_json)),
            revision: row.revision,
            updatedAt: row.updated_at,
          },
          200,
          cors
        );
      }

      // 7. POST /api/admin/login - Authenticate Admin with Brute-Force Protection + PBKDF2
      if (url.pathname === '/api/admin/login' && request.method === 'POST') {
        const secret = getRequiredSessionSecret(env);
        if (!secret) {
          return jsonResponse({ error: 'admin_secret_not_configured' }, 503, cors);
        }

        const clientFp = await getClientFingerprint(request, env);
        const loginRateKey = `admin_login:${invitationId}:${clientFp}`;
        const rate = await checkRateLimit(
          env.DB,
          loginRateKey,
          5,
          15 * 60 * 1000, // 5 attempts per 15 minutes
          15 * 60 * 1000  // 15 minute lockout
        );
        if (!rate.allowed) {
          return jsonResponse(
            {
              error: 'too_many_login_attempts',
              retryAfterSec: rate.retryAfterSec,
            },
            429,
            { ...cors, 'retry-after': String(rate.retryAfterSec) }
          );
        }

        const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
        const password = typeof body?.password === 'string' ? body.password.trim() : '';
        if (!password || password.length > 128) {
          return jsonResponse({ error: 'password_required' }, 400, cors);
        }

        let storedHash = await getAdminPasswordHash(env.DB, invitationId, env);
        if (!storedHash) {
          return jsonResponse({ error: 'admin_not_initialized' }, 503, cors);
        }

        const verification = await verifyPasswordAgainstStoredHash(password, storedHash);
        if (!verification.valid) {
          return jsonResponse({ error: 'unauthorized' }, 401, cors);
        }

        // Transparently upgrade legacy SHA-256 password hash to salted PBKDF2-SHA256
        if (verification.needsRehash) {
          storedHash = await hashPasswordPbkdf2(password);
          const now = new Date().toISOString();
          await env.DB.prepare(
            `UPDATE admin_settings SET password_hash = ?, updated_at = ? WHERE invitation_id = ?`
          )
            .bind(storedHash, now, invitationId)
            .run();
        }

        // Reset failed login counter on success
        await clearRateLimit(env.DB, loginRateKey);

        const session = await createAdminToken(invitationId, storedHash, secret);
        return jsonResponse({ ok: true, ...session }, 200, cors);
      }

      // 8. GET /api/admin/overview - Full RSVP & Guestbook stats + all rows for Admin Console
      if (url.pathname === '/api/admin/overview' && request.method === 'GET') {
        const token = readBearerToken(request);
        if (!(await verifyAdminToken(token, invitationId, env))) {
          return jsonResponse({ error: 'unauthorized' }, 401, cors);
        }

        const { results } = await env.DB.prepare(
          `SELECT * FROM guestbook_entries
           WHERE invitation_id = ?
           ORDER BY created_at DESC`
        )
          .bind(invitationId)
          .all<GuestbookRow>();

        const rows = results || [];
        const entries = rows.map((r) => mapGuestbookRow(r, true));

        let attendingParties = 0;
        let absentParties = 0;
        let undecidedParties = 0;
        let attendingGuests = 0;
        let groomSideGuests = 0;
        let brideSideGuests = 0;
        let mealYesGuests = 0;

        for (const r of rows) {
          if (r.is_hidden) continue;
          const count = Math.max(1, Number(r.companions) || 1);
          if (r.attendance === 'attend') {
            attendingParties += 1;
            attendingGuests += count;
            if (r.side === 'groom') groomSideGuests += count;
            else if (r.side === 'bride') brideSideGuests += count;
            if (r.meal === 'yes') mealYesGuests += count;
          } else if (r.attendance === 'absent') {
            absentParties += 1;
          } else {
            undecidedParties += 1;
          }
        }

        return jsonResponse(
          {
            entries,
            stats: {
              totalEntries: rows.length,
              attendingParties,
              absentParties,
              undecidedParties,
              attendingGuests,
              groomSideGuests,
              brideSideGuests,
              mealYesGuests,
            },
          },
          200,
          cors
        );
      }

      // 9. PUT /api/admin/config - Save sanitized WeddingConfig to D1
      if (url.pathname === '/api/admin/config' && request.method === 'PUT') {
        const token = readBearerToken(request);
        if (!(await verifyAdminToken(token, invitationId, env))) {
          return jsonResponse({ error: 'unauthorized' }, 401, cors);
        }

        const rawText = await request.text();
        if (rawText.length > MAX_CONFIG_PAYLOAD_BYTES) {
          return jsonResponse({ error: 'payload_too_large' }, 413, cors);
        }

        let body: Record<string, unknown> | null = null;
        try {
          body = JSON.parse(rawText) as Record<string, unknown>;
        } catch {
          return jsonResponse({ error: 'invalid_json' }, 400, cors);
        }

        const sanitizedConfig = sanitizeWeddingConfigObject(body?.config);
        if (!sanitizedConfig) {
          return jsonResponse({ error: 'invalid_config' }, 400, cors);
        }

        const now = new Date().toISOString();
        const configJson = JSON.stringify(sanitizedConfig);

        await env.DB.prepare(
          `INSERT INTO invitation_configs (invitation_id, config_json, revision, updated_at)
           VALUES (?, ?, 1, ?)
           ON CONFLICT(invitation_id) DO UPDATE SET
             config_json = excluded.config_json,
             revision = invitation_configs.revision + 1,
             updated_at = excluded.updated_at`
        )
          .bind(invitationId, configJson, now)
          .run();

        const updated = await env.DB.prepare(
          'SELECT revision, updated_at FROM invitation_configs WHERE invitation_id = ?'
        )
          .bind(invitationId)
          .first<{ revision: number; updated_at: string }>();

        return jsonResponse(
          {
            ok: true,
            revision: updated?.revision ?? 1,
            updatedAt: updated?.updated_at ?? now,
          },
          200,
          cors
        );
      }

      // 10. POST /api/admin/password - Update Admin Password in D1 using PBKDF2-SHA256
      if (url.pathname === '/api/admin/password' && request.method === 'POST') {
        const secret = getRequiredSessionSecret(env);
        if (!secret) {
          return jsonResponse({ error: 'admin_secret_not_configured' }, 503, cors);
        }

        const token = readBearerToken(request);
        if (!(await verifyAdminToken(token, invitationId, env))) {
          return jsonResponse({ error: 'unauthorized' }, 401, cors);
        }

        const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
        const newPassword = typeof body?.newPassword === 'string' ? body.newPassword.trim() : '';
        if (newPassword.length < 8 || newPassword.length > 128) {
          return jsonResponse({ error: 'password_must_be_8_to_128_chars' }, 400, cors);
        }

        const pbkdf2Hash = await hashPasswordPbkdf2(newPassword);
        const now = new Date().toISOString();

        await env.DB.prepare(
          `INSERT INTO admin_settings (invitation_id, password_hash, updated_at)
           VALUES (?, ?, ?)
           ON CONFLICT(invitation_id) DO UPDATE SET
             password_hash = excluded.password_hash,
             updated_at = excluded.updated_at`
        )
          .bind(invitationId, pbkdf2Hash, now)
          .run();

        // Issue a fresh token tied to the new password hash so the current admin stays logged in
        const session = await createAdminToken(invitationId, pbkdf2Hash, secret);
        return jsonResponse({ ok: true, updatedAt: now, ...session }, 200, cors);
      }

      return jsonResponse({ error: 'not_found' }, 404, cors);
    } catch (err) {
      console.error('Worker internal error:', err);
      return jsonResponse({ error: 'internal_error' }, 500, cors);
    }
  },
};
