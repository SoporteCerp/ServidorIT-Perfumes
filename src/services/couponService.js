import { getDocuments, addDocument, updateDocument, deleteDocument } from './firestoreService';

export const getCoupons = async () => {
  return await getDocuments('coupons', [], 'code', 'asc');
};

export const addCoupon = async (code, discount, type = 'percentage', minPurchase = 0, expiresAt = null) => {
  return await addDocument('coupons', {
    code: code.toUpperCase(),
    discount,
    type,
    minPurchase,
    expiresAt,
    active: true,
    usedCount: 0
  });
};

export const validateCoupon = async (code, cartTotal) => {
  const coupons = await getDocuments('coupons', [{ field: 'code', operator: '==', value: code.toUpperCase() }]);
  if (coupons.length === 0) return { valid: false, error: 'Codigo no valido' };
  const coupon = coupons[0];
  if (!coupon.active) return { valid: false, error: 'Codigo desactivado' };
  if (coupon.expiresAt && new Date(coupon.expiresAt.seconds * 1000) < new Date()) {
    return { valid: false, error: 'Codigo expirado' };
  }
  if (coupon.minPurchase && cartTotal < coupon.minPurchase) {
    return { valid: false, error: 'Compra minima $' + coupon.minPurchase };
  }
  if (coupon.type === 'free_shipping') {
    return { valid: true, discount: 0, freeShipping: true, coupon };
  }
  const discount = coupon.type === 'percentage' ? (cartTotal * coupon.discount / 100) : coupon.discount;
  return { valid: true, discount, coupon };
};

export const updateCoupon = async (id, data) => {
  return await updateDocument('coupons', id, data);
};

export const getBestCoupon = async (cartTotal, shippingCost) => {
  const coupons = await getCoupons();
  let best = null;
  (coupons || []).forEach(c => {
    if (!c.active) return;
    if (c.expiresAt && new Date(c.expiresAt.seconds * 1000) < new Date()) return;
    if (c.minPurchase && cartTotal < c.minPurchase) return;
    let saving = 0;
    if (c.type === 'percentage') saving = cartTotal * c.discount / 100;
    else if (c.type === 'fixed') saving = c.discount;
    else if (c.type === 'free_shipping') saving = shippingCost || 0;
    if (best === null || saving > best.saving) {
      best = { coupon: c, saving, freeShipping: c.type === 'free_shipping' };
    }
  });
  return best;
};

export const deleteCoupon = async (id) => {
  return await deleteDocument('coupons', id);
};