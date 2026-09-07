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

// geometria em unidades do viewBox 0-100 (independe do tamanho renderizado)
const RADIUS = 40;
const STROKE_WIDTH = 10;
const RING_INSET = "20%";
// respiro entre fatias, em % da circunferência — bem largo de propósito,
// pra cada categoria ler como um pedaço separado, não como um anel contínuo
const GAP_PERCENT = 6;

interface Segment {
  color: string;
  length: number;
  offset: number;
}

function buildSegments(data: DonutSlice[]): Segment[] {
  const total = data.reduce((sum, slice) => sum + slice.value, 0);
  const n = data.length;
  if (total <= 0 || n === 0) return [];

  // se nem os gaps sozinhos cabem (categorias demais), encolhe eles também —
  // melhor um respiro mais fino do que ultrapassar os 100% do círculo
  const gap = Math.min(GAP_PERCENT, 100 / n);

  // comprimento que cada fatia teria se não precisasse de gap; abaixo disso
  // ela vira "ponto" (comprimento 0, só a ponta arredondada aparece)
  const idealLengths = data.map((slice) =>
    Math.max((slice.value / total) * 100 - gap, 0),
  );
  const idealTotal = idealLengths.reduce((sum, len) => sum + len, 0);
  const availableForLengths = 100 - n * gap;
  // se a soma das fatias "reais" estoura o que sobra depois dos gaps,
  // encolhe todas proporcionalmente — os pontos (já em 0) não encolhem mais,
  // garantindo matematicamente que tudo cabe nos 100%, sem sobreposição nem
  // na costura entre a última fatia e a primeira
  const scale = idealTotal > 0 ? Math.min(1, availableForLengths / idealTotal) : 1;

  let cursor = gap / 2;
  return data.map((slice, i) => {
    const length = idealLengths[i] * scale;
    const segStart = cursor;
    cursor = segStart + length + gap;
    return { color: slice.color, length, offset: -segStart };
  });
}

export default function DonutChart({
  data,
  size = 280,
  centerLabel,
  centerValue,
}: DonutChartProps) {
  const segments = buildSegments(data);

  return (
    <div className="py-2">
      <div
        className="relative mx-auto aspect-square w-full"
        style={{ maxWidth: size }}
      >
        <svg viewBox="0 0 100 100" className="size-full -rotate-90">
          {segments.map((seg, i) => (
            <circle
              key={i}
              cx="50"
              cy="50"
              r={RADIUS}
              fill="none"
              stroke={seg.color}
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray={`${seg.length} ${100 - seg.length}`}
              strokeDashoffset={seg.offset}
            />
          ))}
        </svg>
        <div
          className="absolute flex flex-col items-center justify-center rounded-full bg-card text-center"
          style={{ inset: RING_INSET }}
        >
          {centerLabel && (
            <span className="text-xs text-muted-foreground">{centerLabel}</span>
          )}
          {centerValue && (
            <span className="text-xl font-bold">{centerValue}</span>
          )}
        </div>
      </div>
    </div>
  );
}
