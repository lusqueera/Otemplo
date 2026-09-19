/** Formata em reais: 14850 → "R$ 14.850,00"; `compact` omite os centavos. */
export function formatBRL(value: number, { compact = false, sign = false } = {}) {
  const abs = Math.abs(value);
  const [int, cents] = abs.toFixed(2).split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const body = compact ? `R$ ${grouped}` : `R$ ${grouped},${cents}`;
  if (value < 0) return `−${body}`;
  return sign && value > 0 ? `+${body}` : body;
}

/** Converte texto digitado ("1.250,50", "1250.5", "R$ 80") em número; NaN se inválido. */
export function parseAmount(text: string) {
  const cleaned = text.replace(/[^\d,.-]/g, '');
  if (!cleaned) return NaN;
  // Se houver vírgula, ela é o separador decimal e os pontos são de milhar
  const normalized = cleaned.includes(',')
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned;
  return Number(normalized);
}

/** Data ISO (YYYY-MM-DD) de hoje, no fuso local. */
export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/** "2024-10-12" → "12 Out"; hoje → "Hoje"; ontem → "Ontem". */
export function formatDateShort(iso: string) {
  const today = todayISO();
  if (iso === today) return 'Hoje';
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const yesterday = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
  if (iso === yesterday) return 'Ontem';
  const [, m, d] = iso.split('-');
  return `${d} ${MONTHS_SHORT[Number(m) - 1] ?? ''}`;
}

/** "DD/MM" ou "DD/MM/AAAA" → ISO; null se inválido. Ano omitido = ano atual. */
export function parseDateInput(text: string) {
  const m = text.trim().match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = m[3] ? Number(m[3]) : new Date().getFullYear();
  const date = new Date(year, month - 1, day);
  if (date.getDate() !== day || date.getMonth() !== month - 1) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** ISO → "DD/MM/AAAA" para preencher formulários. */
export function isoToInput(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/** Máscara progressiva "DD/MM/AAAA" enquanto digita. */
export function maskDate(text: string) {
  const digits = text.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** Máscara "HH:MM" enquanto digita. */
export function maskTime(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
}

export const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
