/**
 * Phase 3: Visual Web Scraping Engine
 * Autonomous form discovery and analysis using computer vision
 */

'use client';

import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import html2canvas from 'html2canvas';
import { TextIntelligence } from '../intelligence/TextIntelligence';
import { DocumentClassifier } from '../intelligence/DocumentClassifier';

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'date' | 'file' | 'select' | 'checkbox' | 'radio';
  required: boolean;
  placeholder?: string;
  validation?: string;
  acceptedFormats?: string[];
  maxSize?: number;
}

export interface VisualRequirement {
  type: 'photo' | 'signature' | 'document';
  specifications: {
    background?: string;
    dimensions?: string;
    format?: string;
    quality?: string;
    content?: string[];
  };
  exampleImage?: string;
  confidence: number;
}

export interface ValidationRule {
  field: string;
  rules: {
    type: string;
    value: any;
    message: string;
  }[];
}

export interface IntelligentSchema {
  examId: string;
  examName: string;
  organizationName: string;
  formUrl: string;
  lastUpdated: Date;
  detectedFields: FormField[];
  visualRequirements: VisualRequirement[];
  inferredRules: ValidationRule[];
  exampleImages: {
    type: string;
    url: string;
    analysis: any;
  }[];
  confidence: number;
  metadata: {
    formComplexity: 'simple' | 'moderate' | 'complex';
    requiredDocuments: string[];
    estimatedProcessingTime: number;
    commonIssues: string[];
  };
}

export interface ChangeDetection {
  examId: string;
  changes: {
    type: 'field_added' | 'field_removed' | 'requirement_changed' | 'validation_updated';
    field?: string;
    oldValue?: any;
    newValue?: any;
    impact: 'low' | 'medium' | 'high';
    description: string;
  }[];
  overallImpact: 'minor' | 'moderate' | 'major';
  actionRequired: boolean;
  updateRecommendations: string[];
}

export class VisualFormAnalyzer {
  private browser: Browser | null = null;
  private textIntelligence: TextIntelligence;
  private documentClassifier: DocumentClassifier;
  
  constructor() {
    this.textIntelligence = new TextIntelligence();
    this.documentClassifier = new DocumentClassifier();
  }

