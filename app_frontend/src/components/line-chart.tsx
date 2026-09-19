import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Text } from 'react-native-paper';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

import { colors, fonts } from '@/theme/colors';

type LineChartProps = {
  data: number[];
  height?: number;
  /** Rótulos do eixo X, um por ponto. */
  labels?: string[];
  /** Texto secundário abaixo de cada rótulo (ex.: valor do ponto). `undefined` omite. */
  sublabels?: (string | undefined)[];
  /** Curva suave (padrão) ou segmentos retos entre os pontos. */
  curve?: 'smooth' | 'linear';
  /** Índice do ponto em destaque (marcador maior + linha vertical tracejada). */
  highlightIndex?: number;
  /** Linha vertical tracejada abaixo do ponto em destaque. */
  highlightLine?: boolean;
  /** Índices que recebem um marcador pequeno. */
  markers?: number[];
  /** Cor da linha e dos marcadores. */
  color?: string;
};

type Point = { x: number; y: number };

const PADDING_Y = 8;
const MARKER_RADIUS = 3.5;
const HIGHLIGHT_RADIUS = 5;

let nextChartId = 0;

function linearPath(points: Point[]) {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
}

// Catmull-Rom → Bézier cúbica, para uma curva suave passando por todos os pontos.
function smoothPath(points: Point[]) {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export function LineChart({
  data,
  height = 140,
  labels,
  sublabels,
  curve = 'smooth',
  highlightIndex,
  highlightLine = true,
  markers = [],
  color = colors.text,
}: LineChartProps) {
  const [width, setWidth] = useState(0);
  // id único por instância — vários gráficos na mesma tela não podem compartilhar o gradiente (web)
  const [gradientId] = useState(() => `area-${nextChartId++}`);

  function handleLayout(e: LayoutChangeEvent) {
    setWidth(e.nativeEvent.layout.width);
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = data.length > 1 ? width / (data.length - 1) : 0;

  const points: Point[] = data.map((value, i) => ({
    x: i * stepX,
    y: PADDING_Y + (1 - (value - min) / range) * (height - PADDING_Y * 2),
  }));

  const linePath = curve === 'smooth' ? smoothPath(points) : linearPath(points);
  const areaPath =
    points.length > 1
      ? `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`
      : '';
  const highlight = highlightIndex != null ? points[highlightIndex] : undefined;

  return (
    <View>
      <View style={{ height }} onLayout={handleLayout}>
        {width > 0 && (
          <Svg width={width} height={height}>
            <Defs>
              <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={color} stopOpacity={0.18} />
                <Stop offset="1" stopColor={color} stopOpacity={0} />
              </LinearGradient>
            </Defs>

            <Path d={areaPath} fill={`url(#${gradientId})`} />

            {highlight && highlightLine && (
              <Line
                x1={highlight.x}
                y1={highlight.y}
                x2={highlight.x}
                y2={height}
                stroke={colors.muted}
                strokeWidth={1}
                strokeDasharray="3 4"
              />
            )}

            <Path
              d={linePath}
              fill="none"
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {markers.map((i) => {
              const p = points[i];
              if (!p || i === highlightIndex) return null;
              return <Circle key={i} cx={p.x} cy={p.y} r={MARKER_RADIUS} fill={colors.muted} />;
            })}

            {highlight && (
              <>
                <Circle cx={highlight.x} cy={highlight.y} r={HIGHLIGHT_RADIUS + 3} fill={colors.card} />
                <Circle
                  cx={highlight.x}
                  cy={highlight.y}
                  r={HIGHLIGHT_RADIUS}
                  fill={colors.card}
                  stroke={color}
                  strokeWidth={2}
                />
              </>
            )}
          </Svg>
        )}
      </View>

      {labels && (
        <View style={styles.labels}>
          {labels.map((label, i) => {
            const isHighlight = i === highlightIndex;
            const isFuture = highlightIndex != null && i > highlightIndex;
            const sublabel = sublabels?.[i];
            return (
              <View key={label} style={styles.labelColumn}>
                <Text
                  style={[
                    styles.label,
                    isHighlight && styles.labelHighlight,
                    isFuture && styles.labelFuture,
                  ]}
                >
                  {label}
                </Text>
                {sublabel && (
                  <Text style={[styles.sublabel, isHighlight && styles.sublabelHighlight]}>
                    {sublabel}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  labelColumn: {
    alignItems: 'center',
    gap: 2,
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  labelHighlight: {
    color: colors.text,
    fontWeight: '700',
  },
  labelFuture: {
    color: colors.placeholder,
  },
  sublabel: {
    color: colors.muted,
    fontSize: 11,
    fontFamily: fonts.mono,
  },
  sublabelHighlight: {
    color: colors.text,
    fontWeight: '700',
  },
});
