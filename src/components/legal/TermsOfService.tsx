import React from 'react';
import { X, MessageCircle, Mail, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react';

interface TermsOfServiceProps {
  isOpen?: boolean;
  onClose?: () => void;
  isModal?: boolean;
}

export const TermsOfService: React.FC<TermsOfServiceProps> = ({
  isOpen = true,
  onClose,
  isModal = true,
}) => {
  const supportWhatsApp = '6281234567890'; // Nomor WA Support
  const supportEmail = 'support@aplikasianda.com'; // Email Dukungan

  if (isModal && !isOpen) return null;

  const content = (
    <div className="max-w-4xl mx-auto p-6 md:p-8 bg-white border-2 border-slate-900 shadow-2xl rounded-2xl relative text-slate-800">
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Tutup Syarat dan Ketentuan"
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-100 border-2 border-slate-900 flex items-center justify-center text-indigo-800">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Syarat dan Ketentuan Layanan (Terms of Service)
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="space-y-6 text-slate-700 text-sm leading-relaxed mt-6">
        <section className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <h2 className="text-base font-bold mb-2 text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">1</span>
            Penerimaan Syarat
          </h2>
          <p>
            Dengan mengakses dan menggunakan aplikasi ini, Anda menyetujui untuk terikat oleh Syarat dan Ketentuan ini. Layanan ini menyediakan pembuatan perangkat ajar berbasis AI (Kecerdasan Buatan) yang dirancang khusus untuk mempermudah guru dan tenaga pendidik.
          </p>
        </section>

        <section className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <h2 className="text-base font-bold mb-2 text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">2</span>
            Lisensi dan Pembayaran
          </h2>
          <p>
            Akses ke fitur premium memerlukan pembelian lisensi (kode akses) sebesar <strong>Rp 150.000</strong>. Lisensi bersifat mengikat pada akun dan tidak dapat dipindahtangankan. Pembayaran diproses melalui gerbang pembayaran resmi (Payment Gateway) atau kanal kemitraan terverifikasi.
          </p>
        </section>

        <section className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <h2 className="text-base font-bold mb-2 text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 text-xs flex items-center justify-center font-bold">3</span>
            Kebijakan Penggunaan AI dan Batasan Wajar (Fair Use)
          </h2>
          <p>
            Untuk menjaga stabilitas sistem, kami menerapkan kebijakan batas penggunaan wajar (<em>Fair Usage Policy</em>). Pengguna dilarang melakukan spamming <em>request</em> generasi AI secara terus-menerus yang dapat membebani server (contoh: <em>Error 429 Too Many Requests</em>). Pengguna dipersilakan menghubungkan Google Gemini API Key pribadi (BYOK) secara gratis untuk keleluasaan kuota tanpa batas.
          </p>
        </section>

        <section className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <h2 className="text-base font-bold mb-2 text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-rose-600 text-white text-xs flex items-center justify-center font-bold">4</span>
            Kebijakan Pengembalian Dana (Refund)
          </h2>
          <p>
            Mengingat produk ini berupa layanan digital (SaaS), semua pembelian bersifat final. Pengembalian dana hanya dapat diproses jika terjadi kegagalan sistem permanen dari pihak kami yang menyebabkan aplikasi tidak dapat digunakan sama sekali selama 7 hari berturut-turut.
          </p>
        </section>
      </div>

      <div className="mt-8 p-6 bg-blue-50 border-2 border-blue-200 rounded-2xl shadow-xs">
        <h3 className="text-base font-extrabold mb-2 text-blue-900 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-600" />
          Butuh Bantuan?
        </h3>
        <p className="mb-4 text-xs md:text-sm text-blue-800">
          Jika Anda mengalami kendala terkait pembayaran, aktivasi kode lisensi, atau teknis aplikasi perangkat ajar, silakan hubungi tim dukungan kami melalui kontak resmi berikut:
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href={`https://wa.me/${supportWhatsApp}?text=Halo%20Tim%20Support,%20saya%20butuh%20bantuan%20terkait%20aplikasi...`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition flex items-center gap-2 shadow-sm border border-emerald-700"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp Kami</span>
          </a>
          <a
            href={`mailto:${supportEmail}?subject=Bantuan%20Aplikasi%20Perangkat%20Ajar`}
            className="px-4 py-2.5 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-900 transition flex items-center gap-2 shadow-sm border border-slate-900"
          >
            <Mail className="w-4 h-4" />
            <span>Email Dukungan</span>
          </a>
        </div>
      </div>

      {onClose && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-900 text-xs font-bold rounded-xl transition"
          >
            Tutup
          </button>
        </div>
      )}
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
        <div className="my-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl">
          {content}
        </div>
      </div>
    );
  }

  return content;
};

export default TermsOfService;
