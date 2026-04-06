"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import type { CrossingWithRisk } from "@/app/api/crossings/route";

interface CrossingMapProps {
  crossings: CrossingWithRisk[];
}

const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false });

export default function CrossingMap({ crossings }: CrossingMapProps) {
  // lng가 없는 교차로 제외
  const validCrossings = useMemo(
    () => crossings.filter((c) => c.lat !== null && c.lng !== null && c.lng !== 0),
    [crossings]
  );

  if (validCrossings.length === 0) {
    return (
      <div className="bg-card rounded-xl shadow-sm border overflow-hidden p-6 text-center text-muted-foreground text-sm">
        지도에 표시할 수 있는 교차로가 없습니다 (좌표 데이터 부족).
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
      <div className="p-3 border-b">
        <h3 className="text-base font-semibold">교차로 위치 지도</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          마커를 클릭하면 상세 정보를 확인할 수 있습니다 ({validCrossings.length}개 표시)
        </p>
      </div>
      <LeafletMap crossings={validCrossings} />
    </div>
  );
}
