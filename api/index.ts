import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

// Standalone Vercel function entrypoint. Do not import ../server here: Vercel's
// Node ESM bundling may not include the root TypeScript module in /var/task.
const licenseAttempts = new Map<string, { count: number; resetAt: number }>();
const aiAttempts = new Map<string, { count: number; resetAt: number }>();

function limited(map: Map<string, { count: number; resetAt: number }>, key: string, max: number, windowMs: number) {
  const now = Date.now();
  const current = map.get(key);
  if (!current || current.resetAt <= now) {
    map.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  current.count += 1;
  return current.count > max;
}

function getClientIp(req: any): string {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

async function verifyLicense(req: any, res: any) {
  const code = typeof req.body?.code === 'string' ? req.body.code.trim().toUpperCase() : '';
  const authHeader = req.headers?.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!code) return res.status(400).json({ success: false, message: 'Masukkan kode lisensi.' });
  if (!token) return res.status(401).json({ success: false, message: 'Silakan masuk ke akun terlebih dahulu.' });
  if (limited(licenseAttempts, getClientIp(req), 10, 15 * 60 * 1000)) {
    return res.status(429).json({ success: false, message: 'Terlalu banyak percobaan aktivasi. Coba lagi nanti.' });
  }

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceRoleKey) {
    return res.status(503).json({ success: false, message: 'Konfigurasi Supabase server belum lengkap.' });
  }

  try {
    const authClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: authData, error: authError } = await authClient.auth.getUser(token);
    if (authError || !authData.user) return res.status(401).json({ success: false, message: 'Sesi login tidak valid. Silakan masuk kembali.' });

    const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const codeHash = createHash('sha256').update(code, 'utf8').digest('hex');
    const { data, error } = await admin.from('licenses')
      .update({ redeemed_by: authData.user.id, redeemed_at: new Date().toISOString() })
      .eq('code_hash', codeHash)
      .is('redeemed_at', null)
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('License database error:', error.message);
      return res.status(503).json({ success: false, message: 'Layanan aktivasi sedang bermasalah. Coba lagi nanti.' });
    }
    if (!data) return res.status(400).json({ success: false, message: 'Kode lisensi tidak valid atau sudah digunakan.' });
    return res.status(200).json({ success: true, message: 'Lisensi berhasil diaktifkan.' });
  } catch (error) {
    console.error('License verification failed:', error);
    return res.status(500).json({ success: false, message: 'Aktivasi gagal. Silakan coba lagi.' });
  }
}

async function generateAi(req: any, res: any) {
  const ip = getClientIp(req);
  if (limited(aiAttempts, ip, 120, 15 * 60 * 1000)) return res.status(429).json({ error: 'Terlalu banyak permintaan AI. Silakan coba lagi nanti.' });

  const { prompt, systemInstruction, apiKey, isJsonMode, responseSchema } = req.body ?? {};
  if (typeof prompt !== 'string' || !prompt.trim()) return res.status(400).json({ error: 'Prompt is required' });
  if (prompt.length > 50000) return res.status(413).json({ error: 'Prompt terlalu panjang.' });
  const effectiveKey = typeof apiKey === 'string' ? apiKey.trim() : '';
  const key = effectiveKey || process.env.GEMINI_API_KEY;
  if (!key || key === 'MY_GEMINI_API_KEY') return res.status(401).json({ error: 'API Key Gemini belum dikonfigurasi.' });

  const ai = new GoogleGenAI({ apiKey: key });
  // New users should use Gemini 3.8 Flash; Gemini 2.5 Flash can return 404
  // for projects that do not have access to legacy model IDs.
  const models = ['gemini-3.8-flash', 'gemini-flash-latest'];
  let lastError: any;
  for (const model of models) {
    try {
      const config: any = {
        systemInstruction: typeof systemInstruction === 'string'
          ? systemInstruction.slice(0, 10000)
          : 'Anda adalah asisten pakar kurikulum dan perangkat ajar sekolah dasar di Indonesia. Berikan saran yang akurat dan bermanfaat bagi guru.',
        responseMimeType: isJsonMode || responseSchema ? 'application/json' : 'text/plain',
      };
      if (responseSchema && typeof responseSchema === 'object') config.responseSchema = responseSchema;
      const response = await ai.models.generateContent({ model, contents: prompt, config });
      const text = response.text ?? '';
      if (!text.trim()) throw new Error('Empty AI response');
      return res.status(200).json({ success: true, text, source: model });
    } catch (error: any) {
      lastError = error;
      const message = String(error?.message || error);
      // A model-not-found/unsupported error is not transient; move to the fallback model.
      if (/404|NOT_FOUND|not available|not supported/i.test(message)) continue;
      if (!/503|UNAVAILABLE|high demand|fetch failed|timeout|RESOURCE_EXHAUSTED/i.test(message)) break;
    }
  }
  console.error('Gemini request failed:', String(lastError?.message || lastError || 'unknown error'));
  return res.status(502).json({ error: 'Gagal memproses permintaan AI. Periksa model/API key atau coba lagi nanti.' });
}

export default async function handler(req: any, res: any) {
  const routeValue = req.query?.route;
  const route = Array.isArray(routeValue) ? routeValue.join('/') : routeValue;
  const pathname = typeof route === 'string'
    ? `/api/${route.replace(/^\/+|\/+$/g, '')}`
    : String(req.url || '').split('?')[0];

  if (pathname === '/api/health' && req.method === 'GET') {
    return res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  }
  if (pathname === '/api/license/verify' && req.method === 'POST') return verifyLicense(req, res);
  if (pathname === '/api/ai/generate' && req.method === 'POST') return generateAi(req, res);
  return res.status(404).json({ error: 'API endpoint not found.' });
}
