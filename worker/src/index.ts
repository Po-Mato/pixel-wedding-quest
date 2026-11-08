export interface Env {
  DB: D1Database;
  ALLOWED_ORIGINS?: string;
  DEFAULT_INVITATION_ID?: string;
  ADMIN_SESSION_SECRET?: string;
  DEFAULT_ADMIN_PASSWORD?: string;
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

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function getSessionSecret(env: Env): string {
  return env.ADMIN_SESSION_SECRET || 'pixel-wedding-quest-hmac-secret-2027';
}

async function createAdminToken(invitationId: string, env: Env): Promise<{ token: string; expiresAt: string }> {
  const expMs = Date.now() + 24 * 60 * 60 * 1000;
  const payload = `${invitationId}:${expMs}`;
  const sig = await sha256Hex(`${payload}:${getSessionSecret(env)}`);
  const token = btoa(`${payload}:${sig}`);
  return { token, expiresAt: new Date(expMs).toISOString() };
}

async function verifyAdminToken(token: string | null, invitationId: string, env: Env): Promise<boolean> {
  if (!token) return false;
  try {
    const decoded = atob(token);
    const [invId, expStr, sig] = decoded.split(':');
    if (invId !== invitationId) return false;
    const expMs = Number(expStr);
    if (!Number.isFinite(expMs) || Date.now() > expMs) return false;
    const expectedSig = await sha256Hex(`${invId}:${expStr}:${getSessionSecret(env)}`);
    return sig === expectedSig;
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

function corsHeaders(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get('origin') || '*';
  const allowedList = (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const allowOrigin =
    allowedList.length === 0 || allowedList.includes(origin) || origin.startsWith('http://localhost:')
      ? origin
      : allowedList[0];

  return {
    'access-control-allow-origin': allowOrigin,
    'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'access-control-allow-headers': 'Content-Type, Authorization, X-Edit-Token, X-Invitation-Id',
    'access-control-max-age': '86400',
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

async function getAdminPasswordHash(db: D1Database, invitationId: string, env: Env): Promise<string> {
  const row = await db
    .prepare('SELECT password_hash FROM admin_settings WHERE invitation_id = ?')
    .bind(invitationId)
    .first<{ password_hash: string }>();
  if (row?.password_hash) return row.password_hash;
  const defaultPw = env.DEFAULT_ADMIN_PASSWORD || 'wedding2026';
  return sha256Hex(defaultPw);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const cors = corsHeaders(request, env);
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);
    const invitationId =
      url.searchParams.get('invitationId') ||
      request.headers.get('x-invitation-id') ||
      env.DEFAULT_INVITATION_ID ||
      'default';

    try {
      // 1. Root & Health Check
      if (url.pathname === '/' || url.pathname === '/api/health') {
        return jsonResponse(
          {
            ok: true,
            service: 'pixel-wedding-quest-api',
            database: 'cloudflare-d1',
            invitationId,
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

      // 3. POST /api/guestbook - Create new guestbook + RSVP entry in D1
      if (url.pathname === '/api/guestbook' && request.method === 'POST') {
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
        const editToken = crypto.randomUUID().replace(/-/g, '');
        const editTokenHash = await sha256Hex(editToken);
        const clientIp = request.headers.get('cf-connecting-ip') || 'local';
        const clientHash = await sha256Hex(clientIp);
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
            clientHash,
            now,
            now
          )
          .run();

        // Increment blessing counter automatically on new guestbook entry
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
          client_hash: clientHash,
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
        const entryId = decodeURIComponent(itemMatch[1]);
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
        const isOwner =
          Boolean(editToken) &&
          Boolean(existing.edit_token_hash) &&
          (await sha256Hex(editToken)) === existing.edit_token_hash;

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
            config: JSON.parse(row.config_json),
            revision: row.revision,
            updatedAt: row.updated_at,
          },
          200,
          cors
        );
      }

      // 7. POST /api/admin/login - Authenticate Admin and return signed token
      if (url.pathname === '/api/admin/login' && request.method === 'POST') {
        const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
        const password = typeof body?.password === 'string' ? body.password.trim() : '';
        if (!password) {
          return jsonResponse({ error: 'password_required' }, 400, cors);
        }

        const expectedHash = await getAdminPasswordHash(env.DB, invitationId, env);
        const inputHash = await sha256Hex(password);
        if (inputHash !== expectedHash) {
          return jsonResponse({ error: 'unauthorized' }, 401, cors);
        }

        const session = await createAdminToken(invitationId, env);
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

      // 9. PUT /api/admin/config - Save WeddingConfig to D1 so all visitors get it
      if (url.pathname === '/api/admin/config' && request.method === 'PUT') {
        const token = readBearerToken(request);
        if (!(await verifyAdminToken(token, invitationId, env))) {
          return jsonResponse({ error: 'unauthorized' }, 401, cors);
        }

        const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
        if (!body || !body.config) {
          return jsonResponse({ error: 'invalid_config' }, 400, cors);
        }

        const now = new Date().toISOString();
        const configJson = JSON.stringify(body.config);

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

      // 10. POST /api/admin/password - Update Admin Password in D1
      if (url.pathname === '/api/admin/password' && request.method === 'POST') {
        const token = readBearerToken(request);
        if (!(await verifyAdminToken(token, invitationId, env))) {
          return jsonResponse({ error: 'unauthorized' }, 401, cors);
        }

        const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
        const newPassword = typeof body?.newPassword === 'string' ? body.newPassword.trim() : '';
        if (newPassword.length < 4) {
          return jsonResponse({ error: 'password_too_short' }, 400, cors);
        }

        const hash = await sha256Hex(newPassword);
        const now = new Date().toISOString();

        await env.DB.prepare(
          `INSERT INTO admin_settings (invitation_id, password_hash, updated_at)
           VALUES (?, ?, ?)
           ON CONFLICT(invitation_id) DO UPDATE SET
             password_hash = excluded.password_hash,
             updated_at = excluded.updated_at`
        )
          .bind(invitationId, hash, now)
          .run();

        return jsonResponse({ ok: true, updatedAt: now }, 200, cors);
      }

      return jsonResponse({ error: 'not_found' }, 404, cors);
    } catch (err) {
      return jsonResponse(
        {
          error: 'internal_error',
          message: err instanceof Error ? err.message : 'Unknown error',
        },
        500,
        cors
      );
    }
  },
};
