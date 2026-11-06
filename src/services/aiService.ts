export interface AiGenerationPayload {
  materi?: string;
  kelas?: string;
  durasi?: number;
  kompetensi?: string;
  type?: string;
  prompt?: string;
  systemInstruction?: string;
  context?: Record<string, any>;
  isJsonMode?: boolean;
  responseSchema?: any;
  promptParams?: Record<string, any>;
  [key: string]: any;
}

export type AiGenerateRequest = AiGenerationPayload;

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
        return 'Kunci API Gemini tidak valid atau izin ditolak. Silakan periksa kunci Anda di Pengaturan Aplikasi (BYOK).';
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

/**
 * Pembersih dan parser JSON tangguh dari respons model Gemini,
 * tahan terhadap markdown block ```json ... ``` dan whitespace tambahan.
 */
export function parseAiJson<T>(rawText: string, fallback: T): T {
  if (!rawText || typeof rawText !== 'string') return fallback;
  try {
    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    return JSON.parse(cleaned);
  } catch (_) {
    try {
      const match = rawText.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
      if (match) {
        return JSON.parse(match[0]);
      }
    } catch (_) {}
  }
  return fallback;
}

/**
 * Ekstraktor ringkasan kurikulum terpusat dari state aplikasi
 * agar prompt di langkah 9, 10, 11, 12 selalu terhubung secara sinkron.
 */
export function buildCurriculumContext(appState: any) {
  if (!appState) return {};
  const activePkg =
    appState.packages?.find((p: any) => p.id === appState.activePackageId) ||
    appState.packages?.[0] ||
    {};

  return {
    teacherName: appState.profile?.teacherName || '',
    schoolName: appState.profile?.schoolName || '',
    grade: activePkg.grade || appState.profile?.classGrade || 'Fase B - Kelas IV',
    subject: activePkg.subject || 'Pendidikan Pancasila',
    themeTopic: activePkg.themeTopic || 'Norma dan Aturan Kehidupan',
    semester: activePkg.semester || '1',
    academicYear: appState.profile?.academicYear || '2026/2027',
    totalJp: appState.calendar?.totalJpSemester || 72,
    atpSummary: (appState.atp || [])
      .map((t: any) => `${t.code}: ${t.scopeContent} (${t.allocatedJp || 10} JP) - ${t.learningObjective}`)
      .slice(0, 6)
      .join('\n'),
  };
}

export async function requestAiGeneration(payload: AiGenerationPayload): Promise<string> {
  const userApiKey =
    typeof window !== 'undefined' ? localStorage.getItem('user_gemini_api_key') : null;

  // Satukan dan pastikan seluruh parameter dinamis terkirim utuh
  const dynamicParams: Record<string, any> = {
    ...(payload.context || {}),
    ...(payload.promptParams || {}),
  };

  if (payload.materi) dynamicParams.materi = payload.materi;
  if (payload.kelas) dynamicParams.kelas = payload.kelas;
  if (payload.durasi !== undefined) dynamicParams.durasi = payload.durasi;
  if (payload.kompetensi) dynamicParams.kompetensi = payload.kompetensi;

  // Jika prompt belum dibuat manual, buat prompt terstruktur dari parameter dinamis
  let effectivePrompt = payload.prompt || '';
  if (!effectivePrompt && (dynamicParams.materi || dynamicParams.kompetensi)) {
    effectivePrompt = `Susun perangkat pembelajaran Kurikulum Merdeka untuk:\n- Materi: ${dynamicParams.materi || '-'}\n- Kelas: ${dynamicParams.kelas || '-'}\n- Durasi: ${dynamicParams.durasi || 2} JP\n- Kompetensi: ${dynamicParams.kompetensi || '-'}\nLengkapi dengan indikator dan asesmen yang relevan.`;
  }

  let lastError: any = null;

  // Retry logic untuk kegagalan transien (503 / fetch drop)
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      if (attempt > 0) {
        await sleep(1500);
      }

      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: effectivePrompt,
          promptParams: {
            materi: dynamicParams.materi,
            kelas: dynamicParams.kelas,
            durasi: dynamicParams.durasi,
            kompetensi: dynamicParams.kompetensi,
            ...dynamicParams,
          },
          context: dynamicParams,
          type: payload.type || 'general',
          isJsonMode: Boolean(payload.isJsonMode),
          responseSchema: payload.responseSchema || undefined,
          systemInstruction: payload.systemInstruction || undefined,
          apiKey: userApiKey || undefined,
          timestamp: new Date().toISOString(),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const errorMsg = data?.error || data?.message || `Gagal menghubungi server AI (Status ${res.status})`;
        throw new Error(cleanErrorMessage(errorMsg));
      }

      if (data?.text && typeof data.text === 'string' && data.text.trim().length > 0) {
        return data.text;
      }

      if (typeof data === 'string' && data.trim().length > 0) {
        return data;
      }

      if (data && typeof data === 'object') {
        return JSON.stringify(data);
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
