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
    permalink = undefined; // permalink best-effort, ne bloque pas la publication
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
