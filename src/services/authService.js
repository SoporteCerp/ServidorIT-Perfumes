import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from './firebase';
import { setDocument, getDocuments } from './firestoreService';

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
  
  const users = await getDocuments('users', [{ field: 'uid', operator: '==', value: cred.user.uid }]);
  
  if (users.length === 0) {
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
  const users = await getDocuments('users', [{ field: 'uid', operator: '==', value: uid }]);
  return users.length > 0 ? users[0].role : 'customer';
};

export const resetPassword = async (email) => {
  await sendPasswordResetEmail(auth, email);
};

export const logoutUser = async () => {
  await signOut(auth);
};
