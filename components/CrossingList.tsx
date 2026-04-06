"use client";

import type { CrossingWithRisk } from "@/app/api/crossings/route";
import CrossingDetail from "./CrossingDetail";

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
        <p className="text-gray-600">교차로 데이터를 분석 중입니다...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-700 font-medium">{error}</p>
        <p className="text-red-500 text-sm mt-2">
          잠시 후 다시 시도해 주세요.
        </p>
      </div>
    );
  }

  if (crossings.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
        <p className="text-gray-600">
          교차로 데이터가 없습니다. 지역을 선택해 주세요.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* 통계 요약 */}
      {stats && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <span className="text-gray-700">
              전체 <strong>{stats.total}</strong>개 교차로
            </span>
            <span className="text-red-600">
              {"\uD83D\uDD34"} 위험 <strong>{stats.danger}</strong>개
            </span>
            <span className="text-yellow-600">
              {"\uD83D\uDFE1"} 주의 <strong>{stats.caution}</strong>개
            </span>
            <span className="text-green-600">
              {"\uD83D\uDFE2"} 안전 <strong>{stats.safe}</strong>개
            </span>
            <span className="text-gray-500">
              {"\u2753"} 분석불가 <strong>{stats.unknown}</strong>개
            </span>
          </div>
        </div>
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
