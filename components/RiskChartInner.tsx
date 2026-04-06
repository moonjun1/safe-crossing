"use client";

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { PieData, SpeedComparisonData } from "./RiskChart";

interface RiskChartInnerProps {
  pieData: PieData[];
  barData: SpeedComparisonData[];
  currentSpeed: number;
  total: number;
}

export default function RiskChartInner({
  pieData,
  barData,
  currentSpeed,
  total,
}: RiskChartInnerProps) {
  return (
    <div className="space-y-6">
      {/* 도넛 차트: 현재 속도 위험도 비율 */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-3">
          현재 속도 ({currentSpeed.toFixed(1)}m/s) 위험도 분포
        </h4>
        <div className="flex items-center justify-center">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
                dataKey="value"
                label={({ name, value }) =>
                  `${name} ${value}개 (${Math.round((value / total) * 100)}%)`
                }
                labelLine={true}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: unknown, name: unknown) => [
                  `${value}개 (${Math.round((Number(value) / total) * 100)}%)`,
                  String(name),
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 바 차트: 속도별 위험도 비교 */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-3">
          보행속도별 위험도 변화
        </h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="speed" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip />
            <Legend />
            <Bar dataKey="danger" name="위험" fill="#ef4444" stackId="a" />
            <Bar dataKey="caution" name="주의" fill="#eab308" stackId="a" />
            <Bar dataKey="safe" name="안전" fill="#22c55e" stackId="a" />
            <Bar dataKey="unknown" name="분석불가" fill="#9ca3af" stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
