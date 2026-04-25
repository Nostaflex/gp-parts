type BridgeProps = {
  fromColor: string;
  toColor: string;
  accentColor?: string;
};

export function CpBridge({ fromColor, toColor, accentColor = '#E87200' }: BridgeProps) {
  const id = `bridge-${fromColor.replace('#', '')}-${toColor.replace('#', '')}`;
  const gradId = `grad-${id}`;
  const orbId = `orb-${id}`;

  return (
    <div
      aria-hidden="true"
      style={{
        height: '180px',
        marginTop: '-90px',
        marginBottom: '-90px',
        position: 'relative',
        zIndex: 10,
        overflow: 'visible',
      }}
    >
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

        {/* Background gradient rect */}
        <rect width="1440" height="180" fill={`url(#${gradId})`} />

        {/* Wave paths */}
        <path
          d="M0,60 C240,120 480,20 720,80 C960,140 1200,40 1440,90 L1440,180 L0,180 Z"
          fill={toColor}
          opacity="0.5"
        />
        <path
          d="M0,90 C360,40 720,160 1080,60 C1260,20 1380,100 1440,80 L1440,180 L0,180 Z"
          fill={toColor}
          opacity="0.8"
        />

        {/* Orb */}
        <ellipse cx="720" cy="90" rx="320" ry="80" fill={`url(#${orbId})`}>
          <animate attributeName="rx" values="280;360;280" dur="6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;1;0.6" dur="6s" repeatCount="indefinite" />
        </ellipse>
      </svg>
    </div>
  );
}
