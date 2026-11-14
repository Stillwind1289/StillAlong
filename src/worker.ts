import {
  onRequestGet as checkoutGet,
  onRequestPost as checkoutPost,
} from '../functions/api/checkout';
import { onRequestGet as entitlementGet } from '../functions/api/entitlement';
import { onRequestPost as webhookPost } from '../functions/api/webhooks/lemonsqueezy';
import { LemonEnv, PagesFunctionContext, jsonResponse } from '../functions/types';

export interface AssetFetcher {
  fetch(input: Request | string): Promise<Response>;
}

export interface WorkerEnv extends LemonEnv {
  ASSETS: AssetFetcher;
}

function buildContext(request: Request, env: WorkerEnv): PagesFunctionContext<LemonEnv> {
  return {
    request,
    env,
    params: {},
  };
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname !== '/' ? url.pathname.replace(/\/+$/, '') : '/';
    const method = request.method.toUpperCase();

    if (pathname === '/api/checkout') {
      if (method === 'GET') return checkoutGet(buildContext(request, env));
      if (method === 'POST') return checkoutPost(buildContext(request, env));
      return jsonResponse({ error: 'Method not allowed.' }, 405);
    }

    if (pathname === '/api/entitlement') {
      if (method === 'GET') return entitlementGet(buildContext(request, env));
      return jsonResponse({ error: 'Method not allowed.' }, 405);
    }

    if (pathname === '/api/webhooks/lemonsqueezy') {
      if (method === 'POST') return webhookPost(buildContext(request, env));
      return jsonResponse({ error: 'Method not allowed.' }, 405);
    }

    if (pathname.startsWith('/api/')) {
      return jsonResponse({ error: 'API route not found.' }, 404);
    }

    return env.ASSETS.fetch(request);
  },
};
