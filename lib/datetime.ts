/**
 * Converts a stored ISO timestamp to the "YYYY-MM-DDTHH:mm" shape an
 * `<input type="datetime-local">` expects, in the BROWSER's local
 * timezone (this must only ever run client-side — it uses the local Date
 * getters on purpose, not UTC ones).
 */
export function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Converts a datetime-local input's value back to a full ISO string,
 * interpreting it as the browser's local time — the correct direction for
 * sending to the server regardless of what timezone the server runs in. */
export function fromDatetimeLocalValue(value: string): string {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}
