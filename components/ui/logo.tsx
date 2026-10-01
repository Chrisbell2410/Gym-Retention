/**
 * Studio Spark brand mark. `SparkMark` is the icon alone (used for the
 * favicon/app icon and anywhere space is tight); `Logo` pairs it with the
 * wordmark in the display font (Space Grotesk).
 *
 * The bolt uses a gradient id scoped to each render (via `gradientId`) so
 * multiple instances on one page don't collide.
 */

function SparkMark({
  size = 28,
  gradientId = "spark-gradient",
}: {
  size?: number;
  gradientId?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="4" y1="2" x2="24" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FF9D7D" />
          <stop offset="0.55" stopColor="#F8562E" />
          <stop offset="1" stopColor="#B52F13" />
        </linearGradient>
      </defs>
      <path
        d="M15.5 1.5 5 15.8h6.3l-1.8 10.7L23 12.2h-6.4l-1.1-10.7Z"
        fill={`url(#${gradientId})`}
      />
    </svg>
  );
}

export function Logo({
  variant = "light",
  size = 28,
  showWordmark = true,
  className = "",
}: {
  /** "light" = dark wordmark text, for use on white/light backgrounds.
   *  "dark" = light wordmark text, for use on the ink-900 sidebar. */
  variant?: "light" | "dark";
  size?: number;
  showWordmark?: boolean;
  className?: string;
}) {
  const textColor = variant === "dark" ? "text-white" : "text-ink-900";

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <SparkMark size={size} gradientId={`spark-gradient-${variant}`} />
      {showWordmark && (
        <span
          className={`font-display text-lg font-bold tracking-tight ${textColor}`}
        >
          Studio Spark
        </span>
      )}
    </span>
  );
}

export { SparkMark };
