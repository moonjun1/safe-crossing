"use client";

import { useState, useEffect, useCallback } from "react";
import SpeedSlider from "@/components/SpeedSlider";
import CrossingList from "@/components/CrossingList";
import CrossingMap from "@/components/CrossingMap";
import { REGION_CODES } from "@/lib/api-client";
import type { CrossingWithRisk } from "@/app/api/crossings/route";

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
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-5">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {"\uD83D\uDEA6"} 안심 횡단
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            느린 보행자를 위한 교차로 안전 분석
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* 보행속도 설정 */}
        <SpeedSlider speed={speed} onSpeedChange={setSpeed} />

        {/* 지역 선택 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            지역 선택
          </h2>
          <div className="flex flex-wrap gap-2">
            {Object.keys(REGION_CODES).map((r) => (
              <button
                key={r}
                onClick={() => setRegion(r)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  region === r
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

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
      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-4xl mx-auto px-4 py-4 text-center text-xs text-gray-500">
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
