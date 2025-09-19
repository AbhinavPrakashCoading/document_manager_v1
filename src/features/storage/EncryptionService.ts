import crypto from 'crypto'

/**
 * Field-level encryption service for sensitive data
 * Uses AES-256-CBC encryption for personal data
 */
export class EncryptionService {
  private static readonly algorithm = 'aes-256-cbc'
  private static readonly keyLength = 32
  private static readonly ivLength = 16
  
  private readonly encryptionKey: Buffer

  constructor() {
    const key = process.env.ENCRYPTION_KEY || 'default-development-key-change-in-production'
    
    // Create a consistent 32-byte key from the provided key
    this.encryptionKey = crypto
      .createHash('sha256')
      .update(key)
      .digest()
  }

  /**
   * Encrypt a string value
   */
  encrypt(text: string | null): string | null {
    if (!text) return null

    try {
      // Generate random IV
      const iv = crypto.randomBytes(EncryptionService.ivLength)
      
      // Create cipher
      const cipher = crypto.createCipher(EncryptionService.algorithm, this.encryptionKey)
      
      // Encrypt the text
      let encrypted = cipher.update(text, 'utf8', 'hex')
      encrypted += cipher.final('hex')
      
      // Combine IV + encrypted data
      const combined = Buffer.concat([iv, Buffer.from(encrypted, 'hex')])
      
      return combined.toString('base64')
    } catch (error) {
      console.error('Encryption failed:', error)
      // In development, return the original text to prevent data loss
      if (process.env.NODE_ENV === 'development') {
        return text
      }
      throw new Error('Failed to encrypt data')
    }
  }

  /**
   * Decrypt a string value
   */
  decrypt(encryptedText: string | null): string | null {
    if (!encryptedText) return null

    try {
      // In development, if it's not base64, assume it's unencrypted
      if (process.env.NODE_ENV === 'development') {
        try {
          Buffer.from(encryptedText, 'base64')
        } catch {
          // Not base64, probably unencrypted
          return encryptedText
        }
      }

      // Decode from base64
      const combined = Buffer.from(encryptedText, 'base64')
      
      // Extract IV and encrypted data
      const iv = combined.subarray(0, EncryptionService.ivLength)
      const encrypted = combined.subarray(EncryptionService.ivLength)
      
      // Create decipher
      const decipher = crypto.createDecipher(EncryptionService.algorithm, this.encryptionKey)
      
      // Decrypt
      let decrypted = decipher.update(encrypted, undefined, 'utf8')
      decrypted += decipher.final('utf8')
      
      return decrypted
    } catch (error) {
      console.error('Decryption failed:', error)
      // In development, return the original text
      if (process.env.NODE_ENV === 'development') {
        return encryptedText
      }
      throw new Error('Failed to decrypt data')
    }
  }

  /**
   * Encrypt an object's specified fields
   */
  encryptFields<T extends Record<string, any>>(
    obj: T, 
    fieldsToEncrypt: Array<string>
  ): T {
    const result = { ...obj } as any
    
    for (const field of fieldsToEncrypt) {
      if (result[field] && typeof result[field] === 'string') {
        result[field] = this.encrypt(result[field] as string)
      }
    }
    
    return result as T
  }

  /**
   * Decrypt an object's specified fields
   */
  decryptFields<T extends Record<string, any>>(
    obj: T, 
    fieldsToDecrypt: Array<string>
  ): T {
    const result = { ...obj } as any
    
    for (const field of fieldsToDecrypt) {
      if (result[field] && typeof result[field] === 'string') {
        result[field] = this.decrypt(result[field] as string)
      }
    }
    
    return result as T
  }

  /**
   * Generate a secure hash for indexing encrypted data
   * (for searching without decrypting)
   */
  generateSearchHash(text: string): string {
    return crypto
      .createHash('sha256')
      .update(text.toLowerCase().trim())
      .digest('hex')
  }

  /**
   * Verify if text matches a search hash
   */
  verifySearchHash(text: string, hash: string): boolean {
    return this.generateSearchHash(text) === hash
  }
}

// Field encryption configuration constants
export const ENCRYPTED_USER_FIELDS = ['name', 'email'] as const
export const ENCRYPTED_DOCUMENT_FIELDS = ['title', 'filename', 'content'] as const
export const ENCRYPTED_ZIP_FIELDS = ['filename', 'originalPath'] as const