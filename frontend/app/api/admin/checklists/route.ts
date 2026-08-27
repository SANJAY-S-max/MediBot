import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    const templates = await prisma.checklistTemplate.findMany({
      orderBy: { version: "desc" },
    });
    return NextResponse.json({ templates });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { title, category = "Home Checkup", items = [] } = body;

    const template = await prisma.checklistTemplate.create({
      data: {
        title,
        category,
        itemsJson: items,
        isActive: true,
      },
    });

    await logAudit({
      actorUserId: user.id,
      action: "CHECKLIST_TEMPLATE_CREATED",
      entity: "ChecklistTemplate",
      entityId: template.id,
      details: { title },
    });

    return NextResponse.json({ success: true, template });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
