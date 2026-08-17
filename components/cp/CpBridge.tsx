type BridgeProps = {
  fromColor: string;
  toColor: string;
  accentColor?: string;
};

/**
 * Transition entre deux sections : bande dédiée de 128 px — dégradé, double
 * vague douce, orbe qui respire. JAMAIS de chevauchement des sections
 * voisines (retour Djemil 2026-08-17 : les marges négatives coupaient les
 * mascottes posées en bord de section).
 */
export function CpBridge({ fromColor, toColor, accentColor = '#E87200' }: BridgeProps) {
  const id = `bridge-${fromColor.replace('#', '')}-${toColor.replace('#', '')}`;
  const gradId = `grad-${id}`;
  const orbId = `orb-${id}`;

  return (
    <div aria-hidden="true" style={{ height: '128px', overflow: 'hidden' }}>
      <svg
        viewBox="0 0 1440 180"
        preserveAspectRatio="none"
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fromColor} />
            <stop offset="100%" stopColor={toColor} />
          </linearGradient>
          <radialGradient id={orbId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.18" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Fond : dégradé de la section précédente vers la suivante */}
        <rect width="1440" height="180" fill={`url(#${gradId})`} />

        {/* Double vague douce — amplitudes contenues, longues ondulations */}
        <path
          d="M0,84 C360,116 720,56 1080,92 C1260,108 1360,92 1440,100 L1440,180 L0,180 Z"
          fill={toColor}
          opacity="0.45"
        />
        <path
          d="M0,124 C320,96 640,150 960,118 C1160,98 1320,132 1440,116 L1440,180 L0,180 Z"
          fill={toColor}
          opacity="0.85"
        />

        {/* Orbe qui respire */}
        <ellipse cx="720" cy="92" rx="320" ry="70" fill={`url(#${orbId})`}>
          <animate attributeName="rx" values="280;360;280" dur="6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;1;0.6" dur="6s" repeatCount="indefinite" />
        </ellipse>
      </svg>
    </div>
  );
}
