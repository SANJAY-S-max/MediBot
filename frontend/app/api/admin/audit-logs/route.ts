import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const entity = searchParams.get("entity");
    const limit = parseInt(searchParams.get("limit") || "50");

    const whereClause: any = {};
    if (entity) {
      whereClause.entity = entity;
    }

    const auditLogs = await prisma.auditLog.findMany({
      where: whereClause,
      orderBy: { timestamp: "desc" },
      take: limit,
      include: {
        actorUser: {
          select: { name: true, email: true, role: true },
        },
      },
    });

    return NextResponse.json({ auditLogs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
