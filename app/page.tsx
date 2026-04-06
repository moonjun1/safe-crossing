"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import SpeedSlider from "@/components/SpeedSlider";
import CrossingList from "@/components/CrossingList";
import CrossingMap from "@/components/CrossingMap";
import RiskChart from "@/components/RiskChart";
import { REGION_CODES } from "@/lib/api-client";
import { calculateRisk } from "@/lib/risk-calculator";
import type { CrossingWithRisk } from "@/app/api/crossings/route";
import type { RiskLevel } from "@/lib/risk-calculator";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface Stats {
  total: number;
  danger: number;
  caution: number;
  safe: number;
  unknown: number;
}

/** API에서 가져온 raw 데이터 (속도 변경 시 재사용) */
interface RawCrossing {
  id: string;
  name: string;
  lat: number | null;
  lng: number | null;
  laneWidth: number | null;
  speedLimit: string;
  signalTime: number | null;
}

function recalcCrossings(
  rawData: RawCrossing[],
  speed: number
): { crossings: CrossingWithRisk[]; stats: Stats } {
  const order: Record<RiskLevel, number> = {
    danger: 0,
    caution: 1,
    unknown: 2,
    safe: 3,
  };

  const crossings: CrossingWithRisk[] = rawData.map((raw) => {
    const risk = calculateRisk(raw.laneWidth, speed, raw.signalTime);
    return {
      id: raw.id,
      name: raw.name,
      lat: raw.lat,
      lng: raw.lng,
      laneWidth: raw.laneWidth,
      speedLimit: raw.speedLimit,
      risk,
    };
  });

  crossings.sort((a, b) => order[a.risk.level] - order[b.risk.level]);

  const stats: Stats = {
    total: crossings.length,
    danger: crossings.filter((r) => r.risk.level === "danger").length,
    caution: crossings.filter((r) => r.risk.level === "caution").length,
    safe: crossings.filter((r) => r.risk.level === "safe").length,
    unknown: crossings.filter((r) => r.risk.level === "unknown").length,
  };

  return { crossings, stats };
}

function getInsightMessage(
  rawData: RawCrossing[],
  currentSpeed: number
): string | null {
  if (rawData.length === 0) return null;

  const current = recalcCrossings(rawData, currentSpeed);
  const elderly = recalcCrossings(rawData, 0.8);
  const normal = recalcCrossings(rawData, 1.2);

  if (currentSpeed <= 0.8 && current.stats.danger > normal.stats.danger) {
    return `일반 보행속도(1.2m/s) 대비 현재 속도에서 위험 교차로가 ${normal.stats.danger}개 → ${current.stats.danger}개로 증가합니다.`;
  }

  if (currentSpeed >= 1.0 && current.stats.danger < elderly.stats.danger) {
    return `고령자 속도(0.8m/s)로 설정하면 위험 교차로가 ${current.stats.danger}개 → ${elderly.stats.danger}개로 증가합니다.`;
  }

  if (current.stats.danger > 0) {
    return `현재 속도에서 ${current.stats.danger}개 교차로가 보행신호 시간 내 횡단이 어렵습니다.`;
  }

  return null;
}

export default function Home() {
  const [speed, setSpeed] = useState(0.8);
  const [region, setRegion] = useState("서울");
  const [rawData, setRawData] = useState<RawCrossing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 지역이 바뀔 때만 API 호출 (속도 변경 시에는 호출하지 않음)
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        region,
        speed: "1.0", // 기준 속도로 호출 (signalTime 추출이 목적)
        numOfRows: "30",
      });

      const res = await fetch(`/api/crossings?${params}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "데이터 로딩 실패");
      }

      const data = await res.json();
      const crossings: CrossingWithRisk[] = data.crossings || [];

      // raw 데이터 추출 (signalTime 캐싱)
      const raw: RawCrossing[] = crossings.map((c: CrossingWithRisk) => ({
        id: c.id,
        name: c.name,
        lat: c.lat,
        lng: c.lng,
        laneWidth: c.laneWidth,
        speedLimit: c.speedLimit,
        signalTime: c.risk.signalTime,
      }));

      setRawData(raw);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "데이터를 가져오지 못했습니다."
      );
      setRawData([]);
    } finally {
      setLoading(false);
    }
  }, [region]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 속도 변경 시 클라이언트에서 재계산
  const { crossings, stats } = useMemo(
    () => recalcCrossings(rawData, speed),
    [rawData, speed]
  );

  const insight = useMemo(
    () => getInsightMessage(rawData, speed),
    [rawData, speed]
  );

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="bg-card border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-5">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {"\uD83D\uDEA6"} 안심 횡단
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            느린 보행자를 위한 교차로 안전 분석
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* 보행속도 설정 */}
        <SpeedSlider speed={speed} onSpeedChange={setSpeed} />

        {/* 인사이트 문구 */}
        {insight && !loading && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="py-3">
              <p className="text-sm text-blue-800 font-medium">
                {"\uD83D\uDCA1"} {insight}
              </p>
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* 지역 선택 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">지역 선택</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={region}
              onValueChange={(val) => {
                if (val) setRegion(val);
              }}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="지역을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(REGION_CODES).map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Separator />

        {/* 위험도 통계 차트 */}
        <RiskChart crossings={crossings} currentSpeed={speed} />

        {/* 교차로 지도 (Leaflet) */}
        <CrossingMap crossings={crossings} />

        {/* 교차로 목록 */}
        <CrossingList
          crossings={crossings}
          stats={stats}
          loading={loading}
          error={error}
        />
      </main>

      {/* 푸터 */}
      <footer className="bg-card border-t mt-8">
        <div className="max-w-4xl mx-auto px-4 py-4 text-center text-xs text-muted-foreground">
          <p>
            데이터 출처: 국가교통정보센터 (data.go.kr) | 교통안전 신호등 API
          </p>
          <p className="mt-1">
            본 서비스는 참고용이며, 실제 횡단 시 현장 신호를 확인하세요.
          </p>
        </div>
      </footer>
    </div>
  );
}
