import React from 'react';
import { SchoolProfile } from '../../types';
import { Building2, User, Calendar, MapPin, Phone, Mail, Award } from 'lucide-react';

interface Step1Props {
  profile: SchoolProfile;
  onChange: (updated: SchoolProfile) => void;
}

export const Step1Profile: React.FC<Step1Props> = ({ profile, onChange }) => {
  const update = (field: keyof SchoolProfile, val: string) => {
    onChange({ ...profile, [field]: val });
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border-2 border-slate-900 p-5 shadow-sm">
        <h3 className="text-base font-black text-slate-900 mb-1 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-indigo-600" />
          A. Identitas Satuan Pendidikan &amp; Kop Resmi
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Data ini menjadi dasar pembentukan kop surat resmi di seluruh berkas ekspor Word (.doc).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Nama Satuan Pendidikan / Sekolah
            </label>
            <input
              type="text"
              value={profile.schoolName}
              onChange={(e) => update('schoolName', e.target.value)}
              className="w-full text-xs font-bold p-2.5 rounded-xl border-2 border-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              NPSN (Nomor Pokok Sekolah Nasional)
            </label>
            <input
              type="text"
              value={profile.npsn}
              onChange={(e) => update('npsn', e.target.value)}
              className="w-full text-xs font-bold p-2.5 rounded-xl border-2 border-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Alamat Jalan
            </label>
            <input
              type="text"
              value={profile.address}
              onChange={(e) => update('address', e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Desa / Kelurahan
            </label>
            <input
              type="text"
              value={profile.village}
              onChange={(e) => update('village', e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Kecamatan
            </label>
            <input
              type="text"
              value={profile.subdistrict}
              onChange={(e) => update('subdistrict', e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Kabupaten / Kota
            </label>
            <input
              type="text"
              value={profile.city}
              onChange={(e) => update('city', e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Provinsi
            </label>
            <input
              type="text"
              value={profile.province}
              onChange={(e) => update('province', e.target.value)}
              placeholder="Contoh: DKI Jakarta"
              autoComplete="address-level1"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Kode Pos
            </label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              value={profile.postalCode}
              onChange={(e) => update('postalCode', e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Nomor Telepon Sekolah
            </label>
            <input
              type="text"
              value={profile.phone}
              onChange={(e) => update('phone', e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Email Resmi Sekolah
            </label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => update('email', e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Guru, Kepala Sekolah & Titimangsa */}
      <div className="bg-white rounded-2xl border-2 border-slate-900 p-5 shadow-sm">
        <h3 className="text-base font-black text-slate-900 mb-1 flex items-center gap-2">
          <User className="w-5 h-5 text-indigo-600" />
          B. Data Guru Pengampu, Kepala Sekolah &amp; Titimangsa
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Otomatis menjadi blok tanda tangan pengesahan di akhir setiap dokumen.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Kepala Sekolah */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-300 space-y-2">
            <span className="font-bold text-xs text-indigo-900 block mb-1">
              Kepala Satuan Pendidikan:
            </span>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase">
                Nama Lengkap &amp; Gelar
              </label>
              <input
                type="text"
                value={profile.principalName}
                onChange={(e) => update('principalName', e.target.value)}
                className="w-full text-xs font-semibold p-2 rounded-lg border border-slate-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase">
                NIP Kepala Sekolah
              </label>
              <input
                type="text"
                value={profile.principalNip}
                onChange={(e) => update('principalNip', e.target.value)}
                className="w-full text-xs font-semibold p-2 rounded-lg border border-slate-300 bg-white"
              />
            </div>
          </div>

          {/* Guru Pengampu */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-300 space-y-2">
            <span className="font-bold text-xs text-indigo-900 block mb-1">
              Guru Mata Pelajaran / Guru Kelas:
            </span>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase">
                Nama Lengkap &amp; Gelar
              </label>
              <input
                type="text"
                value={profile.teacherName}
                onChange={(e) => update('teacherName', e.target.value)}
                className="w-full text-xs font-semibold p-2 rounded-lg border border-slate-300 bg-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase">NIP</label>
                <input
                  type="text"
                  value={profile.teacherNip}
                  onChange={(e) => update('teacherNip', e.target.value)}
                  className="w-full text-xs font-semibold p-2 rounded-lg border border-slate-300 bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase">
                  Pangkat / Golongan
                </label>
                <input
                  type="text"
                  value={profile.teacherRank}
                  onChange={(e) => update('teacherRank', e.target.value)}
                  className="w-full text-xs font-semibold p-2 rounded-lg border border-slate-300 bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Titimangsa */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-200">
          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
              Kota Penetapan
            </label>
            <input
              type="text"
              value={profile.documentCity}
              onChange={(e) => update('documentCity', e.target.value)}
              className="w-full text-xs font-semibold p-2 rounded-lg border border-slate-300 bg-white"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
              Tanggal Dokumen
            </label>
            <input
              type="text"
              value={profile.documentDate}
              onChange={(e) => update('documentDate', e.target.value)}
              className="w-full text-xs font-semibold p-2 rounded-lg border border-slate-300 bg-white"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
              Tahun Ajaran
            </label>
            <input
              type="text"
              value={profile.academicYear}
              onChange={(e) => update('academicYear', e.target.value)}
              className="w-full text-xs font-semibold p-2 rounded-lg border border-slate-300 bg-white"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
              Semester
            </label>
            <input
              type="text"
              value={profile.semester}
              onChange={(e) => update('semester', e.target.value)}
              className="w-full text-xs font-semibold p-2 rounded-lg border border-slate-300 bg-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
