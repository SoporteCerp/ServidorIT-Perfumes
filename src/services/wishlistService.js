const WISHLIST_KEY = 'esencia_wishlist';

export const getWishlist = () => {
  const data = localStorage.getItem(WISHLIST_KEY);
  return data ? JSON.parse(data) : [];
};

export const toggleWishlist = (productId) => {
  const current = getWishlist();
  const index = current.indexOf(productId);
  if (index === -1) {
    current.push(productId);
  } else {
    current.splice(index, 1);
  }
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(current));
  return current;
};

export const isInWishlist = (productId) => {
  return getWishlist().includes(productId);
};

export const getWishlistCount = () => {
  return getWishlist().length;
};
