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

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceRoleKey) return null;
  return createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

// -------------------------------------------------------------
// Endpoint 1: Verifikasi Kode Lisensi Manual
// -------------------------------------------------------------
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
  const admin = getSupabaseAdmin();
  if (!url || !anonKey || !admin) {
    return res.status(503).json({ success: false, message: 'Konfigurasi Supabase server belum lengkap.' });
  }

  try {
    const authClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: authData, error: authError } = await authClient.auth.getUser(token);
    if (authError || !authData.user) return res.status(401).json({ success: false, message: 'Sesi login tidak valid. Silakan masuk kembali.' });

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

    // Update user profile status
    try {
      await admin.from('user_profiles').upsert({
        id: authData.user.id,
        is_premium: true,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Could not update user_profiles is_premium:', e);
    }

    return res.status(200).json({ success: true, message: 'Lisensi berhasil diaktifkan. Akun Anda kini menjadi Premium!' });
  } catch (error) {
    console.error('License verification failed:', error);
    return res.status(500).json({ success: false, message: 'Aktivasi gagal. Silakan coba lagi.' });
  }
}

// -------------------------------------------------------------
// Endpoint 2: Webhook Midtrans untuk Aktivasi Otomatis
// -------------------------------------------------------------
async function handleMidtransWebhook(req: any, res: any) {
  const {
    order_id,
    status_code,
    gross_amount,
    transaction_status,
    fraud_status,
    signature_key,
    payment_type,
    custom_field1, // Optional: User ID Supabase
  } = req.body ?? {};

  if (!order_id || !status_code || !gross_amount) {
    return res.status(400).json({ message: 'Payload webhook tidak lengkap.' });
  }

  try {
    // 0. KEAMANAN: Validasi Signature Key SHA512
    // Rumus hash Midtrans: SHA512(order_id + status_code + gross_amount + server_key)
    const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;
    if (MIDTRANS_SERVER_KEY) {
      const expectedHash = createHash('sha512')
        .update(`${order_id}${status_code}${gross_amount}${MIDTRANS_SERVER_KEY}`)
        .digest('hex');

      if (expectedHash !== signature_key) {
        console.warn(`[Peringatan Keamanan] Signature tidak valid untuk pesanan: ${order_id}. Webhook ditolak.`);
        return res.status(403).json({ message: 'Invalid Signature Key' });
      }
    } else {
      console.warn('[Midtrans Webhook] MIDTRANS_SERVER_KEY belum diatur di env. Melewati verifikasi signature hash.');
    }

    // 1. Verifikasi transaksi sukses (Settlement atau Capture tanpa fraud)
    const isSuccess =
      transaction_status === 'settlement' ||
      (transaction_status === 'capture' && fraud_status === 'accept');

    const admin = getSupabaseAdmin();
    let newLicenseCode: string | null = null;

    if (isSuccess) {
      // 2. Generate kode lisensi secara otomatis: EDU-XXXXXX
      newLicenseCode = `EDU-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      if (admin) {
        // A. Masukkan kode lisensi ke tabel licenses (dihash SHA256)
        try {
          const codeHash = createHash('sha256').update(newLicenseCode, 'utf8').digest('hex');
          await admin.from('licenses').insert({
            code_hash: codeHash,
            created_at: new Date().toISOString(),
          });
        } catch (err) {
          console.warn('Could not insert license to licenses table:', err);
        }

        // B. Update / upsert status pembayaran di tabel payments
        try {
          await admin.from('payments').upsert({
            order_id,
            gross_amount: Number(gross_amount) || 0,
            payment_type: payment_type || 'midtrans',
            status: 'PAID',
            license_code: newLicenseCode,
            raw_payload: req.body,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'order_id' });
        } catch (err) {
          console.warn('Could not upsert payments table:', err);
        }

        // C. Jika order membawa user_id di custom_field1, langsung aktifkan akun pengguna
        if (custom_field1 && typeof custom_field1 === 'string') {
          try {
            await admin.from('user_profiles').upsert({
              id: custom_field1,
              is_premium: true,
              updated_at: new Date().toISOString(),
            });
          } catch (err) {
            console.warn('Could not auto-activate user_profiles:', err);
          }
        }

        console.log(`[Midtrans Webhook] Transaksi ${order_id} BERHASIL. Kode Lisensi dibuat: ${newLicenseCode}`);
      }
    } else if (admin) {
      // Catat status selain settlement/capture (misal: pending, expire, cancel)
      try {
        await admin.from('payments').upsert({
          order_id,
          gross_amount: Number(gross_amount) || 0,
          payment_type: payment_type || 'midtrans',
          status: String(transaction_status || 'PENDING').toUpperCase(),
          raw_payload: req.body,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'order_id' });
      } catch (err) {
        console.warn('Could not log pending payment:', err);
      }
    }

    // Selalu balas Midtrans dengan status 200 agar webhook tidak diulang terus-menerus
    return res.status(200).json({
      message: 'Webhook received',
      order_id,
      status: isSuccess ? 'PAID' : transaction_status,
      license_code: newLicenseCode || undefined,
    });
  } catch (error) {
    console.error('[Midtrans Webhook Error]:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}

// -------------------------------------------------------------
// Endpoint 3: Pemanggilan AI Google Gemini
// -------------------------------------------------------------
async function generateAi(req: any, res: any) {
  const ip = getClientIp(req);
  if (limited(aiAttempts, ip, 120, 15 * 60 * 1000)) {
    return res.status(429).json({ error: 'Terlalu banyak permintaan AI dalam waktu singkat. Silakan coba lagi nanti.' });
  }

  const { prompt, systemInstruction, apiKey, isJsonMode, responseSchema, promptParams, context } = req.body ?? {};
  
  // Dukung parameter dinamis terstruktur jika prompt spesifik belum diberikan
  let effectivePrompt = typeof prompt === 'string' ? prompt.trim() : '';
  if (!effectivePrompt && (promptParams || context)) {
    const p = promptParams || context;
    effectivePrompt = `Susun perangkat pembelajaran Kurikulum Merdeka untuk:\n- Materi: ${p.materi || p.subject || '-'}\n- Kelas: ${p.kelas || p.grade || '-'}\n- Durasi: ${p.durasi || p.allocatedJp || 2} JP\n- Kompetensi: ${p.kompetensi || '-'}\nLengkapi dengan indikator dan asesmen yang relevan.`;
  }

  if (!effectivePrompt) {
    return res.status(400).json({ error: 'Prompt atau parameter materi tidak boleh kosong.' });
  }
  if (effectivePrompt.length > 50000) {
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
  // Kandidat model resmi aktif dengan performa tinggi & fallback andal
  const models = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
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
          : 'Anda adalah asisten pakar kurikulum dan perangkat ajar sekolah dasar di Indonesia. Berikan saran yang akurat, sistematis, dan bermanfaat bagi guru sesuai Kurikulum Merdeka dan Pembelajaran Mendalam.',
        responseMimeType: isJsonMode || responseSchema ? 'application/json' : 'text/plain',
      };
      if (responseSchema && typeof responseSchema === 'object') {
        config.responseSchema = responseSchema;
      }

      const response = await ai.models.generateContent({ model, contents: effectivePrompt, config });
      const text = response.text ?? '';
      if (!text.trim()) {
        throw new Error('AI mengembalikan respons kosong.');
      }
      return res.status(200).json({ success: true, text, source: model });
    } catch (error: any) {
      lastError = error;
      const message = String(error?.message || error);
      console.warn(`Attempt with ${model} failed:`, message);

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
  // 1. Jika Vercel rewrites meneruskan ?route=...
  const routeValue = req.query?.route;
  const route = Array.isArray(routeValue) ? routeValue.join('/') : routeValue;
  if (typeof route === 'string' && route.trim()) {
    const cleanRoute = route.replace(/^\/+|\/+$/g, '');
    return `/api/${cleanRoute}`;
  }

  // 2. Fallback membaca req.originalUrl atau req.url
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
  try {
    const pathname = getNormalizedPath(req);

    if ((pathname === '/api/health' || pathname === '/api') && req.method === 'GET') {
      return res.status(200).json({
        status: 'ok',
        service: 'Tools Perangkat Ajar API',
        version: '1.3.0',
        timestamp: new Date().toISOString(),
      });
    }

    if (pathname === '/api/license/verify' && req.method === 'POST') {
      return await verifyLicense(req, res);
    }

    if ((pathname === '/api/webhook/midtrans' || pathname === '/api/midtrans/webhook') && req.method === 'POST') {
      return await handleMidtransWebhook(req, res);
    }

    if ((pathname === '/api/ai/generate' || pathname === '/api/generate') && req.method === 'POST') {
      return await generateAi(req, res);
    }

    return res.status(404).json({ error: `API endpoint tidak ditemukan: ${pathname}` });
  } catch (err: any) {
    console.error('Unhandled API handler exception:', err);
    if (!res.headersSent) {
      return res.status(500).json({ error: err?.message || 'Internal Server Error' });
    }
  }
}
