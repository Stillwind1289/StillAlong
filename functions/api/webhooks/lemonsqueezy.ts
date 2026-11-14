import { LemonEnv, PagesFunctionContext, jsonResponse } from '../../types';

function timingSafeHexEqual(a: string, b: string): boolean {
  if (a.length !== b.length || a.length === 0) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function computeHmacSha256Hex(secret: string, rawBody: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(rawBody));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

interface LemonWebhookPayload {
  meta?: {
    event_name?: string;
    webhook_id?: string;
  };
  data?: {
    id?: string;
    attributes?: {
      status?: string;
      refunded?: boolean;
      user_email?: string;
      total?: number;
      currency?: string;
      updated_at?: string;
    };
  };
}

export async function onRequestPost(context: PagesFunctionContext<LemonEnv>): Promise<Response> {
  const { request, env } = context;
  const secret = env.LEMONSQUEEZY_WEBHOOK_SECRET?.trim();

  if (!secret) {
    return jsonResponse({ error: 'Webhook secret is not configured.' }, 503);
  }

  const signature = (request.headers.get('x-signature') || '').trim().toLowerCase();
  const rawBody = await request.text();
  if (!signature || !rawBody) {
    return jsonResponse({ error: 'Missing webhook signature or payload.' }, 401);
  }

  const expectedHex = await computeHmacSha256Hex(secret, rawBody);
  if (!timingSafeHexEqual(signature, expectedHex)) {
    return jsonResponse({ error: 'Invalid webhook signature.' }, 401);
  }

  let payload: LemonWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as LemonWebhookPayload;
  } catch {
    return jsonResponse({ error: 'Invalid JSON payload.' }, 400);
  }

  const eventName = payload.meta?.event_name || 'unknown';
  const orderId = payload.data?.id;
  if (!orderId) {
    return jsonResponse({ ok: true, ignored: true });
  }

  if (env.STILLALONG_KV) {
    const idempotencyKey = `webhook:${eventName}:${orderId}:${payload.data?.attributes?.updated_at || ''}`;
    const alreadySeen = await env.STILLALONG_KV.get(idempotencyKey);
    if (alreadySeen) {
      return jsonResponse({ ok: true, deduplicated: true });
    }

    const attrs = payload.data?.attributes;
    if (eventName === 'order_created' && attrs?.status === 'paid' && !attrs?.refunded) {
      await env.STILLALONG_KV.put(
        `order:${orderId}`,
        JSON.stringify({
          orderId,
          status: 'paid',
          refunded: false,
          email: attrs.user_email ?? null,
          updatedAt: attrs.updated_at ?? new Date().toISOString(),
        })
      );
    } else if (eventName === 'order_refunded' || attrs?.refunded) {
      await env.STILLALONG_KV.put(
        `order:${orderId}`,
        JSON.stringify({
          orderId,
          status: 'refunded',
          refunded: true,
          email: attrs?.user_email ?? null,
          updatedAt: attrs?.updated_at ?? new Date().toISOString(),
        })
      );
    }

    await env.STILLALONG_KV.put(idempotencyKey, '1', { expirationTtl: 60 * 60 * 24 * 30 });
  }

  return jsonResponse({ ok: true, event: eventName });
}
