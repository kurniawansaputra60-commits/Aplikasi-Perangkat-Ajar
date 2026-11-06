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

/** Parse JSON responses from Gemini, including responses wrapped in markdown fences. */
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
      if (match) return JSON.parse(match[0]);
    } catch (_) {}
  }
  return fallback;
}

/** Extract curriculum context shared by the curriculum-generation steps. */
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

/**
 * Generate large Step 12 assessments in small sequential batches. This avoids
 * truncated JSON responses while preserving the requested exact PG/essay counts.
 */
async function generateStep12QuestionBatches(payload: AiGenerationPayload): Promise<string> {
  const originalPrompt = payload.prompt || '';
  const pgMatch = originalPrompt.match(/Jumlah Soal Pilihan Ganda:\s*(\d+)/i);
  const essayMatch = originalPrompt.match(/Jumlah Soal Uraian:\s*(\d+)/i);
  if (!pgMatch || !essayMatch) {
    throw new Error('Jumlah soal PG dan uraian tidak terbaca dari konfigurasi Step 12.');
  }

  const requestedPg = Number(pgMatch[1]);
  const requestedEssay = Number(essayMatch[1]);
  if (!Number.isInteger(requestedPg) || requestedPg < 0 || requestedPg > 50 ||
      !Number.isInteger(requestedEssay) || requestedEssay < 0 || requestedEssay > 20 ||
      requestedPg + requestedEssay === 0) {
    throw new Error('Jumlah soal di luar batas yang didukung. PG maksimal 50 dan uraian maksimal 20.');
  }

  const optionMatch = originalPrompt.match(/(4|5)\s*opsi/i);
  const optionCount = optionMatch ? Number(optionMatch[1]) : 4;
  const optionKeys = optionCount === 5 ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D'];
  const allQuestions: any[] = [];
  const batchSize = 10;

  const generateTypeBatches = async (type: 'PG' | 'Uraian', total: number) => {
    let completed = 0;
    while (completed < total) {
      const batchCount = Math.min(batchSize, total - completed);
      const firstId = type === 'PG' ? completed + 1 : requestedPg + completed + 1;
      const schemaExample = type === 'PG'
        ? `{"id": ${firstId}, "type": "PG", "tpCode": "TP 1", "materi": "...", "indicator": "...", "cognitiveLevel": "C2", "levelLabel": "Mudah", "questionText": "...", "options": [${optionKeys.map((key) => `{"key":"${key}","text":"..."}`).join(', ')}], "correctAnswer": "A", "explanation": "...", "scoreMax": 1}`
        : `{"id": ${firstId}, "type": "Uraian", "tpCode": "TP 1", "materi": "...", "indicator": "...", "cognitiveLevel": "C4", "levelLabel": "HOTS", "questionText": "...", "correctAnswer": "Contoh jawaban...", "explanation": "Rubrik/pedoman penskoran...", "scoreMax": ${Number(payload.context?.maxScorePerEssay) || 4}}`;

      const batchPrompt = `${originalPrompt}\n\nINSTRUKSI BATCH KHUSUS (menggantikan jumlah total pada instruksi sebelumnya untuk panggilan ini):\n- Buat HANYA ${batchCount} butir bertipe ${type}; jangan menghasilkan tipe soal lain.\n- Nomor id harus berurutan dari ${firstId} sampai ${firstId + batchCount - 1}.\n- Konteks mapel, kelas, asesmen, dan materi dari instruksi di atas tetap berlaku.\n- Untuk PG, setiap soal wajib punya tepat ${optionCount} opsi dengan key: ${optionKeys.join(', ')}. Untuk uraian, jangan sertakan options.\n- Kembalikan hanya JSON array valid berisi tepat ${batchCount} objek, mengikuti contoh skema: ${schemaExample}\n- Jangan sertakan markdown atau teks di luar JSON.`;

      const raw = await requestAiGeneration({
        ...payload,
        type: 'step12_click2_soal_batch',
        prompt: batchPrompt,
        isJsonMode: true,
      });
      const batch = parseAiJson<any>(raw, null);
      if (!Array.isArray(batch) || batch.length !== batchCount) {
        throw new Error(`AI mengembalikan batch ${type} yang tidak lengkap (diharapkan ${batchCount} soal). Coba jalankan kembali Klik 2.`);
      }

      const normalized = batch.map((question: any, index: number) => {
        if (!question || typeof question.questionText !== 'string' || !question.questionText.trim()) {
          throw new Error(`Butir ${firstId + index} tidak memiliki teks soal yang valid.`);
        }
        if (type === 'PG') {
          if (!Array.isArray(question.options) || question.options.length !== optionCount ||
              !question.correctAnswer || !question.explanation) {
            throw new Error(`Struktur soal PG nomor ${firstId + index} belum lengkap atau jumlah opsinya salah.`);
          }
          question.options = question.options.map((option: any, optionIndex: number) => ({
            key: optionKeys[optionIndex],
            text: String(option?.text || ''),
          }));
          if (question.options.some((option: any) => !option.text.trim())) {
            throw new Error(`Opsi soal PG nomor ${firstId + index} kosong.`);
          }
          if (!optionKeys.includes(String(question.correctAnswer).trim().toUpperCase())) {
            throw new Error(`Kunci jawaban soal PG nomor ${firstId + index} tidak cocok dengan opsinya.`);
          }
        } else if (!question.correctAnswer || !question.explanation) {
          throw new Error(`Kunci/rubrik soal uraian nomor ${firstId + index} belum lengkap.`);
        }

        return {
          ...question,
          id: firstId + index,
          type,
          tpCode: String(question.tpCode || 'TP 1'),
          materi: String(question.materi || payload.materi || 'Materi asesmen'),
          indicator: String(question.indicator || 'Peserta didik menunjukkan pemahaman terhadap materi.'),
          cognitiveLevel: question.cognitiveLevel || (type === 'PG' ? 'C2' : 'C4'),
          levelLabel: question.levelLabel || (type === 'PG' ? 'Sedang' : 'HOTS'),
          scoreMax: type === 'PG' ? 1 : (Number(question.scoreMax) || Number(payload.context?.maxScorePerEssay) || 4),
        };
      });

      allQuestions.push(...normalized);
      completed += batchCount;
    }
  };

  // Sequential requests reduce quota spikes and keep batch errors attributable.
  await generateTypeBatches('PG', requestedPg);
  await generateTypeBatches('Uraian', requestedEssay);

  return JSON.stringify(allQuestions);
}

