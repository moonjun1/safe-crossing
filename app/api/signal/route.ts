import { NextRequest, NextResponse } from "next/server";
import { fetchSignalInfo } from "@/lib/api-client";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const crsrdId = searchParams.get("crsrdId");

  if (!crsrdId) {
    return NextResponse.json(
      { error: "crsrdId 파라미터가 필요합니다." },
      { status: 400 }
    );
  }

  try {
    const signal = await fetchSignalInfo(crsrdId);
    return NextResponse.json({ signal });
  } catch (error) {
    console.error("Failed to fetch signal:", error);
    return NextResponse.json(
      { error: "신호 데이터를 가져오는데 실패했습니다." },
      { status: 500 }
    );
  }
}
