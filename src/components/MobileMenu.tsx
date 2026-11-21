"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

export default function MobileMenu({ locale }: { locale: "id" | "en" }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function closeMenu() {
    setOpen(false);
  }

  const navigation = locale === "id"
    ? [
        ["#top", "Beranda"],
        ["#layanan", "Layanan"],
        ["#segmen", "Segmen"],
        ["#dokumentasi", "Dokumentasi"],
        ["#alur", "Alur Kerja"],
        ["#kontak", "Kontak"],
      ]
    : [
        ["#top", "Home"],
        ["#layanan", "Services"],
        ["#segmen", "Industries"],
        ["#dokumentasi", "Documentation"],
        ["#alur", "Our Process"],
        ["#kontak", "Contact"],
      ];

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Tutup menu" : "Buka menu"}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex h-9 w-9 cursor-pointer items-center justify-center text-slate-900"
      >
        {open ? <X size={22} strokeWidth={1.75} /> : <Menu size={22} strokeWidth={1.75} />}
      </button>

      <div
        aria-hidden={!open}
        className={`fixed inset-0 z-[60] lg:hidden ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      >
        <button
          type="button"
          aria-label="Tutup menu"
          tabIndex={open ? 0 : -1}
          onClick={closeMenu}
          className={`absolute inset-0 bg-slate-950/55 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
        />
        <aside
          className={`absolute right-0 top-0 flex h-[100dvh] w-[82vw] max-w-[320px] flex-col bg-[#f8fafc] px-5 pb-6 pt-5 shadow-2xl transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="flex h-10 items-center justify-between border-b border-slate-200 pb-4">
            <span className="text-sm font-bold text-slate-950">POTEXIA</span>
            <button type="button" aria-label="Tutup menu" onClick={closeMenu} className="flex h-9 w-9 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100">
              <X size={21} strokeWidth={1.75} />
            </button>
          </div>

          <nav className="mt-5 flex flex-col text-base font-semibold text-slate-700">
            {navigation.map(([href, label]) => (
              <a key={href} href={href} onClick={closeMenu} className="border-b border-slate-100 px-1 py-3.5 hover:text-blue-900">{label}</a>
            ))}
          </nav>

          <div className="mt-auto border-t border-slate-200 pt-4">
            <p className="mb-2 text-xs font-bold uppercase text-slate-400">{locale === "id" ? "Bahasa" : "Language"}</p>
            <Link href="/?lang=id" onClick={closeMenu} className={`flex items-center justify-between rounded-md px-3 py-2.5 text-sm ${locale === "id" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"}`}><span>Bahasa Indonesia</span><span className="text-xs font-bold">ID</span></Link>
            <Link href="/?lang=en" onClick={closeMenu} className={`mt-1 flex items-center justify-between rounded-md px-3 py-2.5 text-sm ${locale === "en" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"}`}><span>English</span><span className="text-xs font-bold">EN</span></Link>
          </div>
        </aside>
      </div>
    </>
  );
}
