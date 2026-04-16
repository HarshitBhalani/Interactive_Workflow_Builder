import type {
  FormErrors,
  LoginFormValues,
  SignUpFormValues,
} from "@/features/auth/types/auth.type";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLoginForm(
  values: LoginFormValues
): FormErrors<keyof LoginFormValues> {
  const errors: FormErrors<keyof LoginFormValues> = {};

  if (!values.email.trim()) {
    errors.email = "Email required hai.";
  } else if (!emailRegex.test(values.email)) {
    errors.email = "Valid email address enter karo.";
  }

  if (!values.password) {
    errors.password = "Password required hai.";
  }

  return errors;
}

export function validateSignUpForm(
  values: SignUpFormValues
): FormErrors<keyof SignUpFormValues> {
  const errors: FormErrors<keyof SignUpFormValues> = {};

  if (!values.fullName.trim()) {
    errors.fullName = "Full name required hai.";
  } else if (values.fullName.trim().length < 3) {
    errors.fullName = "Naam kam se kam 3 characters ka hona chahiye.";
  }

  if (!values.email.trim()) {
    errors.email = "Email required hai.";
  } else if (!emailRegex.test(values.email)) {
    errors.email = "Valid email address enter karo.";
  }

  if (!values.password) {
    errors.password = "Password required hai.";
  } else if (values.password.length < 6) {
    errors.password = "Password kam se kam 6 characters ka hona chahiye.";
  } else if (!/[A-Z]/.test(values.password) || !/[0-9]/.test(values.password)) {
    errors.password =
      "Password me kam se kam 1 uppercase letter aur 1 number hona chahiye.";
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Confirm password required hai.";
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = "Password match nahi kar rahe.";
  }

  return errors;
}
