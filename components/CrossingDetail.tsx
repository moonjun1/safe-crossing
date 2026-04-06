"use client";

import type { CrossingWithRisk } from "@/app/api/crossings/route";
import { getRiskEmoji, getRiskColor } from "@/lib/risk-calculator";

interface CrossingDetailProps {
  crossing: CrossingWithRisk;
}

export default function CrossingDetail({ crossing }: CrossingDetailProps) {
  const { risk } = crossing;
  const emoji = getRiskEmoji(risk.level);
  const colorClass = getRiskColor(risk.level);

  return (
    <div
      className={`rounded-xl border-2 p-4 transition-all hover:shadow-md ${colorClass}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{emoji}</span>
            <h3 className="text-base font-semibold text-gray-900 truncate">
              {crossing.name}
            </h3>
          </div>

          <p className="text-sm text-gray-700 mt-1">{risk.description}</p>

          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
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
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
              risk.level === "danger"
                ? "bg-red-600 text-white"
                : risk.level === "caution"
                ? "bg-yellow-500 text-white"
                : risk.level === "safe"
                ? "bg-green-600 text-white"
                : "bg-gray-400 text-white"
            }`}
          >
            {risk.label}
          </span>
        </div>
      </div>
    </div>
  );
}
