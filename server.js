const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = new URL('./public/', import.meta.url);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.ico': 'image/x-icon'
};

function loadEnvFile() {
  try {
    const text = Bun.file('.env').textSync();
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const index = trimmed.indexOf('=');
      if (index === -1) continue;
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {}
}

loadEnvFile();

function extOf(pathname) {
  const i = pathname.lastIndexOf('.');
  return i >= 0 ? pathname.slice(i) : '';
}

function safePath(pathname) {
  const clean = decodeURIComponent(pathname).replace(/^\/+/, '');
  if (clean.includes('..')) return null;
  return clean || 'index.html';
}

function json(data, status = 200) {
  return Response.json(data, { status });
}

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return { url: url.replace(/\/$/, ''), key };
}

function checkAdmin(url) {
  const password = url.searchParams.get('password') || '';
  return password && password === process.env.ADMIN_PASSWORD;
}

async function supabaseRequest(path, options = {}) {
  const supabase = getSupabase();
  if (!supabase) {
    return { ok: false, status: 400, data: { message: '.env ichida SUPABASE_URL va SUPABASE_PUBLISHABLE_KEY yozilmagan' } };
  }

  const res = await fetch(`${supabase.url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: supabase.key,
      Authorization: `Bearer ${supabase.key}`,
      'Content-Type': 'application/json',
      Prefer: options.prefer || '',
      ...(options.headers || {})
    }
  });

  let data = null;
  const text = await res.text();
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { ok: res.ok, status: res.status, data };
}

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === '/api/send' && req.method === 'POST') {
      try {
        const body = await req.json();
        const answers = body.answers || {};

        if (!answers.name || !answers.love_answer) {
          return json({ ok: false, message: 'Majburiy maydonlar to‘liq emas' }, 400);
        }

        const response = await supabaseRequest('love_answers', {
          method: 'POST',
          prefer: 'return=representation',
          body: JSON.stringify([{ answers }])
        });

        if (!response.ok) {
          return json({ ok: false, message: response.data?.message || 'Supabase xatosi', detail: response.data }, 500);
        }

        return json({ ok: true, item: Array.isArray(response.data) ? response.data[0] : response.data });
      } catch (err) {
        return json({ ok: false, message: err?.message || 'Server xatosi' }, 500);
      }
    }

    if (url.pathname === '/api/answers' && req.method === 'GET') {
      if (!checkAdmin(url)) return json({ ok: false, message: 'Parol noto‘g‘ri' }, 401);
      const response = await supabaseRequest('love_answers?select=*&order=created_at.desc', { method: 'GET' });
      if (!response.ok) return json({ ok: false, message: response.data?.message || 'O‘qib bo‘lmadi', detail: response.data }, 500);
      return json({ ok: true, items: response.data || [] });
    }

    if (url.pathname === '/api/answers' && req.method === 'DELETE') {
      if (!checkAdmin(url)) return json({ ok: false, message: 'Parol noto‘g‘ri' }, 401);
      const response = await supabaseRequest('love_answers?id=gt.0', { method: 'DELETE', prefer: 'return=minimal' });
      if (!response.ok) return json({ ok: false, message: response.data?.message || 'O‘chirilmadi', detail: response.data }, 500);
      return json({ ok: true });
    }

    const matchDelete = url.pathname.match(/^\/api\/answers\/(\d+)$/);
    if (matchDelete && req.method === 'DELETE') {
      if (!checkAdmin(url)) return json({ ok: false, message: 'Parol noto‘g‘ri' }, 401);
      const id = matchDelete[1];
      const response = await supabaseRequest(`love_answers?id=eq.${id}`, { method: 'DELETE', prefer: 'return=minimal' });
      if (!response.ok) return json({ ok: false, message: response.data?.message || 'O‘chirilmadi', detail: response.data }, 500);
      return json({ ok: true });
    }

    let fileName = safePath(url.pathname);
    if (!fileName) return new Response('Bad path', { status: 400 });
    if (fileName === 'admin') fileName = 'admin.html';
    if (fileName.endsWith('/')) fileName += 'index.html';

    const file = Bun.file(new URL(fileName, PUBLIC_DIR));
    if (!(await file.exists())) {
      const index = Bun.file(new URL('index.html', PUBLIC_DIR));
      return new Response(index, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }

    return new Response(file, {
      headers: { 'Content-Type': MIME[extOf(fileName)] || 'application/octet-stream' }
    });
  }
});

console.log(`💖 Charos Final Love: http://localhost:${PORT}`);
console.log(`🔐 Admin: http://localhost:${PORT}/admin`);
