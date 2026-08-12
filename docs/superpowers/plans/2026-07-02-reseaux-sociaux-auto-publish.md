# Section Réseaux sociaux — Auto-publish Instagram + Facebook — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter une section back-office `/admin/reseaux-sociaux` où Stéphane connecte ses comptes Meta une fois puis publie un véhicule/moto (carrousel photo + caption) sur Instagram + Facebook en un clic.

**Architecture:** 4 briques isolées — génération de caption (pure), stockage de connexion (Firestore Admin SDK), OAuth Meta (échange de token), publication Graph API (carrousel IG + multi-photo FB) — assemblées par une server action et une UI admin. Tokens en `meta/social` (admin-only), log en `social_posts`.

**Tech Stack:** Next.js 14 App Router, TypeScript, Firebase Admin SDK, Meta Graph API (fetch global), Vitest + RTL.

## Global Constraints

- **Graph API version épinglée** : `v23.0` dans une constante unique (`GRAPH_VERSION`). Vérifier/mettre à jour la dernière stable au moment de coder.
- **Prix véhicules/motos en euros** (pas centimes) — affichage direct.
- **URLs images** passées à Meta = **absolues HTTPS** obligatoire → convertir les chemins relatifs `/images/...` via `absoluteUrl()` (`lib/seo`). Publication réelle **uniquement depuis prod/preview** (domaine public).
- **Tokens jamais exposés au client** : lus serveur seul via Admin SDK.
- **Design system BO** = « iOS Clarity » (vars `--blue`, `--surface`, `--text`…), pas les tokens storefront Volcanic.
- **Prettier + eslint** via husky au commit (déjà en place).
- **Aucune erreur Meta avalée** : toujours remontée à l'appelant.
- Périmètre : **véhicules + motos** seulement (pas pièces), **carrousel** feed (pas Reels/Stories), **publication immédiate** (pas de planification).

---

### Task 1: Générateur de caption (pur)

**Files:**

- Create: `lib/social/caption.ts`
- Test: `tests/unit/social-caption.test.ts`

**Interfaces:**

- Consumes: `Vehicule` (`@/lib/vehicules`), `Moto` (`@/lib/motos`).
- Produces: `buildCaption(item: Vehicule | Moto): string`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/social-caption.test.ts
import { describe, it, expect } from 'vitest';
import { buildCaption } from '@/lib/social/caption';
import type { Vehicule } from '@/lib/vehicules';
import type { Moto } from '@/lib/motos';

const veh: Vehicule = {
  id: 'v1',
  type: 'occasion',
  marque: 'Peugeot',
  modele: '208',
  annee: 2021,
  km: 30000,
  energie: 'Essence',
  transmission: 'Manuelle',
  places: 5,
  options: [],
  prix: 12900,
  mensualite: 199,
  image: '/x.jpg',
  images: ['/x.jpg'],
  description: '',
  caracteristiques: {},
  reference: 'GP-V1',
  disponibilite: 'disponible',
  updatedAt: '2026-07-01T00:00:00.000Z',
};
const moto: Moto = {
  id: 'm1',
  type: 'occasion',
  marque: 'Yamaha',
  modele: 'MT-07',
  annee: 2022,
  km: 12000,
  categorie: 'Roadster',
  energie: 'Essence',
  options: [],
  prix: 6900,
  mensualite: 99,
  image: '/m.jpg',
  images: ['/m.jpg'],
  description: '',
  caracteristiques: { permis: 'A2' },
  reference: 'GP-M1',
  disponibilite: 'disponible',
  updatedAt: '2026-07-01T00:00:00.000Z',
};

