import { WORDMARK_PATHS, WORDMARK_VIEWBOX } from './paths';

/** ODIN•FUN wordmark from odin.fun. Inherits colour from `currentColor`. */
export function OdinWordmark({ className }: { className?: string }) {
  const { width, height } = WORDMARK_VIEWBOX;
  return (
    <svg
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      fill="currentColor"
      role="img"
      aria-label="ODIN•FUN"
      xmlns="http://www.w3.org/2000/svg"
    >
      {WORDMARK_PATHS.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
