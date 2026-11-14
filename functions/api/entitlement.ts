import { LemonEnv, PagesFunctionContext, jsonResponse } from '../types';

export async function onRequestGet(context: PagesFunctionContext<LemonEnv>): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);
  const orderId = (url.searchParams.get('orderId') || '').trim();

  if (!orderId) {
    return jsonResponse({ entitled: false, reason: 'missing_order_id' }, 400);
  }

  // 1. Check webhook-synced KV record when STILLALONG_KV is bound
  if (env.STILLALONG_KV) {
    const raw = await env.STILLALONG_KV.get(`order:${orderId}`);
    if (raw) {
      try {
        const rec = JSON.parse(raw) as { status?: string; refunded?: boolean };
        return jsonResponse({
          entitled: rec.status === 'paid' && !rec.refunded,
          source: 'kv',
        });
      } catch {
        // Fall through to live API verification
      }
    }
  }

  // 2. Fallback server-side check directly against Lemon Squeezy Orders API
  if (!env.LEMONSQUEEZY_API_KEY?.trim()) {
    return jsonResponse({ entitled: false, reason: 'not_configured' }, 503);
  }

  try {
    const res = await fetch(
      `https://api.lemonsqueezy.com/v1/orders/${encodeURIComponent(orderId)}`,
      {
        headers: {
          accept: 'application/vnd.api+json',
          authorization: `Bearer ${env.LEMONSQUEEZY_API_KEY.trim()}`,
        },
      }
    );

    if (!res.ok) {
      return jsonResponse({ entitled: false, reason: 'order_not_found' }, 404);
    }

    const body = (await res.json()) as {
      data?: {
        attributes?: {
          status?: string;
          refunded?: boolean;
        };
      };
    };
    const attrs = body.data?.attributes;
    const entitled = attrs?.status === 'paid' && !attrs?.refunded;
    return jsonResponse({ entitled, source: 'lemonsqueezy' }, 200);
  } catch {
    return jsonResponse({ entitled: false, reason: 'verification_error' }, 502);
  }
}
