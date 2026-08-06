"use client";
import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";

export default function DoctorDashboard() {
  const [patients] = useState([
    { id: 1, name: "John Patient", age: 45, symptoms: "Severe chest pain, shortness of breath", risk: "High", date: "Today, 10:30 AM", status: "Pending" },
    { id: 2, name: "Mary Smith", age: 32, symptoms: "Fever, dry cough for 3 days", risk: "Moderate", date: "Today, 09:15 AM", status: "Reviewed" },
    { id: 3, name: "Ahmed Ali", age: 28, symptoms: "Mild headache", risk: "Low", date: "Yesterday", status: "Reviewed" },
  ]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black">🏥 Clinical Queue</h1>
          <p className="text-slate-400 text-sm">Review patient AI assessments and manage appointments.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-dark rounded-2xl p-5 border border-sky-500/20">
            <h2 className="text-xl mb-1">👨‍⚕️</h2>
            <h3 className="font-bold">Pending Reviews</h3>
            <p className="text-2xl font-black text-sky-400">1</p>
          </div>
          <div className="glass-dark rounded-2xl p-5 border border-red-500/20">
            <h2 className="text-xl mb-1">🚨</h2>
            <h3 className="font-bold">High Risk Cases</h3>
            <p className="text-2xl font-black text-red-400">1</p>
          </div>
          <div className="glass-dark rounded-2xl p-5 border border-emerald-500/20">
            <h2 className="text-xl mb-1">✅</h2>
            <h3 className="font-bold">Cases Reviewed</h3>
            <p className="text-2xl font-black text-emerald-400">124</p>
          </div>
        </div>

        <div className="glass-dark rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-slate-900/50">
            <h2 className="font-bold">Patient Assessments Queue</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/30 text-slate-400 border-b border-white/5">
                <tr>
                  <th className="p-4 font-medium">Patient</th>
                  <th className="p-4 font-medium">Symptoms Summary</th>
                  <th className="p-4 font-medium">AI Risk Assessment</th>
                  <th className="p-4 font-medium">Time</th>
                  <th className="p-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {patients.map(p => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.age} yrs</p>
                    </td>
                    <td className="p-4 text-slate-300 max-w-xs truncate">{p.symptoms}</td>
                    <td className="p-4">
                      <span className={`badge ${p.risk === "High" ? "badge-red" : p.risk === "Moderate" ? "badge-yellow" : "badge-green"}`}>
                        {p.risk} Risk
                      </span>
                    </td>
                    <td className="p-4 text-slate-400">{p.date}</td>
                    <td className="p-4">
                      <button className="btn-secondary text-xs px-3 py-1">
                        {p.status === "Pending" ? "Review Case" : "View Notes"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
