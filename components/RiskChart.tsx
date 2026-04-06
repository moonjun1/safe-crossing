"use client";

import dynamic from "next/dynamic";
import type { CrossingWithRisk } from "@/app/api/crossings/route";
import { calculateRisk } from "@/lib/risk-calculator";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const RiskChartInner = dynamic(() => import("./RiskChartInner"), { ssr: false });

interface RiskChartProps {
  crossings: CrossingWithRisk[];
  currentSpeed: number;
}

export interface SpeedComparisonData {
  speed: string;
  danger: number;
  caution: number;
  safe: number;
  unknown: number;
}

export interface PieData {
  name: string;
  value: number;
  color: string;
}

const COMPARE_SPEEDS = [0.6, 0.8, 1.0, 1.2];

function computeStatsForSpeed(
  crossings: CrossingWithRisk[],
  speed: number
): { danger: number; caution: number; safe: number; unknown: number } {
  let danger = 0,
    caution = 0,
    safe = 0,
    unknown = 0;

  crossings.forEach((c) => {
    const risk = calculateRisk(c.laneWidth, speed, c.risk.signalTime);
    switch (risk.level) {
      case "danger":
        danger++;
        break;
      case "caution":
        caution++;
        break;
      case "safe":
        safe++;
        break;
      case "unknown":
        unknown++;
        break;
    }
  });

  return { danger, caution, safe, unknown };
}

export default function RiskChart({ crossings, currentSpeed }: RiskChartProps) {
  if (crossings.length === 0) return null;

  // 현재 속도 기준 파이차트 데이터
  const currentStats = computeStatsForSpeed(crossings, currentSpeed);
  const pieData: PieData[] = [
    { name: "위험", value: currentStats.danger, color: "#ef4444" },
    { name: "주의", value: currentStats.caution, color: "#eab308" },
    { name: "안전", value: currentStats.safe, color: "#22c55e" },
    { name: "분석불가", value: currentStats.unknown, color: "#9ca3af" },
  ].filter((d) => d.value > 0);

  // 속도별 비교 바차트 데이터
  const barData: SpeedComparisonData[] = COMPARE_SPEEDS.map((s) => {
    const stats = computeStatsForSpeed(crossings, s);
    return {
      speed: `${s.toFixed(1)}m/s`,
      ...stats,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">위험도 통계</CardTitle>
      </CardHeader>
      <CardContent>
        <RiskChartInner
          pieData={pieData}
          barData={barData}
          currentSpeed={currentSpeed}
          total={crossings.length}
        />
      </CardContent>
    </Card>
  );
}
