import { useMemo } from 'react';
import { Typography } from 'antd';
import { motion } from 'framer-motion';
import '../styles/job-match-cosmos.css';

const { Text, Paragraph } = Typography;

function stripMarkdownBold(s) {
  return String(s || '').replace(/\*\*/g, '');
}

function fallbackEngineFromLegacy(jobMatch) {
  const score = typeof jobMatch.score === 'number' ? jobMatch.score : 0;
  const base = Math.max(22, Math.min(100, score));
  const dims = {
    technicalFit: base,
    experienceFit: Math.round(base * 0.92),
    roleCoherence: Math.round(base * 0.88),
    evidenceDepth: Math.round(base * 0.85),
    adaptability: Math.round(base * 0.8),
    linguisticResonance: Math.round(base * 0.9),
    velocityIndex: Math.round(base * 0.83),
  };
  const radarAxes = [
    { key: 'technicalFit', label: 'Adéquation technique', value: dims.technicalFit },
    { key: 'experienceFit', label: 'Expérience', value: dims.experienceFit },
    { key: 'roleCoherence', label: 'Cohérence de rôle', value: dims.roleCoherence },
    { key: 'evidenceDepth', label: 'Profondeur des preuves', value: dims.evidenceDepth },
    { key: 'adaptability', label: 'Polyvalence', value: dims.adaptability },
    { key: 'linguisticResonance', label: 'Résonance lexicale', value: dims.linguisticResonance },
  ];
  const tier =
    score >= 90
      ? { id: 'COSMIC', label: 'Alignement cosmique', hue: 286 }
      : score >= 78
        ? { id: 'ORBIT', label: 'Orbite verrouillée', hue: 258 }
        : score >= 65
          ? { id: 'RESONANT', label: 'Résonance nette', hue: 220 }
          : score >= 50
            ? { id: 'EMERGING', label: 'Signal émergent', hue: 200 }
            : score >= 35
              ? { id: 'NEBULA', label: 'Dérive nébuleuse', hue: 28 }
              : { id: 'DEEP', label: 'Espace profond', hue: 12 };
  return {
    version: 1,
    headline: jobMatch.summary?.slice(0, 140) || 'Carte de compatibilité générée à partir du score global.',
    tier,
    dimensions: dims,
    radarAxes,
    constellation: [
      ...(jobMatch.matchedSkills || []).slice(0, 5).map((label, i) => ({
        id: `f-${i}`,
        label,
        type: 'match',
        intensity: 0.8,
        angle: (i / 6) * Math.PI * 2,
        ring: 1,
      })),
    ],
    creativeInsights: jobMatch.summary
      ? [stripMarkdownBold(jobMatch.summary)]
      : [],
    signature: {
      gradient: `linear-gradient(135deg, hsl(${tier.hue}, 70%, 38%) 0%, hsl(${(tier.hue + 38) % 360}, 55%, 18%) 100%)`,
      glow: `hsla(${tier.hue}, 80%, 55%, 0.4)`,
    },
  };
}

const DEFAULT_RADAR = [
  { key: 'a', label: '—', value: 40 },
  { key: 'b', label: '—', value: 40 },
  { key: 'c', label: '—', value: 40 },
  { key: 'd', label: '—', value: 40 },
  { key: 'e', label: '—', value: 40 },
  { key: 'f', label: '—', value: 40 },
];

