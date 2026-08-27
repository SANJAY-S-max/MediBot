"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const translations = {
  en: { 
    home: "Public Health Router & Triage", 
    tools: "Telemedicine & AI Tools",
    reports: "Reports & PDF Viewer", 
    reminders: "Reminders", 
    logout: "Logout", 
    language: "Language" 
  },
  hi: { 
    home: "स्वास्थ्य सेवा राउटर एवं ट्राइएज", 
    tools: "टेलीमेडिसिन व AI टूल्स",
    reports: "रिपोर्ट्स व PDF व्यूअर", 
    reminders: "दवा अनुस्मारक", 
    logout: "लॉग आउट", 
    language: "भाषा" 
  },
  ta: { 
    home: "சுகாதார சேவை ரூட்டர் & ட்ரையேஜ்", 
    tools: "டெலிமெடிசின் & AI டூல்ஸ்",
    reports: "அறிக்கைகள் & PDF வியூவர்", 
    reminders: "மருந்து நினைவூட்டல்", 
    logout: "வெளியேறு", 
    language: "மொழி" 
  },
};

export default function AppLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState("en");
  const [menuOpen, setMenuOpen] = useState(false);
  const [toolsDropdown, setToolsDropdown] = useState(false);
  const t = translations[lang] || translations.en;

  useEffect(() => {
    const stored = localStorage.getItem("medibot_lang") || "en";
    setLang(stored);
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => { if (d.user) setUser(d.user); })
      .catch(() => {});
  }, []);

  const changeLang = (l) => { setLang(l); localStorage.setItem("medibot_lang", l); };

  const logout = async () => {
    await fetch("/api/auth/me", { method: "DELETE" });
    router.push("/login");
  };

  const navLinks = user?.role === "admin"
    ? [
        { href: "/admin", label: "⚙️ Admin Panel" },
        { href: "/dashboard", label: `🚑 ${t.home}` },
        { href: "/tools", label: `🌐 ${t.tools}` }
      ]
    : user?.role === "doctor"
    ? [
        { href: "/doctor", label: "🏥 Clinical Queue" },
        { href: "/dashboard", label: `🚑 ${t.home}` },
        { href: "/tools", label: `🌐 ${t.tools}` }
      ]
    : [
        { href: "/dashboard", label: `🚑 ${t.home}` },
        { href: "/tools", label: `🌐 ${t.tools}`, isTools: true },
        { href: "/reports", label: `📋 ${t.reports}` },
        { href: "/reminders", label: `💊 ${t.reminders}` },
      ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-sky-500 selection:text-white">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-xl bg-slate-950/90 shadow-lg shadow-black/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo and Main Nav */}
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-xs font-black text-white shadow-md shadow-sky-500/30 group-hover:scale-105 transition-transform">
                  M
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-sm tracking-tight text-white flex items-center gap-1.5">
                    MediBot <span className="text-sky-400 font-extrabold">AI</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Public Health Router</span>
                </div>
              </Link>

              {/* Desktop Nav Links */}
              <div className="hidden md:flex items-center gap-1.5">
                {navLinks.map((l) => (
                  <div key={l.href} className="relative group">
                    <Link
                      href={l.href}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        pathname === l.href || (l.isTools && (pathname === "/tools" || pathname === "/chat" || pathname === "/telemedicine"))
                          ? "bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm"
                          : "text-slate-300 hover:text-white hover:bg-white/5 border border-transparent"
                      }`}
                    >
                      {l.label}
                      {l.isTools && <span className="text-[10px] opacity-60">▾</span>}
                    </Link>

                    {/* Tools Submenu Dropdown on Hover for Desktop */}
                    {l.isTools && (
                      <div className="absolute top-full left-0 mt-1 w-56 glass-dark rounded-xl p-2 border border-sky-500/20 shadow-2xl opacity-0 translate-y-1 invisible group-hover:opacity-100 group-hover:translate-y-0 group-hover:visible transition-all z-50">
                        <Link href="/tools" className="flex items-center gap-2.5 p-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-sky-500/20 hover:text-white transition-all">
                          <span>🌐</span>
                          <div>
                            <div>All Telemedicine & AI Tools</div>
                            <div className="text-[10px] text-slate-400">Unified Tools Workspace</div>
                          </div>
                        </Link>
                        <Link href="/chat" className="flex items-center gap-2.5 p-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-sky-500/20 hover:text-white transition-all">
                          <span>🤖</span>
                          <div>
                            <div>Multilingual AI Chat</div>
                            <div className="text-[10px] text-slate-400">Symptom & Medical Assistant</div>
                          </div>
                        </Link>
                        <Link href="/telemedicine" className="flex items-center gap-2.5 p-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-sky-500/20 hover:text-white transition-all">
                          <span>📹</span>
                          <div>
                            <div>Jitsi Video Consultations</div>
                            <div className="text-[10px] text-slate-400">Live Doctor Video Call</div>
                          </div>
                        </Link>
                        <Link href="/reports" className="flex items-center gap-2.5 p-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-sky-500/20 hover:text-white transition-all">
                          <span>📄</span>
                          <div>
                            <div>PDF Report Viewer</div>
                            <div className="text-[10px] text-slate-400">Clinical Documentation</div>
                          </div>
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Controls: Language Switcher, User Badge, Logout */}
            <div className="flex items-center gap-3">
              {/* Language switcher */}
              <div className="flex items-center gap-1 glass-dark rounded-xl p-1 border border-white/10">
                {[
                  { code: "en", label: "EN" },
                  { code: "hi", label: "हि" },
                  { code: "ta", label: "த" }
                ].map((l) => (
                  <button
                    key={l.code}
                    onClick={() => changeLang(l.code)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all ${
                      lang === l.code
                        ? "bg-sky-500 text-white shadow-sm shadow-sky-500/40"
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>

              {/* User Profile Pill */}
              {user ? (
                <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-white/10">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow">
                    {user.name?.charAt(0) || "U"}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-white leading-tight">{user.name?.split(" ")[0]}</span>
                    <span className="text-[10px] text-emerald-400 font-semibold capitalize">{user.role || "Patient"}</span>
                  </div>
                </div>
              ) : null}

              {/* Logout Button */}
              <button
                onClick={logout}
                className="text-xs font-semibold text-slate-400 hover:text-rose-400 transition-colors px-2 py-1 flex items-center gap-1"
                title="Logout"
              >
                <span>{t.logout}</span>
                <span>→</span>
              </button>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden glass p-2 rounded-xl border border-white/10 text-slate-300 hover:text-white"
                aria-label="Toggle Menu"
              >
                <span className="text-sm font-bold">{menuOpen ? "✕" : "☰"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/10 bg-slate-950/95 backdrop-blur-2xl px-4 py-4 space-y-2">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className={`block px-3 py-2 rounded-xl text-sm font-bold ${
                  pathname === l.href ? "bg-sky-500/20 text-sky-400 border border-sky-500/30" : "text-slate-300 hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-white/10 flex flex-col gap-1 text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-500">Quick Tools:</span>
              <Link href="/chat" onClick={() => setMenuOpen(false)} className="py-1 text-slate-300 hover:text-sky-400">🤖 AI Multilingual Chat</Link>
              <Link href="/telemedicine" onClick={() => setMenuOpen(false)} className="py-1 text-slate-300 hover:text-sky-400">📹 Jitsi Video Call</Link>
              <Link href="/reports" onClick={() => setMenuOpen(false)} className="py-1 text-slate-300 hover:text-sky-400">📄 PDF Report Viewer</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
