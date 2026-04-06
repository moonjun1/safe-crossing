"use client";

import { useState } from "react";
import type { CrossingWithRisk } from "@/app/api/crossings/route";
import type { RiskLevel } from "@/lib/risk-calculator";
import CrossingDetail from "./CrossingDetail";
import CrossingDetailModal from "./CrossingDetailModal";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, AlertTriangle, AlertCircle, CheckCircle, HelpCircle } from "lucide-react";

interface CrossingListProps {
  crossings: CrossingWithRisk[];
  stats: {
    total: number;
    danger: number;
    caution: number;
    safe: number;
    unknown: number;
  } | null;
  totalStats?: {
    total: number;
    danger: number;
    caution: number;
    safe: number;
    unknown: number;
  } | null;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  riskFilter: RiskLevel | "all";
  onRiskFilterChange: (filter: RiskLevel | "all") => void;
  changedCrossingIds?: Set<string>;
}

const FILTER_OPTIONS: { value: RiskLevel | "all"; label: string; icon: React.ReactNode; ariaLabel: string }[] = [
  { value: "all", label: "전체", icon: <Filter className="h-3.5 w-3.5" />, ariaLabel: "전체 교차로 보기" },
  { value: "danger", label: "위험", icon: <AlertTriangle className="h-3.5 w-3.5" />, ariaLabel: "위험 교차로만 보기" },
  { value: "caution", label: "주의", icon: <AlertCircle className="h-3.5 w-3.5" />, ariaLabel: "주의 교차로만 보기" },
  { value: "safe", label: "안전", icon: <CheckCircle className="h-3.5 w-3.5" />, ariaLabel: "안전 교차로만 보기" },
  { value: "unknown", label: "분석불가", icon: <HelpCircle className="h-3.5 w-3.5" />, ariaLabel: "분석불가 교차로만 보기" },
];

function getRiskIcon(level: RiskLevel) {
  switch (level) {
    case "danger": return <AlertTriangle className="h-3.5 w-3.5" />;
    case "caution": return <AlertCircle className="h-3.5 w-3.5" />;
    case "safe": return <CheckCircle className="h-3.5 w-3.5" />;
    case "unknown": return <HelpCircle className="h-3.5 w-3.5" />;
  }
}

export default function CrossingList({
  crossings,
  stats,
  totalStats,
  loading,
  error,
  searchQuery,
  onSearchChange,
  riskFilter,
  onRiskFilterChange,
  changedCrossingIds,
}: CrossingListProps) {
  const [selectedCrossing, setSelectedCrossing] = useState<CrossingWithRisk | null>(null);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
        <p className="text-muted-foreground" role="status" aria-live="polite">교차로 데이터를 분석 중입니다...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/10">
        <CardContent className="text-center">
          <p className="text-destructive font-medium" role="alert">{error}</p>
          <p className="text-destructive/70 text-sm mt-2">
            잠시 후 다시 시도해 주세요.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      {/* 검색 + 필터 UI */}
      <Card className="mb-4">
        <CardContent className="space-y-3">
          {/* 검색 입력 */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="교차로명 검색..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
              aria-label="교차로명으로 검색"
            />
          </div>

          {/* 위험도 필터 버튼 */}
          <div className="flex flex-wrap gap-2" role="group" aria-label="위험도별 필터">
            {FILTER_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant={riskFilter === opt.value ? "default" : "outline"}
                size="sm"
                onClick={() => onRiskFilterChange(opt.value)}
                className="gap-1.5"
                aria-label={opt.ariaLabel}
                aria-pressed={riskFilter === opt.value}
              >
                {opt.icon}
                {opt.label}
                {opt.value !== "all" && totalStats && (
                  <span className="text-xs opacity-70">
                    ({totalStats[opt.value as RiskLevel]})
                  </span>
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 통계 요약 */}
      {stats && stats.total > 0 && (
        <Card className="mb-4">
          <CardContent>
            <div className="flex flex-wrap justify-center gap-3 text-sm" aria-live="polite">
              <span className="text-foreground">
                전체 <strong>{stats.total}</strong>개 교차로
              </span>
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" /> 위험 {stats.danger}개
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <AlertCircle className="h-3 w-3" /> 주의 {stats.caution}개
              </Badge>
              <Badge variant="default" className="gap-1">
                <CheckCircle className="h-3 w-3" /> 안전 {stats.safe}개
              </Badge>
              <Badge variant="outline" className="gap-1">
                <HelpCircle className="h-3 w-3" /> 분석불가 {stats.unknown}개
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 필터 결과 없음 */}
      {crossings.length === 0 && (searchQuery || riskFilter !== "all") && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              {searchQuery
                ? `"${searchQuery}" 검색 결과가 없습니다.`
                : "해당 위험도의 교차로가 없습니다."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* 데이터 없음 */}
      {crossings.length === 0 && !searchQuery && riskFilter === "all" && (
        <Card>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              교차로 데이터가 없습니다. 지역을 선택해 주세요.
            </p>
          </CardContent>
        </Card>
      )}

      {/* 교차로 카드 목록 */}
      <div className="space-y-3" role="list" aria-label="교차로 목록">
        {crossings.map((crossing) => (
          <div
            key={crossing.id}
            role="listitem"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSelectedCrossing(crossing);
              }
            }}
            onClick={() => setSelectedCrossing(crossing)}
            className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
          >
            <CrossingDetail
              crossing={crossing}
              isHighlighted={changedCrossingIds?.has(crossing.id)}
            />
          </div>
        ))}
      </div>

      {/* 상세 모달 */}
      <CrossingDetailModal
        crossing={selectedCrossing}
        onClose={() => setSelectedCrossing(null)}
      />
    </div>
  );
}
