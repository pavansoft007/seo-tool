import { NextRequest, NextResponse } from "next/server";
import { getScanWithRelations } from "../../../../server/db/scan-storage";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ scanId: string }> }
) {
  const { scanId } = await params;
  const scan = await getScanWithRelations(scanId);

  if (!scan) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  return NextResponse.json({ scan });
}
