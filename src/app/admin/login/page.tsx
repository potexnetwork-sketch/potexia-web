"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-5 py-12">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <p className="text-sm font-bold uppercase text-blue-900">POTEXIA</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Masuk Admin</h1>
        <p className="mt-2 text-sm text-slate-600">Gunakan akun administrator yang terdaftar.</p>

        <label className="mt-6 block text-sm font-semibold text-slate-700">
          Email
          <input required type="email" name="email" className="mt-2 w-full rounded-md border border-slate-300 px-3.5 py-3 text-sm outline-none focus:border-blue-900" />
        </label>
        <label className="mt-4 block text-sm font-semibold text-slate-700">
          Password
          <input required type="password" name="password" className="mt-2 w-full rounded-md border border-slate-300 px-3.5 py-3 text-sm outline-none focus:border-blue-900" />
        </label>

        {error && <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
        <button disabled={loading} type="submit" className="mt-6 w-full rounded-md bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
          {loading ? "Memproses..." : "Masuk"}
        </button>
        <Link href="/" className="mt-5 block text-center text-sm font-semibold text-slate-600 hover:text-slate-900">Kembali ke website</Link>
      </form>
    </main>
  );
}
