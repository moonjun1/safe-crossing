"use client";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface SpeedSliderProps {
  speed: number;
  onSpeedChange: (speed: number) => void;
}

const PRESETS = [
  { label: "일반인", value: 1.2, emoji: "\uD83D\uDEB6" },
  { label: "고령자", value: 0.8, emoji: "\uD83E\uDDD3" },
  { label: "휠체어", value: 0.6, emoji: "\u267F" },
];

export default function SpeedSlider({ speed, onSpeedChange }: SpeedSliderProps) {
  const isPreset = PRESETS.some((p) => p.value === speed);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">보행 속도 설정</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 프리셋 버튼 */}
        <div className="flex flex-wrap gap-2" role="group" aria-label="보행 속도 프리셋">
          {PRESETS.map((preset) => (
            <Button
              key={preset.value}
              variant={speed === preset.value ? "default" : "outline"}
              size="sm"
              onClick={() => onSpeedChange(preset.value)}
              aria-pressed={speed === preset.value}
              aria-label={`${preset.label} 속도 ${preset.value} m/s 로 설정`}
            >
              {preset.emoji} {preset.label} ({preset.value} m/s)
            </Button>
          ))}
          <Button
            variant={!isPreset ? "default" : "outline"}
            size="sm"
            onClick={() => {
              if (isPreset) onSpeedChange(1.0);
            }}
            aria-pressed={!isPreset}
          >
            직접 입력
          </Button>
        </div>

        {/* 슬라이더 */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground whitespace-nowrap" aria-hidden="true">0.4</span>
          <Slider
            min={0.4}
            max={1.5}
            step={0.1}
            value={[speed]}
            onValueChange={(val) => onSpeedChange(Array.isArray(val) ? val[0] : val)}
            aria-label="보행 속도 조절"
            aria-valuemin={0.4}
            aria-valuemax={1.5}
            aria-valuenow={speed}
            aria-valuetext={`보행 속도 ${speed.toFixed(1)} m/s`}
          />
          <span className="text-sm text-muted-foreground whitespace-nowrap" aria-hidden="true">1.5</span>
        </div>

        <p
          className="text-center text-lg font-bold text-primary"
          aria-live="polite"
          aria-atomic="true"
        >
          {speed.toFixed(1)} m/s
        </p>
      </CardContent>
    </Card>
  );
}
