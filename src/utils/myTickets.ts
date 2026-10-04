import { STORAGE_KEYS } from '../config';

function isValidTicket(t: string): boolean {
  if (!t || t.length > 5) return false;
  return /^[0-9-]+$/.test(t);
}

function readAll(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.myTickets);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return {};
    return parsed as Record<string, string>;
  } catch {
    return {};
  }
}

export function loadMyTicket(storeId: number): string {
  const v = readAll()[String(storeId)] ?? '';
  return isValidTicket(v) ? v : '';
}

export function saveMyTicket(storeId: number, ticket: string): void {
  if (!isValidTicket(ticket)) return;
  try {
    const all = readAll();
    all[String(storeId)] = ticket;
    localStorage.setItem(STORAGE_KEYS.myTickets, JSON.stringify(all));
  } catch {
    // private mode — ignore, in-memory only
  }
}

export function clearMyTicket(storeId: number): void {
  try {
    const all = readAll();
    delete all[String(storeId)];
    localStorage.setItem(STORAGE_KEYS.myTickets, JSON.stringify(all));
  } catch {
    // ignore
  }
}
