"use client";

import type { CrossingWithRisk } from "@/app/api/crossings/route";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, CheckCircle, HelpCircle } from "lucide-react";
import type { RiskLevel } from "@/lib/risk-calculator";

interface CrossingDetailModalProps {
  crossing: CrossingWithRisk | null;
  onClose: () => void;
}

function getRiskBadgeVariant(level: RiskLevel) {
  switch (level) {
    case "danger": return "destructive" as const;
    case "caution": return "secondary" as const;
    case "safe": return "default" as const;
    case "unknown": return "outline" as const;
  }
}

function getRiskIcon(level: RiskLevel) {
  switch (level) {
    case "danger": return <AlertTriangle className="h-5 w-5 text-red-600" />;
    case "caution": return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    case "safe": return <CheckCircle className="h-5 w-5 text-green-600" />;
    case "unknown": return <HelpCircle className="h-5 w-5 text-gray-500" />;
  }
}

export default function CrossingDetailModal({
  crossing,
  onClose,
}: CrossingDetailModalProps) {
  if (!crossing) return null;

  const { risk } = crossing;
  const laneWidth = crossing.laneWidth || 15;

  return (
    <Dialog open={!!crossing} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {getRiskIcon(risk.level)}
            <DialogTitle>{crossing.name}</DialogTitle>
          </div>
          <DialogDescription>
            교차로 상세 정보 및 위험도 계산 과정
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 위험도 뱃지 */}
          <div className="flex items-center gap-2">
            <Badge variant={getRiskBadgeVariant(risk.level)} className="gap-1 text-sm px-3 py-1">
              {getRiskIcon(risk.level)}
              {risk.label}
            </Badge>
            {risk.ratio !== null && (
              <span className="text-sm text-muted-foreground">
                위험도 {(risk.ratio * 100).toFixed(0)}%
              </span>
            )}
          </div>

          {/* 기본 정보 */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <h4 className="text-sm font-semibold">기본 정보</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">차로폭</span>
                <p className="font-medium">
                  {crossing.laneWidth ? `${crossing.laneWidth}m` : "기본값 15m"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">제한속도</span>
                <p className="font-medium">
                  {crossing.speedLimit ? `${crossing.speedLimit}km/h` : "-"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">보행신호 시간</span>
                <p className="font-medium">
                  {risk.signalTime ? `${risk.signalTime}초` : "데이터 없음"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">필요 횡단시간</span>
                <p className="font-medium">
                  {risk.crossingTime ? `${risk.crossingTime}초` : "-"}
                </p>
              </div>
            </div>
          </div>

          {/* 계산 과정 시각화 */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-3">
            <h4 className="text-sm font-semibold">위험도 계산 과정</h4>

            {/* 횡단 시간 계산 */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">1. 횡단 소요 시간 계산</p>
              <div className="bg-background rounded-md p-2 text-sm font-mono">
                <span className="text-muted-foreground">차로폭</span>{" "}
                <span className="font-semibold">{laneWidth}m</span>
                <span className="text-muted-foreground"> / 보행속도 </span>
                {risk.crossingTime && (
                  <>
                    <span className="font-semibold">
                      {(laneWidth / risk.crossingTime).toFixed(1)}m/s
                    </span>
                    <span className="text-muted-foreground"> = </span>
                    <span className="font-bold text-foreground">
                      {risk.crossingTime}초
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* 위험도 비율 계산 */}
            {risk.signalTime !== null && risk.crossingTime !== null && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">2. 위험도 비율 계산</p>
                <div className="bg-background rounded-md p-2 text-sm font-mono">
                  <span className="text-muted-foreground">횡단시간</span>{" "}
                  <span className="font-semibold">{risk.crossingTime}초</span>
                  <span className="text-muted-foreground"> / 보행신호 </span>
                  <span className="font-semibold">{risk.signalTime}초</span>
                  <span className="text-muted-foreground"> = </span>
                  <span className="font-bold text-foreground">
                    {risk.ratio !== null ? (risk.ratio * 100).toFixed(0) : "-"}%
                  </span>
                </div>
              </div>
            )}

            {/* 판정 기준 */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">3. 판정 기준</p>
              <div className="text-xs space-y-0.5">
                <p className={risk.level === "danger" ? "font-bold text-red-600" : "text-muted-foreground"}>
                  <AlertTriangle className="inline h-3 w-3 mr-1" />
                  위험: 비율 &gt; 100% (신호 시간 내 횡단 불가)
                </p>
                <p className={risk.level === "caution" ? "font-bold text-yellow-600" : "text-muted-foreground"}>
                  <AlertCircle className="inline h-3 w-3 mr-1" />
                  주의: 비율 70~100% (여유가 부족)
                </p>
                <p className={risk.level === "safe" ? "font-bold text-green-600" : "text-muted-foreground"}>
                  <CheckCircle className="inline h-3 w-3 mr-1" />
                  안전: 비율 &lt; 70% (충분한 여유)
                </p>
                <p className={risk.level === "unknown" ? "font-bold text-gray-600" : "text-muted-foreground"}>
                  <HelpCircle className="inline h-3 w-3 mr-1" />
                  분석불가: 신호 데이터 없음
                </p>
              </div>
            </div>
          </div>

          {/* 종합 설명 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              {crossing.laneWidth
                ? `이 교차로는 차로폭 ${crossing.laneWidth}m`
                : "이 교차로는 기본 차로폭 15m"}
              {risk.crossingTime && ` 기준 횡단에 ${risk.crossingTime}초가 필요합니다.`}
              {risk.signalTime && risk.crossingTime && risk.ratio !== null && (
                <>
                  {" "}보행신호 {risk.signalTime}초 대비{" "}
                  {risk.ratio > 1.0
                    ? `${(risk.crossingTime - risk.signalTime).toFixed(1)}초가 부족합니다.`
                    : risk.ratio >= 0.7
                    ? `여유가 ${(risk.signalTime - risk.crossingTime).toFixed(1)}초뿐입니다.`
                    : `${(risk.signalTime - risk.crossingTime).toFixed(1)}초의 여유가 있습니다.`}
                </>
              )}
            </p>
          </div>

          {/* 좌표 정보 */}
          {crossing.lat && crossing.lng && (
            <p className="text-xs text-muted-foreground text-center">
              위치: {crossing.lat.toFixed(5)}, {crossing.lng.toFixed(5)}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
