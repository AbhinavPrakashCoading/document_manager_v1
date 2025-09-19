// Production-Ready Authentication Types
// TODO: Define comprehensive type system for authentication

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: UserRole
  emailVerified: boolean
  mfaEnabled: boolean
  preferences: UserPreferences
  profile: UserProfile
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
}

export type UserRole = 'admin' | 'user' | 'premium' | 'guest'

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: string
  notifications: NotificationSettings
  privacy: PrivacySettings
}

export interface NotificationSettings {
  email: boolean
  push: boolean
  inApp: boolean
  marketing: boolean
}

export interface PrivacySettings {
  profileVisible: boolean
  allowAnalytics: boolean
  shareUsageData: boolean
}

export interface UserProfile {
  firstName: string
  lastName: string
  bio?: string
  company?: string
  website?: string
  location?: string
  phone?: string
}

export interface AuthSession {
  user: User
  accessToken: string
  refreshToken: string
  expiresAt: Date
  issuedAt: Date
  scope: string[]
}

export interface AuthResult {
  success: boolean
  user?: User
  session?: AuthSession
  error?: AuthError
  requiresMFA?: boolean
  requiresEmailVerification?: boolean
}

export interface AuthError {
  code: AuthErrorCode
  message: string
  details?: Record<string, any>
}

export type AuthErrorCode = 
  | 'INVALID_CREDENTIALS'
  | 'USER_NOT_FOUND'
  | 'EMAIL_ALREADY_EXISTS'
  | 'WEAK_PASSWORD'
  | 'RATE_LIMITED'
  | 'MFA_REQUIRED'
  | 'EMAIL_NOT_VERIFIED'
  | 'TOKEN_EXPIRED'
  | 'UNAUTHORIZED'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'

export interface SignUpData {
  name: string
  email: string
  password: string
  confirmPassword: string
  acceptTerms: boolean
  marketingConsent?: boolean
}

export interface SignInData {
  email: string
  password: string
  rememberMe?: boolean
}

export interface PasswordResetData {
  email: string
}

export interface PasswordUpdateData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface MFASetup {
  secret: string
  qrCode: string
  backupCodes: string[]
  type: MFAType
}

export type MFAType = 'totp' | 'sms' | 'email'

export interface MFAVerification {
  code: string
  type: MFAType
  rememberDevice?: boolean
}

export interface OAuthProvider {
  id: string
  name: string
  icon: string
  color: string
  enabled: boolean
}

export interface AuthConfig {
  providers: {
    email: boolean
    google: boolean
    github: boolean
    microsoft: boolean
  }
  features: {
    mfa: boolean
    emailVerification: boolean
    passwordReset: boolean
    rememberMe: boolean
    socialLogin: boolean
  }
  security: {
    minPasswordLength: number
    requireSpecialChars: boolean
    requireNumbers: boolean
    sessionTimeout: number
    maxLoginAttempts: number
    lockoutDuration: number
  }
  ui: {
    theme: 'light' | 'dark' | 'auto'
    logo?: string
    brandColor: string
    showSignUp: boolean
    showForgotPassword: boolean
  }
}

// Event types for authentication state changes
export interface AuthEvent {
  type: AuthEventType
  user?: User
  error?: AuthError
  timestamp: Date
}

export type AuthEventType = 
  | 'SIGN_IN_SUCCESS'
  | 'SIGN_IN_FAILURE'
  | 'SIGN_OUT'
  | 'TOKEN_REFRESH'
  | 'SESSION_EXPIRED'
  | 'USER_UPDATED'
  | 'PASSWORD_CHANGED'
  | 'MFA_ENABLED'
  | 'MFA_DISABLED'