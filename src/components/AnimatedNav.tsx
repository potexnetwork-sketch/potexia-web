"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const sectionIds = ["top", "layanan", "segmen", "dokumentasi", "alur", "kontak"] as const;

type SectionId = (typeof sectionIds)[number];

export default function AnimatedNav({ locale }: { locale: "id" | "en" }) {
  const [activeSection, setActiveSection] = useState<SectionId>("top");

  useEffect(() => {
    let frame = 0;

    function updateActiveSection() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const scrollBottom = window.scrollY + window.innerHeight;
        const pageBottom = document.documentElement.scrollHeight;
        if (scrollBottom >= pageBottom - 4) {
          setActiveSection("kontak");
          return;
        }

        const readingLine = window.scrollY + 128;
        let currentSection: SectionId = "top";

        for (const id of sectionIds) {
          const section = document.getElementById(id);
          if (section && section.getBoundingClientRect().top + window.scrollY <= readingLine) {
            currentSection = id;
          }
        }

        setActiveSection(currentSection);
      });
    }

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, []);

  const navigation: Array<{ id: SectionId; label: string }> =
    locale === "id"
      ? [
          { id: "top", label: "Beranda" },
          { id: "layanan", label: "Layanan" },
          { id: "segmen", label: "Segmen" },
          { id: "dokumentasi", label: "Dokumentasi" },
          { id: "alur", label: "Alur Kerja" },
          { id: "kontak", label: "Kontak" },
        ]
      : [
          { id: "top", label: "Home" },
          { id: "layanan", label: "Services" },
          { id: "segmen", label: "Industries" },
          { id: "dokumentasi", label: "Documentation" },
          { id: "alur", label: "Our Process" },
          { id: "kontak", label: "Contact" },
        ];

  return (
    <nav className="hidden items-center gap-6 text-sm font-medium lg:flex">
      {navigation.map((item) => {
        const active = activeSection === item.id;

        return (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={() => setActiveSection(item.id)}
            className={`relative py-3 transition-colors ${active ? "text-blue-900" : "text-slate-600 hover:text-slate-950"}`}
          >
            {item.label}
            {active && (
              <motion.span
                layoutId="desktop-nav-underline"
                className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-blue-900"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
          </a>
        );
      })}
    </nav>
  );
}
