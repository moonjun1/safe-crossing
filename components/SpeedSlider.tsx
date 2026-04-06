"use client";

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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">
        보행 속도 설정
      </h2>

      {/* 프리셋 버튼 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {PRESETS.map((preset) => (
          <button
            key={preset.value}
            onClick={() => onSpeedChange(preset.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              speed === preset.value
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {preset.emoji} {preset.label} ({preset.value} m/s)
          </button>
        ))}
        <button
          onClick={() => {
            if (isPreset) onSpeedChange(1.0);
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            !isPreset
              ? "bg-blue-600 text-white shadow-md"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          직접 입력
        </button>
      </div>

      {/* 슬라이더 */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500 whitespace-nowrap">0.4</span>
        <input
          type="range"
          min="0.4"
          max="1.5"
          step="0.1"
          value={speed}
          onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
        <span className="text-sm text-gray-500 whitespace-nowrap">1.5</span>
      </div>

      <p className="text-center mt-2 text-lg font-bold text-blue-700">
        {speed.toFixed(1)} m/s
      </p>
    </div>
  );
}
