import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateHaversineDistanceKm } from "@/lib/recommendationEngine";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get("lat") || "12.7236");
    const lng = parseFloat(searchParams.get("lng") || "80.1872");
    const requiredDepartment = searchParams.get("department")?.toLowerCase() || "";
    const requiredEquipment = searchParams.get("equipment")?.toLowerCase() || "";
    const requiredService = searchParams.get("service")?.toLowerCase() || "";
    const emergencyOnly = searchParams.get("emergency") === "true";
    const tier = searchParams.get("tier");

    const whereClause: any = { isVerified: true };
    if (emergencyOnly) {
      whereClause.isEmergency24x7 = true;
    }
    if (tier) {
      whereClause.tier = tier;
    }

    const hospitals = await prisma.hospital.findMany({
      where: whereClause,
      include: {
        facilities: true,
        departments: true,
        equipment: true,
        diagnosticInstruments: true,
        medicalServices: true,
        bedCapacity: true,
        hostels: true,
      },
    });

    const results = hospitals.map((h) => {
      const distanceKm = calculateHaversineDistanceKm(lat, lng, h.latitude, h.longitude);
      const estimatedTimeMin = Math.round(distanceKm * 2.2 + 5);

      // Capability tokens
      const hospitalCapabilities = new Set<string>();
      h.facilities.forEach((f) => hospitalCapabilities.add(f.name.toLowerCase()));
      h.departments.forEach((d) => hospitalCapabilities.add(d.name.toLowerCase()));
      h.equipment.forEach((e) => hospitalCapabilities.add(e.name.toLowerCase()));
      h.diagnosticInstruments.forEach((i) => hospitalCapabilities.add(i.name.toLowerCase()));
      h.medicalServices.forEach((s) => hospitalCapabilities.add(s.name.toLowerCase()));

      let matchesFilter = true;
      const matchedFilterTags: string[] = [];

      if (requiredDepartment) {
        const matchesDept = Array.from(hospitalCapabilities).some((c) =>
          c.includes(requiredDepartment)
        );
        if (!matchesDept) matchesFilter = false;
        else matchedFilterTags.push(`Dept: ${requiredDepartment}`);
      }

      if (requiredEquipment) {
        const matchesEq = Array.from(hospitalCapabilities).some((c) =>
          c.includes(requiredEquipment)
        );
        if (!matchesEq) matchesFilter = false;
        else matchedFilterTags.push(`Equipment: ${requiredEquipment}`);
      }

      if (requiredService) {
        const matchesSvc = Array.from(hospitalCapabilities).some((c) =>
          c.includes(requiredService)
        );
        if (!matchesSvc) matchesFilter = false;
        else matchedFilterTags.push(`Service: ${requiredService}`);
      }

      const navigationUrl = `https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=${h.latitude},${h.longitude}`;

      return {
        hospital: h,
        distanceKm,
        estimatedTimeMin,
        matchesFilter,
        matchedFilterTags,
        navigationUrl,
      };
    });

    // Filter if specific queries provided
    const filtered = (requiredDepartment || requiredEquipment || requiredService)
      ? results.filter((r) => r.matchesFilter)
      : results;

    // Sort by distance
    filtered.sort((a, b) => a.distanceKm - b.distanceKm);

    return NextResponse.json({
      total: filtered.length,
      patientCoordinates: { latitude: lat, longitude: lng },
      hospitals: filtered,
    });
  } catch (err: any) {
    console.error("Hospital recommendation query error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