function RadarPolygon({ axes, cx = 100, cy = 100, R = 72 }) {
  const safeAxes = useMemo(
    () => (axes && axes.length >= 3 ? axes : DEFAULT_RADAR),
    [axes]
  );
  const n = safeAxes.length;
  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i < n; i += 1) {
      const t = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      const v = Math.max(0, Math.min(100, Number(safeAxes[i]?.value) || 0));
      const r = (v / 100) * R;
      pts.push(`${cx + r * Math.cos(t)},${cy + r * Math.sin(t)}`);
    }
    return pts.join(' ');
  }, [safeAxes, cx, cy, R, n]);

  const ringPoints = useMemo(() => {
    const rings = [0.35, 0.55, 0.75, 1];
    return rings.map((k) => {
      const pts = [];
      for (let i = 0; i < n; i += 1) {
        const t = -Math.PI / 2 + (i * 2 * Math.PI) / n;
        const r = R * k;
        pts.push(`${cx + r * Math.cos(t)},${cy + r * Math.sin(t)}`);
      }
      return pts.join(' ');
    });
  }, [cx, cy, R, n]);

  const labels = useMemo(() => {
    return safeAxes.map((a, i) => {
      const t = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      const lr = R + 18;
      return {
        x: cx + lr * Math.cos(t),
        y: cy + lr * Math.sin(t),
        text: a.label,
      };
    });
  }, [safeAxes, cx, cy, R, n]);

  return (
    <svg className="jmc-radar" viewBox="0 0 200 200" aria-hidden>
      <defs>
        <linearGradient id="jmcRadarFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(167, 139, 250, 0.55)" />
          <stop offset="100%" stopColor="rgba(56, 189, 248, 0.35)" />
        </linearGradient>
      </defs>
      {ringPoints.map((p, idx) => (
        <polygon
          key={idx}
          points={p}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
        />
      ))}
      {safeAxes.map((_, i) => {
        const t = -Math.PI / 2 + (i * 2 * Math.PI) / n;
        const x2 = cx + R * Math.cos(t);
        const y2 = cy + R * Math.sin(t);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x2}
            y2={y2}
            stroke="rgba(255,255,255,0.14)"
            strokeWidth="1"
          />
        );
      })}
      <motion.polygon
        points={points}
        fill="url(#jmcRadarFill)"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="1.5"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />
      {labels.map((l, i) => (
        <text
          key={i}
          x={l.x}
          y={l.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="rgba(248,250,252,0.72)"
          fontSize="8.5"
          fontWeight="600"
        >
          {l.text.split(' ').slice(0, 2).join(' ')}
        </text>
      ))}
    </svg>
  );
}

/**
 * @param {object} props
 * @param {object} props.jobMatch — jobMatchAnalysis depuis l’API
 * @param {'full' | 'compact'} props.variant
 */
export default function AdvancedJobMatchCanvas({ jobMatch = {}, variant = 'full' }) {
  const engine = jobMatch.matchEngine || fallbackEngineFromLegacy(jobMatch);
  const score = typeof jobMatch.score === 'number' ? jobMatch.score : null;
  const styleVars = {
    '--jmc-gradient': engine.signature?.gradient,
    '--jmc-glow': engine.signature?.glow,
  };

  if (variant === 'compact') {
    return (
      <div className="jmc-compact" style={styleVars}>
        <span className="jmc-compact-score">{score != null ? `${Math.round(score)}%` : '—'}</span>
        <span className="jmc-compact-tier">{engine.tier?.label || 'Match'}</span>
        <Text style={{ flex: 1, minWidth: 140, color: 'rgba(248,250,252,0.85)', fontSize: 12 }} ellipsis>
          {stripMarkdownBold(engine.headline)}
        </Text>
      </div>
    );
  }

  return (
    <motion.div
      className="jmc-root"
      style={styleVars}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="jmc-bg" />
      <div className="jmc-aurora" />
      <div className="jmc-stars" />
      <div className="jmc-inner">
        <div>
          <div className="jmc-tier">{engine.tier?.label || 'Analyse'}</div>
          <Paragraph className="jmc-headline" style={{ margin: '12px 0 0', color: '#fff' }}>
            {stripMarkdownBold(engine.headline)}
          </Paragraph>
          <Text type="secondary" style={{ display: 'block', marginTop: 8, color: 'rgba(248,250,252,0.65)', fontSize: 12 }}>
            Moteur {engine.meta?.engine || 'recruit-ai-match'} · v{engine.version || 1}
          </Text>
        </div>
        <div>
          <div className="jmc-score-ring">
            <div className="jmc-score-num">{score != null ? Math.round(score) : '—'}</div>
            <Text style={{ fontSize: 11, color: 'rgba(248,250,252,0.65)' }}>Score global</Text>
          </div>
          <div className="jmc-radar-wrap">
            <RadarPolygon axes={Array.isArray(engine.radarAxes) ? engine.radarAxes : []} />
          </div>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <Text style={{ color: 'rgba(248,250,252,0.75)', fontSize: 12, fontWeight: 600 }}>Constellation compétences</Text>
          <div className="jmc-orbit">
            {(engine.constellation || []).map((node, idx) => (
              <span
                key={node.id || idx}
                className={`jmc-node jmc-node--${node.type === 'gap' ? 'gap' : node.type === 'spark' ? 'spark' : 'match'}`}
                style={{ opacity: 0.75 + (node.intensity || 0.5) * 0.25 }}
              >
                {node.label}
              </span>
            ))}
          </div>
        </div>
        {(engine.creativeInsights || []).length > 0 && (
          <div style={{ gridColumn: '1 / -1' }}>
            <Text style={{ color: 'rgba(248,250,252,0.75)', fontSize: 12, fontWeight: 600 }}>Insights créatifs</Text>
            <ul className="jmc-insights">
              {engine.creativeInsights.map((line, i) => (
                <li key={i}>{stripMarkdownBold(line)}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  );
}
