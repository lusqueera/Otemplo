import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { colors } from '@/theme/colors';

const COLUMNS = 10;
// Escala sequencial: um só tom, do escuro (menor) ao branco (maior)
const LEVELS = ['#2A2A2A', '#5A5A5A', '#9A9A9A', '#FFFFFF'];

type DensityCardProps = {
  /** Intensidade 0–3 por dia (mais antigo primeiro), vinda de /habits/stats. */
  density: number[];
};

export function DensityCard({ density }: DensityCardProps) {
  const rows = Array.from({ length: Math.ceil(density.length / COLUMNS) }, (_, r) =>
    density.slice(r * COLUMNS, (r + 1) * COLUMNS),
  );

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Matriz de Densidade Mensal</Text>
          <Text style={styles.subtitle}>Volume de rituais nos últimos 30 dias</Text>
        </View>
        <View style={styles.legend}>
          <Text style={styles.legendLabel}>Menor</Text>
          {LEVELS.map((tone) => (
            <View key={tone} style={[styles.legendSwatch, { backgroundColor: tone }]} />
          ))}
          <Text style={[styles.legendLabel, styles.legendLabelStrong]}>Maior</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {rows.map((row, r) => (
          <View key={r} style={styles.row}>
            {row.map((level, c) => (
              <View
                key={c}
                style={[
                  styles.cell,
                  { backgroundColor: LEVELS[level] },
                  level === LEVELS.length - 1 && styles.cellGlow,
                ]}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    gap: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  legendLabel: {
    color: colors.muted,
    fontSize: 11,
    marginHorizontal: 3,
  },
  legendLabelStrong: {
    color: colors.text,
    fontWeight: '600',
  },
  legendSwatch: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  grid: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 5,
  },
  cellGlow: {
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
});
