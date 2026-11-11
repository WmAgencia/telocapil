/** Flat shipping for the new Lisinha storefront; fee is per order, not per item. */
export const SHIPPING_FLAT_CENTS=1157;
export function firstPurchaseDiscountCents(productSubtotalCents,eligible){
 if(!Number.isSafeInteger(productSubtotalCents)||productSubtotalCents<0)throw Error('Subtotal inválido');
 return eligible?Math.round(productSubtotalCents*.10):0;
}
