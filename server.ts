import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import rateLimit from 'express-rate-limit';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Enable trust proxy for Cloud Run, Vercel, and reverse proxies
app.set('trust proxy', 1);

app.use(express.json({ limit: '10mb' }));

// Rate limiter on AI endpoints to prevent abuse / resource exhaustion
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 120, // Maksimal 120 request per 15 menit per IP
  message: {
    error: 'Terlalu banyak permintaan pembuatan konten AI dalam waktu singkat. Silakan tunggu beberapa saat.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    trustProxy: false,
    xForwardedForHeader: false,
  },
});

app.use('/api/ai/', aiLimiter);

// Helper to get GoogleGenAI client
function getGeminiClient(apiKey?: string): GoogleGenAI | null {
  const effectiveKey = (apiKey && apiKey.trim() !== '') ? apiKey.trim() : process.env.GEMINI_API_KEY;
  if (!effectiveKey || effectiveKey === 'MY_GEMINI_API_KEY' || effectiveKey.trim() === '') {
    return null;
  }
  return new GoogleGenAI({
    apiKey: effectiveKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function formatGeminiError(rawMsg: string): string {
  try {
    const jsonMatch = rawMsg.match(/\{[\s\S]*"error"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const code = parsed?.error?.code;
      const message = parsed?.error?.message || '';

      if (code === 503 || message.includes('high demand') || message.includes('UNAVAILABLE')) {
        return 'Server Google Gemini sedang mengalami lonjakan beban tinggi sementara (Error 503). Sistem telah mencoba mengulang otomatis 3x. Mohon klik tombol sekali lagi dalam beberapa detik.';
      }
      if (code === 429 || message.includes('quota') || message.includes('RESOURCE_EXHAUSTED')) {
        return 'Batas kuota panggilan AI tercapai (Error 429). Mohon tunggu sekitar 30 detik sebelum mencoba kembali.';
      }
      if (code === 400 || code === 403 || message.includes('API_KEY_INVALID') || message.includes('PERMISSION_DENIED')) {
        return 'API Key Gemini tidak valid atau izin ditolak. Silakan periksa kunci Anda di menu Settings > Secrets.';
      }
      if (message) return message;
    }
  } catch (_) {}

  if (rawMsg.includes('high demand') || rawMsg.includes('503') || rawMsg.includes('UNAVAILABLE')) {
    return 'Server Google Gemini sedang mengalami lonjakan beban tinggi sementara (Error 503). Mohon klik tombol sekali lagi dalam beberapa detik.';
  }
  if (rawMsg.includes('fetch failed')) {
    return 'Koneksi jaringan ke Google Gemini terputus sementara (Fetch Failed). Silakan periksa koneksi internet Anda dan coba lagi.';
  }
  return rawMsg;
}

// AI Generation Endpoint with automatic retry & model failover
app.post('/api/ai/generate', async (req, res) => {
  const { prompt, systemInstruction, apiKey, isJsonMode } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const ai = getGeminiClient(apiKey);

  if (!ai) {
    return res.status(401).json({
      error: 'API Key Gemini belum dikonfigurasi di Settings > Secrets atau pada server.',
    });
  }

  // Model list to attempt in order if experiencing temporary high demand (503)
  const candidateModels = ['gemini-3.8-flash', 'gemini-3.8-flash', 'gemini-flash-latest'];
  let lastError: any = null;

  for (let attempt = 0; attempt < candidateModels.length; attempt++) {
    const currentModel = candidateModels[attempt];
    try {
      if (attempt > 0) {
        console.log(`Retrying Gemini call (attempt ${attempt + 1}) using ${currentModel}...`);
        await sleep(1200 * attempt);
      }

      const response = await ai.models.generateContent({
        model: currentModel,
        contents: prompt,
        config: {
          systemInstruction:
            systemInstruction ||
            'Anda adalah asisten pakar kurikulum dan perangkat ajar Kurikulum Merdeka & Pembelajaran Mendalam (Deep Learning) Sekolah Dasar (SD) di Indonesia. Rancanglah isi pembelajaran yang berkesadaran, bermakna, dan menggembirakan sesuai regulasi terbaru Permendikdasmen No. 10/2025, No. 12/2025, No. 13/2025, dan Kepka BSKAP 046/H/KR/2025.',
          responseMimeType: isJsonMode ? 'application/json' : 'text/plain',
        },
      });

      const text = response.text ?? '';
      if (!text || text.trim() === '') {
        throw new Error('AI mengembalikan respons kosong.');
      }

      return res.json({
        success: true,
        text,
        source: currentModel,
      });
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);
      console.warn(`Attempt ${attempt + 1} with ${currentModel} failed:`, errMsg);

      // Only retry if it is a transient error (503 UNAVAILABLE, 429, or network fetch failure)
      const isTransient =
        errMsg.includes('503') ||
        errMsg.includes('UNAVAILABLE') ||
        errMsg.includes('high demand') ||
        errMsg.includes('fetch failed') ||
        errMsg.includes('timeout') ||
        errMsg.includes('RESOURCE_EXHAUSTED');

      if (!isTransient) {
        break; // Fatal error (e.g. invalid auth), do not retry
      }
    }
  }

  const rawErrorMessage = lastError?.message || String(lastError || 'Terjadi kesalahan saat memanggil model Gemini.');
  const friendlyError = formatGeminiError(rawErrorMessage);

  return res.status(500).json({
    error: `Gagal memproses AI: ${friendlyError}`,
  });
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Tools Perangkat Ajar server running on http://0.0.0.0:${port}`);
  });
}

startServer();
