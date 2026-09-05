import { getDocument, setDocument } from './firestoreService';

const SETTING_ID = 'store';

export const DEFAULT_STORE = {
  name: 'Esencia Gale',
  yappy: '6268-6706',
  whatsapp: '50767238540',
  tagline: 'Tu tienda de fragancias',
  address: 'Panama',
  hours: 'Lun a Sab 9am - 7pm'
};

const normalizeWhatsapp = (v) => {
  const digits = (v || '').replace(/\D/g, '');
  return digits.replace(/^0/, ''); 
};

export const getStoreSettings = async () => {
  const doc = await getDocument('settings', SETTING_ID);
  return { ...DEFAULT_STORE, ...(doc || {}) };
};

export const saveStoreSettings = async (data) => {
  const whatsapp = normalizeWhatsapp(data.whatsapp);
  await setDocument('settings', SETTING_ID, { ...DEFAULT_STORE, ...data, whatsapp });
  return { ...DEFAULT_STORE, ...data, whatsapp };
};