describe('buildCaption', () => {
  it('véhicule : contient marque, modèle, prix et hashtags', () => {
    const c = buildCaption(veh);
    expect(c).toContain('Peugeot 208');
    expect(c).toContain('12 900');
    expect(c).toMatch(/#Guadeloupe/);
    expect(c).toMatch(/#971/);
  });
  it('moto : contient le permis et la catégorie', () => {
    const c = buildCaption(moto);
    expect(c).toContain('Yamaha MT-07');
    expect(c).toContain('A2');
    expect(c).toContain('Roadster');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/social-caption.test.ts`
Expected: FAIL — `buildCaption` not exported / module missing.

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/social/caption.ts
import type { Vehicule } from '@/lib/vehicules';
import type { Moto } from '@/lib/motos';

function isMoto(item: Vehicule | Moto): item is Moto {
  return 'categorie' in item;
}

/**
 * Caption prête à publier (éditable ensuite par l'admin). Réutilise l'esprit
 * du générateur Leboncoin : titre + specs clés + accroche + hashtags 971.
 */
export function buildCaption(item: Vehicule | Moto): string {
  const prix = item.prix.toLocaleString('fr-FR');
  const lines: string[] = [];
  lines.push(`🚗 ${item.marque} ${item.modele} ${item.annee} — ${prix} €`);
  lines.push('');
  lines.push(`• ${item.km.toLocaleString('fr-FR')} km`);
  if (isMoto(item)) {
    lines.push(`• Catégorie : ${item.categorie}`);
    if (item.caracteristiques.permis) lines.push(`• Permis : ${item.caracteristiques.permis}`);
  } else {
    lines.push(`• ${item.energie} · ${item.transmission}`);
  }
  lines.push(`• Financement possible · Garantie incluse`);
  lines.push('');
  lines.push('📍 Car Performance — Guadeloupe (971). DM ou appel pour un essai.');
  lines.push('');
  const type = item.type === 'neuf' ? '#Neuf' : '#Occasion';
  const engin = isMoto(item) ? '#Moto' : '#Voiture';
  lines.push(
    `#Guadeloupe #971 #CarPerformance ${engin} ${type} ` +
      `#${item.marque.replace(/\s+/g, '')} #APVendre`
  );
  return lines.join('\n');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/social-caption.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/social/caption.ts tests/unit/social-caption.test.ts
git commit -m "feat(social): générateur de caption véhicule/moto"
```

---

### Task 2: Config, types, stockage de connexion

**Files:**

- Create: `lib/social/config.ts`, `lib/social/types.ts`, `lib/social/connection.ts`
- Test: `tests/unit/social-connection.test.ts`

**Interfaces:**

- Consumes: `getAdminFirestore` (`@/lib/firebase-admin`).
- Produces:
  - `GRAPH_VERSION`, `GRAPH_BASE`, `OAUTH_DIALOG`, `SOCIAL_SCOPES`, `metaAppId()`, `metaAppSecret()` (config).
  - `SocialConnection`, `PublishInput`, `PublishResult`, `SocialPostLog` (types).
  - `getSocialConnection(): Promise<SocialConnection | null>`, `saveSocialConnection(c): Promise<void>`, `clearSocialConnection(): Promise<void>`, `logSocialPost(e): Promise<void>`, `getRecentSocialPosts(): Promise<SocialPostLog[]>`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/social-connection.test.ts
import { describe, it, expect, vi } from 'vitest';
import type { SocialConnection } from '@/lib/social/types';

const store = new Map<string, unknown>();
const fakeDb = {
  doc: (path: string) => ({
    get: async () => ({ exists: store.has(path), data: () => store.get(path) }),
    set: async (v: unknown) => void store.set(path, v),
    delete: async () => void store.delete(path),
  }),
  collection: () => ({ add: async () => ({ id: 'x' }) }),
};
vi.mock('@/lib/firebase-admin', () => ({ getAdminFirestore: () => fakeDb }));

const conn: SocialConnection = {
  connected: true,
  pageId: 'p1',
  pageName: 'Car Performance',
  pageAccessToken: 'TOK',
  igUserId: 'ig1',
  igUsername: 'carperf',
  connectedAt: '2026-07-02T00:00:00.000Z',
};

describe('connection storage', () => {
  it('save puis get renvoie la connexion ; clear la supprime', async () => {
    const { saveSocialConnection, getSocialConnection, clearSocialConnection } =
      await import('@/lib/social/connection');
    expect(await getSocialConnection()).toBeNull();
    await saveSocialConnection(conn);
    expect((await getSocialConnection())?.pageId).toBe('p1');
    await clearSocialConnection();
    expect(await getSocialConnection()).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/social-connection.test.ts`
Expected: FAIL — modules missing.

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/social/config.ts
export const GRAPH_VERSION = 'v23.0';
export const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;
export const OAUTH_DIALOG = `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`;
export const SOCIAL_SCOPES = [
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_posts',
  'instagram_basic',
  'instagram_content_publish',
].join(',');

export function metaAppId(): string {
  const v = process.env.META_APP_ID;
  if (!v) throw new Error('META_APP_ID manquant');
  return v;
}
export function metaAppSecret(): string {
  const v = process.env.META_APP_SECRET;
  if (!v) throw new Error('META_APP_SECRET manquant');
  return v;
}
```

```ts
// lib/social/types.ts
export interface SocialConnection {
  connected: true;
  pageId: string;
  pageName: string;
  pageAccessToken: string;
  igUserId: string;
  igUsername: string;
  connectedAt: string;
}
export interface PublishInput {
  imageUrls: string[];
  caption: string;
  toInstagram: boolean;
  toFacebook: boolean;
}
export interface PublishResult {
  instagram?: { mediaId: string; permalink?: string };
  facebook?: { postId: string };
  errors: string[];
}
export interface SocialPostLog {
  itemId: string;
  itemType: 'vehicule' | 'moto';
  platforms: string[];
  caption: string;
  postedAt: string;
  igPermalink?: string;
  fbPostId?: string;
}
```

```ts
// lib/social/connection.ts
import { getAdminFirestore } from '@/lib/firebase-admin';
import type { SocialConnection, SocialPostLog } from './types';

const CONNECTION_DOC = 'meta/social';
const POSTS_COLLECTION = 'social_posts';

export async function getSocialConnection(): Promise<SocialConnection | null> {
  const snap = await getAdminFirestore().doc(CONNECTION_DOC).get();
  return snap.exists ? (snap.data() as SocialConnection) : null;
}
export async function saveSocialConnection(c: SocialConnection): Promise<void> {
  await getAdminFirestore().doc(CONNECTION_DOC).set(c);
}
export async function clearSocialConnection(): Promise<void> {
  await getAdminFirestore().doc(CONNECTION_DOC).delete();
}
export async function logSocialPost(entry: SocialPostLog): Promise<void> {
  await getAdminFirestore().collection(POSTS_COLLECTION).add(entry);
}
export async function getRecentSocialPosts(): Promise<SocialPostLog[]> {
  const snap = await getAdminFirestore()
    .collection(POSTS_COLLECTION)
    .orderBy('postedAt', 'desc')
    .limit(100)
    .get();
  return snap.docs.map((d) => d.data() as SocialPostLog);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/social-connection.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/social/config.ts lib/social/types.ts lib/social/connection.ts tests/unit/social-connection.test.ts
git commit -m "feat(social): config, types, stockage connexion Firestore"
```

---

### Task 3: OAuth — URL d'autorisation + échange de token

**Files:**

- Create: `lib/social/oauth.ts`
- Test: `tests/unit/social-oauth.test.ts`

**Interfaces:**

- Consumes: config (Task 2), `SocialConnection` (Task 2).
- Produces: `buildAuthUrl(redirectUri: string, state: string): string`, `exchangeCodeForConnection(code: string, redirectUri: string, nowIso: string): Promise<SocialConnection>`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/social-oauth.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubEnv('META_APP_ID', 'APPID');
vi.stubEnv('META_APP_SECRET', 'SECRET');

function jsonRes(body: unknown) {
  return { ok: true, json: async () => body } as Response;
}

beforeEach(() => vi.unstubAllGlobals());

describe('buildAuthUrl', () => {
  it('inclut client_id, redirect_uri, state, scope', async () => {
    const { buildAuthUrl } = await import('@/lib/social/oauth');
    const url = buildAuthUrl('https://x.app/cb', 'STATE123');
    expect(url).toContain('client_id=APPID');
    expect(url).toContain('state=STATE123');
    expect(url).toContain('instagram_content_publish');
    expect(url).toContain(encodeURIComponent('https://x.app/cb'));
  });
});

describe('exchangeCodeForConnection', () => {
  it('enchaîne short→long token→page→IG et renvoie la connexion', async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (u: string) => {
        calls.push(u);
        if (u.includes('/oauth/access_token') && u.includes('code='))
          return jsonRes({ access_token: 'SHORT' });
        if (u.includes('fb_exchange_token')) return jsonRes({ access_token: 'LONG' });
        if (u.includes('/me/accounts'))
          return jsonRes({
            data: [{ id: 'PAGE1', name: 'Car Performance', access_token: 'PAGETOK' }],
          });
        if (u.includes('instagram_business_account'))
          return jsonRes({ instagram_business_account: { id: 'IG1', username: 'carperf' } });
        throw new Error('unexpected ' + u);
      })
    );
    const { exchangeCodeForConnection } = await import('@/lib/social/oauth');
    const conn = await exchangeCodeForConnection(
      'CODE',
      'https://x.app/cb',
      '2026-07-02T00:00:00.000Z'
    );
    expect(conn.pageId).toBe('PAGE1');
    expect(conn.pageAccessToken).toBe('PAGETOK');
    expect(conn.igUserId).toBe('IG1');
    expect(conn.igUsername).toBe('carperf');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/social-oauth.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/social/oauth.ts
import { GRAPH_BASE, OAUTH_DIALOG, SOCIAL_SCOPES, metaAppId, metaAppSecret } from './config';
import type { SocialConnection } from './types';

export function buildAuthUrl(redirectUri: string, state: string): string {
  const p = new URLSearchParams({
    client_id: metaAppId(),
    redirect_uri: redirectUri,
    state,
    scope: SOCIAL_SCOPES,
    response_type: 'code',
  });
  return `${OAUTH_DIALOG}?${p.toString()}`;
}

async function getJson(url: string): Promise<Record<string, unknown>> {
  const res = await fetch(url);
  const body = (await res.json()) as Record<string, unknown>;
  if (!res.ok || body.error) {
    const err = body.error as { message?: string } | undefined;
    throw new Error(`Meta OAuth: ${err?.message ?? res.status}`);
  }
  return body;
}

export async function exchangeCodeForConnection(
  code: string,
  redirectUri: string,
  nowIso: string
): Promise<SocialConnection> {
  const id = metaAppId();
  const secret = metaAppSecret();

  const short = await getJson(
    `${GRAPH_BASE}/oauth/access_token?client_id=${id}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&client_secret=${secret}&code=${encodeURIComponent(code)}`
  );
  const long = await getJson(
    `${GRAPH_BASE}/oauth/access_token?grant_type=fb_exchange_token` +
      `&client_id=${id}&client_secret=${secret}` +
      `&fb_exchange_token=${short.access_token as string}`
  );
  const pages = await getJson(
    `${GRAPH_BASE}/me/accounts?access_token=${long.access_token as string}`
  );
  const page = (pages.data as Array<{ id: string; name: string; access_token: string }>)[0];
  if (!page) throw new Error('Aucune Page Facebook liée à ce compte');

  const ig = await getJson(
    `${GRAPH_BASE}/${page.id}?fields=instagram_business_account{id,username}` +
      `&access_token=${page.access_token}`
  );
  const igAcc = ig.instagram_business_account as { id: string; username: string } | undefined;
  if (!igAcc) throw new Error('Aucun compte Instagram Business lié à la Page');

  return {
    connected: true,
    pageId: page.id,
    pageName: page.name,
    pageAccessToken: page.access_token,
    igUserId: igAcc.id,
    igUsername: igAcc.username,
    connectedAt: nowIso,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/social-oauth.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/social/oauth.ts tests/unit/social-oauth.test.ts
git commit -m "feat(social): OAuth Meta — URL auth + échange de token"
```

---

### Task 4: Routes OAuth (connect + callback)

**Files:**

- Create: `app/api/admin/social/connect/route.ts`, `app/api/admin/social/callback/route.ts`
- Test: `tests/unit/social-oauth-routes.test.ts`

**Interfaces:**

- Consumes: `buildAuthUrl`, `exchangeCodeForConnection` (Task 3), `saveSocialConnection` (Task 2), `requireAdmin` (`@/lib/admin/auth`).
- Produces: `GET` handlers. Callback stocke la connexion et redirige `/admin/reseaux-sociaux?connected=1` (ou `?error=...`).

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/social-oauth-routes.test.ts
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/admin/auth', () => ({
  requireAdmin: vi.fn(async () => ({ email: 'a@b.c' })),
  AdminError: class extends Error {
    status = 401;
  },
}));
const saveMock = vi.fn(async () => {});
vi.mock('@/lib/social/connection', () => ({ saveSocialConnection: saveMock }));
vi.mock('@/lib/social/oauth', () => ({
  buildAuthUrl: (uri: string, state: string) => `https://fb/dialog?redirect=${uri}&state=${state}`,
  exchangeCodeForConnection: vi.fn(async () => ({ pageId: 'P', connected: true })),
}));

describe('callback OAuth', () => {
  it('rejette si le state ne correspond pas au cookie', async () => {
    const { GET } = await import('@/app/api/admin/social/callback/route');
    const req = new Request('https://x.app/api/admin/social/callback?code=C&state=BAD', {
      headers: { cookie: 'social_oauth_state=GOOD' },
    });
    const res = await GET(req as never);
    expect(res.headers.get('location')).toContain('error=');
    expect(saveMock).not.toHaveBeenCalled();
  });

  it('state OK → stocke la connexion et redirige connected=1', async () => {
    const { GET } = await import('@/app/api/admin/social/callback/route');
    const req = new Request('https://x.app/api/admin/social/callback?code=C&state=GOOD', {
      headers: { cookie: 'social_oauth_state=GOOD' },
    });
    const res = await GET(req as never);
    expect(saveMock).toHaveBeenCalled();
    expect(res.headers.get('location')).toContain('connected=1');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/social-oauth-routes.test.ts`
Expected: FAIL — routes missing.

- [ ] **Step 3: Write minimal implementation**

```ts
// app/api/admin/social/connect/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin, AdminError } from '@/lib/admin/auth';
import { buildAuthUrl } from '@/lib/social/oauth';

export const dynamic = 'force-dynamic';

function randomState(): string {
  // crypto global (Node 18+/edge) — 16 octets hex.
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AdminError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
  const state = randomState();
  const redirectUri = new URL('/api/admin/social/callback', request.nextUrl.origin).toString();
  const res = NextResponse.redirect(buildAuthUrl(redirectUri, state));
  res.cookies.set('social_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });
  return res;
}
```

```ts
// app/api/admin/social/callback/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin, AdminError } from '@/lib/admin/auth';
import { exchangeCodeForConnection } from '@/lib/social/oauth';
import { saveSocialConnection } from '@/lib/social/connection';

export const dynamic = 'force-dynamic';

const DEST = '/admin/reseaux-sociaux';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AdminError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const cookieState = request.cookies.get('social_oauth_state')?.value;

  if (!code || !state || !cookieState || state !== cookieState) {
    return NextResponse.redirect(new URL(`${DEST}?error=state`, origin));
  }
  try {
    const redirectUri = new URL('/api/admin/social/callback', origin).toString();
    const conn = await exchangeCodeForConnection(code, redirectUri, new Date().toISOString());
    await saveSocialConnection(conn);
    const res = NextResponse.redirect(new URL(`${DEST}?connected=1`, origin));
    res.cookies.delete('social_oauth_state');
    return res;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'échec';
    return NextResponse.redirect(new URL(`${DEST}?error=${encodeURIComponent(msg)}`, origin));
  }
}
```

> Note test : `new Date().toISOString()` est appelé dans le handler. Le test ne l'assert pas (mock d'`exchangeCodeForConnection`), donc pas de souci de déterminisme ici.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/social-oauth-routes.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/api/admin/social/connect/route.ts app/api/admin/social/callback/route.ts tests/unit/social-oauth-routes.test.ts
git commit -m "feat(social): routes OAuth connect + callback (state anti-CSRF)"
```

---

### Task 5: Publication Graph API (IG carrousel + FB multi-photo)

**Files:**

- Create: `lib/social/publish.ts`
- Test: `tests/unit/social-publish.test.ts`

**Interfaces:**

- Consumes: config (Task 2), `SocialConnection`, `PublishInput`, `PublishResult` (Task 2), `absoluteUrl` (`@/lib/seo`).
- Produces: `publishPost(conn: SocialConnection, input: PublishInput): Promise<PublishResult>`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/social-publish.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SocialConnection } from '@/lib/social/types';

vi.mock('@/lib/seo', () => ({
  absoluteUrl: (p: string) => (p.startsWith('http') ? p : `https://site${p}`),
}));

const conn: SocialConnection = {
  connected: true,
  pageId: 'PAGE',
  pageName: 'CP',
  pageAccessToken: 'PTOK',
  igUserId: 'IGU',
  igUsername: 'cp',
  connectedAt: '2026-07-02T00:00:00.000Z',
};
function jsonRes(body: unknown) {
  return { ok: true, json: async () => body } as Response;
}
beforeEach(() => vi.unstubAllGlobals());

describe('publishPost', () => {
  it('IG carrousel : enfants → parent CAROUSEL → media_publish', async () => {
    const posted: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (u: string, init?: RequestInit) => {
        posted.push(u + '|' + String(init?.body ?? ''));
        if (u.includes('/media_publish')) return jsonRes({ id: 'MEDIA' });
        if (u.includes(`/IGU/media`)) return jsonRes({ id: 'CONT' });
        if (u.includes('fields=permalink')) return jsonRes({ permalink: 'https://insta/p' });
        throw new Error('unexpected ' + u);
      })
    );
    const { publishPost } = await import('@/lib/social/publish');
    const r = await publishPost(conn, {
      imageUrls: ['/a.jpg', '/b.jpg'],
      caption: 'hello',
      toInstagram: true,
      toFacebook: false,
    });
    expect(r.errors).toEqual([]);
    expect(r.instagram?.mediaId).toBe('MEDIA');
    // 2 enfants + 1 parent CAROUSEL + 1 publish
    expect(posted.filter((p) => p.includes('is_carousel_item=true')).length).toBe(2);
    expect(posted.some((p) => p.includes('media_type=CAROUSEL'))).toBe(true);
    expect(posted.some((p) => p.includes('/media_publish'))).toBe(true);
  });

  it('FB : upload photos published=false puis /feed attached_media', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (u: string) => {
        if (u.includes('/PAGE/photos')) return jsonRes({ id: 'PH' });
        if (u.includes('/PAGE/feed')) return jsonRes({ id: 'FBPOST' });
        throw new Error('unexpected ' + u);
      })
    );
    const { publishPost } = await import('@/lib/social/publish');
    const r = await publishPost(conn, {
      imageUrls: ['/a.jpg'],
      caption: 'hi',
      toInstagram: false,
      toFacebook: true,
    });
    expect(r.facebook?.postId).toBe('FBPOST');
    expect(r.errors).toEqual([]);
  });

  it('erreur Meta remontée dans errors, pas d’exception avalée', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () => ({ ok: false, json: async () => ({ error: { message: 'boom' } }) }) as Response
      )
    );
    const { publishPost } = await import('@/lib/social/publish');
    const r = await publishPost(conn, {
      imageUrls: ['/a.jpg'],
      caption: 'x',
      toInstagram: true,
      toFacebook: false,
    });
    expect(r.instagram).toBeUndefined();
    expect(r.errors.join(' ')).toContain('boom');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/social-publish.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/social/publish.ts
import { GRAPH_BASE } from './config';
import { absoluteUrl } from '@/lib/seo';
import type { SocialConnection, PublishInput, PublishResult } from './types';

async function postGraph(
  path: string,
  params: Record<string, string>
): Promise<Record<string, unknown>> {
  const body = new URLSearchParams(params);
  const res = await fetch(`${GRAPH_BASE}/${path}`, { method: 'POST', body });
  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok || json.error) {
    const err = json.error as { message?: string } | undefined;
    throw new Error(err?.message ?? `Graph error ${res.status}`);
  }
  return json;
}
async function getGraph(path: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${GRAPH_BASE}/${path}`);
  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok || json.error) throw new Error('Graph GET error');
  return json;
}

async function publishInstagram(conn: SocialConnection, urls: string[], caption: string) {
  const token = conn.pageAccessToken;
  let creationId: string;
  if (urls.length === 1) {
    const c = await postGraph(`${conn.igUserId}/media`, {
      image_url: urls[0],
      caption,
      access_token: token,
    });
    creationId = c.id as string;
  } else {
    const children: string[] = [];
    for (const url of urls) {
      const child = await postGraph(`${conn.igUserId}/media`, {
        image_url: url,
        is_carousel_item: 'true',
        access_token: token,
      });
      children.push(child.id as string);
    }
    const parent = await postGraph(`${conn.igUserId}/media`, {
      media_type: 'CAROUSEL',
      children: children.join(','),
      caption,
      access_token: token,
    });
    creationId = parent.id as string;
  }
  const published = await postGraph(`${conn.igUserId}/media_publish`, {
    creation_id: creationId,
    access_token: token,
  });
  const mediaId = published.id as string;
  let permalink: string | undefined;
  try {
    const meta = await getGraph(`${mediaId}?fields=permalink&access_token=${token}`);
    permalink = meta.permalink as string | undefined;
  } catch {
    permalink = undefined; // permalink best-effort, ne bloque pas
  }
  return { mediaId, permalink };
}

async function publishFacebook(conn: SocialConnection, urls: string[], caption: string) {
  const token = conn.pageAccessToken;
  const mediaFbids: Array<{ media_fbid: string }> = [];
  for (const url of urls) {
    const photo = await postGraph(`${conn.pageId}/photos`, {
      url,
      published: 'false',
      access_token: token,
    });
    mediaFbids.push({ media_fbid: photo.id as string });
  }
  const post = await postGraph(`${conn.pageId}/feed`, {
    message: caption,
    attached_media: JSON.stringify(mediaFbids),
    access_token: token,
  });
  return { postId: post.id as string };
}

export async function publishPost(
  conn: SocialConnection,
  input: PublishInput
): Promise<PublishResult> {
  const urls = input.imageUrls.map((u) => absoluteUrl(u));
  const result: PublishResult = { errors: [] };
  if (input.toInstagram) {
    try {
      result.instagram = await publishInstagram(conn, urls, input.caption);
    } catch (e) {
      result.errors.push(`Instagram : ${e instanceof Error ? e.message : 'échec'}`);
    }
  }
  if (input.toFacebook) {
    try {
      result.facebook = await publishFacebook(conn, urls, input.caption);
    } catch (e) {
      result.errors.push(`Facebook : ${e instanceof Error ? e.message : 'échec'}`);
    }
  }
  return result;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/social-publish.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/social/publish.ts tests/unit/social-publish.test.ts
git commit -m "feat(social): publication IG carrousel + FB multi-photo"
```

---

### Task 6: Server actions (publier + déconnecter) + log

**Files:**

- Create: `app/admin/reseaux-sociaux/actions.ts`
- Test: `tests/unit/social-action.test.ts`

**Interfaces:**

- Consumes: `requireAdmin` (`@/lib/admin/auth`), `getSocialConnection`, `clearSocialConnection`, `logSocialPost` (Task 2), `publishPost` (Task 5).
- Produces: `publishSocialPost(input): Promise<{ ok: boolean; result?: PublishResult; error?: string }>`, `disconnectSocial(): Promise<void>`.

Input type (plain object, appelé depuis le client) :

```ts
export interface PublishActionInput {
  itemId: string;
  itemType: 'vehicule' | 'moto';
  imageUrls: string[];
  caption: string;
  toInstagram: boolean;
  toFacebook: boolean;
}
```

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/social-action.test.ts
import { describe, it, expect, vi } from 'vitest';

const requireAdmin = vi.fn(async () => ({ email: 'a@b.c' }));
vi.mock('@/lib/admin/auth', () => ({ requireAdmin, AdminError: class extends Error {} }));
const getConn = vi.fn();
const logMock = vi.fn(async () => {});
vi.mock('@/lib/social/connection', () => ({
  getSocialConnection: getConn,
  clearSocialConnection: vi.fn(),
  logSocialPost: logMock,
}));
const publishMock = vi.fn(async () => ({
  instagram: { mediaId: 'M', permalink: 'L' },
  errors: [],
}));
vi.mock('@/lib/social/publish', () => ({ publishPost: publishMock }));

const input = {
  itemId: 'v1',
  itemType: 'vehicule' as const,
  imageUrls: ['/a.jpg'],
  caption: 'hi',
  toInstagram: true,
  toFacebook: false,
};

describe('publishSocialPost', () => {
  it('erreur claire si non connecté', async () => {
    getConn.mockResolvedValueOnce(null);
    const { publishSocialPost } = await import('@/app/admin/reseaux-sociaux/actions');
    const r = await publishSocialPost(input);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/connect/i);
  });

  it('connecté → publie et logue', async () => {
    getConn.mockResolvedValueOnce({ connected: true, igUserId: 'IG' });
    const { publishSocialPost } = await import('@/app/admin/reseaux-sociaux/actions');
    const r = await publishSocialPost(input);
    expect(r.ok).toBe(true);
    expect(publishMock).toHaveBeenCalled();
    expect(logMock).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/social-action.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Write minimal implementation**

```ts
// app/admin/reseaux-sociaux/actions.ts
'use server';

import { requireAdmin } from '@/lib/admin/auth';
import { getSocialConnection, clearSocialConnection, logSocialPost } from '@/lib/social/connection';
import { publishPost } from '@/lib/social/publish';
import type { PublishResult } from '@/lib/social/types';

export interface PublishActionInput {
  itemId: string;
  itemType: 'vehicule' | 'moto';
  imageUrls: string[];
  caption: string;
  toInstagram: boolean;
  toFacebook: boolean;
}

export async function publishSocialPost(
  input: PublishActionInput
): Promise<{ ok: boolean; result?: PublishResult; error?: string }> {
  await requireAdmin();
  const conn = await getSocialConnection();
  if (!conn)
    return { ok: false, error: 'Aucun compte connecté. Connecte Instagram + Facebook d’abord.' };
  if (!input.toInstagram && !input.toFacebook)
    return { ok: false, error: 'Choisis au moins une plateforme.' };

  const result = await publishPost(conn, {
    imageUrls: input.imageUrls,
    caption: input.caption,
    toInstagram: input.toInstagram,
    toFacebook: input.toFacebook,
  });

  const platforms: string[] = [];
  if (result.instagram) platforms.push('instagram');
  if (result.facebook) platforms.push('facebook');
  if (platforms.length > 0) {
    await logSocialPost({
      itemId: input.itemId,
      itemType: input.itemType,
      platforms,
      caption: input.caption,
      postedAt: new Date().toISOString(),
      igPermalink: result.instagram?.permalink,
      fbPostId: result.facebook?.postId,
    });
  }
  return { ok: result.errors.length === 0, result };
}

export async function disconnectSocial(): Promise<void> {
  await requireAdmin();
  await clearSocialConnection();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/social-action.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/admin/reseaux-sociaux/actions.ts tests/unit/social-action.test.ts
git commit -m "feat(social): server actions publier + déconnecter + log"
```

---

### Task 7: Règles Firestore + .env.example

**Files:**

- Modify: `firestore.rules` (avant le bloc `Default deny`)
- Modify: `.env.example`

**Interfaces:** aucune (config/infra).

- [ ] **Step 1: Ajouter la règle `social_posts`**

Dans `firestore.rules`, juste avant le commentaire `// Default deny`, insérer :

```
    // Log des publications réseaux sociaux : admin seulement (écrit via Admin SDK).
    match /social_posts/{doc} {
      allow read, write: if isAdmin();
    }
```

> `meta/social` (connexion) est déjà couvert par `match /meta/{doc=**}` (admin-only) — ne rien ajouter pour lui.

- [ ] **Step 2: Ajouter les variables d'env**

Dans `.env.example`, ajouter :

```
# Réseaux sociaux (Meta Graph API) — app Meta developer, dev mode.
# Publication réelle uniquement depuis un domaine public (prod/preview).
META_APP_ID=
META_APP_SECRET=
```

- [ ] **Step 3: Vérifier la syntaxe des règles**

Run: `npx firebase deploy --only firestore:rules --dry-run 2>/dev/null || echo "vérifier manuellement (firebase CLI absent)"`
Expected: pas d'erreur de parsing (ou message de fallback).

- [ ] **Step 4: Commit**

```bash
git add firestore.rules .env.example
git commit -m "chore(social): règle Firestore social_posts + env META_APP_*"
```

---

### Task 8: UI section Réseaux sociaux + entrée sidebar

**Files:**

- Create: `app/admin/(shell)/reseaux-sociaux/page.tsx`, `app/admin/(shell)/reseaux-sociaux/ReseauxSociauxClient.tsx`
- Modify: `components/admin/AdminSidebar.tsx`
- Test: `tests/unit/reseaux-sociaux-client.test.tsx`

**Interfaces:**

- Consumes: `getSocialConnection`, `getRecentSocialPosts` (Task 2), `getAdapter` (`@/lib/data`), `buildCaption` (Task 1), `publishSocialPost`, `disconnectSocial` (Task 6).
- Produces: UI. `ReseauxSociauxClient` props : `{ connection: {igUsername, pageName} | null; items: SocialItem[]; posted: Record<string, string> }`.

`SocialItem` (dérivé côté server, sérialisable) :

```ts
export interface SocialItem {
  id: string;
  type: 'vehicule' | 'moto';
  label: string; // "Peugeot 208 (2021)"
  images: string[];
  defaultCaption: string;
}
```

- [ ] **Step 1: Write the failing test (client rend l’état non-connecté et la liste)**

```tsx
// tests/unit/reseaux-sociaux-client.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/app/admin/reseaux-sociaux/actions', () => ({
  publishSocialPost: vi.fn(),
  disconnectSocial: vi.fn(),
}));

import { ReseauxSociauxClient } from '@/app/admin/(shell)/reseaux-sociaux/ReseauxSociauxClient';

const items = [
  {
    id: 'v1',
    type: 'vehicule' as const,
    label: 'Peugeot 208 (2021)',
    images: ['/a.jpg'],
    defaultCaption: 'cap',
  },
];

describe('ReseauxSociauxClient', () => {
  it('non connecté → invite à connecter', () => {
    render(<ReseauxSociauxClient connection={null} items={items} posted={{}} />);
    expect(screen.getByText(/Connecter/i)).toBeTruthy();
  });
  it('connecté → affiche le compte et la liste des véhicules', () => {
    render(
      <ReseauxSociauxClient
        connection={{ igUsername: 'carperf', pageName: 'Car Performance' }}
        items={items}
        posted={{}}
      />
    );
    expect(screen.getByText(/carperf/)).toBeTruthy();
    expect(screen.getByText('Peugeot 208 (2021)')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/reseaux-sociaux-client.test.tsx`
Expected: FAIL — component missing.

- [ ] **Step 3: Write the client component**

```tsx
// app/admin/(shell)/reseaux-sociaux/ReseauxSociauxClient.tsx
'use client';

import { useState } from 'react';
import { publishSocialPost, disconnectSocial } from '@/app/admin/reseaux-sociaux/actions';

export interface SocialItem {
  id: string;
  type: 'vehicule' | 'moto';
  label: string;
  images: string[];
  defaultCaption: string;
}

interface Props {
  connection: { igUsername: string; pageName: string } | null;
  items: SocialItem[];
  posted: Record<string, string>; // itemId -> date ISO du dernier post
}

const S = {
  bg: 'var(--bg)',
  surface: 'var(--surface)',
  text: 'var(--text)',
  blue: 'var(--blue)',
  border: 'var(--border)',
  muted: 'rgba(28,28,30,0.6)',
};

export function ReseauxSociauxClient({ connection, items, posted }: Props) {
  const [selectedId, setSelectedId] = useState<string>(items[0]?.id ?? '');
  const selected = items.find((i) => i.id === selectedId) ?? items[0];
  const [caption, setCaption] = useState<string>(selected?.defaultCaption ?? '');
  const [images, setImages] = useState<string[]>(selected?.images ?? []);
  const [toIg, setToIg] = useState(true);
  const [toFb, setToFb] = useState(true);
  const [status, setStatus] = useState<string>('');
  const [busy, setBusy] = useState(false);

  function select(id: string) {
    const it = items.find((i) => i.id === id);
    setSelectedId(id);
    setCaption(it?.defaultCaption ?? '');
    setImages(it?.images ?? []);
    setStatus('');
  }

  async function onPublish() {
    if (!selected) return;
    setBusy(true);
    setStatus('Publication en cours…');
    try {
      const r = await publishSocialPost({
        itemId: selected.id,
        itemType: selected.type,
        imageUrls: images,
        caption,
        toInstagram: toIg,
        toFacebook: toFb,
      });
      setStatus(r.ok ? '✅ Publié' : `⚠️ ${r.error ?? r.result?.errors.join(' · ')}`);
    } catch {
      setStatus('⚠️ Erreur inattendue');
    } finally {
      setBusy(false);
    }
  }

  if (!connection) {
    return (
      <div className="p-6 max-w-2xl">
        <h1 className="text-2xl font-bold mb-3" style={{ color: S.text }}>
          Réseaux sociaux
        </h1>
        <p className="text-sm mb-6" style={{ color: S.muted }}>
          Connecte ton compte Instagram Business + ta Page Facebook pour publier tes véhicules en un
          clic. La publication ne fonctionne que depuis le site en ligne (pas en local).
        </p>
        <a
          href="/api/admin/social/connect"
          className="inline-flex px-5 py-3 rounded-xl text-white font-semibold"
          style={{ background: S.blue }}
        >
          Connecter Instagram + Facebook
        </a>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: S.text }}>
            Réseaux sociaux
          </h1>
          <p className="text-sm" style={{ color: S.muted }}>
            Connecté : @{connection.igUsername} · {connection.pageName}
          </p>
        </div>
        <button
          type="button"
          onClick={() => disconnectSocial().then(() => location.reload())}
          className="text-sm underline"
          style={{ color: S.muted }}
        >
          Déconnecter
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <aside
          className="rounded-2xl p-3 border"
          style={{ background: S.surface, borderColor: S.border }}
        >
          <div className="flex flex-col gap-1 max-h-[600px] overflow-auto">
            {items.map((it) => (
              <button
                key={it.id}
                type="button"
                onClick={() => select(it.id)}
                className="text-left p-3 rounded-lg"
                style={{
                  background: selectedId === it.id ? 'rgba(0,122,255,0.1)' : 'transparent',
                  color: S.text,
                }}
              >
                <div className="text-sm font-medium">{it.label}</div>
                {posted[it.id] && (
                  <div className="text-xs mt-0.5" style={{ color: S.muted }}>
                    déjà posté le {new Date(posted[it.id]).toLocaleDateString('fr-FR')}
                  </div>
                )}
              </button>
            ))}
          </div>
        </aside>

        <section className="flex flex-col gap-4">
          <div
            className="rounded-2xl p-5 border"
            style={{ background: S.surface, borderColor: S.border }}
          >
            <p className="text-xs font-semibold uppercase mb-2" style={{ color: S.muted }}>
              Caption
            </p>
            <textarea
              aria-label="Caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={10}
              className="w-full p-3 rounded-lg text-sm"
              style={{ background: '#F5F5F7', color: S.text }}
            />
          </div>

          <div
            className="rounded-2xl p-5 border"
            style={{ background: S.surface, borderColor: S.border }}
          >
            <p className="text-xs font-semibold uppercase mb-3" style={{ color: S.muted }}>
              Photos ({images.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {selected?.images.map((src) => {
                const on = images.includes(src);
                return (
                  <button
                    key={src}
                    type="button"
                    onClick={() =>
                      setImages((cur) => (on ? cur.filter((s) => s !== src) : [...cur, src]))
                    }
                    className="w-20 h-20 rounded-lg overflow-hidden border-2"
                    style={{ borderColor: on ? S.blue : 'transparent' }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm" style={{ color: S.text }}>
              <input type="checkbox" checked={toIg} onChange={(e) => setToIg(e.target.checked)} />{' '}
              Instagram
            </label>
            <label className="flex items-center gap-2 text-sm" style={{ color: S.text }}>
              <input type="checkbox" checked={toFb} onChange={(e) => setToFb(e.target.checked)} />{' '}
              Facebook
            </label>
            <button
              type="button"
              onClick={onPublish}
              disabled={busy || images.length === 0}
              className="ml-auto px-5 py-2.5 rounded-xl text-white font-semibold disabled:opacity-50"
              style={{ background: S.blue }}
            >
              Publier
            </button>
          </div>

          {status && (
            <p className="text-sm" style={{ color: S.text }}>
              {status}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Write the server page**

```tsx
// app/admin/(shell)/reseaux-sociaux/page.tsx
import type { Metadata } from 'next';
import { getAdapter } from '@/lib/data';
import { getSocialConnection, getRecentSocialPosts } from '@/lib/social/connection';
import { buildCaption } from '@/lib/social/caption';
import { ReseauxSociauxClient, type SocialItem } from './ReseauxSociauxClient';

export const metadata: Metadata = {
  title: 'Réseaux sociaux — Admin',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

export default async function ReseauxSociauxPage() {
  const adapter = await getAdapter();
  const [vehicules, motos, connection, posts] = await Promise.all([
    adapter.getVehicules(),
    adapter.getMotos(),
    getSocialConnection(),
    getRecentSocialPosts(),
  ]);

  const items: SocialItem[] = [
    ...vehicules.map((v) => ({
      id: v.id,
      type: 'vehicule' as const,
      label: `${v.marque} ${v.modele} (${v.annee})`,
      images: v.images,
      defaultCaption: buildCaption(v),
    })),
    ...motos.map((m) => ({
      id: m.id,
      type: 'moto' as const,
      label: `${m.marque} ${m.modele} (${m.annee})`,
      images: m.images,
      defaultCaption: buildCaption(m),
    })),
  ];

  const posted: Record<string, string> = {};
  for (const p of posts) if (!posted[p.itemId]) posted[p.itemId] = p.postedAt;

  return (
    <ReseauxSociauxClient
      connection={
        connection ? { igUsername: connection.igUsername, pageName: connection.pageName } : null
      }
      items={items}
      posted={posted}
    />
  );
}
```

- [ ] **Step 5: Ajouter l'entrée sidebar**

Dans `components/admin/AdminSidebar.tsx` : ajouter `Share2` à l'import lucide-react (ligne d'import des icônes), puis dans le groupe `title: 'Outils'`, après l'entrée `leboncoin` :

```tsx
      { href: '/admin/reseaux-sociaux', label: 'Réseaux sociaux', icon: Share2, enabled: true },
```

- [ ] **Step 6: Run tests + typecheck + build**

Run: `npx vitest run tests/unit/reseaux-sociaux-client.test.tsx && npx tsc --noEmit 2>&1 | grep -v '\.next/' | grep -iE 'error TS' || echo "tsc OK"`
Expected: test PASS, `tsc OK`.

Run: `npm run build 2>&1 | tail -5`
Expected: build réussi, route `/admin/reseaux-sociaux` listée.

- [ ] **Step 7: Commit**

```bash
git add "app/admin/(shell)/reseaux-sociaux" components/admin/AdminSidebar.tsx tests/unit/reseaux-sociaux-client.test.tsx
git commit -m "feat(social): UI section Réseaux sociaux + entrée sidebar"
```

---

### Task 9: Go-live (externe — hors code, à faire par Djemil/Stéphane)

**Files:** aucun (checklist opérationnelle, à cocher au déploiement).

**Interfaces:** aucune.

- [ ] **Step 1: Vérifier les comptes de Stéphane**
  - Instagram passé en compte **Business/Creator**.
  - Une **Page Facebook** du business existe et l'IG y est **lié** (Paramètres IG → Comptes liés).

- [ ] **Step 2: Créer l'app Meta developer** (developers.facebook.com)
  - Nouvelle app type « Business ». Ajouter produits **Facebook Login** + **Instagram Graph API**.
  - Facebook Login → Valid OAuth Redirect URIs : `https://<domaine-prod>/api/admin/social/callback` (+ l'URL preview si besoin).
  - Ajouter le compte de Stéphane comme **rôle** (admin/testeur) → dev mode, pas de review publique.
  - Noter **App ID** + **App Secret**.

- [ ] **Step 3: Renseigner l'env Vercel**
  - `META_APP_ID`, `META_APP_SECRET` (Production + Preview). Redeploy.

- [ ] **Step 4: Connecter + 1er post en preview/prod**
  - Aller sur `/admin/reseaux-sociaux` → « Connecter Instagram + Facebook » → autoriser.
  - Sélectionner un véhicule → vérifier caption + photos → « Publier » sur IG + FB.
  - Confirmer l'apparition du post sur Instagram et sur la Page Facebook.

- [ ] **Step 5: Ouvrir la PR EOD**

```bash
git push -u origin feat/reseaux-sociaux-auto-publish
gh pr create --title "feat(social): section Réseaux sociaux — auto-publish Instagram + Facebook" --body "Voir docs/superpowers/specs/2026-07-02-reseaux-sociaux-auto-publish-design.md"
```

---

## Self-Review

**Spec coverage** — chaque décision du spec est couverte :

- Auto-publish direct → Tasks 3/5. Véhicules + motos → Task 1/8. Carrousel → Task 5. IG + FB toggles → Task 5/8. Caption éditable → Task 1/8. Historique soft (repost autorisé) → Task 2 (log) + 6 (pas de blocage) + 8 (indicateur). Publication immédiate → pas de planif (non-objectif). Tokens `meta/social` admin-only → Task 2 + 7. Sécurité (state CSRF, serveur seul) → Task 4/2. Prérequis externes → Task 9. Contrainte URLs absolues → Task 5. Gestion d'erreurs remontées → Task 5/6/8.

**Placeholder scan** — aucun TODO/TBD ; code complet à chaque étape.

**Type consistency** — `SocialConnection`, `PublishInput`, `PublishResult`, `SocialPostLog`, `PublishActionInput`, `SocialItem` définis une fois (Tasks 2/6/8) et réutilisés avec les mêmes champs. `publishPost(conn, input)` signature identique Task 5 ↔ 6. `getSocialConnection`/`saveSocialConnection`/`clearSocialConnection`/`logSocialPost`/`getRecentSocialPosts` cohérents Task 2 ↔ 4/6/8.

**Note d'exécution** : Tasks 1–8 sont codables et testables **sans** creds Meta (tout mocké). Task 9 (go-live) nécessite les prérequis externes → étape finale.
