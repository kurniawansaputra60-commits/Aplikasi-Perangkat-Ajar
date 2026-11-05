export interface AiGenerateRequest {
  type: string;
  prompt: string;
  systemInstruction?: string;
  context?: Record<string, any>;
  isJsonMode?: boolean;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function cleanErrorMessage(rawMsg: string): string {
  try {
    const jsonMatch = rawMsg.match(/\{[\s\S]*"error"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const code = parsed?.error?.code;
      const message = parsed?.error?.message || '';

      if (code === 503 || message.includes('high demand') || message.includes('UNAVAILABLE')) {
        return 'Server AI Google Gemini sedang mengalami lonjakan trafik tinggi sementara (Error 503). Silakan klik tombol sekali lagi dalam beberapa detik.';
      }
      if (code === 429 || message.includes('quota') || message.includes('RESOURCE_EXHAUSTED')) {
        return 'Batas kuota panggilan AI tercapai (Error 429). Mohon tunggu beberapa saat sebelum mencoba kembali.';
      }
      if (code === 400 || code === 403) {
        return 'Kunci API Gemini tidak valid atau izin ditolak. Silakan periksa kunci Anda di Settings > Secrets.';
      }
      if (message) return message;
    }
  } catch (_) {}

  if (rawMsg.includes('high demand') || rawMsg.includes('503') || rawMsg.includes('UNAVAILABLE')) {
    return 'Server AI Google Gemini sedang mengalami lonjakan beban tinggi sementara (Error 503). Mohon klik tombol sekali lagi dalam beberapa detik.';
  }
  if (rawMsg.includes('fetch failed')) {
    return 'Koneksi jaringan ke server terputus (Fetch Failed). Silakan periksa koneksi internet Anda dan coba lagi.';
  }
  return rawMsg;
}

export async function requestAiGeneration(params: AiGenerateRequest): Promise<string> {
  const userApiKey =
    typeof window !== 'undefined' ? localStorage.getItem('user_gemini_api_key') : null;

  let lastError: any = null;

  // Try up to 2 times on client side in case of transient network failure
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      if (attempt > 0) {
        await sleep(1500);
      }

      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: params.prompt,
          type: params.type,
          isJsonMode: Boolean(params.isJsonMode),
          systemInstruction: params.systemInstruction || undefined,
          apiKey: userApiKey || undefined,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const errorMsg = data?.error || `Gagal menghubungi server AI (Status ${res.status})`;
        throw new Error(cleanErrorMessage(errorMsg));
      }

      if (data?.text && data.text.trim().length > 0) {
        return data.text;
      }

      throw new Error('AI mengembalikan respons kosong.');
    } catch (err: any) {
      lastError = err;
      const msg = err?.message || String(err);
      const isTransient =
        msg.includes('503') ||
        msg.includes('fetch failed') ||
        msg.includes('UNAVAILABLE') ||
        msg.includes('Failed to fetch');

      if (!isTransient || attempt === 1) {
        break;
      }
    }
  }

  const finalMsg = cleanErrorMessage(lastError?.message || 'Koneksi ke server AI terputus. Silakan coba lagi.');
  throw new Error(finalMsg);
}
