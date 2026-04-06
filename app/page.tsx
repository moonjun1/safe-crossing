"use client";

import { useState, useEffect, useCallback } from "react";
import SpeedSlider from "@/components/SpeedSlider";
import CrossingList from "@/components/CrossingList";
import CrossingMap from "@/components/CrossingMap";
import { REGION_CODES } from "@/lib/api-client";
import type { CrossingWithRisk } from "@/app/api/crossings/route";
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

export default function Home() {
  const [speed, setSpeed] = useState(0.8);
  const [region, setRegion] = useState("서울");
  const [crossings, setCrossings] = useState<CrossingWithRisk[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        region,
        speed: speed.toString(),
        numOfRows: "30",
      });

      const res = await fetch(`/api/crossings?${params}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "데이터 로딩 실패");
      }

      const data = await res.json();
      setCrossings(data.crossings || []);
      setStats(data.stats || null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "데이터를 가져오지 못했습니다."
      );
      setCrossings([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [region, speed]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

        <Separator />

        {/* 지역 선택 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">지역 선택</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={region} onValueChange={(val) => { if (val) setRegion(val); }}>
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

        {/* 카카오맵 (키가 있을 때만) */}
        {kakaoKey && <CrossingMap crossings={crossings} />}

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
