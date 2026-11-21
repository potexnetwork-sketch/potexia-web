"use client";

import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { CompanySettings, ConsultationRequest, ProjectItem } from "@/types/database";
import { BarChart3, FileText, ImagePlus, LayoutDashboard, LogOut, MessageSquareText, Pencil, Plus, Settings, Trash2 } from "lucide-react";
import FinanceWorkspace from "@/components/admin/FinanceWorkspace";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

const emptyProject = {
  title: "",
  category: "Kantor",
  service_type: "Jaringan",
  summary: "",
  is_published: true,
};

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [tab, setTab] = useState<"overview" | "projects" | "requests" | "finance" | "settings">("overview");
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [requests, setRequests] = useState<ConsultationRequest[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [projectForm, setProjectForm] = useState(emptyProject);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadProjects() {
    const { data, error: loadError } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });
    if (loadError) setError(loadError.message);
    else setProjects((data ?? []) as ProjectItem[]);
  }

  async function loadRequests() {
    const { data, error: loadError } = await supabase
      .from("consultation_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (loadError) setError(loadError.message);
    else setRequests((data ?? []) as ConsultationRequest[]);
  }

  useEffect(() => {
    let active = true;

    async function loadInitialData() {
      const [projectsResult, requestsResult, settingsResult] = await Promise.all([
        supabase.from("projects").select("*").order("created_at", { ascending: false }),
        supabase.from("consultation_requests").select("*").order("created_at", { ascending: false }),
        supabase.from("company_settings").select("*").eq("id", 1).single(),
      ]);

      if (!active) return;
      if (projectsResult.error) setError(projectsResult.error.message);
      else setProjects((projectsResult.data ?? []) as ProjectItem[]);
      if (requestsResult.error) setError(requestsResult.error.message);
      else setRequests((requestsResult.data ?? []) as ConsultationRequest[]);
      if (settingsResult.error) setError(settingsResult.error.message);
      else setSettings(settingsResult.data as CompanySettings);
    }

    void loadInitialData();
    return () => {
      active = false;
    };
  }, [supabase]);

  useEffect(() => {
    if (!imageFile) {
      setPreviewImageUrl(null);
      return;
    }

    const imageUrl = URL.createObjectURL(imageFile);
    setPreviewImageUrl(imageUrl);
    return () => URL.revokeObjectURL(imageUrl);
  }, [imageFile]);

  function resetProjectForm() {
    setEditingId(null);
    setProjectForm(emptyProject);
    setImageFile(null);
    setExistingImageUrl(null);
  }

  function startEdit(project: ProjectItem) {
    setEditingId(project.id);
    setProjectForm({
      title: project.title,
      category: project.category,
      service_type: project.service_type,
      summary: project.summary,
      is_published: project.is_published,
    });
    setExistingImageUrl(project.image_url);
    setImageFile(null);
    setMessage("");
    setError("");
  }

  async function handleProjectSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    let imageUrl = existingImageUrl;
    if (imageFile) {
      const uniqueId = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const fileName = `${uniqueId}-${imageFile.name.replace(/[^a-zA-Z0-9.-]/g, "-")}`;
      const { error: uploadError } = await supabase.storage
        .from("portfolio-images")
        .upload(fileName, imageFile, { upsert: false });
      if (uploadError) {
        setError(uploadError.message);
        setBusy(false);
        return;
      }
      const { data: publicUrl } = supabase.storage.from("portfolio-images").getPublicUrl(fileName);
      imageUrl = publicUrl.publicUrl;

      if (existingImageUrl) {
        const marker = "/portfolio-images/";
        const oldPath = existingImageUrl.includes(marker)
          ? decodeURIComponent(existingImageUrl.split(marker)[1])
          : null;
        if (oldPath) await supabase.storage.from("portfolio-images").remove([oldPath]);
      }
    }

    const payload = { ...projectForm, image_url: imageUrl };
    const result = editingId
      ? await supabase.from("projects").update(payload).eq("id", editingId)
      : await supabase.from("projects").insert(payload);

    if (result.error) setError(result.error.message);
    else {
      setMessage(editingId ? "Dokumentasi berhasil diperbarui." : "Dokumentasi berhasil ditambahkan.");
      resetProjectForm();
      await loadProjects();
    }
    setBusy(false);
  }

  async function togglePublished(project: ProjectItem) {
    setBusy(true);
    setError("");
    const { error: updateError } = await supabase
      .from("projects")
      .update({ is_published: !project.is_published })
      .eq("id", project.id);
    if (updateError) setError(updateError.message);
    else await loadProjects();
    setBusy(false);
  }

  async function deleteProject(project: ProjectItem) {
    if (!window.confirm(`Hapus dokumentasi "${project.title}"?`)) return;
    setBusy(true);
    setError("");

    if (project.image_url) {
      const marker = "/portfolio-images/";
      const path = project.image_url.includes(marker)
        ? decodeURIComponent(project.image_url.split(marker)[1])
        : null;
      if (path) await supabase.storage.from("portfolio-images").remove([path]);
    }

    const { error: deleteError } = await supabase.from("projects").delete().eq("id", project.id);
    if (deleteError) setError(deleteError.message);
    else {
      setMessage("Dokumentasi berhasil dihapus.");
      await loadProjects();
    }
    setBusy(false);
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settings) return;
    setBusy(true);
    setError("");
    setMessage("");
    const { error: updateError } = await supabase
      .from("company_settings")
      .update({
        brand_name: settings.brand_name,
        tagline: settings.tagline,
        email: settings.email,
        whatsapp_number: settings.whatsapp_number,
        phone_display: settings.phone_display,
        address: settings.address,
      })
      .eq("id", 1);
    if (updateError) setError(updateError.message);
    else setMessage("Pengaturan perusahaan berhasil diperbarui.");
    setBusy(false);
  }

  async function updateRequestStatus(request: ConsultationRequest, status: ConsultationRequest["status"]) {
    setBusy(true);
    setError("");
    setMessage("");
    const { error: updateError } = await supabase
      .from("consultation_requests")
      .update({ status })
      .eq("id", request.id);
    if (updateError) setError(updateError.message);
    else {
      setMessage("Status permintaan berhasil diperbarui.");
      await loadRequests();
    }
    setBusy(false);
  }

  async function deleteRequest(request: ConsultationRequest) {
    if (!window.confirm(`Hapus permintaan dari "${request.name}"?`)) return;
    setBusy(true);
    setError("");
    const { error: deleteError } = await supabase
      .from("consultation_requests")
      .delete()
      .eq("id", request.id);
    if (deleteError) setError(deleteError.message);
    else {
      setMessage("Permintaan berhasil dihapus.");
      await loadRequests();
    }
    setBusy(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  const inputClass = "mt-2 w-full rounded-md border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-800 focus:ring-4 focus:ring-blue-100";

  const navigation = [
    { id: "overview" as const, label: "Ringkasan", icon: LayoutDashboard },
    { id: "projects" as const, label: "Dokumentasi", icon: FileText },
    { id: "requests" as const, label: "Permintaan", icon: MessageSquareText },
    { id: "finance" as const, label: "Keuangan", icon: BarChart3 },
    { id: "settings" as const, label: "Pengaturan", icon: Settings },
  ];

  return (
    <main className="admin-dashboard min-h-screen bg-slate-100">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <div className="flex h-20 items-center border-b border-slate-200 px-5"><Image src="/logo-transparent.png" alt="POTEXIA Data & Technology Solutions" width={170} height={56} priority className="h-11 w-auto object-contain" /></div>
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            return <button key={item.id} type="button" onClick={() => { setTab(item.id); setMessage(""); setError(""); if (item.id === "requests") void loadRequests(); }} className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors ${tab === item.id ? "bg-blue-50 text-blue-800" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}><Icon size={18} strokeWidth={1.75} />{item.label}</button>;
          })}
        </nav>
        <div className="border-t border-slate-200 p-4"><button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-red-50 hover:text-red-700"><LogOut size={18} strokeWidth={1.75} />Logout</button></div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur lg:px-8"><div className="mx-auto flex max-w-6xl items-center justify-between"><div><p className="text-xs font-semibold uppercase text-slate-400">Admin Workspace</p><p className="mt-1 font-bold text-slate-950">{navigation.find((item) => item.id === tab)?.label}</p></div><div className="flex items-center gap-3"><span className="hidden text-xs font-medium text-slate-500 sm:block">{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date())}</span><button type="button" onClick={logout} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 lg:hidden"><LogOut size={16} />Keluar</button></div></div></header>
        <div className="mx-auto max-w-6xl px-5 py-6 lg:px-8 lg:py-8">
          <div className="mb-5 flex gap-2 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1.5 lg:hidden">
          {navigation.map((item) => <button key={item.id} type="button" onClick={() => { setTab(item.id); setMessage(""); setError(""); if (item.id === "requests") void loadRequests(); }} className={`shrink-0 rounded-md px-3 py-2 text-xs font-semibold ${tab === item.id ? "bg-blue-800 text-white" : "text-slate-600 hover:bg-slate-100"}`}>{item.label}</button>)}
        </div>

        {tab === "overview" && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div><p className="text-xs font-bold uppercase text-blue-800">DASHBOARD</p><h1 className="mt-1 text-2xl font-bold tracking-normal text-slate-950">Ringkasan Operasional</h1><p className="mt-1 text-sm text-slate-500">Pantau aktivitas, permintaan pelanggan, dan arus kas bisnis.</p></div>
              <p className="text-sm font-medium text-slate-500">{new Intl.DateTimeFormat("id-ID", { dateStyle: "full" }).format(new Date())}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <article className="overflow-hidden rounded-lg bg-[#4f78f6] p-5 text-white shadow-sm"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-white/85">Dokumentasi</p><FileText size={19} className="text-white/80" /></div><p className="mt-4 text-3xl font-bold tabular-nums">{projects.length}</p><p className="mt-1 text-xs text-white/75">{projects.filter((project) => project.is_published).length} dipublikasikan</p></article>
              <article className="overflow-hidden rounded-lg bg-[#24a982] p-5 text-white shadow-sm"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-white/85">Permintaan Baru</p><MessageSquareText size={19} className="text-white/80" /></div><p className="mt-4 text-3xl font-bold tabular-nums">{requests.filter((request) => request.status === "new").length}</p><p className="mt-1 text-xs text-white/75">Menunggu tindak lanjut</p></article>
              <article className="overflow-hidden rounded-lg bg-[#ed9417] p-5 text-white shadow-sm sm:col-span-2 xl:col-span-1"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-white/85">Permintaan Aktif</p><BarChart3 size={19} className="text-white/80" /></div><p className="mt-4 text-3xl font-bold tabular-nums">{requests.filter((request) => request.status !== "completed").length}</p><p className="mt-1 text-xs text-white/75">Sedang ditangani tim</p></article>
            </div>

            <FinanceWorkspace compact />
          </div>
        )}

        {tab === "finance" && <FinanceWorkspace />}

        {message && <p className="mb-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">{message}</p>}
        {error && <p className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}

        {tab === "projects" && (
          <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
            <form onSubmit={handleProjectSubmit} className="h-fit rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-xs font-bold uppercase text-blue-800">Portfolio</p>
              <h2 className="mt-1 text-lg font-bold text-slate-950">{editingId ? "Edit Dokumentasi" : "Tambah Dokumentasi"}</h2>
              <label className="mt-5 block text-sm font-semibold text-slate-700">Judul<input required value={projectForm.title} onChange={(event) => setProjectForm({ ...projectForm, title: event.target.value })} className={inputClass} /></label>
              <label className="mt-4 block text-sm font-semibold text-slate-700">Kategori<select value={projectForm.category} onChange={(event) => setProjectForm({ ...projectForm, category: event.target.value })} className={inputClass}><option>Kantor</option><option>Hotel & Villa</option><option>F&amp;B &amp; UMKM</option><option>Sekolah</option></select></label>
              <label className="mt-4 block text-sm font-semibold text-slate-700">Jenis Layanan<select value={projectForm.service_type} onChange={(event) => setProjectForm({ ...projectForm, service_type: event.target.value })} className={inputClass}><option>Jaringan</option><option>Managed Service IT</option><option>Aplikasi POS</option></select></label>
              <label className="mt-4 block text-sm font-semibold text-slate-700">Ringkasan<textarea required rows={4} value={projectForm.summary} onChange={(event) => setProjectForm({ ...projectForm, summary: event.target.value })} className={inputClass} /></label>
              <div className="mt-4">
                <p className="text-sm font-semibold text-slate-700">Gambar Dokumentasi</p>
                <input id="project-image-upload" type="file" accept="image/*" onChange={(event) => setImageFile(event.target.files?.[0] ?? null)} className="sr-only" />
                <div className="mt-2 flex flex-wrap items-center gap-3 rounded-md border border-dashed border-slate-300 bg-slate-50 p-3">
                  <label htmlFor="project-image-upload" className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-blue-800 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-900">
                    <ImagePlus size={17} strokeWidth={1.8} />{imageFile ? "Ganti Gambar" : "Pilih Gambar"}
                  </label>
                  <span className="min-w-0 flex-1 truncate text-xs text-slate-600">{imageFile?.name ?? (existingImageUrl ? "Gambar dokumentasi saat ini" : "Belum ada gambar dipilih")}</span>
                </div>
                {(previewImageUrl || existingImageUrl) && <img src={previewImageUrl ?? existingImageUrl ?? ""} alt="Preview gambar dokumentasi" className="mt-3 h-36 w-full rounded-md border border-slate-200 object-cover" />}
              </div>
              <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={projectForm.is_published} onChange={(event) => setProjectForm({ ...projectForm, is_published: event.target.checked })} />Publikasikan</label>
              <div className="mt-5 flex gap-2"><button disabled={busy} type="submit" className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"><Plus size={16} strokeWidth={1.75} />{editingId ? "Simpan" : "Tambah"}</button>{editingId && <button type="button" onClick={resetProjectForm} className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold">Batal</button>}</div>
            </form>

            <div className="space-y-3">
              {projects.map((project) => (
                <article key={project.id} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 sm:grid-cols-[112px_1fr_auto]">
                  {project.image_url ? <img src={project.image_url} alt={project.title} className="h-28 w-full rounded-md object-cover sm:h-24" /> : <div className="flex h-28 items-center justify-center rounded-md bg-slate-100 text-xs text-slate-400 sm:h-24">Tanpa gambar</div>}
                  <div className="min-w-0"><div className="flex flex-wrap gap-2"><span className="rounded-md bg-slate-100 px-2 py-1 text-xs">{project.category}</span><span className="rounded-md border border-slate-200 px-2 py-1 text-xs">{project.service_type}</span></div><h3 className="mt-2 font-bold text-slate-900">{project.title}</h3><p className="mt-1 line-clamp-2 text-sm text-slate-600">{project.summary}</p></div>
                  <div className="flex flex-wrap items-start gap-2 sm:flex-col"><button disabled={busy} type="button" onClick={() => togglePublished(project)} className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold">{project.is_published ? "Jadikan Draft" : "Publish"}</button><button type="button" onClick={() => startEdit(project)} className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold"><Pencil size={14} strokeWidth={1.75} />Edit</button><button disabled={busy} type="button" onClick={() => deleteProject(project)} className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-700"><Trash2 size={14} strokeWidth={1.75} />Hapus</button></div>
                </article>
              ))}
              {projects.length === 0 && <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">Belum ada dokumentasi.</div>}
            </div>
          </div>
        )}

        {tab === "requests" && (
          <div className="space-y-3">
            {requests.map((request) => (
              <article key={request.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold text-slate-900">{request.name}</h2>
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">{request.business}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{request.segment} • {request.service}</p>
                    <p className="mt-1 text-sm text-slate-600">Lokasi: {request.location}</p>
                    {request.notes && <p className="mt-3 whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-700">{request.notes}</p>}
                    <p className="mt-3 text-xs text-slate-400">
                      {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(request.created_at))}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <select
                      disabled={busy}
                      value={request.status}
                      onChange={(event) => updateRequestStatus(request, event.target.value as ConsultationRequest["status"])}
                      className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
                    >
                      <option value="new">Baru</option>
                      <option value="processed">Diproses</option>
                      <option value="completed">Selesai</option>
                    </select>
                    <button disabled={busy} type="button" onClick={() => deleteRequest(request)} className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-700"><Trash2 size={14} strokeWidth={1.75} />Hapus</button>
                  </div>
                </div>
              </article>
            ))}
            {requests.length === 0 && <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">Belum ada permintaan konsultasi.</div>}
          </div>
        )}

        {tab === "settings" && settings && (
          <form onSubmit={saveSettings} className="max-w-2xl rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:p-7">
            <p className="text-xs font-bold uppercase text-blue-800">Profil Bisnis</p>
            <h2 className="mt-1 text-lg font-bold text-slate-950">Pengaturan Kontak &amp; Alamat</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">Nama Brand<input required value={settings.brand_name} onChange={(event) => setSettings({ ...settings, brand_name: event.target.value })} className={inputClass} /></label>
              <label className="text-sm font-semibold text-slate-700">Tagline<input required value={settings.tagline} onChange={(event) => setSettings({ ...settings, tagline: event.target.value })} className={inputClass} /></label>
              <label className="text-sm font-semibold text-slate-700">Email<input required type="email" value={settings.email} onChange={(event) => setSettings({ ...settings, email: event.target.value })} className={inputClass} /></label>
              <label className="text-sm font-semibold text-slate-700">Nomor WhatsApp<input required value={settings.whatsapp_number} onChange={(event) => setSettings({ ...settings, whatsapp_number: event.target.value })} className={inputClass} /></label>
              <label className="text-sm font-semibold text-slate-700">Nomor Tampilan<input required value={settings.phone_display} onChange={(event) => setSettings({ ...settings, phone_display: event.target.value })} className={inputClass} /></label>
              <label className="text-sm font-semibold text-slate-700 md:col-span-2">Alamat<textarea required rows={3} value={settings.address} onChange={(event) => setSettings({ ...settings, address: event.target.value })} className={inputClass} /></label>
            </div>
            <button disabled={busy} type="submit" className="mt-5 rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white">Simpan Pengaturan</button>
          </form>
        )}
      </div>
      </div>
    </main>
  );
}
