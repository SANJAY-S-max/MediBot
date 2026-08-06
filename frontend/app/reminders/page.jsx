"use client";
import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";

export default function RemindersPage() {
  const [reminders, setReminders] = useState([]);
  const [form, setForm] = useState({ name: "", dose: "", time: "08:00", frequency: "Daily", notes: "" });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("medibot_reminders") || "[]");
    setReminders(saved);
  }, []);

  const save = (updated) => {
    setReminders(updated);
    localStorage.setItem("medibot_reminders", JSON.stringify(updated));
  };

  const addReminder = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const newReminder = { ...form, id: Date.now(), active: true, createdAt: new Date().toISOString() };
    save([...reminders, newReminder]);
    setForm({ name: "", dose: "", time: "08:00", frequency: "Daily", notes: "" });
    setShowForm(false);
  };

  const toggle = (id) => save(reminders.map(r => r.id === id ? { ...r, active: !r.active } : r));
  const remove = (id) => save(reminders.filter(r => r.id !== id));

  const frequencies = ["Daily", "Twice Daily", "Weekly", "As Needed"];

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black">💊 Medication Reminders</h1>
            <p className="text-slate-400 text-sm">{reminders.filter(r => r.active).length} active reminders</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm px-4 py-2">
            + Add Reminder
          </button>
        </div>

        {/* Add Form */}
        {showForm && (
          <div className="glass-dark rounded-2xl p-6">
            <h2 className="font-bold mb-4">New Medication Reminder</h2>
            <form onSubmit={addReminder} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Medication Name *</label>
                  <input required className="input-field" placeholder="e.g. Paracetamol"
                    value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Dose</label>
                  <input className="input-field" placeholder="e.g. 500mg"
                    value={form.dose} onChange={(e) => setForm({ ...form, dose: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Time</label>
                  <input type="time" className="input-field" value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Frequency</label>
                  <select className="input-field" value={form.frequency}
                    onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
                    {frequencies.map(f => <option key={f} value={f} className="bg-slate-900">{f}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Notes (optional)</label>
                <input className="input-field" placeholder="Take with food..."
                  value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary">Save Reminder</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Reminders List */}
        {reminders.length === 0 ? (
          <div className="glass-dark rounded-2xl p-12 text-center">
            <div className="text-5xl mb-4">💊</div>
            <h3 className="text-lg font-bold mb-2">No reminders yet</h3>
            <p className="text-slate-400 text-sm mb-4">Add your first medication reminder to stay on track</p>
            <button onClick={() => setShowForm(true)} className="btn-primary">Add First Reminder</button>
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.map((r) => (
              <div key={r.id} className={`glass-dark rounded-2xl p-5 flex items-center justify-between border ${r.active ? "border-emerald-500/20" : "border-white/5 opacity-60"}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${r.active ? "bg-emerald-500/20" : "bg-slate-800"}`}>
                    💊
                  </div>
                  <div>
                    <p className="font-bold">{r.name} {r.dose && <span className="text-slate-400 text-sm font-normal">· {r.dose}</span>}</p>
                    <p className="text-sm text-slate-400">{r.time} · {r.frequency}</p>
                    {r.notes && <p className="text-xs text-slate-500 mt-0.5">{r.notes}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggle(r.id)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${r.active ? "border-emerald-500/30 text-emerald-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30" : "border-slate-600 text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-400"}`}>
                    {r.active ? "Pause" : "Resume"}
                  </button>
                  <button onClick={() => remove(r.id)} className="text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
