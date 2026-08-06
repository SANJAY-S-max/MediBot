"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      const role = data.user.role;
      if (role === "admin") router.push("/admin");
      else if (role === "doctor") router.push("/doctor");
      else router.push("/dashboard");
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  const quickLogin = async (email, pass) => {
    setForm({ email, password: pass });
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      const role = data.user.role;
      if (role === "admin") router.push("/admin");
      else if (role === "doctor") router.push("/doctor");
      else router.push("/dashboard");
    } catch { setError("Network error."); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-blue-600 rounded-xl flex items-center justify-center text-lg font-bold">M</div>
            <span className="text-xl font-bold">MediBot</span>
          </Link>
          <h1 className="text-3xl font-black">Welcome back</h1>
          <p className="text-slate-400 mt-2">Sign in to your health dashboard</p>
        </div>

        <div className="glass-dark p-8 rounded-2xl">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <input
                type="email" required placeholder="you@example.com"
                className="input-field" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <input
                type="password" required placeholder="••••••••"
                className="input-field" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center flex items-center gap-2">
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6">
            <p className="text-center text-xs text-slate-500 mb-3">Quick Demo Login</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Patient", email: "patient@medibot.com", pass: "Patient@123" },
                { label: "Doctor", email: "doctor@medibot.com", pass: "Doctor@123" },
                { label: "Admin", email: "admin@medibot.com", pass: "Admin@123" },
              ].map((d) => (
                <button key={d.label} onClick={() => quickLogin(d.email, d.pass)}
                  className="glass rounded-lg py-2 text-xs text-slate-300 hover:text-white hover:bg-white/10 transition-all">
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-slate-500 text-sm mt-6">
            No account?{" "}
            <Link href="/register" className="text-sky-400 hover:text-sky-300 font-semibold">Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
