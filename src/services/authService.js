import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from './firebase';
import { setDocument, getDocument } from './firestoreService';

export const registerUser = async (email, password, name) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  
  await setDocument('users', cred.user.uid, {
    uid: cred.user.uid,
    email: email.toLowerCase(),
    name,
    role: 'customer'
  });

  return cred.user;
};

export const loginUser = async (email, password) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  
  const userDoc = await getDocument('users', cred.user.uid);
  
  if (!userDoc) {
    await setDocument('users', cred.user.uid, {
      uid: cred.user.uid,
      email: email.toLowerCase(),
      name: cred.user.displayName || '',
      role: 'customer'
    });
  }

  return cred.user;
};

export const getUserRole = async (uid) => {
  const userDoc = await getDocument('users', uid);
  return userDoc && userDoc.role ? userDoc.role : 'customer';
};

export const resetPassword = async (email) => {
  await sendPasswordResetEmail(auth, email);
};

export const logoutUser = async () => {
  await signOut(auth);
};
