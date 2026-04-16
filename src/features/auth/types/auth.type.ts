import type { User } from "firebase/auth";

export type AuthResult =
  | {
      success: true;
      message: string;
      user: User;
    }
  | {
      success: false;
      message: string;
      code?: string;
    };

export type LoginFormValues = {
  email: string;
  password: string;
};

export type SignUpFormValues = LoginFormValues & {
  fullName: string;
  confirmPassword: string;
};

export type FormErrors<T extends string> = Partial<Record<T | "submit", string>>;
