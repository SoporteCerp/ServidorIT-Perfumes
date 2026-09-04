const DAY_MS = 24 * 60 * 60 * 1000;

const toMillis = (t) => {
  if (!t) return null;
  if (typeof t === 'number') return t;
  if (typeof t.toDate === 'function') return t.toDate().getTime();
  const ms = Date.parse(t);
  return isNaN(ms) ? null : ms;
};

export const isProductNew = (p) => {
  const ms = toMillis(p && p.createdAt);
  return !!ms && Date.now() - ms < 60 * DAY_MS;
};

export const productDiscount = (p) => {
  const orig = parseFloat(p && p.originalPrice);
  const price = parseFloat(p && p.price);
  if (!orig || !price || orig <= price) return 0;
  return Math.round(((orig - price) / orig) * 100);
};

export const isProductOffer = (p) => productDiscount(p) > 0;

export const isLowStock = (p) => {
  const st = p && typeof p.stock === 'number' ? p.stock : parseInt(p && p.stock, 10);
  return Number.isFinite(st) && st > 0 && st <= 5;
};

export const getProductImages = (p) => {
  const arr = p && Array.isArray(p.images) ? p.images.filter(Boolean) : [];
  if (arr.length > 0) return arr;
  return p && p.image ? [p.image] : [];
};