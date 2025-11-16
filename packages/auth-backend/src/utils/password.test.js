/**
 * Password utility tests
 * Example test file demonstrating test structure
 * @module utils/password.test
 */

import { test } from 'node:test';
import assert from 'node:assert';
import {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
  generateRandomPassword,
} from './password.js';

/**
 * Test: Hash Password
 */
test('hashPassword should hash a password', async () => {
  const password = 'TestPassword123!';
  const hashedPassword = await hashPassword(password);

  assert.ok(hashedPassword, 'Hashed password should exist');
  assert.notStrictEqual(hashedPassword, password, 'Hashed password should differ from original');
  assert.ok(hashedPassword.startsWith('$2'), 'Should use bcrypt hash format');
});

test('hashPassword should throw error for empty password', async () => {
  await assert.rejects(
    async () => await hashPassword(''),
    /Password must be a non-empty string/,
    'Should throw error for empty password'
  );
});

/**
 * Test: Compare Password
 */
test('comparePassword should return true for matching passwords', async () => {
  const password = 'TestPassword123!';
  const hashedPassword = await hashPassword(password);
  const isMatch = await comparePassword(password, hashedPassword);

  assert.strictEqual(isMatch, true, 'Passwords should match');
});

test('comparePassword should return false for non-matching passwords', async () => {
  const password = 'TestPassword123!';
  const wrongPassword = 'WrongPassword123!';
  const hashedPassword = await hashPassword(password);
  const isMatch = await comparePassword(wrongPassword, hashedPassword);

  assert.strictEqual(isMatch, false, 'Passwords should not match');
});

/**
 * Test: Validate Password Strength
 */
test('validatePasswordStrength should accept strong password', () => {
  const result = validatePasswordStrength('StrongPass123!');

  assert.strictEqual(result.isValid, true, 'Strong password should be valid');
  assert.strictEqual(result.errors.length, 0, 'Should have no errors');
});

test('validatePasswordStrength should reject weak password', () => {
  const result = validatePasswordStrength('weak');

  assert.strictEqual(result.isValid, false, 'Weak password should be invalid');
  assert.ok(result.errors.length > 0, 'Should have errors');
});

test('validatePasswordStrength should reject password without uppercase', () => {
  const result = validatePasswordStrength('password123!');

  assert.strictEqual(result.isValid, false, 'Password without uppercase should be invalid');
  assert.ok(
    result.errors.some((e) => e.includes('uppercase')),
    'Should have uppercase error'
  );
});

test('validatePasswordStrength should reject password without number', () => {
  const result = validatePasswordStrength('Password!');

  assert.strictEqual(result.isValid, false, 'Password without number should be invalid');
  assert.ok(
    result.errors.some((e) => e.includes('number')),
    'Should have number error'
  );
});

test('validatePasswordStrength should reject password without special character', () => {
  const result = validatePasswordStrength('Password123');

  assert.strictEqual(result.isValid, false, 'Password without special char should be invalid');
  assert.ok(
    result.errors.some((e) => e.includes('special')),
    'Should have special character error'
  );
});

test('validatePasswordStrength should reject too short password', () => {
  const result = validatePasswordStrength('Pass1!');

  assert.strictEqual(result.isValid, false, 'Short password should be invalid');
  assert.ok(
    result.errors.some((e) => e.includes('8 characters')),
    'Should have length error'
  );
});

/**
 * Test: Generate Random Password
 */
test('generateRandomPassword should generate password with default length', () => {
  const password = generateRandomPassword();

  assert.strictEqual(password.length, 16, 'Should generate 16-character password by default');
});

test('generateRandomPassword should generate password with custom length', () => {
  const length = 20;
  const password = generateRandomPassword(length);

  assert.strictEqual(password.length, length, `Should generate ${length}-character password`);
});

test('generateRandomPassword should generate strong password', () => {
  const password = generateRandomPassword();
  const result = validatePasswordStrength(password);

  assert.strictEqual(result.isValid, true, 'Generated password should be strong');
  assert.ok(/[A-Z]/.test(password), 'Should contain uppercase');
  assert.ok(/[a-z]/.test(password), 'Should contain lowercase');
  assert.ok(/\d/.test(password), 'Should contain number');
  assert.ok(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password), 'Should contain special character');
});
