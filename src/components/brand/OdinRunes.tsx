import { RUNES_PATHS, RUNES_VIEWBOX } from './paths';

/** Decorative rune strip shown under the wordmark on odin.fun. Inherits colour from `currentColor`. */
export function OdinRunes({ className }: { className?: string }) {
  const { width, height } = RUNES_VIEWBOX;
  return (
    <svg
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      fill="currentColor"
      role="img"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      {RUNES_PATHS.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
