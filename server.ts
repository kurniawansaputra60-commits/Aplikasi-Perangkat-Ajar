import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import rateLimit from 'express-rate-limit';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 3000);

app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Terlalu banyak permintaan AI. Silakan coba lagi nanti.' },
  validate: { trustProxy: false, xForwardedForHeader: false },
});
app.use('/api/ai/', aiLimiter);

const licenseLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak percobaan aktivasi. Coba lagi nanti.' },
});
app.use('/api/license/', licenseLimiter);

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceRoleKey) return null;
  return { url, anonKey, serviceRoleKey };
}

app.post('/api/license/verify', async (req, res) => {
  const code = typeof req.body?.code === 'string' ? req.body.code.trim().toUpperCase() : '';
  const authorization = req.header('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!code) return res.status(400).json({ success: false, message: 'Masukkan kode lisensi.' });
  if (!token) return res.status(401).json({ success: false, message: 'Silakan masuk ke akun terlebih dahulu.' });

  const config = getSupabaseConfig();
  if (!config) return res.status(503).json({ success: false, message: 'Konfigurasi Supabase server belum lengkap.' });

  try {
    const authClient = createClient(config.url, config.anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: authData, error: authError } = await authClient.auth.getUser(token);
    if (authError || !authData.user) return res.status(401).json({ success: false, message: 'Sesi login tidak valid. Silakan masuk kembali.' });

    const admin = createClient(config.url, config.serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const codeHash = createHash('sha256').update(code, 'utf8').digest('hex');
    const { data, error } = await admin
      .from('licenses')
      .update({ redeemed_by: authData.user.id, redeemed_at: new Date().toISOString() })
      .eq('code_hash', codeHash)
      .is('redeemed_at', null)
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('License redemption database error:', error.message);
      return res.status(503).json({ success: false, message: 'Layanan aktivasi sedang bermasalah. Coba lagi nanti.' });
    }
    if (!data) return res.status(400).json({ success: false, message: 'Kode lisensi tidak valid atau sudah digunakan.' });
    return res.json({ success: true, message: 'Lisensi berhasil diaktifkan.' });
  } catch (error) {
    console.error('License verification failed:', error);
    return res.status(500).json({ success: false, message: 'Aktivasi gagal. Silakan coba lagi.' });
  }
});

function getGeminiClient(apiKey?: string): GoogleGenAI | null {
  const effectiveKey = apiKey?.trim() || process.env.GEMINI_API_KEY;
  if (!effectiveKey || effectiveKey === 'MY_GEMINI_API_KEY') return null;
  return new GoogleGenAI({ apiKey: effectiveKey });
}
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

app.post('/api/ai/generate', async (req, res) => {
  const { prompt, systemInstruction, apiKey, isJsonMode, responseSchema } = req.body ?? {};
  if (typeof prompt !== 'string' || !prompt.trim()) return res.status(400).json({ error: 'Prompt is required' });
  if (prompt.length > 50000) return res.status(413).json({ error: 'Prompt terlalu panjang.' });

  const ai = getGeminiClient(typeof apiKey === 'string' ? apiKey : undefined);
  if (!ai) return res.status(401).json({ error: 'API Key Gemini belum dikonfigurasi.' });

  const candidateModels = ['gemini-2.5-flash', 'gemini-flash-latest'];
  let lastError: any = null;
  for (let attempt = 0; attempt < candidateModels.length; attempt++) {
    try {
      if (attempt > 0) await sleep(1000 * attempt);
      const config: any = {
        systemInstruction: typeof systemInstruction === 'string' ? systemInstruction.slice(0, 10000) : 'Anda adalah asisten pakar kurikulum dan perangkat ajar sekolah dasar di Indonesia. Berikan saran yang akurat dan bermanfaat bagi guru.',
        responseMimeType: isJsonMode || responseSchema ? 'application/json' : 'text/plain',
      };
      if (responseSchema && typeof responseSchema === 'object') config.responseSchema = responseSchema;
      const response = await ai.models.generateContent({ model: candidateModels[attempt], contents: prompt, config });
      const text = response.text ?? '';
      if (!text.trim()) throw new Error('AI mengembalikan respons kosong.');
      return res.json({ success: true, text, source: candidateModels[attempt] });
    } catch (error: any) {
      lastError = error;
      const message = String(error?.message || error);
      const transient = /503|UNAVAILABLE|high demand|fetch failed|timeout|RESOURCE_EXHAUSTED/i.test(message);
      if (!transient) break;
    }
  }
  const message = String(lastError?.message || 'Terjadi kesalahan saat memanggil AI.');
  console.error('Gemini request failed:', message);
  return res.status(502).json({ error: 'Gagal memproses permintaan AI. Silakan coba lagi nanti.' });
});

app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

async function startServer() {
  if (process.env.VERCEL || process.env.NOW_REGION) return;
  const distPath = path.resolve(__dirname, 'dist');
  const indexHtmlPath = path.join(distPath, 'index.html');
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else if (fs.existsSync(indexHtmlPath)) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(indexHtmlPath));
  }
  app.listen(port, '0.0.0.0', () => console.log(`Server running on port ${port}`));
}

startServer().catch((error) => console.error('Failed to start server:', error));
export default app;
