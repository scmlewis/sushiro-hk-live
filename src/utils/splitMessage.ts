import { formatCurrency } from './formatCurrency';

export interface SplitLine {
  name: string;
  total: number;
}

export const buildSplitMessage = (lines: SplitLine[]): string => {
  const header = '🍣 壽司郎分帳';
  const body = lines.map((l) => `${l.name}: ${formatCurrency(l.total)}`);
  const grandTotal = lines.reduce((sum, l) => sum + l.total, 0);
  const footer = `總額 (含服務費): ${formatCurrency(grandTotal)}`;
  return [header, ...body, footer].join('\n');
};
