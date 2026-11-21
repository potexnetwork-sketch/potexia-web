"use client";

import type { CompanySettings } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { FormEvent, useState } from "react";

export default function ConsultationForm({ settings, locale = "id" }: { settings: CompanySettings; locale?: "id" | "en" }) {
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setStatus("");

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload = {
      name: String(form.get("name") ?? ""),
      business: String(form.get("business") ?? ""),
      segment: String(form.get("segment") ?? ""),
      service: String(form.get("service") ?? ""),
      location: String(form.get("location") ?? ""),
      notes: String(form.get("notes") ?? ""),
      locale,
      status: "new",
    };

    const supabase = createClient();
    const { error } = await supabase.from("consultation_requests").insert(payload);

    if (error) {
      setStatus(locale === "id"
        ? "Permintaan belum berhasil disimpan. Silakan coba lagi."
        : "Your request could not be saved. Please try again.");
      setSubmitting(false);
      return;
    }

    const message = [
      locale === "id"
        ? "Halo POTEXIA, saya ingin konsultasi solusi IT."
        : "Hello POTEXIA, I would like to request an IT consultation.",
      "",
      `${locale === "id" ? "Nama" : "Name"}: ${payload.name}`,
      `${locale === "id" ? "Usaha/Instansi" : "Business/Institution"}: ${payload.business}`,
      `${locale === "id" ? "Segmen" : "Segment"}: ${payload.segment}`,
      `${locale === "id" ? "Layanan" : "Service"}: ${payload.service}`,
      `${locale === "id" ? "Lokasi" : "Location"}: ${payload.location}`,
      `${locale === "id" ? "Kebutuhan" : "Requirements"}: ${payload.notes || "-"}`,
    ].join("\n");

    formElement.reset();
    setStatus(locale === "id" ? "Permintaan tersimpan. Membuka WhatsApp..." : "Request saved. Opening WhatsApp...");
    setSubmitting(false);

    const url = `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(message)}`;
    setWhatsappUrl(url);

    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (!opened) {
      setStatus(locale === "id"
        ? "Permintaan tersimpan. Klik tautan WhatsApp untuk melanjutkan."
        : "Request saved. Click the WhatsApp link to continue.");
    }
  }

  const inputClass =
    "mt-2 w-full rounded-md border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-800 focus:ring-4 focus:ring-blue-800/10";

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 rounded-md border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2 md:gap-x-5 md:p-7">
      <div className="border-b border-slate-100 pb-4 md:col-span-2">
        <h3 className="text-lg font-bold text-slate-950">{locale === "id" ? "Detail Permintaan" : "Request Details"}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">{locale === "id" ? "Lengkapi informasi berikut agar kami dapat menyiapkan rekomendasi yang tepat." : "Complete the details below so we can prepare a suitable recommendation."}</p>
      </div>
      <label className="text-sm font-semibold text-slate-700">
        {locale === "id" ? "Nama Lengkap" : "Full Name"}
        <input required name="name" className={inputClass} placeholder={locale === "id" ? "Nama Anda" : "Your name"} />
      </label>
      <label className="text-sm font-semibold text-slate-700">
        {locale === "id" ? "Nama Usaha/Instansi" : "Business/Institution Name"}
        <input required name="business" className={inputClass} placeholder={locale === "id" ? "Nama usaha atau instansi" : "Business or institution name"} />
      </label>
      <label className="text-sm font-semibold text-slate-700">
        {locale === "id" ? "Kategori Segmen" : "Industry Segment"}
        <select required name="segment" className={inputClass} defaultValue="">
          <option value="" disabled>{locale === "id" ? "Pilih segmen" : "Select an industry"}</option>
          <option value={locale === "id" ? "Kantor" : "Office"}>{locale === "id" ? "Kantor" : "Office"}</option>
          <option value={locale === "id" ? "Hotel & Villa" : "Hotel & Villa"}>{locale === "id" ? "Hotel & Villa" : "Hotel & Villa"}</option>
          <option value={locale === "id" ? "F&B & UMKM" : "F&B & SMB"}>{locale === "id" ? "F&B & UMKM" : "F&B & SMB"}</option>
          <option value={locale === "id" ? "Sekolah" : "Education"}>{locale === "id" ? "Sekolah" : "Education"}</option>
          <option value={locale === "id" ? "Lainnya" : "Other"}>{locale === "id" ? "Lainnya" : "Other"}</option>
        </select>
      </label>
      <label className="text-sm font-semibold text-slate-700">
        {locale === "id" ? "Layanan yang Dibutuhkan" : "Required Service"}
        <select required name="service" className={inputClass} defaultValue="">
          <option value="" disabled>{locale === "id" ? "Pilih layanan" : "Select a service"}</option>
          <option>{locale === "id" ? "Jaringan & Infrastruktur" : "Network & Infrastructure"}</option>
          <option>{locale === "id" ? "Managed Service IT" : "Managed IT Services"}</option>
          <option>{locale === "id" ? "Aplikasi Kasir (POS)" : "Point of Sale (POS)"}</option>
          <option>{locale === "id" ? "Pemasangan CCTV" : "CCTV Installation"}</option>
          <option>{locale === "id" ? "Website & Landing Page" : "Website & Landing Page"}</option>
          <option>{locale === "id" ? "Maintenance Jaringan & CCTV" : "Network & CCTV Maintenance"}</option>
          <option>{locale === "id" ? "Paket Lengkap" : "Complete Package"}</option>
        </select>
      </label>
      <label className="text-sm font-semibold text-slate-700 md:col-span-2">
        {locale === "id" ? "Lokasi/Area" : "Location/Area"}
        <input required name="location" className={inputClass} placeholder={locale === "id" ? "Kota atau alamat lokasi" : "City or site address"} />
      </label>
      <label className="text-sm font-semibold text-slate-700 md:col-span-2">
        {locale === "id" ? "Kebutuhan/Catatan" : "Requirements/Notes"}
        <textarea name="notes" rows={4} className={inputClass} placeholder={locale === "id" ? "Ceritakan kebutuhan atau kendala saat ini" : "Describe your requirements or current challenges"} />
      </label>
      <div className="md:col-span-2">
        <button disabled={submitting} type="submit" className="inline-flex w-full items-center justify-center rounded-md bg-blue-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto">
          {submitting
            ? (locale === "id" ? "Menyimpan..." : "Saving...")
            : (locale === "id" ? "Kirim via WhatsApp" : "Send via WhatsApp")}
        </button>
        {status && <p className="mt-3 text-sm text-slate-600" role="status">{status}</p>}
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex text-sm font-bold text-blue-900 underline underline-offset-4"
          >
            {locale === "id" ? "Lanjutkan ke WhatsApp" : "Continue to WhatsApp"}
          </a>
        )}
      </div>
    </form>
  );
}
