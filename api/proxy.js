export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    const url = new URL(req.url);
    const targetPath = url.searchParams.get('target');
    
    if (!targetPath) {
      return new Response(JSON.stringify({ error: "Missing target parameter" }), { status: 400 });
    }

    const HF_SPACE = "https://kwai-kolors-kolors-virtual-try-on.hf.space";
    const targetUrl = new URL(HF_SPACE + targetPath);

    // Forward any extra query params (like session_hash)
    url.searchParams.forEach((value, key) => {
      if (key !== 'target') {
        targetUrl.searchParams.set(key, value);
      }
    });

    const headers = new Headers(req.headers);
    // Strip tracking headers that cause 403 Forbidden embedding
    headers.delete('origin');
    headers.delete('referer');
    headers.delete('host');
    // We intentionally KEEP x-forwarded-for so HuggingFace rate-limits
    // the user's real IP instead of Vercel's shared datacenter IP!

    const proxyReq = new Request(targetUrl, {
      method: req.method,
      headers: headers,
      body: (req.method !== 'GET' && req.method !== 'HEAD') ? req.body : null,
      duplex: 'half'
    });

    const response = await fetch(proxyReq);

    // Return the response stream to the client
    return new Response(response.body, {
      status: response.status,
      headers: response.headers
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
