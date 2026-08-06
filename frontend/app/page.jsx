"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const features = [
  { icon: "🤖", title: "AI Symptom Checker", desc: "Describe symptoms in English, Hindi, or Tamil. Get instant AI-powered health insights." },
  { icon: "🎙️", title: "Voice Input", desc: "Speak your symptoms aloud — MediBot listens and analyzes in real time." },
  { icon: "👨‍⚕️", title: "Doctor Dashboard", desc: "Doctors review flagged assessments and add clinical notes for patients." },
  { icon: "📋", title: "Health Reports", desc: "Download detailed PDF health reports with AI-generated insights." },
  { icon: "💊", title: "Med Reminders", desc: "Set personalized medication reminders so you never miss a dose." },
  { icon: "📹", title: "Telemedicine", desc: "Join secure video consultations with your doctor from anywhere." },
  { icon: "🌐", title: "Multilingual", desc: "Full support for English, Hindi (हिंदी), and Tamil (தமிழ்)." },
  { icon: "🔐", title: "Secure & Private", desc: "JWT-based authentication. Your health data stays private and secure." },
  { icon: "🏥", title: "Admin Control", desc: "Admins manage users, roles, and platform analytics from one panel." },
];

const stats = [
  { value: "3", label: "Languages Supported" },
  { value: "AI", label: "Gemini Powered" },
  { value: "9+", label: "Core Features" },
  { value: "24/7", label: "Available" },
];

export default function LandingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      {/* Navbar */}
      <nav className="relative z-50 border-b border-white/5 backdrop-blur-xl bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-blue-600 rounded-lg flex items-center justify-center text-sm font-bold">M</div>
              <span className="font-bold text-lg">MediBot</span>
              <span className="hidden sm:inline badge badge-blue ml-2">AI Healthcare</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login" className="btn-secondary text-sm px-4 py-2">Log In</Link>
              <Link href="/register" className="btn-primary text-sm px-4 py-2">Get Started</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full text-sm text-sky-400 mb-8 border border-sky-500/20">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          Powered by Google Gemini AI
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-6 leading-tight">
          Your AI-Powered<br />
          <span className="gradient-text text-glow">Health Companion</span>
        </h1>

        <p className="text-slate-400 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Describe symptoms in <strong className="text-white">English, Hindi, or Tamil</strong>. 
          Get instant AI health insights, consult doctors, set reminders, and more — all in one place.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link href="/register" className="btn-primary text-base px-8 py-4 w-full sm:w-auto">
            🚀 Start Free — No Credit Card
          </Link>
          <Link href="/login" className="btn-secondary text-base px-8 py-4 w-full sm:w-auto">
            Sign In to Dashboard
          </Link>
        </div>

        {/* Demo credentials */}
        <div className="glass rounded-2xl p-4 max-w-lg mx-auto mb-16 border border-sky-500/20">
          <p className="text-xs text-slate-400 mb-3 font-semibold uppercase tracking-wider">Demo Accounts</p>
          <div className="grid grid-cols-3 gap-3 text-sm">
            {[
              { role: "Patient", email: "patient@medibot.com", pass: "Patient@123", color: "green" },
              { role: "Doctor", email: "doctor@medibot.com", pass: "Doctor@123", color: "blue" },
              { role: "Admin", email: "admin@medibot.com", pass: "Admin@123", color: "purple" },
            ].map((d) => (
              <button
                key={d.role}
                onClick={async () => {
                  await fetch("/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: d.email, password: d.pass }),
                  });
                  if (d.role === "Doctor") router.push("/doctor");
                  else if (d.role === "Admin") router.push("/admin");
                  else router.push("/dashboard");
                }}
                className="glass p-2 rounded-xl hover:bg-white/10 transition-all cursor-pointer text-center"
              >
                <div className="font-semibold text-white">{d.role}</div>
                <div className="text-slate-500 text-xs">Click to login</div>
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
          {stats.map((s) => (
            <div key={s.label} className="glass rounded-xl p-4">
              <div className="text-2xl font-black gradient-text">{s.value}</div>
              <div className="text-xs text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center mb-3">Everything You Need</h2>
        <p className="text-slate-400 text-center mb-12">A complete healthcare platform in one app</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="card group hover:border-sky-500/30 cursor-default">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-bold mb-2 group-hover:text-sky-400 transition-colors">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <footer className="relative z-10 border-t border-white/5 py-8 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <div className="glass rounded-xl p-4 mb-6 border border-red-500/20">
            <p className="text-red-400 text-sm">
              ⚠️ <strong>Medical Disclaimer:</strong> MediBot provides preliminary health guidance only and is <strong>NOT a substitute for professional medical diagnosis</strong>. Always consult a qualified healthcare professional for medical advice.
            </p>
          </div>
          <p className="text-slate-600 text-sm">© 2024 MediBot AI Healthcare Assistant. Built with Google Gemini.</p>
        </div>
      </footer>
    </div>
  );
}
