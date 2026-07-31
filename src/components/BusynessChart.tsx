import React from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import type { PopularTimesHour } from '../types';

interface BusynessChartProps {
  popularTimes: PopularTimesHour[] | null;
  currentHour: number;
}

export const getBarColor = (hour: number, currentHour: number, busy: number): string => {
  if (hour < currentHour) return '#d4d4d4'; // past: neutral-300
  if (hour === currentHour) return '#aa151b'; // current: brand red
  if (busy >= 75) return '#aa151b';
  if (busy >= 50) return '#f97316';
  if (busy >= 25) return '#eab308';
  return '#10b981';
};

export const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const hour = payload[0].payload.hour;
    const busy = payload[0].value;
    return (
      <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md px-3 py-1.5 shadow-lg">
        <p className="text-xs font-bold text-neutral-900 dark:text-white">
          {`${String(hour).padStart(2, '0')}:00 — ${busy}%`}
        </p>
      </div>
    );
  }
  return null;
};

export const BusynessChart: React.FC<BusynessChartProps> = ({ popularTimes, currentHour }) => {
  if (!popularTimes || popularTimes.length === 0) return null;

  const filteredData = popularTimes
    .filter((h) => h.hour >= 10 && h.hour <= 22)
    .map((h) => ({
      ...h,
      label: `${String(h.hour).padStart(2, '0')}:00`,
    }));

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-black text-neutral-800 dark:text-neutral-200 uppercase tracking-tight">
          今日人流
        </span>
        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
          資料來源：Google
        </span>
      </div>

      <div className="w-full h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filteredData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#a3a3a3', fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
              interval={2}
            />
            <YAxis
              domain={[0, 100]}
              tick={false}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Bar dataKey="busy" radius={[2, 2, 0, 0]} maxBarSize={20}>
              {filteredData.map((entry) => (
                <Cell
                  key={entry.hour}
                  fill={getBarColor(entry.hour, currentHour, entry.busy)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-[#aa151b]" />
          <span className="text-[10px] font-bold text-neutral-500">目前時段</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-neutral-300 dark:bg-neutral-600" />
          <span className="text-[10px] font-bold text-neutral-500">已過時段</span>
        </div>
      </div>
    </div>
  );
};
