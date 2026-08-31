import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

export const uploadProfilePhoto = async (uid, file) => {
  const ext = file.name.split('.').pop() || 'jpg';
  const storageRef = ref(storage, `profile-photos/${uid}/avatar.${ext}`);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
};

export const deleteProfilePhoto = async (path) => {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch {}
};
