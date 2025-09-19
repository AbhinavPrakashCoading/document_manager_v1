export interface ValidationResult {
  type: string;
  message: string;
}

export interface ValidationRuleResult {
  valid: boolean;
  message: string;
}

export type ValidationMode = 'strict' | 'soft' | 'warning' | 'fallback';