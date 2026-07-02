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
