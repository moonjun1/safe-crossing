"use client";

import { useState, useEffect, useCallback } from "react";
import type { CrossingWithRisk } from "@/app/api/crossings/route";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Trophy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import CrossingDetailModal from "./CrossingDetailModal";

interface TopDangerousListProps {
  speed: number;
}

export default function TopDangerousList({ speed }: TopDangerousListProps) {
  const [topCrossings, setTopCrossings] = useState<CrossingWithRisk[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCrossing, setSelectedCrossing] = useState<CrossingWithRisk | null>(null);

  const fetchTop10 = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/top-dangerous?speed=${speed.toFixed(1)}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "데이터 로딩 실패");
      }

      const data = await res.json();
      setTopCrossings(data.crossings || []);
      setLoaded(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "데이터를 가져오지 못했습니다."
      );
    } finally {
      setLoading(false);
    }
  }, [speed]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          전국 위험 교차로 TOP 10
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          대한민국에서 고령자가 가장 건너기 어려운 교차로는?
        </p>
      </CardHeader>
      <CardContent>
        {!loaded && !loading && (
          <div className="text-center py-4">
            <Button onClick={fetchTop10} variant="outline" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              전국 위험 교차로 TOP 10 조회
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              주요 지역의 교차로를 분석하여 가장 위험한 10곳을 찾습니다
            </p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
              전국 교차로를 분석 중입니다... (잠시 시간이 소요됩니다)
            </p>
          </div>
        )}

        {error && (
          <div className="text-center py-4">
            <p className="text-destructive text-sm" role="alert">{error}</p>
            <Button onClick={fetchTop10} variant="outline" size="sm" className="mt-2">
              다시 시도
            </Button>
          </div>
        )}

        {loaded && topCrossings.length > 0 && (
          <div className="space-y-2">
            {topCrossings.map((crossing, index) => (
              <div
                key={crossing.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                onClick={() => setSelectedCrossing(crossing)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedCrossing(crossing);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`${index + 1}위: ${crossing.name} - ${crossing.risk.label}`}
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center text-sm">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{crossing.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {crossing.risk.crossingTime && crossing.risk.signalTime
                      ? `횡단 ${crossing.risk.crossingTime}초 / 신호 ${crossing.risk.signalTime}초`
                      : crossing.risk.description}
                  </p>
                </div>
                <Badge variant="destructive" className="gap-1 flex-shrink-0">
                  <AlertTriangle className="h-3 w-3" />
                  {crossing.risk.ratio !== null ? `${(crossing.risk.ratio * 100).toFixed(0)}%` : crossing.risk.label}
                </Badge>
              </div>
            ))}

            <p className="text-xs text-muted-foreground text-center pt-2">
              보행속도 {speed.toFixed(1)}m/s 기준 | 클릭하여 상세 정보 보기
            </p>
          </div>
        )}

        {loaded && topCrossings.length === 0 && !error && (
          <p className="text-sm text-muted-foreground text-center py-4">
            현재 속도에서 위험 교차로가 발견되지 않았습니다.
          </p>
        )}
      </CardContent>

      <CrossingDetailModal
        crossing={selectedCrossing}
        onClose={() => setSelectedCrossing(null)}
      />
    </Card>
  );
}
