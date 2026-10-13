export function ProgressBar({
  label,
  value,
  valueLabel,
}: {
  label: string;
  value: number; // 0–100
  valueLabel?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="progress-label">
        <span>{label}</span>
        <span>{valueLabel ?? `${clamped}%`}</span>
      </div>
      <div
        className="bar"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <i style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}
