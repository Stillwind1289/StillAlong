import { LemonEnv, PagesFunctionContext, jsonResponse } from '../types';

function isCheckoutConfigured(env: LemonEnv): boolean {
  return Boolean(
    env.LEMONSQUEEZY_API_KEY?.trim() &&
      env.LEMONSQUEEZY_STORE_ID?.trim() &&
      env.LEMONSQUEEZY_VARIANT_ID?.trim()
  );
}

export async function onRequestGet(context: PagesFunctionContext<LemonEnv>): Promise<Response> {
  return jsonResponse({
    configured: isCheckoutConfigured(context.env),
    priceUsd: 6.99,
    billingType: 'one_time',
  });
}

export async function onRequestPost(context: PagesFunctionContext<LemonEnv>): Promise<Response> {
  const { env, request } = context;

  if (!isCheckoutConfigured(env)) {
    return jsonResponse(
      {
        configured: false,
        error:
          'Checkout setup is in progress. Configure Lemon Squeezy environment variables in Cloudflare Pages first.',
      },
      503
    );
  }

  let customerEmail: string | undefined;
  try {
    const body = (await request.json()) as { email?: string };
    if (typeof body?.email === 'string' && body.email.includes('@')) {
      customerEmail = body.email.trim();
    }
  } catch {
    // Optional JSON body
  }

  const origin = env.PUBLIC_APP_URL?.trim() || new URL(request.url).origin;

  const payload = {
    data: {
      type: 'checkouts',
      attributes: {
        checkout_data: customerEmail ? { email: customerEmail } : {},
        product_options: {
          redirect_url: `${origin}/app?checkout=pending`,
        },
      },
      relationships: {
        store: {
          data: {
            type: 'stores',
            id: env.LEMONSQUEEZY_STORE_ID!.trim(),
          },
        },
        variant: {
          data: {
            type: 'variants',
            id: env.LEMONSQUEEZY_VARIANT_ID!.trim(),
          },
        },
      },
    },
  };

  try {
    const lsRes = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        accept: 'application/vnd.api+json',
        'content-type': 'application/vnd.api+json',
        authorization: `Bearer ${env.LEMONSQUEEZY_API_KEY!.trim()}`,
      },
      body: JSON.stringify(payload),
    });

    if (!lsRes.ok) {
      return jsonResponse(
        {
          error: 'Lemon Squeezy rejected the checkout request. Please verify Store and Variant IDs.',
        },
        502
      );
    }

    const lsData = (await lsRes.json()) as {
      data?: { attributes?: { url?: string } };
    };
    const checkoutUrl = lsData?.data?.attributes?.url;
    if (!checkoutUrl) {
      return jsonResponse({ error: 'Checkout URL was not returned by Lemon Squeezy.' }, 502);
    }

    return jsonResponse({ checkoutUrl, configured: true }, 200);
  } catch {
    return jsonResponse({ error: 'Unable to reach Lemon Squeezy API.' }, 502);
  }
}
