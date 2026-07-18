"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "patient" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      router.push(form.role === "doctor" ? "/doctor" : "/dashboard");
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-blue-600 rounded-xl flex items-center justify-center text-lg font-bold">M</div>
            <span className="text-xl font-bold">MediBot</span>
          </Link>
          <h1 className="text-3xl font-black">Create Account</h1>
          <p className="text-slate-400 mt-2">Join MediBot for free healthcare guidance</p>
        </div>

        <div className="glass-dark p-8 rounded-2xl">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
              <input type="text" required placeholder="Dr. Jane Smith" className="input-field"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <input type="email" required placeholder="you@example.com" className="input-field"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <input type="password" required placeholder="Min 6 characters" className="input-field"
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">I am a...</label>
              <div className="grid grid-cols-2 gap-3">
                {[{ value: "patient", label: "🧑 Patient", desc: "Seeking health guidance" }, { value: "doctor", label: "👨‍⚕️ Doctor", desc: "Reviewing patient cases" }].map((r) => (
                  <button type="button" key={r.value}
                    onClick={() => setForm({ ...form, role: r.value })}
                    className={`p-3 rounded-xl border text-left transition-all ${form.role === r.value ? "border-sky-500 bg-sky-500/10 text-sky-400" : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20"}`}>
                    <div className="font-semibold text-sm">{r.label}</div>
                    <div className="text-xs opacity-70 mt-0.5">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center flex items-center gap-2 mt-2">
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
              {loading ? "Creating account..." : "Create Free Account"}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-sky-400 hover:text-sky-300 font-semibold">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
