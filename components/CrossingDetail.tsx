"use client";

import type { CrossingWithRisk } from "@/app/api/crossings/route";
import { getRiskEmoji, getRiskColor } from "@/lib/risk-calculator";
import type { RiskLevel } from "@/lib/risk-calculator";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CrossingDetailProps {
  crossing: CrossingWithRisk;
}

function getRiskBadgeVariant(level: RiskLevel) {
  switch (level) {
    case "danger":
      return "destructive" as const;
    case "caution":
      return "secondary" as const;
    case "safe":
      return "default" as const;
    case "unknown":
      return "outline" as const;
  }
}

export default function CrossingDetail({ crossing }: CrossingDetailProps) {
  const { risk } = crossing;
  const emoji = getRiskEmoji(risk.level);
  const colorClass = getRiskColor(risk.level);

  return (
    <Card className={`border-2 transition-all hover:shadow-md ${colorClass}`}>
      <CardContent>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{emoji}</span>
              <h3 className="text-base font-semibold text-foreground truncate">
                {crossing.name}
              </h3>
            </div>

            <p className="text-sm text-muted-foreground mt-1">{risk.description}</p>

            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
              <span>
                차로폭: {crossing.laneWidth ? `${crossing.laneWidth}m` : "기본값 15m"}
              </span>
              {risk.crossingTime !== null && (
                <span>횡단시간: {risk.crossingTime}초</span>
              )}
              {risk.signalTime !== null && (
                <span>보행신호: {risk.signalTime}초</span>
              )}
              {risk.ratio !== null && (
                <span>위험도: {(risk.ratio * 100).toFixed(0)}%</span>
              )}
              {crossing.speedLimit && (
                <span>제한속도: {crossing.speedLimit}km/h</span>
              )}
            </div>
          </div>

          <div className="flex-shrink-0">
            <Badge variant={getRiskBadgeVariant(risk.level)}>
              {risk.label}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
