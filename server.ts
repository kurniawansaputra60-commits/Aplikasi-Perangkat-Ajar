import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json({ limit: '10mb' }));

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

// AI Generation Endpoint
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

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
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
      return res.status(500).json({ error: 'AI mengembalikan respons kosong.' });
    }

    return res.json({
      success: true,
      text,
      source: 'gemini-3.8-flash',
    });
  } catch (err: any) {
    console.error('Gemini API call failed:', err?.message || err);
    return res.status(500).json({
      error: `Gagal memproses AI: ${err?.message || 'Terjadi kesalahan saat memanggil model Gemini.'}`,
    });
  }
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
