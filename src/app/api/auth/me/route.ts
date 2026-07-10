import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  return NextResponse.json({
    id: session.userId,
    first_name: session.firstName,
    last_name: session.lastName,
    email: session.email,
    role: session.role,
  });
}
