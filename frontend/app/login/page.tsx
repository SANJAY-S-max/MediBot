"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const DEMO_ACCOUNTS = [
  {
    role: "PATIENT",
    label: "Patient",
    icon: "🏥",
    email: "patient@medibot.com",
    pass: "Patient@123",
    desc: "Access personal health records, diagnoses, and medical assistance triage",
  },
  {
    role: "AHA_WORKER",
    label: "AHA Worker",
    icon: "👩‍⚕️",
    email: "ahaworker@medibot.com",
    pass: "Aha@123",
    desc: "Manage assigned village patients, perform checklist checkups, and escalate emergencies",
  },
  {
    role: "DOCTOR",
    label: "Doctor",
    icon: "👨‍⚕️",
    email: "doctor@medibot.com",
    pass: "Doctor@123",
    desc: "Inspect real-time triage queue, review AHA escalations, issue prescriptions & diagnoses",
  },
  {
    role: "ADMIN",
    label: "Admin",
    icon: "⚙️",
    email: "admin@medibot.com",
    pass: "Admin@123",
    desc: "Monitor live system health, manage hospital infrastructure, users, and audit logs",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string>("PATIENT");
  const [form, setForm] = useState({ email: "patient@medibot.com", password: "Patient@123" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password, role: selectedRole }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Authentication failed.");
        return;
      }

      // Strict role-based redirect determined by verified server role
      const serverRole = data.role || data.user?.role;
      if (serverRole === "ADMIN") router.push("/admin");
      else if (serverRole === "DOCTOR") router.push("/doctor");
      else if (serverRole === "AHA_WORKER") router.push("/aha");
      else router.push("/dashboard");
    } catch {
      setError("Network connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRole = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setSelectedRole(acc.role);
    setForm({ email: acc.email, password: acc.pass });
  };

  const handleQuickLogin = async (acc: typeof DEMO_ACCOUNTS[0]) => {
    setSelectedRole(acc.role);
    setForm({ email: acc.email, password: acc.pass });
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: acc.email, password: acc.pass, role: acc.role }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Authentication failed.");
        return;
      }

      const serverRole = data.role || data.user?.role;
      if (serverRole === "ADMIN") router.push("/admin");
      else if (serverRole === "DOCTOR") router.push("/doctor");
      else if (serverRole === "AHA_WORKER") router.push("/aha");
      else router.push("/dashboard");
    } catch {
      setError("Network error during login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background glow decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-2xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-blue-600 rounded-2xl flex items-center justify-center text-xl font-black shadow-lg shadow-sky-500/20">
              M
            </div>
            <div className="text-left">
              <span className="text-2xl font-black tracking-tight text-white block">MediBot AI</span>
              <span className="text-xs text-sky-400 font-semibold tracking-wider uppercase block">
                Public Healthcare Platform
              </span>
            </div>
          </Link>
          <p className="text-slate-400 text-sm max-w-md mx-auto pt-2">
            Secure Role-Based Access backed by Neon PostgreSQL & Ayushman Bharat Healthcare Network
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {DEMO_ACCOUNTS.map((acc) => {
            const isSelected = selectedRole === acc.role;
            return (
              <button
                key={acc.role}
                type="button"
                onClick={() => handleSelectRole(acc)}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? "bg-sky-500/20 border-sky-400 text-white shadow-lg shadow-sky-500/10 ring-1 ring-sky-400"
                    : "bg-slate-900/60 border-white/10 text-slate-400 hover:text-white hover:border-white/20"
                }`}
              >
                <div className="text-xl mb-1">{acc.icon}</div>
                <div>
                  <div className="text-xs font-bold text-white">{acc.label}</div>
                  <div className="text-[10px] text-slate-500 leading-tight line-clamp-1 mt-0.5">
                    {acc.email}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Login Box */}
        <div className="p-6 md:p-8 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl shadow-2xl space-y-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-semibold">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full p-3 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-sky-400"
                placeholder="name@medibot.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full p-3 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-sky-400"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-sky-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : null}
              {loading ? "Authenticating & Validating Role..." : `Sign In as ${selectedRole.replace("_", " ")}`}
            </button>
          </form>

          {/* 1-Click Quick Demo Login */}
          <div className="pt-4 border-t border-white/10 space-y-3">
            <div className="text-[11px] text-center text-slate-400 font-bold uppercase tracking-wider">
              ⚡ 1-Click Instant Demo Login
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleQuickLogin(acc)}
                  disabled={loading}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-all text-center"
                >
                  <span className="block text-base mb-0.5">{acc.icon}</span>
                  {acc.label}
                </button>
              ))}
            </div>
          </div>

          <div className="text-center text-xs text-slate-500">
            Need a new account?{" "}
            <Link href="/register" className="text-sky-400 hover:text-sky-300 font-bold">
              Register Patient Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
