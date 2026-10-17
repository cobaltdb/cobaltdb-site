export function Logo({
  markOnly = false,
  className = "",
}: {
  markOnly?: boolean;
  className?: string;
}) {
  return (
    <span className={`logo ${className}`}>
      <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <g
          stroke="currentColor"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M35 11.5c-3-2.2-8.1-3.5-14-3.5C11.6 8 4 11.4 4 15.5S11.6 23 21 23s17-3.4 17-7.5c0-1.5-1.1-2.9-3-4Z" />
          <path d="M4 15.5v30C4 50.2 11.6 54 21 54c2.3 0 4.4-.2 6.4-.6M4 30c0 3.5 4.9 6.4 11.7 7.3M4 43c0 3.1 3.9 5.8 9.6 7" />
          <path d="m45 15 4 4-2.1 5.2 3.4 4 5.5-1 2.3 6-4.8 3 .2 5.1 4.8 3-2.5 5.9-5.5-1.1-3.6 3.6 1 5.4-6 2.5-2.9-4.8-5.2-.2-3.2 4.6-5.8-2.7 1.2-5.2" />
          <path d="M40 24c-8 3-11.6 9-9.8 16.5 1 4.2-.1 8.1-3.2 11.5M42 31c-4 2-5 5-3.8 8.7.9 2.8-.1 5.2-2.2 7.3" />
        </g>
      </svg>
      {!markOnly && (
        <span>
          Cobalt<span className="logo-db">DB</span>
        </span>
      )}
    </span>
  );
}
