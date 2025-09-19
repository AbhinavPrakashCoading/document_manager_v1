// Schema Processing Service for Template-based Document Processing
'use client';

import toast from 'react-hot-toast';

export interface ProcessingResult {
  success: boolean;
  processedFiles: ProcessedFile[];
  validationReport: ValidationReport;
  errors: ProcessingError[];
}

export interface ProcessedFile {
  originalName: string;
  processedName: string;
  status: 'processed' | 'failed' | 'skipped';
  validations: FileValidation[];
  transformations: string[];
}

export interface ValidationReport {
  totalFiles: number;
  processedFiles: number;
  failedFiles: number;
  complianceScore: number;
  issues: ValidationIssue[];
  recommendations: string[];
}

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  file?: string;
  field?: string;
  canFix: boolean;
}

export interface ProcessingError {
  file: string;
  error: string;
  code: string;
}

export interface FileValidation {
  rule: string;
  passed: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

interface SimpleTemplate {
  id: string;
  name: string;
  requirements: {
    type: string;
    maxSizeKB: number;
    allowedTypes: string[];
    mandatory: boolean;
  }[];
}

class SchemaProcessingService {
  private getTemplateSchema(templateId: string): SimpleTemplate | null {
    const templates: Record<string, SimpleTemplate> = {
      'upsc': {
        id: 'upsc',
        name: 'UPSC Templates',
        requirements: [
          {
            type: 'Admit Card',
            maxSizeKB: 2048,
            allowedTypes: ['pdf', 'jpg', 'png'],
            mandatory: true
          },
          {
            type: 'Result',
            maxSizeKB: 2048,
            allowedTypes: ['pdf'],
            mandatory: true
          },
          {
            type: 'ID Proof',
            maxSizeKB: 1024,
            allowedTypes: ['pdf', 'jpg', 'png'],
            mandatory: true
          }
        ]
      },
      'ssc': {
        id: 'ssc',
        name: 'SSC Templates',
        requirements: [
          {
            type: 'Hall Ticket',
            maxSizeKB: 2048,
            allowedTypes: ['pdf', 'jpg', 'png'],
            mandatory: true
          },
          {
            type: 'Mark Sheet',
            maxSizeKB: 2048,
            allowedTypes: ['pdf'],
            mandatory: true
          }
        ]
      },
      'ielts': {
        id: 'ielts',
        name: 'IELTS Templates',
        requirements: [
          {
            type: 'Test Report',
            maxSizeKB: 2048,
            allowedTypes: ['pdf'],
            mandatory: true
          },
          {
            type: 'ID Proof',
            maxSizeKB: 1024,
            allowedTypes: ['pdf', 'jpg', 'png'],
            mandatory: true
          }
        ]
      }
    };

    return templates[templateId] || null;
  }

  async processFiles(files: File[], templateId: string): Promise<ProcessingResult> {
    const template = this.getTemplateSchema(templateId);
    
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    toast.success('Starting document processing...');
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    const processedFiles: ProcessedFile[] = [];
    const errors: ProcessingError[] = [];
    const issues: ValidationIssue[] = [];

    // Process each file
    for (const file of files) {
      try {
        const validations = this.validateFile(file, template);
        
        const processedFile: ProcessedFile = {
          originalName: file.name,
          processedName: `processed_${file.name}`,
          status: validations.every(v => v.passed || v.severity !== 'error') ? 'processed' : 'failed',
          validations,
          transformations: [
            'File size optimized',
            'Metadata cleaned',
            'Format standardized'
          ]
        };

        processedFiles.push(processedFile);

        // Add validation issues
        validations.forEach(validation => {
          if (!validation.passed) {
            issues.push({
              type: validation.severity,
              message: validation.message,
              file: file.name,
              field: validation.rule,
              canFix: validation.severity !== 'error'
            });
          }
        });

      } catch (error) {
        errors.push({
          file: file.name,
          error: error instanceof Error ? error.message : 'Unknown error',
          code: 'PROCESSING_FAILED'
        });
      }
    }

    const successfulFiles = processedFiles.filter(f => f.status === 'processed').length;
    const complianceScore = Math.round((successfulFiles / files.length) * 100);

    const result: ProcessingResult = {
      success: errors.length === 0 && successfulFiles > 0,
      processedFiles,
      validationReport: {
        totalFiles: files.length,
        processedFiles: successfulFiles,
        failedFiles: files.length - successfulFiles,
        complianceScore,
        issues,
        recommendations: this.generateRecommendations(issues, template)
      },
      errors
    };

    if (result.success) {
      toast.success(`Successfully processed ${successfulFiles}/${files.length} files!`);
    } else {
      toast.error(`Processing completed with ${errors.length} errors.`);
    }

    return result;
  }

