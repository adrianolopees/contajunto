export default function Logo({ size }: { size: number }) {
  const barHeight = Math.round(size * 0.35);
  const radius = barHeight / 2;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-primary"
        style={{ width: size, height: barHeight, borderRadius: radius }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-income"
        style={{ width: size, height: barHeight, borderRadius: radius }}
      />
    </div>
  );
}
