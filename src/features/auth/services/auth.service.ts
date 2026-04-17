import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/features/auth/config/firebase";
import { getFirebaseAuthErrorMessage } from "@/features/auth/utils/auth-errors";
import type { AuthResult } from "@/features/auth/types/auth.type";

export async function signUpUser(
  email: string,
  password: string,
  fullName: string
): Promise<AuthResult> {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );

    await updateProfile(userCredential.user, {
      displayName: fullName.trim(),
    });

    await setDoc(doc(db, "users", userCredential.user.uid), {
      uid: userCredential.user.uid,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      success: true,
      user: userCredential.user,
      message: "Your account has been created successfully.",
    };
  } catch (error) {
    const parsedError = getFirebaseAuthErrorMessage(error);

    return {
      success: false,
      message: parsedError.message,
      code: parsedError.code,
    };
  }
}

export async function loginUser(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );

    return {
      success: true,
      user: userCredential.user,
      message: "Login successful.",
    };
  } catch (error) {
    const parsedError = getFirebaseAuthErrorMessage(error);

    return {
      success: false,
      message: parsedError.message,
      code: parsedError.code,
    };
  }
}

export async function logoutUser(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    await signOut(auth);

    return {
      success: true,
      message: "Logout successful.",
    };
  } catch {
    return {
      success: false,
      message: "Logout could not be completed. Please try again.",
    };
  }
}
