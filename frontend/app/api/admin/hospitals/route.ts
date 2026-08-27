import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { FacilityTier } from "@prisma/client";

export async function GET() {
  try {
    const hospitals = await prisma.hospital.findMany({
      orderBy: { name: "asc" },
      include: {
        facilities: true,
        departments: true,
        equipment: true,
        diagnosticInstruments: true,
        medicalServices: true,
        bedCapacity: true,
        hostels: true,
        doctors: { include: { user: { select: { name: true } } } },
      },
    });

    return NextResponse.json({ hospitals });
  } catch (err: any) {
    console.error("Admin hospitals GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      code,
      tier = "PHC",
      district = "Chengalpattu",
      state = "Tamil Nadu",
      pincode,
      address,
      latitude = 12.7236,
      longitude = 80.1872,
      contactPhone,
      isEmergency24x7 = false,
      hasBloodBank = false,
      hasAmbulanceStation = true,
      operatingHours = "24x7",
      totalBeds = 10,
      availableBeds = 5,
      icuBeds = 0,
      oxygenBeds = 2,
      ventilatorBeds = 0,
    } = body;

    if (!name || !contactPhone || !address) {
      return NextResponse.json({ error: "Name, contactPhone, and address are required" }, { status: 400 });
    }

    const hospital = await prisma.hospital.create({
      data: {
        name,
        code: code || `HOSP-${Math.floor(1000 + Math.random() * 9000)}`,
        tier: (tier as FacilityTier) || FacilityTier.PHC,
        district,
        state,
        pincode,
        address,
        latitude: parseFloat(String(latitude)),
        longitude: parseFloat(String(longitude)),
        contactPhone,
        isEmergency24x7: Boolean(isEmergency24x7),
        hasBloodBank: Boolean(hasBloodBank),
        hasAmbulanceStation: Boolean(hasAmbulanceStation),
        operatingHours,
        bedCapacity: {
          create: {
            totalBeds: parseInt(String(totalBeds)) || 0,
            availableBeds: parseInt(String(availableBeds)) || 0,
            icuBeds: parseInt(String(icuBeds)) || 0,
            availableIcuBeds: Math.min(parseInt(String(icuBeds)) || 0, 2),
            oxygenBeds: parseInt(String(oxygenBeds)) || 0,
            availableOxygenBeds: Math.min(parseInt(String(oxygenBeds)) || 0, 2),
            ventilatorBeds: parseInt(String(ventilatorBeds)) || 0,
            availableVentBeds: Math.min(parseInt(String(ventilatorBeds)) || 0, 1),
          },
        },
      },
      include: { bedCapacity: true },
    });

    await logAudit({
      actorUserId: user.id,
      action: "HOSPITAL_CREATED",
      entity: "Hospital",
      entityId: hospital.id,
      details: { name: hospital.name, tier: hospital.tier },
    });

    return NextResponse.json({ success: true, hospital });
  } catch (err: any) {
    console.error("Create hospital error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
