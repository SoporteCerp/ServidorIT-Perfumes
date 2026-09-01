import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

export const uploadProfilePhoto = async (uid, file) => {
  const ext = file.name.split('.').pop() || 'jpg';
  const storageRef = ref(storage, `profile-photos/${uid}/avatar.${ext}`);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
};

export const uploadProductImage = async (imageData, index) => {
  const isDataUrl = typeof imageData === 'string' && imageData.startsWith('data:');
  if (!isDataUrl) return imageData;
  const extMatch = imageData.match(/^data:image\/([a-zA-Z+]+);/);
  const ext = extMatch ? (extMatch[1] || 'jpg').replace('+', '') : 'jpg';
  const blob = dataUrlToBlob(imageData);
  const storageRef = ref(storage, `product-images/${Date.now()}-${index}.${ext}`);
  await uploadBytes(storageRef, blob);
  return await getDownloadURL(storageRef);
};

const dataUrlToBlob = (dataUrl) => {
  const [head, body] = dataUrl.split(',');
  const mime = head.match(/:(.*?);/)?.[1] || 'image/jpeg';
  const binary = atob(body);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
};

export const deleteProfilePhoto = async (path) => {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch {}
};