  /**
   * Initialize browser for web scraping
   */
  private async initBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
    }
    return this.browser;
  }

  /**
   * Scrape form intelligently using visual analysis
   */
  async scrapeFormIntelligently(url: string): Promise<IntelligentSchema> {
    const browser = await this.initBrowser();
    const page = await browser.newPage();
    
    try {
      // Set viewport and navigate
      await page.setViewport({ width: 1920, height: 1080 });
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Get page metadata
      const examInfo = await this.extractExamInfo(page);
      
      // Analyze form structure
      const detectedFields = await this.analyzeFormFields(page);
      
      // Take screenshots of example images
      const exampleImages = await this.extractExampleImages(page);
      
      // Analyze visual requirements from examples
      const visualRequirements = await this.analyzeVisualRequirements(exampleImages);
      
      // Generate validation rules
      const inferredRules = await this.generateValidationRules(detectedFields, visualRequirements);
      
      // Calculate confidence and metadata
      const confidence = this.calculateSchemaConfidence(detectedFields, visualRequirements);
      const metadata = await this.generateMetadata(page, detectedFields);

      return {
        examId: this.generateExamId(examInfo.examName, examInfo.organizationName),
        examName: examInfo.examName,
        organizationName: examInfo.organizationName,
        formUrl: url,
        lastUpdated: new Date(),
        detectedFields,
        visualRequirements,
        inferredRules,
        exampleImages,
        confidence,
        metadata
      };
    } catch (error) {
      console.error('Form scraping failed:', error);
      throw new Error(`Failed to analyze form at ${url}: ${error}`);
    } finally {
      await page.close();
    }
  }

  /**
   * Monitor form changes by comparing with previous version
   */
  async monitorFormChanges(examId: string, previousSchema: IntelligentSchema): Promise<ChangeDetection> {
    const currentSchema = await this.scrapeFormIntelligently(previousSchema.formUrl);
    
    const changes = this.compareSchemas(previousSchema, currentSchema);
    const overallImpact = this.assessOverallImpact(changes);
    const actionRequired = changes.some(change => change.impact === 'high');
    const updateRecommendations = this.generateUpdateRecommendations(changes);

    return {
      examId,
      changes,
      overallImpact,
      actionRequired,
      updateRecommendations
    };
  }

  /**
   * Extract exam information from page
   */
  private async extractExamInfo(page: Page): Promise<{ examName: string; organizationName: string }> {
    const examInfo = await page.evaluate(() => {
      // Try multiple selectors for exam name
      const examNameSelectors = [
        'h1', 'h2', '.exam-title', '.form-title', '.page-title',
        '[class*="title"]', '[class*="heading"]', '[id*="title"]'
      ];
      
      let examName = '';
      for (const selector of examNameSelectors) {
        const element = document.querySelector(selector);
        if (element?.textContent?.trim()) {
          examName = element.textContent.trim();
          break;
        }
      }
      
      // Try multiple selectors for organization
      const orgSelectors = [
        '.organization', '.org-name', '.header .logo', '.brand',
        '[class*="organization"]', '[class*="agency"]'
      ];
      
      let organizationName = '';
      for (const selector of orgSelectors) {
        const element = document.querySelector(selector);
        if (element?.textContent?.trim()) {
          organizationName = element.textContent.trim();
          break;
        }
      }
      
      // Fallback: extract from URL or document title
      if (!examName) {
        examName = document.title || window.location.hostname;
      }
      
      if (!organizationName) {
        organizationName = window.location.hostname.replace('www.', '').split('.')[0];
      }
      
      return { examName, organizationName };
    });

    return examInfo;
  }

  /**
   * Analyze form fields using DOM analysis
   */
  private async analyzeFormFields(page: Page): Promise<FormField[]> {
    const fields = await page.evaluate(() => {
      const formFields: FormField[] = [];
      
      // Find all form elements
      const forms = document.querySelectorAll('form');
      const allInputs = document.querySelectorAll('input, select, textarea');
      
      allInputs.forEach((input, index) => {
        const element = input as HTMLElement;
        const id = element.id || `field_${index}`;
        
        // Get label
        let label = '';
        const labelElement = document.querySelector(`label[for="${element.id}"]`) as HTMLLabelElement;
        if (labelElement) {
          label = labelElement.textContent?.trim() || '';
        } else {
          // Look for nearby text
          const parent = element.parentElement;
          const siblings = parent?.children;
          if (siblings) {
            for (let i = 0; i < siblings.length; i++) {
              const sibling = siblings[i];
              if (sibling !== element && sibling.textContent?.trim()) {
                label = sibling.textContent.trim();
                break;
              }
            }
          }
        }
        
        // Determine field type
        const tagName = element.tagName.toLowerCase();
        let type: FormField['type'] = 'text';
        
        if (tagName === 'input') {
          const inputType = (element as HTMLInputElement).type;
          if (['text', 'email', 'date', 'file', 'checkbox', 'radio'].includes(inputType)) {
            type = inputType as FormField['type'];
          }
        } else if (tagName === 'select') {
          type = 'select';
        }
        
        // Check if required
        const required = element.hasAttribute('required') || 
                        element.getAttribute('aria-required') === 'true' ||
                        label.includes('*');
        
        // Get other attributes
        const placeholder = (element as HTMLInputElement).placeholder || '';
        const accept = element.getAttribute('accept') || '';
        
        formFields.push({
          id,
          label,
          type,
          required,
          placeholder,
          acceptedFormats: accept ? accept.split(',').map(f => f.trim()) : undefined
        });
      });
      
      return formFields;
    });

    return fields;
  }

  /**
   * Extract example images from the form page
   */
  private async extractExampleImages(page: Page): Promise<{ type: string; url: string; analysis: any }[]> {
    const images = await page.evaluate(() => {
      const exampleImages: { type: string; url: string; analysis: any }[] = [];
      
      // Look for images that might be examples
      const images = document.querySelectorAll('img');
      
      images.forEach((img, index) => {
        const src = img.src;
        const alt = img.alt || '';
        const className = img.className || '';
        
        // Detect if this might be an example image
        const isExample = alt.toLowerCase().includes('example') ||
                         alt.toLowerCase().includes('sample') ||
                         className.toLowerCase().includes('example') ||
                         className.toLowerCase().includes('sample') ||
                         src.includes('example') ||
                         src.includes('sample');
        
        if (isExample) {
          // Try to determine type from context
          let type = 'document';
          if (alt.toLowerCase().includes('photo') || alt.toLowerCase().includes('picture')) {
            type = 'photo';
          } else if (alt.toLowerCase().includes('signature')) {
            type = 'signature';
          }
          
          exampleImages.push({
            type,
            url: src,
            analysis: {
              alt,
              className,
              width: img.naturalWidth,
              height: img.naturalHeight
            }
          });
        }
      });
      
      return exampleImages;
    });

    return images;
  }

  /**
   * Analyze visual requirements from example images
   */
  private async analyzeVisualRequirements(exampleImages: { type: string; url: string; analysis: any }[]): Promise<VisualRequirement[]> {
    const requirements: VisualRequirement[] = [];
    
    for (const example of exampleImages) {
      try {
        // For now, we'll create basic requirements
        // In a full implementation, we'd use computer vision to analyze the actual images
        const requirement: VisualRequirement = {
          type: example.type as VisualRequirement['type'],
          specifications: this.inferSpecifications(example),
          exampleImage: example.url,
          confidence: 75 // Base confidence
        };
        
        requirements.push(requirement);
      } catch (error) {
        console.warn(`Failed to analyze example image: ${example.url}`, error);
      }
    }
    
    return requirements;
  }

  /**
   * Infer specifications from example image analysis
   */
  private inferSpecifications(example: { type: string; url: string; analysis: any }): VisualRequirement['specifications'] {
    const { analysis } = example;
    
    const specs: VisualRequirement['specifications'] = {};
    
    // Infer dimensions
    if (analysis.width && analysis.height) {
      const aspectRatio = analysis.width / analysis.height;
      if (aspectRatio > 1.5) {
        specs.dimensions = 'Landscape orientation recommended';
      } else if (aspectRatio < 0.7) {
        specs.dimensions = 'Portrait orientation recommended';
      } else {
        specs.dimensions = 'Square or near-square format';
      }
    }
    
    // Infer background requirements from context
    if (example.type === 'photo') {
      specs.background = 'Plain, light-colored background preferred';
      specs.quality = 'Clear, well-lit photograph';
      specs.content = ['Single person visible', 'Face clearly visible', 'Neutral expression'];
    } else if (example.type === 'signature') {
      specs.background = 'White or transparent background';
      specs.quality = 'Clear, legible signature';
      specs.content = ['Single signature only', 'Dark ink preferred'];
    } else {
      specs.background = 'Clean, uncluttered background';
      specs.quality = 'High resolution, clear text';
      specs.format = 'PDF or high-quality image';
    }
    
    return specs;
  }

  /**
   * Generate validation rules from analyzed fields and requirements
   */
  private async generateValidationRules(fields: FormField[], requirements: VisualRequirement[]): Promise<ValidationRule[]> {
    const rules: ValidationRule[] = [];
    
    fields.forEach(field => {
      const fieldRules: ValidationRule['rules'] = [];
      
      // Required field validation
      if (field.required) {
        fieldRules.push({
          type: 'required',
          value: true,
          message: `${field.label} is required`
        });
      }
      
      // File type validation
      if (field.type === 'file' && field.acceptedFormats) {
        fieldRules.push({
          type: 'fileTypes',
          value: field.acceptedFormats,
          message: `Only ${field.acceptedFormats.join(', ')} files are allowed`
        });
      }
      
      // Field-specific validation
      if (field.type === 'email') {
        fieldRules.push({
          type: 'email',
          value: true,
          message: 'Please enter a valid email address'
        });
      }
      
      if (fieldRules.length > 0) {
        rules.push({
          field: field.id,
          rules: fieldRules
        });
      }
    });
    
    // Add visual requirement rules
    requirements.forEach((req, index) => {
      const visualRules: ValidationRule['rules'] = [];
      
      if (req.specifications.background) {
        visualRules.push({
          type: 'backgroundCheck',
          value: req.specifications.background,
          message: `Background should be: ${req.specifications.background}`
        });
      }
      
      if (req.specifications.quality) {
        visualRules.push({
          type: 'qualityCheck',
          value: req.specifications.quality,
          message: `Quality requirement: ${req.specifications.quality}`
        });
      }
      
      if (visualRules.length > 0) {
        rules.push({
          field: `visual_requirement_${index}`,
          rules: visualRules
        });
      }
    });
    
    return rules;
  }

  /**
   * Calculate confidence score for the generated schema
   */
  private calculateSchemaConfidence(fields: FormField[], requirements: VisualRequirement[]): number {
    let confidence = 50; // Base confidence
    
    // Increase confidence based on number of detected fields
    confidence += Math.min(fields.length * 5, 30);
    
    // Increase confidence if we found labels for most fields
    const fieldsWithLabels = fields.filter(f => f.label && f.label.length > 0);
    const labelRatio = fieldsWithLabels.length / fields.length;
    confidence += labelRatio * 20;
    
    // Increase confidence based on visual requirements found
    confidence += requirements.length * 10;
    
    // Increase confidence if required fields are marked
    const requiredFields = fields.filter(f => f.required);
    if (requiredFields.length > 0) {
      confidence += 15;
    }
    
    return Math.min(Math.max(confidence, 0), 100);
  }

  /**
   * Generate metadata about the form
   */
  private async generateMetadata(page: Page, fields: FormField[]): Promise<IntelligentSchema['metadata']> {
    const complexity = this.assessFormComplexity(fields);
    const requiredDocuments = this.extractRequiredDocuments(fields);
    const estimatedTime = this.estimateProcessingTime(fields.length, complexity);
    
    return {
      formComplexity: complexity,
      requiredDocuments,
      estimatedProcessingTime: estimatedTime,
      commonIssues: [
        'Image quality too low',
        'Background not uniform',
        'Required fields missing',
        'File format not supported'
      ]
    };
  }

  /**
   * Assess form complexity based on field analysis
   */
  private assessFormComplexity(fields: FormField[]): 'simple' | 'moderate' | 'complex' {
    if (fields.length <= 5) return 'simple';
    if (fields.length <= 15) return 'moderate';
    return 'complex';
  }

  /**
   * Extract required documents from field analysis
   */
  private extractRequiredDocuments(fields: FormField[]): string[] {
    const documents: string[] = [];
    
    fields.forEach(field => {
      if (field.type === 'file' && field.required) {
        const label = field.label.toLowerCase();
        if (label.includes('photo') || label.includes('picture')) {
          documents.push('Passport Photo');
        } else if (label.includes('signature')) {
          documents.push('Signature');
        } else if (label.includes('certificate')) {
          documents.push('Certificate');
        } else if (label.includes('id') || label.includes('identity')) {
          documents.push('ID Document');
        } else {
          documents.push(field.label);
        }
      }
    });
    
    return [...new Set(documents)]; // Remove duplicates
  }

  /**
   * Estimate processing time based on form complexity
   */
  private estimateProcessingTime(fieldCount: number, complexity: string): number {
    const baseTime = 5; // 5 minutes base
    const fieldMultiplier = fieldCount * 0.5;
    const complexityMultiplier = complexity === 'simple' ? 1 : complexity === 'moderate' ? 1.5 : 2;
    
    return Math.round(baseTime + fieldMultiplier * complexityMultiplier);
  }

  /**
   * Compare two schemas to detect changes
   */
  private compareSchemas(oldSchema: IntelligentSchema, newSchema: IntelligentSchema): ChangeDetection['changes'] {
    const changes: ChangeDetection['changes'] = [];
    
    // Compare fields
    const oldFields = new Map(oldSchema.detectedFields.map(f => [f.id, f]));
    const newFields = new Map(newSchema.detectedFields.map(f => [f.id, f]));
    
    // Check for added fields
    newFields.forEach((field, id) => {
      if (!oldFields.has(id)) {
        changes.push({
          type: 'field_added',
          field: id,
          newValue: field,
          impact: field.required ? 'high' : 'medium',
          description: `New field added: ${field.label}`
        });
      }
    });
    
    // Check for removed fields
    oldFields.forEach((field, id) => {
      if (!newFields.has(id)) {
        changes.push({
          type: 'field_removed',
          field: id,
          oldValue: field,
          impact: field.required ? 'high' : 'low',
          description: `Field removed: ${field.label}`
        });
      }
    });
    
    // Check for field changes
    oldFields.forEach((oldField, id) => {
      const newField = newFields.get(id);
      if (newField) {
        if (oldField.required !== newField.required) {
          changes.push({
            type: 'requirement_changed',
            field: id,
            oldValue: oldField.required,
            newValue: newField.required,
            impact: 'high',
            description: `Field ${oldField.label} requirement changed from ${oldField.required} to ${newField.required}`
          });
        }
      }
    });
    
    return changes;
  }

  /**
   * Assess overall impact of changes
   */
  private assessOverallImpact(changes: ChangeDetection['changes']): 'minor' | 'moderate' | 'major' {
    const highImpactChanges = changes.filter(c => c.impact === 'high').length;
    const mediumImpactChanges = changes.filter(c => c.impact === 'medium').length;
    
    if (highImpactChanges >= 3) return 'major';
    if (highImpactChanges >= 1 || mediumImpactChanges >= 3) return 'moderate';
    return 'minor';
  }

  /**
   * Generate update recommendations based on changes
   */
  private generateUpdateRecommendations(changes: ChangeDetection['changes']): string[] {
    const recommendations: string[] = [];
    
    const highImpactChanges = changes.filter(c => c.impact === 'high');
    if (highImpactChanges.length > 0) {
      recommendations.push('Immediate schema update required due to high-impact changes');
      recommendations.push('Review and update validation rules');
      recommendations.push('Test document submission flows');
    }
    
    const fieldChanges = changes.filter(c => c.type.includes('field'));
    if (fieldChanges.length > 0) {
      recommendations.push('Update form field mappings');
      recommendations.push('Review user interface for new/removed fields');
    }
    
    const requirementChanges = changes.filter(c => c.type === 'requirement_changed');
    if (requirementChanges.length > 0) {
      recommendations.push('Update field validation logic');
      recommendations.push('Notify users of changed requirements');
    }
    
    return recommendations;
  }

  /**
   * Generate unique exam ID
   */
  private generateExamId(examName: string, orgName: string): string {
    const cleanExam = examName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const cleanOrg = orgName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const timestamp = Date.now().toString(36);
    return `${cleanOrg}_${cleanExam}_${timestamp}`;
  }

  /**
   * Cleanup browser resources
   */
  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}