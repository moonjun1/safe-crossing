import { NextRequest, NextResponse } from "next/server";
import {
  fetchCrossings,
  fetchSignalInfo,
  extractPedestrianSignalSeconds,
  REGION_CODES,
} from "@/lib/api-client";
import { calculateRisk, type RiskLevel } from "@/lib/risk-calculator";

export interface CrossingWithRisk {
  id: string;
  name: string;
  lat: number | null;
  lng: number | null;
  laneWidth: number | null;
  speedLimit: string;
  risk: {
    level: RiskLevel;
    ratio: number | null;
    crossingTime: number | null;
    signalTime: number | null;
    label: string;
    description: string;
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region") || "서울";
  const stdgCdParam = searchParams.get("stdgCd"); // 직접 10자리 코드 전달 가능
  const speed = parseFloat(searchParams.get("speed") || "0.8");
  const numOfRows = parseInt(searchParams.get("numOfRows") || "30", 10);

  // stdgCd가 직접 전달되면 사용, 아니면 region 매핑
  let stdgCd = stdgCdParam;
  if (!stdgCd) {
    const prefix = REGION_CODES[region];
    if (!prefix) {
      return NextResponse.json(
        { error: `알 수 없는 지역: ${region}` },
        { status: 400 }
      );
    }
    stdgCd = prefix + "00000000";
  }

  try {
    const crossings = await fetchCrossings(stdgCd, numOfRows);

    // 신호 정보를 병렬로 가져오기
    const results: CrossingWithRisk[] = await Promise.all(
      crossings.map(async (c) => {
        const lat = c.mapCtptIntLat ? parseFloat(c.mapCtptIntLat) : null;
        const lng = c.mapCtptIntLot ? parseFloat(c.mapCtptIntLot) : null;
        const laneWidth = c.laneWdth ? parseFloat(c.laneWdth) : null;

        let signalSeconds: number | null = null;
        try {
          const signalData = await fetchSignalInfo(c.crsrdId);
          signalSeconds = extractPedestrianSignalSeconds(signalData);
        } catch {
          // 신호 정보 실패 시 null 유지
        }

        const risk = calculateRisk(laneWidth, speed, signalSeconds);

        return {
          id: c.crsrdId,
          name: c.crsrdNm || `교차로 ${c.crsrdId}`,
          lat: lat && !isNaN(lat) ? lat : null,
          lng: lng && !isNaN(lng) ? lng : null,
          laneWidth: laneWidth && !isNaN(laneWidth) ? laneWidth : null,
          speedLimit: c.lmtSpd || "",
          risk,
        };
      })
    );

    // 위험도순 정렬: danger > caution > unknown > safe
    const order: Record<RiskLevel, number> = {
      danger: 0,
      caution: 1,
      unknown: 2,
      safe: 3,
    };
    results.sort((a, b) => order[a.risk.level] - order[b.risk.level]);

    // 통계
    const stats = {
      total: results.length,
      danger: results.filter((r) => r.risk.level === "danger").length,
      caution: results.filter((r) => r.risk.level === "caution").length,
      safe: results.filter((r) => r.risk.level === "safe").length,
      unknown: results.filter((r) => r.risk.level === "unknown").length,
    };

    return NextResponse.json({ crossings: results, stats });
  } catch (error) {
    console.error("Failed to fetch crossings:", error);
    return NextResponse.json(
      { error: "교차로 데이터를 가져오는데 실패했습니다." },
      { status: 500 }
    );
  }
}
