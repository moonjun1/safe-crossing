"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import SpeedSlider from "@/components/SpeedSlider";
import CrossingList from "@/components/CrossingList";
import CrossingMap from "@/components/CrossingMap";
import RiskChart from "@/components/RiskChart";
import TopDangerousList from "@/components/TopDangerousList";
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
import { Button } from "@/components/ui/button";
import { Share2, AlertTriangle } from "lucide-react";

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
  currentSpeed: number,
  prevSpeed: number | null
): string | null {
  if (rawData.length === 0) return null;

  const current = recalcCrossings(rawData, currentSpeed);

  // 속도 변경 시 이전 속도와 비교
  if (prevSpeed !== null && prevSpeed !== currentSpeed) {
    const prev = recalcCrossings(rawData, prevSpeed);
    const diff = current.stats.danger - prev.stats.danger;
    if (diff !== 0) {
      const prevLabel = getSpeedLabel(prevSpeed);
      const curLabel = getSpeedLabel(currentSpeed);
      if (diff > 0) {
        return `${prevLabel}(${prevSpeed.toFixed(1)}m/s) → ${curLabel}(${currentSpeed.toFixed(1)}m/s)로 변경하면 위험 교차로가 ${prev.stats.danger}개 → ${current.stats.danger}개로 증가합니다.`;
      } else {
        return `${prevLabel}(${prevSpeed.toFixed(1)}m/s) → ${curLabel}(${currentSpeed.toFixed(1)}m/s)로 변경하면 위험 교차로가 ${prev.stats.danger}개 → ${current.stats.danger}개로 감소합니다.`;
      }
    }
  }

  // 기본 인사이트
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

function getSpeedLabel(speed: number): string {
  if (speed === 1.2) return "일반인";
  if (speed === 0.8) return "고령자";
  if (speed === 0.6) return "휠체어";
  return "사용자설정";
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    }>
      <HomeInner />
    </Suspense>
  );
}

function HomeInner() {
  const searchParams = useSearchParams();

  // URL 파라미터에서 초기값 로딩
  const initialSpeed = parseFloat(searchParams.get("speed") || "0.8");
  const initialRegion = searchParams.get("region") || "서울";

  const [speed, setSpeed] = useState(initialSpeed);
  const [prevSpeed, setPrevSpeed] = useState<number | null>(null);
  const [region, setRegion] = useState(initialRegion);
  const [rawData, setRawData] = useState<RawCrossing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "all">("all");
  const [shareToast, setShareToast] = useState(false);

  // 속도 변경 핸들러 (이전 속도 추적)
  const handleSpeedChange = useCallback(
    (newSpeed: number) => {
      setPrevSpeed(speed);
      setSpeed(newSpeed);
    },
    [speed]
  );

  // 지역이 바뀔 때만 API 호출
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        region,
        speed: "1.0",
        numOfRows: "30",
      });

      const res = await fetch(`/api/crossings?${params}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "데이터 로딩 실패");
      }

      const data = await res.json();
      const crossings: CrossingWithRisk[] = data.crossings || [];

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
    () => getInsightMessage(rawData, speed, prevSpeed),
    [rawData, speed, prevSpeed]
  );

  // 검색 + 필터 적용
  const filteredCrossings = useMemo(() => {
    let result = crossings;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(q));
    }

    if (riskFilter !== "all") {
      result = result.filter((c) => c.risk.level === riskFilter);
    }

    return result;
  }, [crossings, searchQuery, riskFilter]);

  const filteredStats = useMemo(() => {
    return {
      total: filteredCrossings.length,
      danger: filteredCrossings.filter((c) => c.risk.level === "danger").length,
      caution: filteredCrossings.filter((c) => c.risk.level === "caution")
        .length,
      safe: filteredCrossings.filter((c) => c.risk.level === "safe").length,
      unknown: filteredCrossings.filter((c) => c.risk.level === "unknown")
        .length,
    };
  }, [filteredCrossings]);

  // 공유 기능
  const handleShare = useCallback(async () => {
    const url = new URL(window.location.href);
    url.searchParams.set("region", region);
    url.searchParams.set("speed", speed.toFixed(1));

    const shareUrl = url.toString();

    try {
      if (navigator.share) {
        await navigator.share({
          title: "안심 횡단 - 교차로 안전 분석",
          text: `${region} 지역 보행속도 ${speed.toFixed(1)}m/s 기준 교차로 안전 분석 결과`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setShareToast(true);
        setTimeout(() => setShareToast(false), 2000);
      }
    } catch {
      // 사용자 취소 등
    }
  }, [region, speed]);

  // 위험도 변화 감지 (깜빡임 효과용)
  const changedCrossingIds = useMemo(() => {
    if (prevSpeed === null || prevSpeed === speed) return new Set<string>();

    const prevResult = recalcCrossings(rawData, prevSpeed);
    const ids = new Set<string>();

    crossings.forEach((c) => {
      const prevCrossing = prevResult.crossings.find((p) => p.id === c.id);
      if (prevCrossing && prevCrossing.risk.level !== c.risk.level) {
        ids.add(c.id);
      }
    });

    return ids;
  }, [rawData, speed, prevSpeed, crossings]);

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="bg-card border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {"\uD83D\uDEA6"} 안심 횡단
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              느린 보행자를 위한 교차로 안전 분석
            </p>
          </div>
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="gap-1.5"
              aria-label="이 분석 결과 공유하기"
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">공유</span>
            </Button>
            {shareToast && (
              <div className="absolute top-full right-0 mt-2 px-3 py-1.5 bg-foreground text-background text-xs rounded-md whitespace-nowrap shadow-lg z-50">
                URL이 복사되었습니다
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* 보행속도 설정 */}
        <SpeedSlider speed={speed} onSpeedChange={handleSpeedChange} />

        {/* 인사이트 문구 */}
        {insight && !loading && (
          <Card className="border-blue-200 bg-blue-50" role="status" aria-live="polite">
            <CardContent className="py-3">
              <p className="text-sm text-blue-800 font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {insight}
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
        <CrossingMap crossings={filteredCrossings} />

        {/* 교차로 목록 (검색/필터 포함) */}
        <CrossingList
          crossings={filteredCrossings}
          stats={filteredStats}
          loading={loading}
          error={error}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          riskFilter={riskFilter}
          onRiskFilterChange={setRiskFilter}
          changedCrossingIds={changedCrossingIds}
          totalStats={stats}
        />

        <Separator />

        {/* 전국 위험 교차로 TOP 10 */}
        <TopDangerousList speed={speed} />
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
