import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronDown, Building2, CheckCircle2, Cctv, Globe, Globe2, Headphones, Network, ShoppingBag, Wrench } from "lucide-react";
import { getCompanySettings, getPublishedProjects } from "@/lib/supabase/queries";
import ConsultationForm from "@/components/ConsultationForm";
import MotionReveal from "@/components/MotionReveal";
import SegmentTabs from "@/components/SegmentTabs";
import MobileMenu from "@/components/MobileMenu";
import AnimatedNav from "@/components/AnimatedNav";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string | string[] }>;
}) {
  const resolvedParams = await searchParams;
  const langParam = Array.isArray(resolvedParams.lang)
    ? resolvedParams.lang[0]
    : resolvedParams.lang;
  const locale: "id" | "en" = langParam === "en" ? "en" : "id";
  const [projects, settings] = await Promise.all([getPublishedProjects(), getCompanySettings()]);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: settings.brand_name,
    description: settings.tagline,
    url: "https://potexia.web.id",
    logo: "https://potexia.web.id/logo-transparent.png",
    image: "https://potexia.web.id/logo-transparent.png",
    email: settings.email,
    telephone: settings.phone_display,
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.address,
      addressCountry: "ID",
    },
    areaServed: {
      "@type": "Country",
      name: "Indonesia",
    },
    availableLanguage: ["Indonesian", "English"],
  };
  const services = locale === "id" ? [
    { icon: Network, title: "Infrastruktur & Kelola Jaringan", text: "Rancang LAN/fiber, perluas cakupan Wi-Fi, dan kelola perangkat jaringan kantor." },
    { icon: Headphones, title: "Managed Service IT", text: "Pantau perangkat, tangani gangguan, dan jadwalkan perawatan serta dukungan IT." },
    { icon: ShoppingBag, title: "Aplikasi Kasir (POS)", text: "Atur POS sesuai alur usaha, kelola transaksi dan stok, lalu latih staf." },
    { icon: Cctv, title: "Pemasangan CCTV", text: "Survei lokasi, pasang kamera dan NVR, atur penyimpanan serta pemantauan jarak jauh." },
    { icon: Globe2, title: "Website & Landing Page", text: "Bangun website profil, katalog, atau landing page untuk menjangkau pelanggan." },
    { icon: Wrench, title: "Maintenance Jaringan & CCTV", text: "Periksa jaringan dan CCTV, rawat perangkat, perbarui konfigurasi, tangani gangguan." },
  ] : [
    { icon: Network, title: "Infrastructure & Network Management", text: "Plan LAN/fiber, improve Wi-Fi coverage, and manage your network equipment." },
    { icon: Headphones, title: "Managed IT Services", text: "Monitor devices, resolve issues, and schedule system maintenance and IT support." },
    { icon: ShoppingBag, title: "Point of Sale (POS)", text: "Configure POS around your workflow, track sales and stock, and train your staff." },
    { icon: Cctv, title: "CCTV Installation", text: "Survey your site, install cameras and NVR, and configure secure remote access." },
    { icon: Globe2, title: "Websites & Landing Pages", text: "Build a company profile, catalog, or landing page to reach more customers." },
    { icon: Wrench, title: "Network & CCTV Maintenance", text: "Inspect equipment, update configurations, and resolve network or CCTV faults." },
  ];
  const steps = locale === "id" ? [
    ["01", "Konsultasi", "Kami memahami kebutuhan, kendala, target operasional, anggaran, dan prioritas teknologi bisnis Anda."],
    ["02", "Survei Lokasi", "Tim menilai kondisi lapangan, cakupan area, kebutuhan perangkat, dan solusi teknis yang paling tepat."],
    ["03", "Penawaran & Kesepakatan", "Solusi, ruang lingkup pekerjaan, jadwal, dan estimasi biaya disusun lalu disepakati sebelum implementasi."],
    ["04", "Implementasi", "Pekerjaan dilaksanakan sesuai kesepakatan dengan instalasi terstruktur, pengujian menyeluruh, serah terima, dan dokumentasi."],
  ] : [
    ["01", "Consultation", "We discuss your requirements, operational challenges, targets, budget, and technology priorities."],
    ["02", "Site Survey", "Our team assesses field conditions, coverage area, equipment requirements, and the most suitable technical solution."],
    ["03", "Proposal & Agreement", "The solution, scope of work, schedule, and estimated cost are prepared and agreed before implementation."],
    ["04", "Implementation", "Work is carried out according to the agreement with structured installation, comprehensive testing, handover, and documentation."],
  ];

  return (
    <main className="overflow-hidden bg-white text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-[6px] lg:px-8">
          <a href="#top" className="flex h-[40px] items-center" aria-label="POTEXIA - Data & Technology Solutions">
            <Image src="/logo-transparent.png" alt="POTEXIA" width={220} height={72} priority className="h-[40px] w-auto object-contain" />
          </a>
          <AnimatedNav locale={locale} />
          <div className="ml-auto flex items-center lg:ml-0">
            <details className="group relative hidden lg:block">
              <summary className="inline-flex h-8 cursor-pointer list-none items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-slate-800 hover:bg-slate-100">
                <Globe size={20} strokeWidth={1.75} className="text-slate-800" />
                <span>{locale === "id" ? "ID" : "EN"}</span>
                <ChevronDown size={14} strokeWidth={1.75} className="text-slate-700 transition-transform group-open:rotate-180" />
              </summary>
              <div className="absolute right-0 mt-2 w-48 rounded-lg border border-slate-200 bg-white p-1.5 shadow-xl">
                <Link href="/?lang=id" className={`flex items-center justify-between rounded-md px-3 py-2.5 text-sm ${locale === "id" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"}`}>
                  <span>Bahasa Indonesia</span><span className="text-xs font-bold">ID</span>
                </Link>
                <Link href="/?lang=en" className={`mt-1 flex items-center justify-between rounded-md px-3 py-2.5 text-sm ${locale === "en" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"}`}>
                  <span>English</span><span className="text-xs font-bold">EN</span>
                </Link>
              </div>
            </details>

            <div className="lg:hidden">
              <MobileMenu locale={locale} />
            </div>
          </div>
        </div>
      </header>

      <section id="top" className="relative isolate min-h-[620px] overflow-hidden border-b border-slate-900 pt-[78px] text-white md:min-h-[680px] md:pt-[72px]">
        <Image
          src="/potek-building-hero.jpg"
          alt="Gedung perkantoran modern dengan fasad kaca"
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover object-[50%_50%]"
        />
        <div className="absolute inset-0 -z-10 building-hero-overlay" />

        <div className="mx-auto flex min-h-[620px] max-w-7xl items-center px-5 pb-24 pt-10 md:min-h-[680px] md:pb-24 md:pt-16 lg:px-8 lg:py-24">
          <MotionReveal className="max-w-3xl">
            <h1 className="max-w-3xl text-[32px] font-bold leading-[1.12] text-white sm:text-4xl md:text-6xl">{locale === "id" ? "Solusi IT Profesional untuk Mendukung Pertumbuhan Bisnis Anda" : "Professional IT Solutions Built to Support Your Business Growth"}</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-100 md:mt-6 md:text-lg md:leading-8">{locale === "id" ? "POTEXIA membantu bisnis, kantor, UMKM, sekolah, hotel, dan properti membangun infrastruktur jaringan, sistem keamanan, aplikasi kasir, serta solusi digital yang aman, stabil, terukur, dan disesuaikan dengan kebutuhan operasional Anda." : "POTEXIA helps businesses, offices, local enterprises, schools, hotels, and properties build secure, stable, and scalable network infrastructure, security systems, POS applications, and digital solutions tailored to operational needs."}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#kontak" className="inline-flex items-center justify-center rounded-md bg-white px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-100">{locale === "id" ? "Konsultasi Gratis" : "Free Consultation"} <ArrowRight className="ml-2" size={18} strokeWidth={1.75} /></a>
              <a href="#layanan" className="inline-flex items-center justify-center rounded-md border border-white/60 bg-slate-950/20 px-5 py-3 text-sm font-semibold text-white hover:border-white hover:bg-slate-950/40">{locale === "id" ? "Lihat Layanan" : "Explore Services"}</a>
            </div>
          </MotionReveal>
        </div>
      </section>

      <section id="layanan" className="mx-auto max-w-7xl px-5 py-16 md:py-20 lg:px-8">
        <MotionReveal>
          <p className="text-sm font-bold uppercase text-blue-900">{locale === "id" ? "Layanan Utama" : "Core Services"}</p>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">{locale === "id" ? "Solusi yang menutup kebutuhan operasional" : "Solutions designed for complete operational needs"}</h2>
        </MotionReveal>
        <div className="mt-9 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <MotionReveal key={service.title} delay={index * 0.04} className="h-full">
              <article className="group flex h-full min-h-[250px] flex-col border border-slate-200 bg-white p-5 transition-colors hover:border-blue-300 sm:p-6">
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-blue-900 transition-colors group-hover:bg-blue-900 group-hover:text-white">
                  <service.icon size={20} strokeWidth={1.75} />
                </div>
                <h3 className="text-lg font-bold leading-snug text-slate-950">{service.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{service.text}</p>
                <a href="#kontak" className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-blue-900 hover:text-blue-700">
                  {locale === "id" ? "Konsultasi layanan" : "Discuss this service"}
                  <ArrowRight size={15} strokeWidth={1.8} className="transition-transform group-hover:translate-x-0.5" />
                </a>
              </article>
            </MotionReveal>
          ))}
        </div>
      </section>

      <section id="segmen" className="bg-slate-50 py-16 md:py-20"><div className="mx-auto max-w-7xl px-5 lg:px-8"><MotionReveal><p className="text-sm font-bold uppercase text-blue-900">{locale === "id" ? "Solusi Berdasarkan Segmen" : "Solutions by Industry"}</p><h2 className="mt-3 text-3xl font-bold md:text-4xl">{locale === "id" ? "Sesuaikan dengan cara bisnis Anda bekerja" : "Tailored to the way your organization operates"}</h2></MotionReveal><div className="mt-9"><SegmentTabs locale={locale} /></div></div></section>

      <section id="dokumentasi" className="mx-auto max-w-7xl px-5 py-16 md:py-20 lg:px-8">
        <MotionReveal><p className="text-sm font-bold uppercase text-blue-900">{locale === "id" ? "Dokumentasi & Studi Kasus" : "Portfolio & Case Studies"}</p><h2 className="mt-3 text-3xl font-bold md:text-4xl">{locale === "id" ? "Implementasi yang telah dilaksanakan" : "Selected implementation projects"}</h2></MotionReveal>
        {projects.length === 0 ? <div className="mt-9 border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center"><Wrench className="mx-auto text-slate-400" size={28} strokeWidth={1.75} /><p className="mt-4 font-semibold text-slate-700">{locale === "id" ? "Dokumentasi proyek belum tersedia" : "No project documentation available"}</p><p className="mt-1 text-sm text-slate-500">{locale === "id" ? "Konten terbaru akan segera ditampilkan." : "The latest project updates will appear here."}</p></div> : <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{projects.map((project, index) => <MotionReveal key={project.id} delay={index * 0.04}><article className="overflow-hidden border border-slate-200 bg-white">{project.image_url ? <img src={project.image_url} alt={project.title} className="h-52 w-full object-cover" /> : <div className="flex h-52 items-center justify-center bg-slate-100"><Building2 size={36} strokeWidth={1.75} className="text-slate-400" /></div>}<div className="p-5"><div className="mb-4 flex flex-wrap gap-2"><span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{project.category}</span><span className="rounded-md border border-blue-900/20 px-2.5 py-1 text-xs font-semibold text-blue-900">{project.service_type}</span></div><h3 className="text-lg font-bold">{project.title}</h3><p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{project.summary}</p></div></article></MotionReveal>)}</div>}
      </section>

      <section id="alur" className="border-y border-slate-200 bg-slate-50 py-16 md:py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-[0.72fr_1.28fr] lg:items-start lg:px-8">
          <MotionReveal>
            <p className="text-sm font-bold uppercase text-blue-900">{locale === "id" ? "Alur Kerja" : "Our Process"}</p>
            <h2 className="mt-3 max-w-xl text-3xl font-bold leading-[1.12] md:text-5xl">{locale === "id" ? "Dari konsultasi hingga implementasi yang terencana" : "From consultation to structured implementation"}</h2>
          </MotionReveal>

          <div className="relative">
            {steps.map(([number, title, text], index) => (
              <MotionReveal key={number} delay={index * 0.04} className="relative">
                <article className="relative grid grid-cols-[20px_1fr] gap-4 pb-7 last:pb-0">
                  {index < steps.length - 1 && (
                    <div className="absolute bottom-0 left-[5.5px] top-[18px] w-px bg-slate-950/80" />
                  )}
                  <div className="relative z-10 mt-2 h-[12px] w-[12px] shrink-0 rounded-full border-2 border-slate-50 bg-slate-950" />
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                    <p className="mt-2 max-w-xl text-[15px] leading-6 text-slate-600">{text}</p>
                  </div>
                </article>
              </MotionReveal>
            ))}
          </div>
        </div>
      </section>

      <section id="kontak" className="scroll-mt-20 border-y border-slate-200 bg-slate-50 py-16 md:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:px-8">
          <MotionReveal className="lg:pt-3">
            <p className="text-sm font-bold uppercase text-blue-900">{locale === "id" ? "Konsultasi Proyek" : "Project Consultation"}</p>
            <h2 className="mt-3 max-w-lg text-3xl font-bold leading-tight text-slate-950 md:text-4xl">{locale === "id" ? "Mulai dari kebutuhan bisnis Anda" : "Start with what your business needs"}</h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">{locale === "id" ? "Ceritakan kebutuhan dan kendala yang sedang dihadapi. Tim POTEXIA akan meninjau detailnya dan membantu menentukan langkah yang paling sesuai." : "Tell us about your needs and current challenges. The POTEXIA team will review the details and help identify the right next steps."}</p>
            <div className="mt-8 divide-y divide-slate-200 border-y border-slate-200">
              {(locale === "id"
                ? ["Survei kebutuhan dan konsultasi awal", "Solusi disesuaikan dengan lokasi dan operasional", "Rencana implementasi dan dukungan yang jelas"]
                : ["Initial needs assessment and consultation", "Solutions tailored to your site and operations", "Clear implementation and support plan"]
              ).map((text) => <div key={text} className="flex items-center gap-3 py-4 text-sm font-semibold text-slate-700"><CheckCircle2 size={18} strokeWidth={1.75} className="shrink-0 text-blue-800" />{text}</div>)}
            </div>
          </MotionReveal>
          <MotionReveal delay={0.05}>
            <ConsultationForm settings={settings} locale={locale} />
          </MotionReveal>
        </div>
      </section>

      <footer className="border-t border-slate-800 bg-slate-900 text-slate-300"><div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-3 lg:px-8"><div><p className="text-xl font-bold text-white">{settings.brand_name}</p><p className="mt-2 text-sm">{settings.tagline}</p></div><div><p className="text-sm font-bold text-white">{locale === "id" ? "Layanan" : "Services"}</p><p className="mt-3 text-sm leading-6">Jaringan &amp; Infrastruktur<br />Managed Service IT<br />Aplikasi Kasir (POS)<br />Pemasangan CCTV<br />Website &amp; Landing Page<br />Maintenance Jaringan &amp; CCTV</p></div><div><p className="text-sm font-bold text-white">Kontak</p><p className="mt-3 text-sm leading-6">{settings.address}<br />{settings.email}<br />{settings.phone_display}</p></div></div></footer>
    </main>
  );
}
