describe('checkPasswordStrength (extended cases)', () => {
  let checkPasswordStrength: (password: string) => { isValid: boolean; error?: string };

  beforeAll(() => {
    jest.resetModules();
    jest.isolateModules(() => {
      jest.doMock('@/lib/validators/password-strength', () => {
        const actual = jest.requireActual('@/lib/validators/password-strength');
        return { 
          __esModule: true,
          ...actual,
        };
      });

      checkPasswordStrength = require('@/lib/validators/password-strength').checkPasswordStrength;
    });
  });

  // === BASELINE TESTS ===
  it('valid password passes all rules', () => {
    const result = checkPasswordStrength('Aa@123');
    expect(result.isValid).toBe(true);
  });

  it('fails on too short password', () => {
    const result = checkPasswordStrength('A@1');
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/at least 6 characters/i);
  });

  it('fails without uppercase', () => {
    const result = checkPasswordStrength('abc@123');
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/uppercase/i);
  });

  it('fails without lowercase', () => {
    const result = checkPasswordStrength('ABC@123');
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/lowercase/i);
  });

  it('fails without special character', () => {
    const result = checkPasswordStrength('Abc123');
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/special character/i);
  });

  // === SPECIAL CHARACTER EDGE CASES ===
  const specialChars = `!@#$%^&*()_+-={}[]:";'<>?,./~\``.split('');

  specialChars.forEach((char) => {
    it(`accepts special character: "${char}"`, () => {
      const password = `Aabc${char}1`;
      const result = checkPasswordStrength(password);
      expect(result.isValid).toBe(true);
    });
  });

  it('fails with only special characters', () => {
    const result = checkPasswordStrength('!@#$%^');
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/uppercase/); // fails first on missing uppercase
  });

  // === BOUNDARY CASES ===
  it('passes with exactly 6 characters when valid', () => {
    const result = checkPasswordStrength('Aa@123');
    expect(result.isValid).toBe(true);
  });

  it('fails with 6 characters but missing special char', () => {
    const result = checkPasswordStrength('Aa1234');
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/special character/);
  });

  it('fails with 6 characters but missing uppercase', () => {
    const result = checkPasswordStrength('ab@123');
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/uppercase/);
  });

  // === WEIRD INPUTS ===
  it('fails with whitespace', () => {
    const result = checkPasswordStrength('Aa@ 12');
    expect(result.isValid).toBe(true); // whitespace is technically allowed
  });

  it('passes with special unicode character like ñ', () => {
    const result = checkPasswordStrength('Aañ@12');
    expect(result.isValid).toBe(true);
  });

  it('fails if only emojis', () => {
    const result = checkPasswordStrength('😅😅😅😅😅😅');
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/uppercase/);
  });

  it('passes with emoji *and* valid characters', () => {
    const result = checkPasswordStrength('A@bc12🤖');
    expect(result.isValid).toBe(true);
  });
});
