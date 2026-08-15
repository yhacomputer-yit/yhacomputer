export function parseFee(value) {
  const normalized = String(value ?? "").replace(/[^0-9.]/g, "");
  const numeric = Number(normalized);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

export function hasConfirmedFee(value) {
  return parseFee(value) !== null;
}

export function formatFee(value) {
  const numeric = parseFee(value);
  if (numeric === null) return "Fee to be confirmed";
  return `MMK ${new Intl.NumberFormat("en-US").format(numeric)}`;
}

function asDate(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  const source = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T12:00:00Z` : raw;
  const date = new Date(source);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatEventDate(value) {
  const date = asDate(value);
  if (!date) return String(value ?? "");
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function toIsoEventDate(value) {
  const date = asDate(value);
  return date ? date.toISOString().slice(0, 10) : null;
}
