// Password must be at least 6 characters long, contain one uppercase letter, one lowercase letter, and one special character
export function checkPasswordStrength(password: string): { isValid: boolean; error?: string; minLength?: boolean; upperCase?: boolean; lowerCase?: boolean; specialChar?: boolean; } {
  const hasMinLength = password.length >= 6;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_\-+=~`[\]{}|;:'",.<>?/\\]/.test(password);


  if (!hasMinLength) {
    return {
      isValid: false,
      error: "Password must be at least 6 characters long",
    };
  }

  if (!hasUpperCase) {
    return {
      isValid: false,
      error: "Password must contain at least one uppercase letter",
    };
  }

  if (!hasLowerCase) {
    return {
      isValid: false,
      error: "Password must contain at least one lowercase letter",
    };
  }

  if (!hasSpecialChar) {
    return {
      isValid: false,
      error: "Password must contain at least one special character",
    };
  }

  return { isValid: true, minLength: hasMinLength, upperCase: hasUpperCase, lowerCase: hasLowerCase, specialChar: hasSpecialChar };
}
