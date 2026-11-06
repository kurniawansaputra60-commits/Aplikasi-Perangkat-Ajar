import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function formatGeminiError(rawMsg: string): string {
  try {
    const jsonMatch = rawMsg.match(/\{[\s\S]*"error"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const code = parsed?.error?.code;
      const message = parsed?.error?.message || '';
      const reason = parsed?.error?.details?.[0]?.reason || '';

      if (code === 400 && (reason === 'API_KEY_INVALID' || message.includes('API key not valid'))) {
        return 'API Key Gemini tidak valid atau belum diaktifkan. Silakan periksa kembali di menu "Atur Key AI (BYOK)" di bilah atas aplikasi, atau periksa GEMINI_API_KEY di Vercel.';
      }
      if (code === 403 || reason === 'PERMISSION_DENIED') {
        return 'Izin API Key ditolak. Pastikan API Key Gemini Anda memiliki izin untuk Generative Language API di Google AI Studio.';
      }
      if (code === 503 || message.includes('high demand') || message.includes('UNAVAILABLE')) {
        return 'Server Google Gemini sedang mengalami lonjakan beban tinggi sementara (Error 503). Sistem telah mencoba mengulang otomatis. Silakan coba klik tombol sekali lagi.';
      }
      if (code === 429 || reason === 'RATE_LIMIT_EXCEEDED' || message.includes('quota') || message.includes('RESOURCE_EXHAUSTED')) {
        return 'Batas kuota panggilan AI (Error 429) tercapai. Silakan tunggu sekitar 30 detik atau pasang API Key Gemini pribadi Anda di menu "Atur Key AI (BYOK)".';
      }
      if (message) return message;
    }
  } catch (_) {}

  if (/API key not valid|API_KEY_INVALID/i.test(rawMsg)) {
    return 'API Key Gemini tidak valid atau belum diaktifkan. Silakan periksa kunci Anda di menu "Atur Key AI (BYOK)" atau Vercel Environment Variables.';
  }
  if (/high demand|503|UNAVAILABLE/i.test(rawMsg)) {
    return 'Server Google Gemini sedang mengalami lonjakan beban tinggi sementara (Error 503). Silakan coba klik tombol sekali lagi dalam beberapa detik.';
  }
  if (/quota|429|RESOURCE_EXHAUSTED/i.test(rawMsg)) {
    return 'Batas kuota panggilan AI (Error 429) tercapai. Silakan tunggu sekitar 30 detik atau gunakan API Key Anda sendiri di menu "Atur Key AI (BYOK)".';
  }
  if (/fetch failed/i.test(rawMsg)) {
    return 'Koneksi jaringan ke Google Gemini terputus sementara (Fetch Failed). Silakan periksa koneksi internet Anda dan coba lagi.';
  }
  return rawMsg;
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
  if (limited(aiAttempts, ip, 120, 15 * 60 * 1000)) {
    return res.status(429).json({ error: 'Terlalu banyak permintaan AI dalam waktu singkat. Silakan coba lagi nanti.' });
  }

  const { prompt, systemInstruction, apiKey, isJsonMode, responseSchema } = req.body ?? {};
  if (typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'Prompt tidak boleh kosong.' });
  }
  if (prompt.length > 50000) {
    return res.status(413).json({ error: 'Prompt terlalu panjang.' });
  }

  const effectiveKey = typeof apiKey === 'string' ? apiKey.trim() : '';
  const key = effectiveKey || process.env.GEMINI_API_KEY;
  if (!key || key === 'MY_GEMINI_API_KEY' || key.trim() === '') {
    return res.status(401).json({
      error: 'API Key Gemini belum diatur. Silakan klik tombol "Atur Key AI (BYOK)" di kanan atas untuk memasukkan API Key Gemini gratis Anda, atau atur GEMINI_API_KEY di Vercel.'
    });
  }

  const ai = new GoogleGenAI({ apiKey: key });
  // Robust candidate models order: standard fast -> preview -> evergreen fallback
  const models = ['gemini-2.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest'];
  let lastError: any = null;

  for (let attempt = 0; attempt < models.length; attempt++) {
    const model = models[attempt];
    try {
      if (attempt > 0) {
        await sleep(800 * attempt);
      }

      const config: any = {
        systemInstruction: typeof systemInstruction === 'string' && systemInstruction.trim()
          ? systemInstruction.slice(0, 10000)
          : 'Anda adalah asisten pakar kurikulum dan perangkat ajar sekolah dasar di Indonesia. Berikan saran yang akurat, sistematis, dan bermanfaat bagi guru.',
        responseMimeType: isJsonMode || responseSchema ? 'application/json' : 'text/plain',
      };
      if (responseSchema && typeof responseSchema === 'object') {
        config.responseSchema = responseSchema;
      }

      const response = await ai.models.generateContent({ model, contents: prompt, config });
      const text = response.text ?? '';
      if (!text.trim()) {
        throw new Error('AI mengembalikan respons kosong.');
      }
      return res.status(200).json({ success: true, text, source: model });
    } catch (error: any) {
      lastError = error;
      const message = String(error?.message || error);
      console.warn(`Attempt with ${model} failed:`, message);

      // If the API key is completely invalid, stop trying other models
      if (/API_KEY_INVALID|API key not valid|PERMISSION_DENIED/i.test(message)) {
        break;
      }
    }
  }

  const rawErrorMessage = String(lastError?.message || lastError || 'Terjadi kesalahan saat memanggil model Gemini.');
  const friendlyError = formatGeminiError(rawErrorMessage);
  console.error('Gemini request failed:', rawErrorMessage);

  const statusCode = /API_KEY_INVALID|API key not valid|PERMISSION_DENIED/i.test(rawErrorMessage) ? 401 : 502;
  return res.status(statusCode).json({ error: friendlyError });
}

function getNormalizedPath(req: any): string {
  // 1. If Vercel rewrites passed ?route=...
  const routeValue = req.query?.route;
  const route = Array.isArray(routeValue) ? routeValue.join('/') : routeValue;
  if (typeof route === 'string' && route.trim()) {
    const cleanRoute = route.replace(/^\/+|\/+$/g, '');
    return `/api/${cleanRoute}`;
  }

  // 2. Fallback to raw path from req.originalUrl or req.url
  const rawUrl = String(req.originalUrl || req.url || '').split('?')[0];
  const clean = rawUrl.replace(/^\/+/, '');
  if (clean.startsWith('api/')) {
    return `/${clean}`;
  }
  if (clean === 'api') {
    return '/api';
  }
  return `/api/${clean}`;
}

export default async function handler(req: any, res: any) {
  const pathname = getNormalizedPath(req);

  if ((pathname === '/api/health' || pathname === '/api') && req.method === 'GET') {
    return res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  }

  if (pathname === '/api/license/verify' && req.method === 'POST') {
    return verifyLicense(req, res);
  }

  if (pathname === '/api/ai/generate' && req.method === 'POST') {
    return generateAi(req, res);
  }

  return res.status(404).json({ error: `API endpoint tidak ditemukan: ${pathname}` });
}
