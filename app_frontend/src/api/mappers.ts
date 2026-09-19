// Conversões entre o JSON da API (decimais como string, horas "HH:MM:SS") e os tipos do app.

export const num = (value: string | number | null | undefined) => (value == null ? 0 : Number(value));

export const numOrUndefined = (value: string | number | null | undefined) =>
  value == null ? undefined : Number(value);

/** "14:00:00" → "14:00". */
export const hhmm = (value: string | null | undefined) => (value ? value.slice(0, 5) : '');

export const hhmmOrUndefined = (value: string | null | undefined) => (value ? value.slice(0, 5) : undefined);

/** Envia decimais como string com duas casas (DecimalField). */
export const dec = (value: number) => value.toFixed(2);

/** Remove chaves `undefined` para o PATCH só enviar o que mudou. */
export function compact<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) out[k] = v;
  return out as Partial<T>;
}