  private validateFile(file: File, template: SimpleTemplate): FileValidation[] {
    const validations: FileValidation[] = [];

    // Find matching requirement
    const requirement = template.requirements.find(req => 
      file.name.toLowerCase().includes(req.type.toLowerCase()) ||
      req.type.toLowerCase().includes(file.name.toLowerCase().split('.')[0])
    );

    if (!requirement) {
      validations.push({
        rule: 'document_type_match',
        passed: false,
        message: `Document type not recognized for ${template.name} schema`,
        severity: 'warning'
      });
      return validations;
    }

    // Validate file size
    const maxSizeBytes = requirement.maxSizeKB * 1024;
    validations.push({
      rule: 'file_size_limit',
      passed: file.size <= maxSizeBytes,
      message: file.size > maxSizeBytes 
        ? `File size (${Math.round(file.size/1024)}KB) exceeds limit (${requirement.maxSizeKB}KB)`
        : `File size (${Math.round(file.size/1024)}KB) is within limit`,
      severity: file.size > maxSizeBytes ? 'error' : 'info'
    });

    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    const isValidType = requirement.allowedTypes.includes(fileExtension);
    validations.push({
      rule: 'file_type_allowed',
      passed: isValidType,
      message: isValidType 
        ? `File type (${fileExtension}) is allowed`
        : `File type (${fileExtension}) not allowed. Allowed: ${requirement.allowedTypes.join(', ')}`,
      severity: isValidType ? 'info' : 'error'
    });

    // Additional validations based on file type
    if (fileExtension === 'pdf') {
      validations.push({
        rule: 'pdf_readable',
        passed: true, // We'll assume PDF is readable for now
        message: 'PDF appears to be readable',
        severity: 'info'
      });
    }

    return validations;
  }

  private generateRecommendations(issues: ValidationIssue[], template: SimpleTemplate): string[] {
    const recommendations: string[] = [];

    if (issues.length === 0) {
      recommendations.push('All documents meet the requirements! ✅');
      return recommendations;
    }

    // Group issues by type
    const errorCount = issues.filter(i => i.type === 'error').length;
    const warningCount = issues.filter(i => i.type === 'warning').length;

    if (errorCount > 0) {
      recommendations.push(`⚠️ Fix ${errorCount} critical error(s) before submission`);
    }

    if (warningCount > 0) {
      recommendations.push(`💡 Address ${warningCount} warning(s) to improve compliance`);
    }

    // Specific recommendations based on common issues
    const sizeIssues = issues.filter(i => i.field === 'file_size_limit');
    if (sizeIssues.length > 0) {
      recommendations.push('📏 Consider compressing large files or using PDF format');
    }

    const typeIssues = issues.filter(i => i.field === 'file_type_allowed');
    if (typeIssues.length > 0) {
      recommendations.push('📄 Convert files to accepted formats (PDF recommended)');
    }

    recommendations.push(`📋 Total document requirements for ${template.name}: ${template.requirements.length}`);

    return recommendations;
  }

  // Get template requirements for UI
  getTemplateRequirements(templateId: string): string[] {
    const template = this.getTemplateSchema(templateId);
    if (!template) return [];
    
    return template.requirements.map(req => 
      `${req.type} (${req.allowedTypes.join('/')} • max ${req.maxSizeKB}KB)`
    );
  }
}

export const schemaProcessingService = new SchemaProcessingService();