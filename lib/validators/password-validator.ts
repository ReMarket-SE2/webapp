
// Password must be at least 6 characters long, contain one uppercase letter, one lowercase letter, and one special character
export function validatePassword(password: string): { isValid: boolean; error?: string } {
    if (password.length < 6) {
    return { isValid: false, error: "Password must be at least 6 characters long" }
  }

  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: "Password must contain at least one uppercase letter" }
  }

  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: "Password must contain at least one lowercase letter" }
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { isValid: false, error: "Password must contain at least one special character" }
  }

  return { isValid: true }
} 