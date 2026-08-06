"use client";
import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [reminders, setReminders] = useState([]);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => setUser(d.user));
    const savedChats = JSON.parse(localStorage.getItem("medibot_chats") || "[]");
    setChats(savedChats.slice(-5).reverse());
    const savedReminders = JSON.parse(localStorage.getItem("medibot_reminders") || "[]");
    setReminders(savedReminders.slice(0, 3));
  }, []);

  const stats = [
    { label: "AI Consultations", value: chats.length, icon: "🤖", color: "from-sky-500/20 to-blue-500/20 border-sky-500/30" },
    { label: "Active Reminders", value: reminders.filter(r => r.active).length, icon: "💊", color: "from-emerald-500/20 to-green-500/20 border-emerald-500/30" },
    { label: "Health Score", value: "85%", icon: "❤️", color: "from-rose-500/20 to-pink-500/20 border-rose-500/30" },
    { label: "This Week", value: chats.length, icon: "📊", color: "from-purple-500/20 to-violet-500/20 border-purple-500/30" },
  ];

  const quickActions = [
    { href: "/chat", label: "AI Symptom Check", icon: "🤖", desc: "Describe symptoms to AI", color: "from-sky-600 to-blue-600" },
    { href: "/reports", label: "Health Reports", icon: "📋", desc: "View & download reports", color: "from-emerald-600 to-green-600" },
    { href: "/reminders", label: "Medication", icon: "💊", desc: "Manage pill reminders", color: "from-violet-600 to-purple-600" },
    { href: "/telemedicine", label: "Video Call", icon: "📹", desc: "Consult a doctor", color: "from-rose-600 to-pink-600" },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Welcome */}
        <div className="glass rounded-2xl p-6 bg-gradient-to-r from-sky-500/10 to-blue-500/10 border-sky-500/20">
          <h1 className="text-2xl font-black">
            Welcome back, <span className="gradient-text">{user?.name?.split(" ")[0] || "Patient"}!</span> 👋
          </h1>
          <p className="text-slate-400 mt-1">Your health dashboard — everything in one place.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className={`glass rounded-2xl p-4 bg-gradient-to-br ${s.color} border`}>
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-2xl font-black">{s.value}</div>
              <div className="text-slate-400 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((a) => (
              <a key={a.href} href={a.href}
                className="glass rounded-2xl p-5 hover:scale-105 transition-all duration-200 group cursor-pointer block">
                <div className={`w-12 h-12 bg-gradient-to-br ${a.color} rounded-xl flex items-center justify-center text-2xl mb-3`}>{a.icon}</div>
                <div className="font-bold text-sm group-hover:text-sky-400 transition-colors">{a.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{a.desc}</div>
              </a>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Chats */}
          <div className="glass-dark rounded-2xl p-5">
            <h2 className="font-bold mb-4 flex items-center gap-2">🤖 Recent AI Consultations</h2>
            {chats.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">💬</div>
                <p className="text-slate-400 text-sm">No consultations yet</p>
                <a href="/chat" className="text-sky-400 text-sm hover:underline">Start your first AI chat →</a>
              </div>
            ) : (
              <div className="space-y-3">
                {chats.map((c, i) => (
                  <div key={i} className="glass rounded-xl p-3">
                    <p className="text-sm text-white font-medium truncate">{c.symptoms}</p>
                    <p className="text-xs text-slate-500 mt-1">{new Date(c.date).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Reminders */}
          <div className="glass-dark rounded-2xl p-5">
            <h2 className="font-bold mb-4 flex items-center gap-2">💊 Medication Reminders</h2>
            {reminders.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">💊</div>
                <p className="text-slate-400 text-sm">No reminders set</p>
                <a href="/reminders" className="text-sky-400 text-sm hover:underline">Add medication reminder →</a>
              </div>
            ) : (
              <div className="space-y-3">
                {reminders.map((r, i) => (
                  <div key={i} className="glass rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{r.name}</p>
                      <p className="text-xs text-slate-500">{r.time} · {r.frequency}</p>
                    </div>
                    <span className={r.active ? "badge-green" : "badge-yellow"}>
                      {r.active ? "Active" : "Paused"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
