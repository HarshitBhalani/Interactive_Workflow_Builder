const firebaseAuthErrorMessages: Record<string, string> = {
  "auth/email-already-in-use": "Ye email already registered hai. Login karke dekho.",
  "auth/invalid-email": "Please ek valid email address enter karo.",
  "auth/weak-password": "Password kam se kam 6 characters ka hona chahiye.",
  "auth/user-not-found": "Is email se koi account nahi mila.",
  "auth/wrong-password": "Password galat hai. Dobara try karo.",
  "auth/invalid-credential": "Email ya password sahi nahi hai.",
  "auth/too-many-requests":
    "Bahut zyada attempts ho gaye. Thodi der baad try karo.",
  "auth/network-request-failed":
    "Network issue aaya hai. Internet connection check karo.",
  "auth/missing-password": "Password required hai.",
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
        "Authentication complete nahi ho paya. Please dobara try karo.",
    };
  }

  return {
    message: "Unexpected error aaya hai. Please dobara try karo.",
  };
}
