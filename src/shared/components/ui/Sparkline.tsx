interface Props {
  values: number[];
  width?: number;
  height?: number;
  /** Tailwind stroke colour class — applied via `text-`. */
  color?: string;
  fill?: boolean;
}

/**
 * Tiny inline sparkline. SVG-only, no charting deps.
 */
export default function Sparkline({
  values,
  width = 100,
  height = 30,
  color = "text-indigo-500",
  fill = true,
}: Props) {
  if (!values.length) {
    return <svg width={width} height={height} />;
  }

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  const step = width / Math.max(1, values.length - 1);
  const points = values
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const fillPath = fill
    ? `M0,${height} L${points
        .split(" ")
        .map((p) => p)
        .join(" L")} L${width},${height} Z`
    : "";

  return (
    <svg width={width} height={height} className={color} role="img">
      {fill && (
        <path d={fillPath} fill="currentColor" opacity="0.12" />
      )}
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
