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
    errors.email = "Email is required.";
  } else if (!emailRegex.test(values.email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (!values.password) {
    errors.password = "Password is required.";
  }

  return errors;
}

export function validateSignUpForm(
  values: SignUpFormValues
): FormErrors<keyof SignUpFormValues> {
  const errors: FormErrors<keyof SignUpFormValues> = {};

  if (!values.fullName.trim()) {
    errors.fullName = "Full name is required.";
  } else if (values.fullName.trim().length < 3) {
    errors.fullName = "Full name must be at least 3 characters.";
  }

  if (!values.email.trim()) {
    errors.email = "Email is required.";
  } else if (!emailRegex.test(values.email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (!values.password) {
    errors.password = "Password is required.";
  } else if (values.password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  } else if (!/[A-Z]/.test(values.password) || !/[0-9]/.test(values.password)) {
    errors.password =
      "Password must include at least 1 uppercase letter and 1 number.";
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}