export async function requestAiGeneration(payload: AiGenerationPayload): Promise<string> {
  if (payload.type === 'step12_click2_soal') {
    return generateStep12QuestionBatches(payload);
  }

  const userApiKey =
    typeof window !== 'undefined' ? localStorage.getItem('user_gemini_api_key') : null;

  const dynamicParams: Record<string, any> = {
    ...(payload.context || {}),
    ...(payload.promptParams || {}),
  };

  if (payload.materi) dynamicParams.materi = payload.materi;
  if (payload.kelas) dynamicParams.kelas = payload.kelas;
  if (payload.durasi !== undefined) dynamicParams.durasi = payload.durasi;
  if (payload.kompetensi) dynamicParams.kompetensi = payload.kompetensi;

  let effectivePrompt = payload.prompt || '';
  if (!effectivePrompt && (dynamicParams.materi || dynamicParams.kompetensi)) {
    effectivePrompt = `Susun perangkat pembelajaran Kurikulum Merdeka untuk:\n- Materi: ${dynamicParams.materi || '-'}\n- Kelas: ${dynamicParams.kelas || '-'}\n- Durasi: ${dynamicParams.durasi || '-'}\n- Kompetensi: ${dynamicParams.kompetensi || '-'}`;
  }

  let lastError: any = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      if (attempt > 0) await sleep(1500);

      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      if (data?.text && typeof data.text === 'string' && data.text.trim()) return data.text;
      if (typeof data === 'string' && data.trim()) return data;
      if (data && typeof data === 'object') return JSON.stringify(data);
      throw new Error('AI mengembalikan respons kosong.');
    } catch (err: any) {
      lastError = err;
      const msg = err?.message || String(err);
      const isTransient = msg.includes('503') || msg.includes('fetch failed') || msg.includes('UNAVAILABLE') || msg.includes('Failed to fetch');
      if (!isTransient || attempt === 1) break;
    }
  }

  throw new Error(cleanErrorMessage(lastError?.message || 'Koneksi ke server AI terputus. Silakan coba lagi.'));
}
