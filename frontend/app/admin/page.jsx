"use client";
import AppLayout from "@/components/AppLayout";

export default function AdminDashboard() {
  const stats = [
    { label: "Total Users", value: "1,204", color: "from-sky-500/20 to-blue-500/20 text-sky-400 border-sky-500/30" },
    { label: "Active Doctors", value: "45", color: "from-emerald-500/20 to-green-500/20 text-emerald-400 border-emerald-500/30" },
    { label: "AI Consultations", value: "8,932", color: "from-purple-500/20 to-violet-500/20 text-purple-400 border-purple-500/30" },
    { label: "Telemedicine Calls", value: "1,420", color: "from-rose-500/20 to-pink-500/20 text-rose-400 border-rose-500/30" },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black">⚙️ Admin Control Panel</h1>
          <p className="text-slate-400 text-sm">System analytics and user management.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className={`glass-dark rounded-2xl p-5 border bg-gradient-to-br ${s.color}`}>
              <div className="text-3xl font-black mb-1">{s.value}</div>
              <div className="text-slate-400 text-xs uppercase tracking-wider font-semibold">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-dark rounded-2xl p-6">
            <h2 className="font-bold mb-4">System Status</h2>
            <div className="space-y-4">
              {[
                { name: "Gemini AI API", status: "Operational", color: "text-emerald-400" },
                { name: "PostgreSQL Database", status: "Operational", color: "text-emerald-400" },
                { name: "Jitsi Telemedicine", status: "Operational", color: "text-emerald-400" },
                { name: "Email Service", status: "Degraded", color: "text-yellow-400" },
              ].map(s => (
                <div key={s.name} className="flex justify-between items-center border-b border-white/5 pb-2 last:border-0 last:pb-0">
                  <span className="text-slate-300 text-sm">{s.name}</span>
                  <span className={`text-xs font-bold ${s.color}`}>● {s.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-dark rounded-2xl p-6">
            <h2 className="font-bold mb-4">Recent System Alerts</h2>
            <div className="space-y-3">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-red-400 text-sm font-semibold">High API Latency</p>
                <p className="text-xs text-slate-400 mt-1">Gemini API response time exceeded 2000ms at 10:45 AM.</p>
              </div>
              <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl">
                <p className="text-sky-400 text-sm font-semibold">New Doctor Registration</p>
                <p className="text-xs text-slate-400 mt-1">Dr. Michael Chen is pending approval.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
