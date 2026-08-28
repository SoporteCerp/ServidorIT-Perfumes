import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from './firebase';
import { addDocument, getDocuments, updateDocument } from './firestoreService';

const ADMIN_EMAIL = 'esenciagale@gmail.com';

export const registerUser = async (email, password, name) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  
  const role = email.toLowerCase() === ADMIN_EMAIL ? 'admin' : 'customer';
  await addDocument('users', {
    uid: cred.user.uid,
    email: email.toLowerCase(),
    name,
    role
  });

  return cred.user;
};

export const loginUser = async (email, password) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  
  const users = await getDocuments('users', [{ field: 'uid', operator: '==', value: cred.user.uid }]);
  const role = email.toLowerCase() === ADMIN_EMAIL ? 'admin' : 'customer';
  
  if (users.length === 0) {
    await addDocument('users', {
      uid: cred.user.uid,
      email: email.toLowerCase(),
      name: cred.user.displayName || '',
      role
    });
  } else if (users[0].role !== role) {
    await updateDocument('users', users[0].id, { role });
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
