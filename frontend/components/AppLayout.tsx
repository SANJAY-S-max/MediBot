"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "PATIENT" | "DOCTOR" | "AHA_WORKER" | "ADMIN";
  avatar?: string;
  patientProfile?: { abhaId?: string; district?: string };
  doctorProfile?: { specialization?: string; hospital?: { name?: string } };
  ahaProfile?: { workerCode?: string; assignedDistrict?: string };
  adminProfile?: { designation?: string };
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/me", { method: "POST" });
      router.push("/login");
    } catch {
      router.push("/login");
    }
  };

  // Define navigation items based on user role
  const getNavLinks = () => {
    const role = user?.role || "PATIENT";

    if (role === "ADMIN") {
      return [
        { href: "/admin", label: "Admin Control", icon: "⚙️" },
        { href: "/doctor", label: "Clinical Queue", icon: "👨‍⚕️" },
        { href: "/aha", label: "AHA Operations", icon: "👩‍⚕️" },
        { href: "/dashboard", label: "Patient View", icon: "🏥" },
        { href: "/telemedicine", label: "Telemedicine", icon: "📹" },
      ];
    } else if (role === "DOCTOR") {
      return [
        { href: "/doctor", label: "Clinical Triage Queue", icon: "👨‍⚕️" },
        { href: "/dashboard", label: "Facility Matching", icon: "🏥" },
        { href: "/telemedicine", label: "Telemedicine", icon: "📹" },
        { href: "/aha", label: "Field Checkups", icon: "👩‍⚕️" },
      ];
    } else if (role === "AHA_WORKER") {
      return [
        { href: "/aha", label: "Assigned Patients", icon: "👩‍⚕️" },
        { href: "/dashboard", label: "Referral & Triage", icon: "🏥" },
        { href: "/telemedicine", label: "Teleconsultation", icon: "📹" },
      ];
    }

    // Default Patient
    return [
      { href: "/dashboard", label: "My Health Dashboard", icon: "🏥" },
      { href: "/chat", label: "AI Health Assistant", icon: "💬" },
      { href: "/telemedicine", label: "Doctor Consult", icon: "📹" },
      { href: "/reports", label: "Reports & Records", icon: "📋" },
    ];
  };

  const navLinks = getNavLinks();

  const getRoleBadge = () => {
    switch (user?.role) {
      case "ADMIN":
        return { label: "System Admin", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" };
      case "DOCTOR":
        return { label: "Doctor / Clinician", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" };
      case "AHA_WORKER":
        return { label: "AHA/ASHA Worker", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" };
      default:
        return { label: "Patient", color: "bg-sky-500/20 text-sky-400 border-sky-500/30" };
    }
  };

  const badge = getRoleBadge();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900/70 backdrop-blur-xl border-r border-white/10 p-5 shrink-0 min-h-screen">
        {/* Brand */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center font-black text-xl shadow-lg shadow-sky-500/20">
            M
          </div>
          <div>
            <div className="font-black text-lg tracking-tight bg-gradient-to-r from-white via-sky-200 to-sky-400 bg-clip-text text-transparent">
              MediBot AI
            </div>
            <div className="text-[10px] text-slate-400 tracking-wider uppercase font-semibold">
              Public Health Platform
            </div>
          </div>
        </div>

        {/* User Card */}
        <div className="mb-6 p-3.5 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-sm border border-sky-500/30">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold truncate text-white">{user?.name || "Healthcare User"}</div>
              <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded-full border mt-0.5 font-medium ${badge.color}`}>
                {badge.label}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5">
          <div className="text-[11px] uppercase font-bold text-slate-500 px-3 mb-2 tracking-wider">
            Navigation
          </div>
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-sky-500 text-white shadow-lg shadow-sky-500/25 font-bold"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <span className="text-base">{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer info & Logout */}
        <div className="pt-4 border-t border-white/10 space-y-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors border border-red-500/20"
          >
            <span>🚪</span> Sign Out
          </button>
          <div className="text-[10px] text-center text-slate-500">
            Powered by Neon PostgreSQL & MediBot AI
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900/90 border-b border-white/10 p-4 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center font-bold text-sm">M</div>
          <span className="font-bold text-sm">MediBot AI</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${badge.color}`}>
            {badge.label}
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-white/5 text-slate-300"
        >
          ☰
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-white/10 p-4 space-y-2 z-30">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                pathname === link.href ? "bg-sky-500 text-white font-bold" : "text-slate-300"
              }`}
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="w-full text-left py-2 px-3 text-sm text-red-400 font-semibold"
          >
            🚪 Sign Out
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
