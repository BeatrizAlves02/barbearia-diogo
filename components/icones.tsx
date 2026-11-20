type P = { className?: string };
const base = {
  fill: "none", stroke: "currentColor", strokeWidth: 1.6,
  strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const IconeSeta = ({ className = "size-5" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base} strokeWidth={2}>
    <path d="M5 12h14" /><path d="M13 6l6 6-6 6" />
  </svg>
);
export const IconeVisto = ({ className = "size-4" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base} strokeWidth={3}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);
export const IconeExterno = ({ className = "size-4" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base} strokeWidth={1.8}>
    <path d="M7 17L17 7" /><path d="M8 7h9v9" />
  </svg>
);
export const IconeVoltar = ({ className = "size-5" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base} strokeWidth={1.8}>
    <path d="M15 6l-6 6 6 6" />
  </svg>
);
export const IconeCasa = ({ className = "size-5.5" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" />
  </svg>
);
export const IconeCalendario = ({ className = "size-5.5" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
);
export const IconeUtilizador = ({ className = "size-5" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
  </svg>
);
