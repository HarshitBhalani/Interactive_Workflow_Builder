const firebaseAuthErrorMessages: Record<string, string> = {
  "auth/email-already-in-use":
    "This email is already registered. Please log in instead.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/user-not-found": "No account was found with this email address.",
  "auth/wrong-password": "The password is incorrect. Please try again.",
  "auth/invalid-credential": "The email or password you entered is incorrect.",
  "auth/too-many-requests":
    "Too many attempts were made. Please try again later.",
  "auth/network-request-failed":
    "A network error occurred. Please check your internet connection.",
  "auth/missing-password": "Password is required.",
  "auth/missing-email": "Please enter your email address first.",
};

export function getFirebaseAuthErrorMessage(error: unknown): {
  message: string;
  code?: string;
} {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return {
      code: error.code,
      message:
        firebaseAuthErrorMessages[error.code] ??
        "Authentication could not be completed. Please try again.",
    };
  }

  return {
    message: "An unexpected error occurred. Please try again.",
  };
}
