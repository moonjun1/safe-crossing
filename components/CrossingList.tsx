"use client";

import type { CrossingWithRisk } from "@/app/api/crossings/route";
import CrossingDetail from "./CrossingDetail";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CrossingListProps {
  crossings: CrossingWithRisk[];
  stats: {
    total: number;
    danger: number;
    caution: number;
    safe: number;
    unknown: number;
  } | null;
  loading: boolean;
  error: string | null;
}

export default function CrossingList({
  crossings,
  stats,
  loading,
  error,
}: CrossingListProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
        <p className="text-muted-foreground">교차로 데이터를 분석 중입니다...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/10">
        <CardContent className="text-center">
          <p className="text-destructive font-medium">{error}</p>
          <p className="text-destructive/70 text-sm mt-2">
            잠시 후 다시 시도해 주세요.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (crossings.length === 0) {
    return (
      <Card>
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            교차로 데이터가 없습니다. 지역을 선택해 주세요.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      {/* 통계 요약 */}
      {stats && (
        <Card className="mb-4">
          <CardContent>
            <div className="flex flex-wrap justify-center gap-3 text-sm">
              <span className="text-foreground">
                전체 <strong>{stats.total}</strong>개 교차로
              </span>
              <Badge variant="destructive">
                {"\uD83D\uDD34"} 위험 {stats.danger}개
              </Badge>
              <Badge variant="secondary">
                {"\uD83D\uDFE1"} 주의 {stats.caution}개
              </Badge>
              <Badge variant="default">
                {"\uD83D\uDFE2"} 안전 {stats.safe}개
              </Badge>
              <Badge variant="outline">
                {"\u2753"} 분석불가 {stats.unknown}개
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 교차로 카드 목록 */}
      <div className="space-y-3">
        {crossings.map((crossing) => (
          <CrossingDetail key={crossing.id} crossing={crossing} />
        ))}
      </div>
    </div>
  );
}
