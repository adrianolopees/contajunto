interface DonutSlice {
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSlice[];
  size?: number;
  centerLabel?: string;
  centerValue?: string;
}

export default function DonutChart({
  data,
  size = 220,
  centerLabel,
  centerValue,
}: DonutChartProps) {
  const total = data.reduce((sum, slice) => sum + slice.value, 0);

  let cumulative = 0;
  const stops = data.map((slice) => {
    const start = total > 0 ? (cumulative / total) * 360 : 0;
    cumulative += slice.value;
    const end = total > 0 ? (cumulative / total) * 360 : 0;
    return `${slice.color} ${start}deg ${end}deg`;
  });

  const background =
    total > 0 ? `conic-gradient(${stops.join(", ")})` : undefined;

  return (
    <div className="flex justify-center py-2">
      <div
        className="relative shrink-0 rounded-full bg-muted"
        style={{ width: size, height: size, background }}
      >
        <div
          className="absolute flex flex-col items-center justify-center rounded-full bg-card text-center"
          style={{
            inset: size * 0.24,
          }}
        >
          {centerLabel && (
            <span className="text-xs text-muted-foreground">
              {centerLabel}
            </span>
          )}
          {centerValue && (
            <span className="text-lg font-bold">{centerValue}</span>
          )}
        </div>
      </div>
    </div>
  );
}
