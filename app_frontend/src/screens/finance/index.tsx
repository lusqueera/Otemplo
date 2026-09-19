import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';

import { ActionSheet, type Action } from '@/components/action-sheet';
import { Badge, Card } from '@/components/card';
import { ChipRow } from '@/components/chip-row';
import { KpiTile } from '@/components/kpi-tile';
import { LineChart } from '@/components/line-chart';
import { QuoteCard } from '@/components/quote-card';
import { ScreenHeader } from '@/components/screen-header';
import { Sheet } from '@/components/sheet';
import { confirmDelete } from '@/lib/confirm';
import { formatBRL } from '@/lib/format';
import { useAllocation, useDeleteTransaction, useFinanceSummary, useTransactions } from '@/api/finance';
import { formatPct, monthLabel, useFinanceStats, useNetWorthEvolution } from '@/api/stats';
import { useFinanceStore } from '@/store/finance';
import { colors } from '@/theme/colors';
import { AllocationCard } from './components/allocation-card';
import { AllocationSheet } from './components/allocation-sheet';
import { PeriodCard } from './components/period-card';
import { TransactionFormSheet } from './components/transaction-form-sheet';
import { TransactionRow } from './components/transaction-row';
import { KIND_LABEL, KIND_LABEL_PLURAL, quote, type Transaction, type TransactionKind } from './data';

const SCREEN_PADDING = 20;
const RECENT_LIMIT = 5;

type Filter = 'all' | TransactionKind;

type SheetState =
  | { kind: 'none' }
  | { kind: 'tx-actions'; transaction: Transaction }
  | { kind: 'tx-form'; transaction?: Transaction }
  | { kind: 'tx-all' }
  | { kind: 'allocation' };

