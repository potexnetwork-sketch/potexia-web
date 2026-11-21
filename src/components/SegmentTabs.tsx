"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const segments = {
  Kantor: {
    challenge: "Gangguan jaringan, koneksi Wi-Fi yang tidak konsisten, dan perangkat kantor yang tidak terawat dapat menghambat komunikasi, operasional tim, serta keamanan data harian. Tanpa pemantauan rutin, masalah teknis sering baru ditangani setelah berdampak pada produktivitas.",
    solution: "POTEXIA merancang jaringan kantor yang terkelola, memperluas dan mengoptimalkan Wi-Fi, memantau perangkat serta konektivitas, dan menyediakan pendampingan teknis sesuai kebutuhan dan jam operasional. Sistem disusun agar mudah dikembangkan seiring bertambahnya karyawan dan perangkat.",
  },
  "Hotel & Villa": {
    challenge: "Sinyal Wi-Fi perlu tetap kuat di kamar, area publik, dan fasilitas luar, sementara tamu, staf, dan sistem operasional membutuhkan pengelolaan akses yang berbeda. Gangguan jaringan dapat menurunkan kenyamanan tamu serta menghambat layanan front office, CCTV, dan pemesanan.",
    solution: "POTEXIA melakukan survei coverage, merancang penempatan access point, mengatur jaringan tamu dan staf secara terpisah, serta mengintegrasikan Wi-Fi dengan kebutuhan operasional. Pemeliharaan berkala dan dukungan cepat membantu menjaga layanan tetap stabil sepanjang waktu.",
  },
  "F&B & UMKM": {
    challenge: "Proses transaksi yang lambat, pencatatan stok manual, gangguan printer, atau kasir tidak siap dapat memperlambat pelayanan dan menyulitkan pemilik memantau penjualan setiap hari.",
    solution: "POTEXIA menyediakan aplikasi kasir dan POS yang disesuaikan dengan alur usaha, mengatur perangkat dan printer, serta membantu migrasi data serta pelatihan staf. Laporan stok dan penjualan disusun agar pemilik dapat memantau performa usaha secara lebih cepat dan akurat.",
  },
  Sekolah: {
    challenge: "Laboratorium, administrasi, ruang kelas, dan kegiatan pembelajaran membutuhkan koneksi internet serta perangkat yang stabil. Banyak sekolah juga kesulitan mengelola akun, perangkat, kabel jaringan, dan bantuan teknis secara konsisten.",
    solution: "POTEXIA membangun jaringan LAN dan Wi-Fi aman, menyusun pembagian area akses, mengelola perangkat dan akun dasar, serta menyiapkan jadwal dukungan IT rutin. Solusi dirancang praktis bagi guru dan tenaga administrasi serta dapat disesuaikan dengan perkembangan jumlah pengguna.",
  },
};

type SegmentName = keyof typeof segments;

export default function SegmentTabs({ locale = "id" }: { locale?: "id" | "en" }) {
  const [active, setActive] = useState<SegmentName>("Kantor");

  return (
    <div>
      <div className="flex flex-wrap gap-2 border-b border-slate-200">
        {(Object.keys(segments) as SegmentName[]).map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setActive(name)}
            className={`border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
              active === name
                ? "border-blue-900 text-blue-900"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
            aria-pressed={active === name}
          >
            {locale === "en"
              ? ({ Kantor: "Office", "Hotel & Villa": "Hotel & Villa", "F&B & UMKM": "F&B & SMB", Sekolah: "Education" } as Record<string, string>)[name]
              : name}
          </button>
        ))}
      </div>

      <motion.div
        key={active}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="grid gap-6 border-x border-b border-slate-200 bg-white p-6 md:grid-cols-2 md:p-8"
      >
        <div>
          <p className="mb-2 text-xs font-bold uppercase text-slate-500">{locale === "id" ? "Tantangan umum" : "Common challenges"}</p>
          <p className="leading-7 text-slate-700">{locale === "en"
            ? ({
                Kantor: "Network interruptions, inconsistent Wi-Fi, and poorly maintained office devices can disrupt team communication, daily operations, and data security. Without routine monitoring, technical issues are often discovered only after productivity is affected.",
                "Hotel & Villa": "Reliable Wi-Fi is needed across rooms, public areas, and outdoor facilities, while guests, staff, and operating systems require separate access management. Network problems can reduce guest comfort and interrupt front-office, CCTV, and booking services.",
                "F&B & UMKM": "Slow transactions, manual stock records, printer failures, or unprepared cashier systems can delay customer service and make it difficult for owners to monitor sales performance each day.",
                Sekolah: "Laboratories, administration, classrooms, and learning activities require stable internet and dependable devices. Schools also need consistent support for account, device, cable-network, and technical issue management.",
              } as Record<string, string>)[active]
            : segments[active].challenge}</p>
        </div>
        <div className="border-l-0 border-slate-200 md:border-l md:pl-6">
          <p className="mb-2 text-xs font-bold uppercase text-blue-900">{locale === "id" ? "Solusi POTEXIA" : "POTEXIA solution"}</p>
          <p className="leading-7 text-slate-700">{locale === "en"
            ? ({
                Kantor: "POTEXIA designs managed office networks, improves and expands Wi-Fi coverage, monitors devices and connectivity, and provides technical support aligned with operating hours. The system is structured to grow as employee and device numbers increase.",
                "Hotel & Villa": "POTEXIA surveys every coverage area, plans distributed access-point placement, separates guest and staff networks, and integrates Wi-Fi with operational needs. Scheduled maintenance and responsive support keep services stable throughout the day.",
                "F&B & UMKM": "POTEXIA provides POS and cashier applications tailored to business workflows, configures devices and printers, assists with data migration, and trains staff. Sales and inventory reports are prepared so owners can monitor performance quickly and accurately.",
                Sekolah: "POTEXIA builds secure LAN and Wi-Fi systems, organizes access areas, manages basic accounts and shared devices, and prepares a recurring IT support schedule. The solution remains practical for teachers and administrative staff while allowing future user growth.",
              } as Record<string, string>)[active]
            : segments[active].solution}</p>
        </div>
      </motion.div>
    </div>
  );
}
