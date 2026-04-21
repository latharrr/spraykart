export const dynamic = 'force-dynamic';

const SNIPPET_LIMIT = 280;

function getBackendConfig() {
  if (process.env.BACKEND_URL) {
    return {
      backendUrl: process.env.BACKEND_URL,
      source: 'BACKEND_URL',
    };
  }

  if (process.env.NEXT_PUBLIC_API_URL) {
    return {
      backendUrl: process.env.NEXT_PUBLIC_API_URL,
      source: 'NEXT_PUBLIC_API_URL',
    };
  }

  return {
    backendUrl: 'http://localhost:5000',
    source: 'fallback-localhost',
  };
}

function summarizeBody(text, contentType) {
  if (!text) return '';

  if (contentType?.includes('application/json')) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return `JSON array(${parsed.length})`;
      }
      if (parsed && typeof parsed === 'object') {
        return `JSON object keys: ${Object.keys(parsed).slice(0, 12).join(', ')}`;
      }
    } catch {
      // Fall back to a raw text snippet.
    }
  }

  return text.slice(0, SNIPPET_LIMIT);
}

async function probe(url) {
  try {
    const res = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });

    const contentType = res.headers.get('content-type') || '';
    const text = await res.text();

    return {
      ok: res.ok,
      status: res.status,
      contentType,
      summary: summarizeBody(text, contentType),
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      contentType: '',
      summary: error?.message || 'Request failed',
    };
  }
}

export async function GET() {
  const { backendUrl, source } = getBackendConfig();

  const [health, products] = await Promise.all([
    probe(`${backendUrl}/health`),
    probe(`${backendUrl}/api/products?limit=1`),
  ]);

  return Response.json({
    source,
    backendUrl,
    probes: {
      health,
      products,
    },
  });
}
