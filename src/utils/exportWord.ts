import { AppState } from '../types';

export function generateKopHtml(state: AppState): string {
  const p = state.profile;
  return `
    <div style="font-family: Arial, sans-serif; text-align: center; margin-bottom: 20px; border-bottom: 3px double #000; padding-bottom: 10px;">
      <h3 style="margin: 0; text-transform: uppercase; font-size: 14pt; font-weight: bold; letter-spacing: 0.5px;">PEMERINTAH PROVINSI / KABUPATEN / KOTA</h3>
      <h2 style="margin: 4px 0; text-transform: uppercase; font-size: 16pt; font-weight: bold;">${p.schoolName || 'SD NEGERI CONTOH'}</h2>
      <p style="margin: 2px 0; font-size: 10pt; line-height: 1.4;">
        ${p.address || ''}, Kel. ${p.village || ''}, Kec. ${p.subdistrict || ''}, ${p.city || ''} ${p.postalCode ? 'Kode Pos ' + p.postalCode : ''}<br/>
        Telp: ${p.phone || '-'} | Email: ${p.email || '-'} | NPSN: ${p.npsn || '-'}
      </p>
    </div>
  `;
}

export function generateSignatureHtml(state: AppState): string {
  const p = state.profile;
  const dateStr = `${p.documentCity || 'Jakarta'}, ${p.documentDate || '14 Juli 2026'}`;

  return `
    <table style="width: 100%; margin-top: 40px; font-family: Arial, sans-serif; font-size: 11pt; border: none; border-collapse: collapse;">
      <tr>
        <td style="width: 50%; text-align: left; vertical-align: top; border: none;">
          Mengetahui,<br/>
          <strong>Kepala ${p.schoolName || 'Sekolah'}</strong>
          <br/><br/><br/><br/>
          <strong><u>${p.principalName || 'Nama Kepala Sekolah, M.Pd.'}</u></strong><br/>
          NIP. ${p.principalNip || '-'}
        </td>
        <td style="width: 50%; text-align: right; vertical-align: top; border: none;">
          ${dateStr}<br/>
          <strong>Guru Mata Pelajaran / Kelas</strong>
          <br/><br/><br/><br/>
          <strong><u>${p.teacherName || 'Nama Guru, S.Pd.'}</u></strong><br/>
          NIP. ${p.teacherNip || '-'}<br/>
          ${p.teacherRank ? `<small>Pangkat/Gol: ${p.teacherRank}</small>` : ''}
        </td>
      </tr>
    </table>
  `;
}

