// Netlify Functions v1 (CommonJS) — no ESM config needed
exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    const path = event.queryStringParameters && event.queryStringParameters.path;
    if (!path || !path.startsWith('/api/')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing or invalid path' })
      };
    }

    let body = {};
    try {
      body = JSON.parse(event.body || '{}');
    } catch (e) {}

    const envKey =
      process.env.UW_API_KEY ||
      process.env.UNUSUAL_WHALES_API_KEY ||
      process.env.UW_KEY ||
      '';

    const key = (body && body.key) || envKey;
    if (!key) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Missing UW API key' })
      };
    }

    const upstream = 'https://api.unusualwhales.com' + path;
    const upstreamRes = await fetch(upstream, {
      headers: {
        'Authorization': 'Bearer ' + key,
        'UW-CLIENT-API-ID': '100001',
        'Accept': 'application/json'
      }
    });

    const text = await upstreamRes.text();
    return {
      statusCode: upstreamRes.status,
      headers: Object.assign({}, headers, {
        'Cache-Control': 'no-store'
      }),
      body: text
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err && err.message ? err.message : 'Proxy error' })
    };
  }
};
