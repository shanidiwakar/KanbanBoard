import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from '@react-native-firebase/auth';

const auth = getAuth();

export const login = async (email: string, password: string,) => {
  return signInWithEmailAndPassword(
    auth,
    email.trim(),
    password,
  );
};

export const register = async (
  email: string,
  password: string,
) => {
  return createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password,
  );
};

export const logout = async () => {
  return signOut(auth);
};