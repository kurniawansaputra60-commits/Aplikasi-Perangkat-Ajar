export interface AiGenerateRequest {
  type: string;
  prompt: string;
  context?: Record<string, any>;
  isJsonMode?: boolean;
}

export async function requestAiGeneration(params: AiGenerateRequest): Promise<string> {
  // 1. Ambil API Key milik pengguna dari localStorage jika ada
  const userApiKey =
    typeof window !== 'undefined' ? localStorage.getItem('user_gemini_api_key') : null;

  try {
    const res = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: params.prompt,
        apiKey: userApiKey || undefined,
        isJsonMode: params.isJsonMode,
        systemInstruction:
          'Anda adalah asisten pakar kurikulum dan perangkat ajar Kurikulum Merdeka & Pembelajaran Mendalam (Deep Learning) Sekolah Dasar (SD) di Indonesia. Rancanglah isi pembelajaran yang berkesadaran, bermakna, dan menggembirakan sesuai regulasi terbaru Permendikdasmen No. 10/2025, No. 12/2025, No. 13/2025, dan Kepka BSKAP 046/H/KR/2025.',
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Gagal menghasilkan konten dari AI.');
    }

    if (data.text && data.text.trim().length > 0) {
      return data.text;
    }

    throw new Error('AI mengembalikan respons kosong.');
  } catch (err: any) {
    console.error('AI API error:', err);
    throw new Error(err.message || 'Koneksi ke server AI terputus. Silakan coba lagi.');
  }
}
