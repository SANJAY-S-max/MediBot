"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const translations = {
  en: { home: "Dashboard", chat: "AI Chat", reports: "Reports", reminders: "Reminders", telemedicine: "Telemedicine", logout: "Logout", language: "Language" },
  hi: { home: "डैशबोर्ड", chat: "AI चैट", reports: "रिपोर्ट", reminders: "अनुस्मारक", telemedicine: "टेलीमेडिसिन", logout: "लॉग आउट", language: "भाषा" },
  ta: { home: "டாஷ்போர்டு", chat: "AI சேட்", reports: "அறிக்கைகள்", reminders: "நினைவூட்டல்", telemedicine: "டெலிமெடிசின்", logout: "வெளியேறு", language: "மொழி" },
};

export default function AppLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState("en");
  const [menuOpen, setMenuOpen] = useState(false);
  const t = translations[lang] || translations.en;

  useEffect(() => {
    const stored = localStorage.getItem("medibot_lang") || "en";
    setLang(stored);
    fetch("/api/auth/me").then(r => r.json()).then(d => { if (d.user) setUser(d.user); });
  }, []);

  const changeLang = (l) => { setLang(l); localStorage.setItem("medibot_lang", l); };

  const logout = async () => {
    await fetch("/api/auth/me", { method: "DELETE" });
    router.push("/login");
  };

  const navLinks = user?.role === "admin"
    ? [{ href: "/admin", label: "⚙️ Admin Panel" }, { href: "/chat", label: `🤖 ${t.chat}` }]
    : user?.role === "doctor"
    ? [{ href: "/doctor", label: "🏥 Clinical Queue" }, { href: "/chat", label: `🤖 ${t.chat}` }]
    : [
        { href: "/dashboard", label: `🏠 ${t.home}` },
        { href: "/chat", label: `🤖 ${t.chat}` },
        { href: "/reports", label: `📋 ${t.reports}` },
        { href: "/reminders", label: `💊 ${t.reminders}` },
        { href: "/telemedicine", label: `📹 ${t.telemedicine}` },
      ];

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Top Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/5 backdrop-blur-xl bg-slate-950/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-7 h-7 bg-gradient-to-br from-sky-400 to-blue-600 rounded-lg flex items-center justify-center text-xs font-bold">M</div>
                <span className="font-bold text-sm">MediBot</span>
              </Link>
              <div className="hidden md:flex items-center gap-1">
                {navLinks.map((l) => (
                  <Link key={l.href} href={l.href}
                    className={pathname === l.href ? "nav-link-active" : "nav-link"}>
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Language switcher */}
              <div className="flex items-center gap-1 glass rounded-lg px-2 py-1">
                {["en", "hi", "ta"].map((l) => (
                  <button key={l} onClick={() => changeLang(l)}
                    className={`text-xs px-2 py-0.5 rounded transition-all ${lang === l ? "bg-sky-500 text-white font-semibold" : "text-slate-400 hover:text-white"}`}>
                    {l === "en" ? "EN" : l === "hi" ? "हि" : "த"}
                  </button>
                ))}
              </div>
              {/* User */}
              {user && (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-gradient-to-br from-sky-400 to-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                    {user.name?.charAt(0) || user.avatar || "U"}
                  </div>
                  <span className="hidden sm:inline text-sm text-slate-300">{user.name?.split(" ")[0]}</span>
                </div>
              )}
              <button onClick={logout} className="text-xs text-slate-400 hover:text-red-400 transition-colors px-2 py-1">
                {t.logout} →
              </button>
              {/* Mobile menu */}
              <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden glass p-1.5 rounded-lg">
                <span className="text-slate-400">{menuOpen ? "✕" : "☰"}</span>
              </button>
            </div>
          </div>
        </div>
        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/5 px-4 py-3 space-y-1">
            {navLinks.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
                className={`block ${pathname === l.href ? "nav-link-active" : "nav-link"}`}>
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </nav>



      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
