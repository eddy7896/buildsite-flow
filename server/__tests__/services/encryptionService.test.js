/**
 * Encryption Service Tests
 */

const encryptionService = require('../../services/encryptionService');

describe('Encryption Service', () => {
  const testData = {
    ssn: '123-45-6789',
    bankAccount: '1234567890',
    salary: '50000.00',
  };

  describe('encrypt and decrypt', () => {
    test('should encrypt and decrypt data correctly', () => {
      const encrypted = encryptionService.encrypt(testData.ssn);
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(testData.ssn);
      // Encrypted format is salt:iv:authTag:encryptedData (colon-separated base64)
      expect(encrypted).toMatch(/^[A-Za-z0-9+/=:]+$/);

      const decrypted = encryptionService.decrypt(encrypted);
      expect(decrypted).toBe(testData.ssn);
    });

    test('should handle empty strings', () => {
      // Empty strings should throw an error as per encryption service
      expect(() => encryptionService.encrypt('')).toThrow();
    });

    test('should handle special characters', () => {
      const specialData = 'Test@123#$%^&*()';
      const encrypted = encryptionService.encrypt(specialData);
      const decrypted = encryptionService.decrypt(encrypted);
      expect(decrypted).toBe(specialData);
    });
  });

  describe('encryptFields and decryptFields', () => {
    test('should encrypt multiple fields', () => {
      const data = {
        ssn: testData.ssn,
        bankAccount: testData.bankAccount,
        salary: testData.salary,
      };

      const encrypted = encryptionService.encryptFields(data, ['ssn', 'bankAccount', 'salary']);
      // encryptFields encrypts the fields in place
      expect(encrypted.ssn).toBeDefined();
      expect(encrypted.bankAccount).toBeDefined();
      expect(encrypted.salary).toBeDefined();
      expect(encrypted.ssn).not.toBe(testData.ssn);
      expect(encrypted.bankAccount).not.toBe(testData.bankAccount);
    });

    test('should decrypt multiple fields', () => {
      const encrypted = encryptionService.encryptFields(
        { ssn: testData.ssn, bankAccount: testData.bankAccount },
        ['ssn', 'bankAccount']
      );

      // decryptFields looks for encrypted format (with colons)
      const decrypted = encryptionService.decryptFields(encrypted, ['ssn', 'bankAccount']);
      expect(decrypted.ssn).toBe(testData.ssn);
      expect(decrypted.bankAccount).toBe(testData.bankAccount);
    });
  });

  describe('hash', () => {
    test('should generate consistent hash', () => {
      const hash1 = encryptionService.hash(testData.ssn);
      const hash2 = encryptionService.hash(testData.ssn);
      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex
    });

    test('should generate different hashes for different inputs', () => {
      const hash1 = encryptionService.hash('value1');
      const hash2 = encryptionService.hash('value2');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('isEncrypted', () => {
    test('should identify encrypted data', () => {
      const encrypted = encryptionService.encrypt(testData.ssn);
      expect(encryptionService.isEncrypted(encrypted)).toBe(true);
    });

    test('should identify plain text data', () => {
      expect(encryptionService.isEncrypted(testData.ssn)).toBe(false);
    });
  });
});
