import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function GET(request) {
  try {
    const token = request.cookies.get("medibot_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Default sample assessments for clinical documentation & viewer
    const assessments = [
      {
        id: "REP-2026-0801",
        patient_name: user.name || "John Patient",
        symptoms: "Acute Chest Pain & Dyspnea on Exertion",
        severity_level: "P1 Critical",
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        vitals: {
          spo2: 89,
          heart_rate: 115,
          systolic_bp: 95,
          respiratory_rate: 28,
          temperature: 98.6
        },
        recommendations: "Immediate escalation to District Hospital with ICU/Ventilator readiness. 108 ALS Ambulance dispatched.",
        assigned_facility: "Chengalpattu Government District Headquarters Hospital",
        referral_id: "REF-20260827-8912"
      },
      {
        id: "REP-2026-0802",
        patient_name: user.name || "John Patient",
        symptoms: "High Grade Fever (102.5°F) with Rigors & Body Ache",
        severity_level: "P2 Moderate",
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        vitals: {
          spo2: 97,
          heart_rate: 98,
          systolic_bp: 118,
          respiratory_rate: 18,
          temperature: 102.5
        },
        recommendations: "Routed to nearest Primary Health Centre (PHC) for malaria RDT and CBC blood tests. Keep patient hydrated.",
        assigned_facility: "Thiruporur Primary Health Centre (24x7 PHC)",
        referral_id: "REF-20260826-4412"
      },
      {
        id: "REP-2026-0803",
        patient_name: user.name || "John Patient",
        symptoms: "Mild Cough, Nasal Congestion & Sore Throat",
        severity_level: "P3 Routine",
        created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
        vitals: {
          spo2: 99,
          heart_rate: 74,
          systolic_bp: 120,
          respiratory_rate: 16,
          temperature: 98.4
        },
        recommendations: "Routine OPD consultation. Steam inhalation, hydration, and over-the-counter paracetamol as needed.",
        assigned_facility: "Kelambakkam Health Sub-Centre",
        referral_id: "REF-20260824-1109"
      }
    ];

    return NextResponse.json({
      status: "success",
      assessments
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