export default function FinanceScreen() {
  const monthOffset = useFinanceStore((s) => s.monthOffset);
  const period = useFinanceStore((s) => s.period);
  const shiftMonth = useFinanceStore((s) => s.shiftMonth);
  const setPeriod = useFinanceStore((s) => s.setPeriod);

  const [filter, setFilter] = useState<Filter>('all');
  const [sheet, setSheet] = useState<SheetState>({ kind: 'none' });
  const close = () => setSheet({ kind: 'none' });

  // Lançamentos já vêm filtrados pelo período; o resumo é calculado no servidor
  const { data: inPeriodTx = [] } = useTransactions(period, monthOffset);
  const { data: summary } = useFinanceSummary(period, monthOffset);
  const { data: allocation = [] } = useAllocation();
  // Sheet "todas as movimentações": histórico completo, carregado só quando aberto
  const { data: transactions = [] } = useTransactions('overview', 0, sheet.kind === 'tx-all');
  const deleteTransaction = useDeleteTransaction();
  const { income = 0, expenses = 0, net = 0, investment = 0 } = summary ?? {};
  const netWorth = summary?.totalAllocation ?? 0;
  const { data: stats } = useFinanceStats(period, monthOffset);
  const { data: evolutionPoints = [] } = useNetWorthEvolution(6);
  // Gráfico em milhares; primeiro e último ponto rotulados
  const evolutionValues = evolutionPoints.map((p) => Math.round(p.netWorth / 100) / 10);
  const evolutionLabels = evolutionPoints.map((p) => monthLabel(p.month));
  const evolutionSublabels = evolutionValues.map((v, i) =>
    i === 0 || i === evolutionValues.length - 1 ? `${v}k` : undefined,
  );
  const expenseCeiling = stats?.expenseCeiling ?? 0;
  const overCeiling = expenseCeiling > 0 && expenses > expenseCeiling;

  const chips = useMemo(
    () => [
      { id: 'all', label: `Todas (${inPeriodTx.length})` },
      ...(Object.keys(KIND_LABEL) as TransactionKind[]).map((k) => ({
        id: k,
        label: `${KIND_LABEL_PLURAL[k]} (${inPeriodTx.filter((t) => t.kind === k).length})`,
      })),
    ],
    [inPeriodTx],
  );
  const filtered = filter === 'all' ? inPeriodTx : inPeriodTx.filter((t) => t.kind === filter);
  const recent = filtered.slice(0, RECENT_LIMIT);

  function handleDelete(t: Transaction) {
    confirmDelete('Excluir transação', `"${t.title}" (${formatBRL(t.amount)}) será removida.`, () => {
      deleteTransaction.mutate(t.id);
      close();
    });
  }

  const txActions: Action[] =
    sheet.kind === 'tx-actions'
      ? [
          { id: 'edit', label: 'Editar transação', icon: 'edit-2', onPress: () => setSheet({ kind: 'tx-form', transaction: sheet.transaction }) },
          { id: 'delete', label: 'Excluir transação', icon: 'trash-2', destructive: true, onPress: () => handleDelete(sheet.transaction) },
        ]
      : [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Finanças & Capital"
          subtitle="Gestão patrimonial, fluxo de caixa e alocação estratégica de recursos."
          action={{ label: 'Novo Aporte / Transação', onPress: () => setSheet({ kind: 'tx-form' }) }}
        />

        <PeriodCard monthOffset={monthOffset} period={period} onShiftMonth={shiftMonth} onPeriodChange={setPeriod} />

        {/* KPIs */}
        <View style={styles.grid}>
          <View style={styles.gridRow}>
            <KpiTile
              label="Patrimônio total"
              badge={formatPct(stats?.netWorthChangePct, ' mês')}
              value={formatBRL(netWorth, { compact: true })}
              hint={investment > 0 ? `Aportes no período: ${formatBRL(investment, { compact: true })}` : 'Liquidez & Investimentos'}
            />
            <KpiTile
              label="Fluxo líquido"
              badge={formatBRL(net, { compact: true, sign: true })}
              value={formatBRL(net, { compact: true, sign: true })}
              hint={period === 'month' ? 'Renda − despesas (aportes não contam)' : 'No período selecionado'}
            />
          </View>
          <View style={styles.gridRow}>
            <KpiTile
              label="Entradas totais"
              icon={<Feather name="arrow-up-right" size={16} color={colors.muted} />}
              value={formatBRL(income, { compact: true })}
              hint="Salário + Proventos"
            />
            <KpiTile
              label="Despesas totais"
              icon={<Feather name="credit-card" size={16} color={colors.muted} />}
              value={formatBRL(expenses, { compact: true })}
              hint={expenseCeiling ? `Teto: ${formatBRL(expenseCeiling, { compact: true })} (${overCeiling ? 'Acima do teto' : 'Dentro do teto'})` : 'Defina um teto no perfil'}
            />
          </View>
        </View>

        {/* Evolução */}
        <Card
          overline="Trajetória patrimonial"
          title="Evolução Líquida (6 Meses)"
          action={
            <Badge
              icon={<Feather name="trending-up" size={14} color={colors.text} />}
              label={formatPct(stats?.netWorthChangePct)}
            />
          }
        >
          <LineChart
            data={evolutionValues}
            labels={evolutionLabels}
            sublabels={evolutionSublabels}
            highlightIndex={evolutionValues.length - 1}
            highlightLine={false}
          />
        </Card>

        <AllocationCard allocation={allocation} onManage={() => setSheet({ kind: 'allocation' })} />

        {/* Movimentações */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitle}>
              <Text style={styles.overline}>Registro analítico</Text>
              <Text style={styles.title}>Movimentações Recentes</Text>
            </View>
            <Pressable onPress={() => setSheet({ kind: 'tx-all' })} accessibilityRole="button">
              <Text style={styles.link}>Ver todas</Text>
            </Pressable>
          </View>

          <ChipRow
            chips={chips}
            selectedId={filter}
            onSelect={(id) => setFilter(id as Filter)}
            inset={SCREEN_PADDING}
          />

          {recent.length === 0 ? (
            <Pressable style={styles.emptyCard} onPress={() => setSheet({ kind: 'tx-form' })}>
              <Text style={styles.emptyTitle}>
                {inPeriodTx.length === 0 ? 'Nada neste período' : 'Nada nesta categoria'}
              </Text>
              <Text style={styles.emptyText}>Toque para registrar uma transação.</Text>
            </Pressable>
          ) : (
            <View style={styles.list}>
              {recent.map((t) => (
                <TransactionRow key={t.id} transaction={t} onPress={(tx) => setSheet({ kind: 'tx-actions', transaction: tx })} />
              ))}
              {filtered.length > RECENT_LIMIT && (
                <Pressable style={styles.more} onPress={() => setSheet({ kind: 'tx-all' })} accessibilityRole="button">
                  <Text style={styles.moreText}>Ver mais {filtered.length - RECENT_LIMIT}</Text>
                  <Feather name="chevron-right" size={14} color={colors.muted} />
                </Pressable>
              )}
            </View>
          )}
        </View>

        <QuoteCard
          text={quote.text}
          author={quote.author}
          icon={<Feather name="aperture" size={18} color={colors.muted} />}
        />
      </ScrollView>

      <ActionSheet
        visible={sheet.kind === 'tx-actions'}
        onClose={close}
        title={sheet.kind === 'tx-actions' ? sheet.transaction.title : ''}
        subtitle={
          sheet.kind === 'tx-actions'
            ? `${KIND_LABEL[sheet.transaction.kind]} • ${formatBRL(sheet.transaction.amount)}`
            : undefined
        }
        actions={txActions}
      />
      <TransactionFormSheet
        visible={sheet.kind === 'tx-form'}
        onClose={close}
        transaction={sheet.kind === 'tx-form' ? sheet.transaction : undefined}
        onDelete={handleDelete}
      />
      <Sheet
        visible={sheet.kind === 'tx-all'}
        onClose={close}
        title="Todas as movimentações"
        subtitle={`${transactions.length} registros • toque para editar`}
      >
        <View style={styles.list}>
          {transactions.map((t) => (
            <TransactionRow
              key={t.id}
              transaction={t}
              onCard
              onPress={(tx) => setSheet({ kind: 'tx-form', transaction: tx })}
            />
          ))}
        </View>
      </Sheet>
      <AllocationSheet visible={sheet.kind === 'allocation'} onClose={close} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 20,
  },
  grid: {
    gap: 10,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  section: {
    gap: 14,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: {
    flex: 1,
    gap: 4,
  },
  overline: {
    color: colors.muted,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '600',
  },
  link: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: 4,
  },
  list: {
    gap: 10,
  },
  more: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
  },
  moreText: {
    color: colors.muted,
    fontSize: 13,
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
  },
});
