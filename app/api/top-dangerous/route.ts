import { NextRequest, NextResponse } from "next/server";
import {
  fetchCrossings,
  fetchSignalInfo,
  extractPedestrianSignalSeconds,
  REGION_CODES,
} from "@/lib/api-client";
import { calculateRisk, type RiskLevel } from "@/lib/risk-calculator";
import type { CrossingWithRisk } from "@/app/api/crossings/route";

// 주요 대도시 위주로 조회 (API 호출 수 제한)
const TOP_REGIONS = ["서울", "부산", "대구", "인천", "광주", "대전", "경기"];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const speed = parseFloat(searchParams.get("speed") || "0.8");

  try {
    const allCrossings: CrossingWithRisk[] = [];

    // 주요 지역별 교차로 병렬 조회
    const regionResults = await Promise.all(
      TOP_REGIONS.map(async (regionName) => {
        const prefix = REGION_CODES[regionName];
        if (!prefix) return [];

        const stdgCd = prefix + "00000000";
        try {
          const crossings = await fetchCrossings(stdgCd, 20);
          const results = await Promise.all(
            crossings.map(async (c) => {
              const lat = c.mapCtptIntLat ? parseFloat(c.mapCtptIntLat) : null;
              const lng = c.mapCtptIntLot ? parseFloat(c.mapCtptIntLot) : null;
              const laneWidth = c.laneWdth ? parseFloat(c.laneWdth) : null;

              let signalSeconds: number | null = null;
              try {
                const signalData = await fetchSignalInfo(c.crsrdId);
                signalSeconds = extractPedestrianSignalSeconds(signalData);
              } catch {
                // skip
              }

              const risk = calculateRisk(laneWidth, speed, signalSeconds);

              return {
                id: c.crsrdId,
                name: `[${regionName}] ${c.crsrdNm || `교차로 ${c.crsrdId}`}`,
                lat: lat && !isNaN(lat) ? lat : null,
                lng: lng && !isNaN(lng) ? lng : null,
                laneWidth: laneWidth && !isNaN(laneWidth) ? laneWidth : null,
                speedLimit: c.lmtSpd || "",
                risk,
              } as CrossingWithRisk;
            })
          );
          return results;
        } catch {
          return [];
        }
      })
    );

    regionResults.forEach((results) => allCrossings.push(...results));

    // 위험도순 정렬 (danger만, ratio 높은 순)
    const dangerCrossings = allCrossings
      .filter((c) => c.risk.level === "danger" && c.risk.ratio !== null)
      .sort((a, b) => (b.risk.ratio || 0) - (a.risk.ratio || 0))
      .slice(0, 10);

    // 위험 교차로가 10개 미만이면 caution도 포함
    if (dangerCrossings.length < 10) {
      const cautionCrossings = allCrossings
        .filter((c) => c.risk.level === "caution" && c.risk.ratio !== null)
        .sort((a, b) => (b.risk.ratio || 0) - (a.risk.ratio || 0))
        .slice(0, 10 - dangerCrossings.length);
      dangerCrossings.push(...cautionCrossings);
    }

    return NextResponse.json({ crossings: dangerCrossings });
  } catch (error) {
    console.error("Failed to fetch top dangerous crossings:", error);
    return NextResponse.json(
      { error: "전국 위험 교차로 데이터를 가져오는데 실패했습니다." },
      { status: 500 }
    );
  }
}
