import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';

import { Card } from '@/components/card';
import { formatBRL } from '@/lib/format';
import { colors } from '@/theme/colors';
import type { AssetClass } from '../data';

type AllocationCardProps = {
  allocation: AssetClass[];
  onManage: () => void;
};

export function AllocationCard({ allocation, onManage }: AllocationCardProps) {
  const total = allocation.reduce((acc, a) => acc + a.amount, 0);

  return (
    <Card
      overline="Estratégia de capital"
      title="Alocação de Ativos"
      action={
        <Pressable style={styles.manage} onPress={onManage} accessibilityRole="button">
          <Text style={styles.count}>{allocation.length} Classes</Text>
          <Feather name="edit-2" size={12} color={colors.muted} />
        </Pressable>
      }
    >
      {allocation.length === 0 ? (
        <Pressable onPress={onManage}>
          <Text style={styles.empty}>Nenhuma classe cadastrada. Toque para adicionar.</Text>
        </Pressable>
      ) : (
        <>
          {/* Barra empilhada: um segmento por classe, separados por 2px de superfície */}
          <View style={styles.bar}>
            {allocation.map((asset) => (
              <View
                key={asset.id}
                style={[styles.segment, { flex: Math.max(asset.amount, 1), backgroundColor: asset.tone }]}
              />
            ))}
          </View>

          <View style={styles.legend}>
            {allocation.map((asset) => {
              const share = total ? Math.round((asset.amount / total) * 100) : 0;
              return (
                <Pressable key={asset.id} style={styles.legendItem} onPress={onManage}>
                  <View style={[styles.dot, { backgroundColor: asset.tone }]} />
                  <View style={styles.legendText}>
                    <Text style={styles.legendName}>{asset.name}</Text>
                    <Text style={styles.legendValue}>
                      {share}% • {formatBRL(asset.amount, { compact: true })}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  manage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  count: {
    color: colors.muted,
    fontSize: 13,
  },
  empty: {
    color: colors.muted,
    fontSize: 13,
  },
  bar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    gap: 2,
  },
  segment: {
    height: '100%',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 14,
  },
  legendItem: {
    width: '50%',
    flexDirection: 'row',
    gap: 10,
    paddingRight: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  legendText: {
    flex: 1,
    gap: 2,
  },
  legendName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  legendValue: {
    color: colors.muted,
    fontSize: 12,
  },
});
