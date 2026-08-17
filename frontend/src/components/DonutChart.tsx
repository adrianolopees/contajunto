interface DonutSlice {
  label: string;
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
  size = 128,
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
    <div className="flex items-center gap-4">
      <div
        className="relative shrink-0 rounded-full bg-muted"
        style={{ width: size, height: size, background }}
      >
        <div
          className="absolute flex flex-col items-center justify-center rounded-full bg-card text-center"
          style={{
            inset: size * 0.22,
          }}
        >
          {centerLabel && (
            <span className="text-[10px] text-muted-foreground">
              {centerLabel}
            </span>
          )}
          {centerValue && (
            <span className="text-xs font-bold">{centerValue}</span>
          )}
        </div>
      </div>
      <ul className="flex-1 space-y-1.5">
        {data.map((slice) => (
          <li key={slice.label} className="flex items-center gap-2 text-sm">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: slice.color }}
            />
            <span className="flex-1 truncate text-muted-foreground">
              {slice.label}
            </span>
            <span className="font-medium tabular-nums">
              {total > 0 ? Math.round((slice.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