export function generateStepHtmlContent(stepNumber: number, state: AppState): { title: string; html: string } {
  const activePkg = state.packages.find((p) => p.id === state.activePackageId) || state.packages[0];
  const kop = generateKopHtml(state);
  const signature = generateSignatureHtml(state);

  let title = 'Dokumen Perangkat Ajar';
  let body = '';

  switch (stepNumber) {
    case 1: {
      title = 'Profil Guru dan Satuan Pendidikan';
      const pr = state.profile;
      body = `
        <h3 style="text-align: center; margin-bottom: 20px;">PROFIL GURU & SATUAN PENDIDIKAN</h3>
        <table border="1" cellpadding="6" cellspacing="0" style="width: 100%; border-collapse: collapse; font-size: 10.5pt;">
          <tr bgcolor="#f2f2f2"><th colspan="2" align="left">A. Data Satuan Pendidikan</th></tr>
          <tr><td width="30%"><strong>Nama Sekolah</strong></td><td>${pr.schoolName}</td></tr>
          <tr><td><strong>NPSN</strong></td><td>${pr.npsn}</td></tr>
          <tr><td><strong>Alamat Lengkap</strong></td><td>${pr.address}, ${pr.village}, ${pr.subdistrict}, ${pr.city}, ${pr.province}</td></tr>
          <tr><td><strong>Kontak & Email</strong></td><td>${pr.phone} / ${pr.email}</td></tr>
          <tr><td><strong>Nama Kepala Sekolah</strong></td><td>${pr.principalName} (NIP. ${pr.principalNip})</td></tr>
          <tr bgcolor="#f2f2f2"><th colspan="2" align="left">B. Data Guru Pengampu</th></tr>
          <tr><td><strong>Nama Guru</strong></td><td>${pr.teacherName}</td></tr>
          <tr><td><strong>NIP</strong></td><td>${pr.teacherNip}</td></tr>
          <tr><td><strong>Pangkat / Golongan</strong></td><td>${pr.teacherRank}</td></tr>
          <tr><td><strong>Tahun Ajaran / Semester</strong></td><td>${pr.academicYear} / ${pr.semester}</td></tr>
        </table>
      `;
      break;
    }
    case 2: {
      title = 'Daftar Paket Mengajar';
      body = `
        <h3 style="text-align: center; margin-bottom: 20px;">DAFTAR PAKET MENGAJAR & FASE</h3>
        <table border="1" cellpadding="6" cellspacing="0" style="width: 100%; border-collapse: collapse; font-size: 10pt;">
          <tr bgcolor="#e6e6e6">
            <th>No</th>
            <th>Nama Paket</th>
            <th>Mata Pelajaran</th>
            <th>Kelas / Fase</th>
            <th>Topik Esensial</th>
            <th>Alokasi JP/Minggu</th>
          </tr>
          ${state.packages
            .map(
              (pkg, idx) => `
            <tr>
              <td align="center">${idx + 1}</td>
              <td><strong>${pkg.name}</strong></td>
              <td>${pkg.subject}</td>
              <td align="center">${pkg.grade}</td>
              <td>${pkg.themeTopic}</td>
              <td align="center">${pkg.targetHourPerWeek} JP</td>
            </tr>
          `
            )
            .join('')}
        </table>
      `;
      break;
    }
    case 3: {
      title = 'Kalender dan Analisis Pekan Efektif';
      const cal = state.calendar;
      body = `
        <h3 style="text-align: center; margin-bottom: 20px;">ANALISIS PEKAN EFEKTIF DAN ALOKASI WAKTU<br/>${cal.semesterName}</h3>
        <table border="1" cellpadding="6" cellspacing="0" style="width: 100%; border-collapse: collapse; font-size: 10pt;">
          <tr bgcolor="#e6e6e6">
            <th>No</th>
            <th>Bulan</th>
            <th>Jumlah Pekan</th>
            <th>Pekan Efektif</th>
            <th>Keterangan Pekan Tidak Efektif</th>
          </tr>
          ${cal.months
            .map(
              (m, i) => `
            <tr>
              <td align="center">${i + 1}</td>
              <td>${m.monthName}</td>
              <td align="center">${m.weeksTotal}</td>
              <td align="center"><strong>${m.weeksEffective}</strong></td>
              <td>${m.nonEffectiveDetails}</td>
            </tr>
          `
            )
            .join('')}
          <tr bgcolor="#f9f9f9" style="font-weight: bold;">
            <td colspan="2" align="center">TOTAL</td>
            <td align="center">${cal.months.reduce((a, b) => a + b.weeksTotal, 0)}</td>
            <td align="center">${cal.totalWeeksEffective}</td>
            <td>Total Jam Pelajaran = ${cal.totalWeeksEffective} pekan x ${cal.jpPerWeek} JP = ${cal.totalJpSemester} JP</td>
          </tr>
        </table>
      `;
      break;
    }
    case 4: {
      title = 'Capaian Pembelajaran (CP)';
      const cp = state.cp;
      body = `
        <h3 style="text-align: center; margin-bottom: 20px;">CAPAIAN PEMBELAJARAN (CP)<br/>Mata Pelajaran: ${activePkg.subject} (${activePkg.grade})</h3>
        <p><strong>Dasar Regulasi:</strong> ${cp.officialSource}</p>
        <div style="background: #f9f9f9; padding: 12px; border: 1px solid #ccc; margin-bottom: 15px;">
          <strong>Rasional & Deskripsi Fase:</strong><br/>
          ${cp.generalDescription}
        </div>
        <table border="1" cellpadding="6" cellspacing="0" style="width: 100%; border-collapse: collapse; font-size: 10pt;">
          <tr bgcolor="#e6e6e6">
            <th width="30%">Elemen</th>
            <th>Capaian Pembelajaran Per Elemen</th>
          </tr>
          ${cp.elements
            .map(
              (el) => `
            <tr>
              <td valign="top"><strong>${el.name}</strong></td>
              <td>${el.cpText}</td>
            </tr>
          `
            )
            .join('')}
        </table>
      `;
      break;
    }
    case 5: {
      title = 'Alur Tujuan Pembelajaran (ATP)';
      body = `
        <h3 style="text-align: center; margin-bottom: 20px;">ALUR TUJUAN PEMBELAJARAN (ATP)<br/>${activePkg.subject} — ${activePkg.grade}</h3>
        <table border="1" cellpadding="6" cellspacing="0" style="width: 100%; border-collapse: collapse; font-size: 10pt;">
          <tr bgcolor="#e6e6e6">
            <th>Kode</th>
            <th>Lingkup Materi / Konten</th>
            <th>Tujuan Pembelajaran (TP)</th>
            <th>Dimensi Profil Lulusan</th>
            <th>Alokasi JP</th>
            <th>Kata Kunci / Glosarium</th>
          </tr>
          ${state.atp
            .map(
              (item) => `
            <tr>
              <td align="center" valign="top"><strong>${item.code}</strong></td>
              <td valign="top"><strong>${item.scopeContent}</strong></td>
              <td valign="top">${item.learningObjective}</td>
              <td valign="top">${item.graduateDimensions.join(', ')}</td>
              <td align="center" valign="top">${item.allocatedJp} JP</td>
              <td valign="top"><small>${item.keywords}</small></td>
            </tr>
          `
            )
            .join('')}
        </table>
      `;
      break;
    }
    case 6: {
      title = 'Program Tahunan (Prota)';
      const sem1 = state.prota.filter((p) => p.semester === '1');
      const sem2 = state.prota.filter((p) => p.semester === '2');
      const totalSem1 = sem1.reduce((a, b) => a + b.allocatedJp, 0);
      const totalSem2 = sem2.reduce((a, b) => a + b.allocatedJp, 0);

      body = `
        <h3 style="text-align: center; margin-bottom: 20px;">PROGRAM TAHUNAN (PROTA)<br/>${activePkg.subject} — ${activePkg.grade} (Tahun Ajaran ${state.profile.academicYear})</h3>
        <table border="1" cellpadding="6" cellspacing="0" style="width: 100%; border-collapse: collapse; font-size: 10pt;">
          <tr bgcolor="#e6e6e6">
            <th>Semester</th>
            <th>Kode TP</th>
            <th>Materi Pembelajaran</th>
            <th>Alokasi Waktu</th>
          </tr>
          ${sem1
            .map(
              (item, i) => `
            <tr>
              ${i === 0 ? `<td rowspan="${sem1.length + 1}" align="center" valign="top"><strong>Semester 1 (Ganjil)</strong></td>` : ''}
              <td align="center"><strong>${item.tpCode}</strong></td>
              <td>${item.material}</td>
              <td align="center">${item.allocatedJp} JP</td>
            </tr>
          `
            )
            .join('')}
          <tr bgcolor="#f9f9f9">
            <td colspan="2" align="right"><strong>Subtotal Semester 1</strong></td>
            <td align="center"><strong>${totalSem1} JP</strong></td>
          </tr>
          ${sem2
            .map(
              (item, i) => `
            <tr>
              ${i === 0 ? `<td rowspan="${sem2.length + 1}" align="center" valign="top"><strong>Semester 2 (Genap)</strong></td>` : ''}
              <td align="center"><strong>${item.tpCode}</strong></td>
              <td>${item.material}</td>
              <td align="center">${item.allocatedJp} JP</td>
            </tr>
          `
            )
            .join('')}
          <tr bgcolor="#f9f9f9">
            <td colspan="2" align="right"><strong>Subtotal Semester 2</strong></td>
            <td align="center"><strong>${totalSem2} JP</strong></td>
          </tr>
          <tr bgcolor="#d9edf7" style="font-weight: bold;">
            <td colspan="3" align="center">TOTAL ALOKASI WAKTU 1 TAHUN</td>
            <td align="center">${totalSem1 + totalSem2} JP</td>
          </tr>
        </table>
      `;
      break;
    }
    case 7: {
      title = 'Program Semester (Promes)';
      body = `
        <h3 style="text-align: center; margin-bottom: 20px;">PROGRAM SEMESTER (PROMES)<br/>${activePkg.subject} — ${activePkg.grade} (${state.calendar.semesterName})</h3>
        <table border="1" cellpadding="4" cellspacing="0" style="width: 100%; border-collapse: collapse; font-size: 8.5pt;">
          <tr bgcolor="#e6e6e6">
            <th rowspan="2">No TP</th>
            <th rowspan="2">Materi Pokok</th>
            <th rowspan="2">Jml JP</th>
            <th colspan="5">Juli</th>
            <th colspan="4">Agustus</th>
            <th colspan="4">September</th>
            <th colspan="5">Oktober</th>
            <th colspan="4">November</th>
            <th colspan="4">Desember</th>
          </tr>
          <tr bgcolor="#f2f2f2">
            ${[1, 2, 3, 4, 5, 1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4, 5, 1, 2, 3, 4, 1, 2, 3, 4]
              .map((w) => `<th width="20">${w}</th>`)
              .join('')}
          </tr>
          ${state.promes
            .map(
              (row) => `
            <tr>
              <td align="center"><strong>${row.tpCode}</strong></td>
              <td>${row.material}</td>
              <td align="center"><strong>${row.totalJp}</strong></td>
              <td align="center"></td><td align="center"></td><td align="center">${row.weeks['m0_w3'] || ''}</td><td align="center">${row.weeks['m0_w4'] || ''}</td><td align="center"></td>
              <td align="center">${row.weeks['m1_w1'] || ''}</td><td align="center">${row.weeks['m1_w2'] || ''}</td><td align="center">${row.weeks['m1_w3'] || ''}</td><td align="center">${row.weeks['m1_w4'] || ''}</td>
              <td align="center">${row.weeks['m2_w1'] || ''}</td><td align="center">${row.weeks['m2_w2'] || ''}</td><td align="center"></td><td align="center"></td>
              <td align="center">${row.weeks['m3_w1'] || ''}</td><td align="center">${row.weeks['m3_w2'] || ''}</td><td align="center"></td><td align="center"></td><td align="center"></td>
              <td align="center"></td><td align="center"></td><td align="center"></td><td align="center"></td>
              <td align="center"></td><td align="center"></td><td align="center"></td><td align="center"></td>
            </tr>
          `
            )
            .join('')}
        </table>
      `;
      break;
    }
    case 8: {
      title = 'Kriteria Ketercapaian Tujuan Pembelajaran (KKTP)';
      const kktp = state.kktp;
      body = `
        <h3 style="text-align: center; margin-bottom: 20px;">KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP)<br/>${activePkg.subject} — ${activePkg.grade}</h3>
        <p><strong>Ketuntasan Minimal Kriteria:</strong> ${kktp.passingGrade}%</p>
        <h4>1. Pendekatan Interval Nilai</h4>
        <table border="1" cellpadding="6" cellspacing="0" style="width: 100%; border-collapse: collapse; font-size: 10pt; margin-bottom: 20px;">
          <tr bgcolor="#e6e6e6">
            <th>Interval Nilai</th>
            <th>Kategori Predikat</th>
            <th>Deskripsi Kemampuan</th>
            <th>Tindak Lanjut Pembelajaran</th>
          </tr>
          ${kktp.intervals
            .map(
              (it) => `
            <tr>
              <td align="center"><strong>${it.range}</strong></td>
              <td><strong>${it.predicate}</strong></td>
              <td>${it.description}</td>
              <td>${it.followUp}</td>
            </tr>
          `
            )
            .join('')}
        </table>

        <h4>2. Pendekatan Rubrik Penilaian</h4>
        <table border="1" cellpadding="6" cellspacing="0" style="width: 100%; border-collapse: collapse; font-size: 9.5pt;">
          <tr bgcolor="#e6e6e6">
            <th>Kode TP</th>
            <th>Indikator Kompetensi</th>
            <th>Perlu Bimbingan (0-69)</th>
            <th>Cukup (70-79)</th>
            <th>Baik (80-89)</th>
            <th>Sangat Baik (90-100)</th>
          </tr>
          ${kktp.rubricItems
            .map(
              (r) => `
            <tr>
              <td align="center"><strong>${r.tpCode}</strong></td>
              <td><strong>${r.indicator}</strong></td>
              <td>${r.needGuidance}</td>
              <td>${r.fair}</td>
              <td>${r.good}</td>
              <td>${r.excellent}</td>
            </tr>
          `
            )
            .join('')}
        </table>
      `;
      break;
    }
    case 9: {
      title = 'Modul Ajar Deep Learning (RPM)';
      const mod = state.modules[state.activeModuleTp] || Object.values(state.modules)[0];
      body = `
        <h3 style="text-align: center; margin-bottom: 20px;">MODUL AJAR DEEP LEARNING (RENCANA PEMBELAJARAN MENDALAM)<br/>${activePkg.subject} — ${activePkg.grade}</h3>
        <p><strong>Topik:</strong> ${mod.topicTitle} (${mod.tpCode}) | <strong>Alokasi Waktu:</strong> ${mod.allocatedJp} JP (${mod.totalMeetings} Pertemuan)</p>

        <h4 style="background: #3f51b5; color: #fff; padding: 6px 10px; margin: 15px 0 5px;">BAGIAN 1 · IDENTIFIKASI & KARAKTERISTIK (DEEP LEARNING)</h4>
        <table border="1" cellpadding="6" cellspacing="0" style="width: 100%; border-collapse: collapse; font-size: 10pt;">
          <tr><td width="30%"><strong>Karakteristik Peserta Didik</strong></td><td>${mod.step1.studentCharacteristics}</td></tr>
          <tr><td><strong>Pengetahuan Awal</strong></td><td>${mod.step1.initialKnowledge}</td></tr>
          <tr><td><strong>Minat & Kebutuhan Belajar</strong></td><td>${mod.step1.learningNeedsAndInterests}</td></tr>
          <tr><td><strong>Jenis Pengetahuan Materi</strong></td><td>${mod.step1.subjectKnowledgeType}</td></tr>
          <tr><td><strong>Relevansi Kehidupan Nyata</strong></td><td>${mod.step1.realWorldRelevance}</td></tr>
          <tr><td><strong>Dimensi Profil Lulusan</strong></td><td><strong>${mod.step1.selectedDimensions.join(', ')}</strong><br/>${mod.step1.dimensionsContext}</td></tr>
        </table>

        <h4 style="background: #3f51b5; color: #fff; padding: 6px 10px; margin: 15px 0 5px;">BAGIAN 2 · DESAIN PEMBELAJARAN</h4>
        <table border="1" cellpadding="6" cellspacing="0" style="width: 100%; border-collapse: collapse; font-size: 10pt;">
          <tr><td width="30%"><strong>Capaian Pembelajaran (CP)</strong></td><td>${mod.step2.cpStatement}</td></tr>
          <tr><td><strong>Keterkaitan Lintas Disiplin</strong></td><td><pre style="font-family: inherit; margin: 0; white-space: pre-wrap;">${mod.step2.crossDisciplinary}</pre></td></tr>
          <tr><td><strong>Tujuan Tiap Pertemuan</strong></td><td>
            1. ${mod.step2.meetingObjectives.meeting1}<br/>
            2. ${mod.step2.meetingObjectives.meeting2}<br/>
            ${mod.step2.meetingObjectives.meeting3 ? `3. ${mod.step2.meetingObjectives.meeting3}` : ''}
          </td></tr>
          <tr><td><strong>Praktik Pedagogis (PBL/PjBL)</strong></td><td>${mod.step2.pedagogicalPractices}</td></tr>
          <tr><td><strong>Pertanyaan Pemandu Reflektif</strong></td><td><pre style="font-family: inherit; margin: 0; white-space: pre-wrap;">${mod.step2.guidingQuestions}</pre></td></tr>
          <tr><td><strong>Kemitraan & Lingkungan</strong></td><td>${mod.step2.partnershipsAndEnvironment}</td></tr>
        </table>

        <h4 style="background: #3f51b5; color: #fff; padding: 6px 10px; margin: 15px 0 5px;">BAGIAN 3 · PENGALAMAN BELAJAR BERMAKNA</h4>
        <table border="1" cellpadding="6" cellspacing="0" style="width: 100%; border-collapse: collapse; font-size: 10pt;">
          <tr><td width="30%"><strong>Tahap AWAL (Berkesadaran)</strong></td><td>${mod.step3.mindfulBeginning}</td></tr>
          <tr><td><strong>INTI · Memahami (Bermakna)</strong></td><td>${mod.step3.meaningfulCoreUnderstand}</td></tr>
          <tr><td><strong>INTI · Mengaplikasi (Menggembirakan)</strong></td><td>${mod.step3.joyfulCoreApply}</td></tr>
          <tr><td><strong>INTI · Merefleksi (Mendalam)</strong></td><td>${mod.step3.reflectiveCoreReflect}</td></tr>
          <tr><td><strong>Tahap PENUTUP (Strategi 3-2-1)</strong></td><td>${mod.step3.closingSummary}</td></tr>
        </table>

        <h4 style="background: #3f51b5; color: #fff; padding: 6px 10px; margin: 15px 0 5px;">BAGIAN 4 · ASESMEN</h4>
        <table border="1" cellpadding="6" cellspacing="0" style="width: 100%; border-collapse: collapse; font-size: 10pt;">
          <tr><td width="30%"><strong>Asesmen Awal (Diagnostik)</strong></td><td>${mod.step4.initialDiagnostic}</td></tr>
          <tr><td><strong>Asesmen Proses (Formatif)</strong></td><td><pre style="font-family: inherit; margin: 0; white-space: pre-wrap;">${mod.step4.processAssessment}</pre></td></tr>
          <tr><td><strong>Asesmen Akhir (Sumatif)</strong></td><td>${mod.step4.finalAssessmentDesc} (Bentuk: ${mod.step4.finalAssessmentTypes.join(', ')})</td></tr>
        </table>

        <h4 style="background: #3f51b5; color: #fff; padding: 6px 10px; margin: 15px 0 5px;">BAGIAN 5 · KKTP & LAMPIRAN INSTRUMEN</h4>
        <table border="1" cellpadding="6" cellspacing="0" style="width: 100%; border-collapse: collapse; font-size: 10pt;">
          <tr><td width="30%"><strong>Kriteria & Interval Ketuntasan</strong></td><td>${mod.step5.kktpCriteria}</td></tr>
          <tr><td><strong>Program Remedial & Pengayaan</strong></td><td>${mod.step5.remedialAndEnrichment}</td></tr>
          <tr><td><strong>Refleksi Siswa dan Guru</strong></td><td><pre style="font-family: inherit; margin: 0; white-space: pre-wrap;">${mod.step5.reflectionStudentTeacher}</pre></td></tr>
        </table>
      `;
      break;
    }
    case 10: {
      title = 'Lembar Kerja Peserta Didik (LKPD)';
      const lkpd = state.lkpd[state.activeModuleTp] || Object.values(state.lkpd)[0];
      body = `
        <h3 style="text-align: center; margin-bottom: 20px;">${lkpd.title}<br/>${activePkg.subject} — ${activePkg.grade}</h3>
        <p><strong>Bentuk Kegiatan:</strong> ${lkpd.groupType} | <strong>Waktu Pengerjaan:</strong> ${lkpd.estimatedTime}</p>
        
        <div style="background: #eef2ff; border-left: 4px solid #4338ca; padding: 10px; margin-bottom: 15px;">
          <strong>Stimulus / Studi Kasus Masalah Otentik:</strong><br/>
          ${lkpd.contextualStimulus}
        </div>

        <h4>Alat dan Bahan:</h4>
        <ul>${lkpd.toolsAndMaterials.map((t) => `<li>${t}</li>`).join('')}</ul>

        <h4>Langkah-Langkah Investigasi:</h4>
        <ol>${lkpd.investigationSteps.map((s) => `<li>${s}</li>`).join('')}</ol>

        <h4>Tabel Lembar Pengamatan & Analisis:</h4>
        <table border="1" cellpadding="6" cellspacing="0" style="width: 100%; border-collapse: collapse; font-size: 10pt;">
          <tr bgcolor="#e6e6e6">
            ${lkpd.tableHeaders.map((h) => `<th>${h}</th>`).join('')}
          </tr>
          ${lkpd.tableRows
            .map(
              (r) => `
            <tr>
              ${r.map((col, idx) => `<td ${idx === 0 ? 'align="center"' : ''}>${col}</td>`).join('')}
            </tr>
          `
            )
            .join('')}
        </table>

        <h4>Pertanyaan Diskusi Terbimbing:</h4>
        <ol>${lkpd.discussionQuestions.map((q) => `<li><strong>${q}</strong></li>`).join('')}</ol>

        <h4>Refleksi Pribadi Siswa:</h4>
        <div style="border: 1px dashed #666; padding: 12px; min-height: 40px;">
          ${lkpd.reflectionPrompt}
        </div>
      `;
      break;
    }
    case 11: {
      title = 'Rencana Asesmen';
      body = `
        <h3 style="text-align: center; margin-bottom: 20px;">MATRIKS RENCANA ASESMEN LENGKAP<br/>${activePkg.subject} — ${activePkg.grade}</h3>
        <table border="1" cellpadding="6" cellspacing="0" style="width: 100%; border-collapse: collapse; font-size: 10pt;">
          <tr bgcolor="#e6e6e6">
            <th>Jenis Asesmen</th>
            <th>Kode TP</th>
            <th>Teknik Asesmen</th>
            <th>Bentuk Instrumen</th>
            <th>Waktu Pelaksanaan</th>
            <th>Uraian / Keterangan</th>
          </tr>
          ${state.assessmentPlans
            .map(
              (plan) => `
            <tr>
              <td valign="top"><strong>${plan.type}</strong></td>
              <td align="center" valign="top"><strong>${plan.tpCode}</strong></td>
              <td valign="top">${plan.technique}</td>
              <td valign="top">${plan.instrument}</td>
              <td valign="top">${plan.timing}</td>
              <td valign="top">${plan.details}</td>
            </tr>
          `
            )
            .join('')}
        </table>
      `;
      break;
    }
    case 12: {
      title = 'Kisi-kisi dan Kartu Soal Asesmen Tertulis';
      const s12 = state.step12;
      body = `
        <h3 style="text-align: center; margin-bottom: 20px;">KISI-KISI, NASKAH SOAL, DAN KARTU SOAL<br/>${s12.assessmentName}</h3>
        <p>
          <strong>Jenis Asesmen:</strong> ${s12.assessmentType} | 
          <strong>Bentuk Soal:</strong> ${s12.countPg} Pilihan Ganda (${s12.optionsCount}) & ${s12.countEssay} Uraian (Skor maks/soal: ${s12.maxScorePerEssay})
        </p>

        <h4>1. Matriks Distribusi Kisi-kisi Soal</h4>
        <table border="1" cellpadding="6" cellspacing="0" style="width: 100%; border-collapse: collapse; font-size: 10pt; margin-bottom: 25px;">
          <tr bgcolor="#e6e6e6">
            <th rowspan="2">No TP</th>
            <th rowspan="2">Lingkup Materi</th>
            <th colspan="3">Level Kognitif</th>
            <th rowspan="2">No. Soal PG</th>
            <th rowspan="2">No. Soal Uraian</th>
            <th rowspan="2">Jml Butir</th>
            <th rowspan="2">Bobot Skor</th>
          </tr>
          <tr bgcolor="#f2f2f2">
            <th>C1/C2 (Mudah)</th>
            <th>C3 (Sedang)</th>
            <th>C4-C6 (HOTS)</th>
          </tr>
          ${s12.matrix
            .map(
              (m) => `
            <tr>
              <td align="center"><strong>${m.tpCode}</strong></td>
              <td>${m.materi}</td>
              <td align="center">${m.levelEasy_C1C2}</td>
              <td align="center">${m.levelMedium_C3}</td>
              <td align="center">${m.levelHots_C4C6}</td>
              <td align="center">${m.noSoalPg}</td>
              <td align="center">${m.noSoalUraian}</td>
              <td align="center"><strong>${m.totalButir}</strong></td>
              <td align="center">${m.totalBobot}</td>
            </tr>
          `
            )
            .join('')}
          <tr bgcolor="#f9f9f9" style="font-weight: bold;">
            <td colspan="2" align="center">JUMLAH</td>
            <td align="center">${s12.matrix.reduce((a, b) => a + b.levelEasy_C1C2, 0)}</td>
            <td align="center">${s12.matrix.reduce((a, b) => a + b.levelMedium_C3, 0)}</td>
            <td align="center">${s12.matrix.reduce((a, b) => a + b.levelHots_C4C6, 0)}</td>
            <td align="center">${s12.countPg} butir</td>
            <td align="center">${s12.countEssay} butir</td>
            <td align="center">${s12.countPg + s12.countEssay}</td>
            <td align="center">${s12.countPg + s12.countEssay * s12.maxScorePerEssay}</td>
          </tr>
        </table>

        <h4>2. Naskah Butir Soal & Kunci Jawaban Lengkap</h4>
        ${s12.questions
          .map(
            (q) => `
          <div style="margin-bottom: 18px; border: 1px solid #ddd; padding: 10px; page-break-inside: avoid;">
            <div style="font-size: 9pt; color: #555; margin-bottom: 4px;">
              <strong>Nomor ${q.id}</strong> | Jenis: ${q.type} | TP: ${q.tpCode} | Level: ${q.cognitiveLevel} (${q.levelLabel}) | Skor Maks: ${q.scoreMax}
            </div>
            <div style="margin-bottom: 8px; font-weight: 500;">
              ${q.questionText.replace(/\n/g, '<br/>')}
            </div>
            ${
              q.options
                ? `<div style="margin-left: 20px; font-size: 10pt;">
                ${q.options.map((opt) => `<div>${opt.key}. ${opt.text}</div>`).join('')}
              </div>`
                : ''
            }
            <div style="background: #eef8ee; padding: 6px; margin-top: 8px; font-size: 9.5pt; border-left: 3px solid #2e7d32;">
              <strong>Kunci Jawaban:</strong> ${q.correctAnswer}<br/>
              <strong>Penjelasan / Pedoman Penskoran:</strong> ${q.explanation}
            </div>
          </div>
        `
          )
          .join('')}

        <h4 style="margin-top: 25px;">3. Kartu Soal Asesmen Tertulis</h4>
        <table border="1" cellpadding="6" cellspacing="0" style="width: 100%; border-collapse: collapse; font-size: 9.5pt;">
          <tr bgcolor="#e6e6e6">
            <th width="8%">No Soal</th>
            <th width="12%">No TP & Level</th>
            <th width="20%">Materi & Indikator</th>
            <th width="35%">Rumusan Butir Soal</th>
            <th width="25%">Kunci Jawaban & Pedoman Penskoran</th>
          </tr>
          ${s12.kartuSoal
            .map(
              (ks) => `
            <tr>
              <td align="center" valign="top"><strong>${ks.noSoal}</strong></td>
              <td valign="top"><strong>${ks.tpCode}</strong><br/>${ks.level}</td>
              <td valign="top">
                <strong>${ks.materi}</strong><br/>
                <small>${ks.indicator}</small><br/>
                <em>Sumber: ${ks.bukuSumber}</em>
              </td>
              <td valign="top">${ks.soalText.replace(/\n/g, '<br/>')}</td>
              <td valign="top">
                <strong>Kunci: ${ks.kunciJawaban}</strong><br/>
                <pre style="font-family: inherit; margin: 4px 0 0; white-space: pre-wrap; font-size: 8.5pt;">${ks.pedomanPenskoran}</pre>
              </td>
            </tr>
          `
            )
            .join('')}
        </table>
      `;
      break;
    }
    case 13: {
      title = 'Analisis Kualitas Butir Soal';
      body = `
        <h3 style="text-align: center; margin-bottom: 20px;">ANALISIS KUALITAS BUTIR SOAL & DAYA PEMBEDA<br/>${activePkg.subject} — ${activePkg.grade}</h3>
        <table border="1" cellpadding="6" cellspacing="0" style="width: 100%; border-collapse: collapse; font-size: 9.5pt;">
          <tr bgcolor="#e6e6e6">
            <th>No Soal</th>
            <th>Tipe & Level</th>
            <th>Tingkat Kesukaran (P)</th>
            <th>Daya Pembeda (D)</th>
            <th>Kualitas Pengecoh</th>
            <th>Keputusan Butir</th>
            <th>Rekomendasi Perbaikan</th>
          </tr>
          ${state.analysis
            .map(
              (an) => `
            <tr>
              <td align="center"><strong>${an.noSoal}</strong></td>
              <td align="center">${an.type} (${an.level})</td>
              <td align="center">${an.difficultyIndex} (${an.difficultyLabel})</td>
              <td align="center">${an.discriminationIndex} (${an.discriminationLabel})</td>
              <td>${an.distractorQuality}</td>
              <td align="center"><strong>${an.verdict}</strong></td>
              <td>${an.recommendation}</td>
            </tr>
          `
            )
            .join('')}
        </table>
      `;
      break;
    }
    default:
      break;
  }

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.4; color: #111; margin: 20px; }
        table { border-collapse: collapse; width: 100%; margin-bottom: 15px; }
        th, td { border: 1px solid #333; padding: 6px 8px; vertical-align: top; }
        th { background-color: #f0f0f0; }
        h2, h3, h4 { font-family: Arial, sans-serif; }
      </style>
    </head>
    <body>
      ${kop}
      ${body}
      ${signature}
    </body>
    </html>
  `;

  return { title, html: fullHtml };
}

export function downloadWordDoc(stepNumber: number, state: AppState) {
  const { title, html } = generateStepHtmlContent(stepNumber, state);
  const activePkg = state.packages.find((p) => p.id === state.activePackageId) || state.packages[0];
  const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const filename = `Langkah-${stepNumber}_${cleanTitle}_${activePkg.grade.replace(/[^a-z0-9]/g, '-')}.doc`;

  const blob = new Blob(['\ufeff', html], {
    type: 'application/msword;charset=utf-8',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function copyForWord(stepNumber: number, state: AppState): Promise<boolean> {
  const { html } = generateStepHtmlContent(stepNumber, state);

  try {
    const textBlob = new Blob([html.replace(/<[^>]+>/g, ' ')], { type: 'text/plain' });
    const htmlBlob = new Blob([html], { type: 'text/html' });

    if (navigator.clipboard && window.ClipboardItem) {
      const item = new ClipboardItem({
        'text/html': htmlBlob,
        'text/plain': textBlob,
      });
      await navigator.clipboard.write([item]);
      return true;
    } else {
      await navigator.clipboard.writeText(html);
      return true;
    }
  } catch (err) {
    console.warn('Clipboard write error:', err);
    return false;
  }
}
