import { createClient } from "./server";
import {
  DEFAULT_COMPANY_SETTINGS,
  type CompanySettings,
  type ProjectItem,
} from "@/types/database";

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const normalizedUrl = url?.toUpperCase() ?? "";
  const normalizedKey = key?.toUpperCase() ?? "";

  return Boolean(
    url &&
    key &&
    !normalizedUrl.includes("ISI_PROJECT_ID_KAMU") &&
    !normalizedKey.includes("ISI_ANON_KEY_KAMU") &&
    url.startsWith("https://")
  );
}

export async function getPublishedProjects(): Promise<ProjectItem[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Gagal mengambil data projects:", error.message);
      return [];
    }

    return data ?? [];
  } catch (err) {
    console.error("Error koneksi Supabase (projects):", err);
    return [];
  }
}

export async function getCompanySettings(): Promise<CompanySettings> {
  if (!isSupabaseConfigured()) return DEFAULT_COMPANY_SETTINGS;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("company_settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (error || !data) {
      return DEFAULT_COMPANY_SETTINGS;
    }

    return {
      ...DEFAULT_COMPANY_SETTINGS,
      ...data,
    };
  } catch (err) {
    console.error("Error koneksi Supabase (company_settings):", err);
    return DEFAULT_COMPANY_SETTINGS;
  }
}
