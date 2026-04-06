export type RiskLevel = "danger" | "caution" | "safe" | "unknown";

export interface RiskResult {
  level: RiskLevel;
  ratio: number | null;
  crossingTime: number | null;
  signalTime: number | null;
  label: string;
  description: string;
}

const DEFAULT_LANE_WIDTH = 15; // 왕복 4차로 기본 (m)

export function calculateRisk(
  laneWidth: number | null,
  walkingSpeed: number,
  signalSeconds: number | null
): RiskResult {
  const width = laneWidth && laneWidth > 0 ? laneWidth : DEFAULT_LANE_WIDTH;
  const crossingTime = width / walkingSpeed;

  if (signalSeconds === null || signalSeconds <= 0) {
    return {
      level: "unknown",
      ratio: null,
      crossingTime: Math.round(crossingTime * 10) / 10,
      signalTime: null,
      label: "분석 불가",
      description: `신호 데이터 없음 (차로폭 ${width}m 기준 횡단 ${crossingTime.toFixed(1)}초 필요)`,
    };
  }

  const ratio = crossingTime / signalSeconds;

  if (ratio > 1.0) {
    return {
      level: "danger",
      ratio: Math.round(ratio * 100) / 100,
      crossingTime: Math.round(crossingTime * 10) / 10,
      signalTime: signalSeconds,
      label: "위험",
      description: `신호 시간 부족! 횡단 ${crossingTime.toFixed(1)}초 필요하지만 신호 ${signalSeconds}초`,
    };
  }

  if (ratio >= 0.7) {
    return {
      level: "caution",
      ratio: Math.round(ratio * 100) / 100,
      crossingTime: Math.round(crossingTime * 10) / 10,
      signalTime: signalSeconds,
      label: "주의",
      description: `여유가 적습니다 (횡단 ${crossingTime.toFixed(1)}초 / 신호 ${signalSeconds}초)`,
    };
  }

  return {
    level: "safe",
    ratio: Math.round(ratio * 100) / 100,
    crossingTime: Math.round(crossingTime * 10) / 10,
    signalTime: signalSeconds,
    label: "안전",
    description: `안전하게 건널 수 있습니다 (횡단 ${crossingTime.toFixed(1)}초 / 신호 ${signalSeconds}초)`,
  };
}

export function getRiskEmoji(level: RiskLevel): string {
  switch (level) {
    case "danger":
      return "\uD83D\uDD34";
    case "caution":
      return "\uD83D\uDFE1";
    case "safe":
      return "\uD83D\uDFE2";
    case "unknown":
      return "\u2753";
  }
}

export function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case "danger":
      return "border-red-500 bg-red-50";
    case "caution":
      return "border-yellow-500 bg-yellow-50";
    case "safe":
      return "border-green-500 bg-green-50";
    case "unknown":
      return "border-gray-300 bg-gray-50";
  }
}
