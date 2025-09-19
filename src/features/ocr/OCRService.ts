/**
 * Free OCR Service using Tesseract.js
 * Extracts text from images completely offline and for free
 */

'use client';

import { createWorker, Worker, PSM, OEM, createScheduler, Scheduler } from 'tesseract.js';
import toast from 'react-hot-toast';

export interface OCRResult {
  text: string;
  confidence: number;
  words?: Array<{
    text: string;
    confidence: number;
    bbox: { x0: number; y0: number; x1: number; y1: number };
  }>;
  lines?: Array<{
    text: string;
    confidence: number;
    bbox: { x0: number; y0: number; x1: number; y1: number };
  }>;
  paragraphs?: Array<{
    text: string;
    confidence: number;
    bbox: { x0: number; y0: number; x1: number; y1: number };
  }>;
}

export interface OCRProgress {
  status: string;
  progress: number;
  userJobId: string;
}

export interface OCROptions {
  languages: string[]; // e.g., ['eng', 'hin', 'fra']
  psm?: PSM; // Page Segmentation Mode
  oem?: OEM; // OCR Engine Mode
  preserveInterword?: boolean;
  rotateAuto?: boolean;
  rectangle?: { left: number; top: number; width: number; height: number };
}

class OCRService {
  private workers: Map<string, Worker> = new Map();
  private scheduler: Scheduler | null = null;
  private isInitialized = false;
  private supportedLanguages = [
    { code: 'eng', name: 'English', flag: '🇺🇸' },
    { code: 'hin', name: 'Hindi', flag: '🇮🇳' },
    { code: 'spa', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fra', name: 'French', flag: '🇫🇷' },
    { code: 'deu', name: 'German', flag: '🇩🇪' },
    { code: 'chi_sim', name: 'Chinese (Simplified)', flag: '🇨🇳' },
    { code: 'chi_tra', name: 'Chinese (Traditional)', flag: '🇹🇼' },
    { code: 'jpn', name: 'Japanese', flag: '🇯🇵' },
    { code: 'kor', name: 'Korean', flag: '🇰🇷' },
    { code: 'ara', name: 'Arabic', flag: '🇸🇦' },
    { code: 'rus', name: 'Russian', flag: '🇷🇺' },
    { code: 'por', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'ita', name: 'Italian', flag: '🇮🇹' },
    { code: 'pol', name: 'Polish', flag: '🇵🇱' },
    { code: 'nld', name: 'Dutch', flag: '🇳🇱' },
    { code: 'tur', name: 'Turkish', flag: '🇹🇷' },
    { code: 'vie', name: 'Vietnamese', flag: '🇻🇳' },
    { code: 'tha', name: 'Thai', flag: '🇹🇭' },
    { code: 'ben', name: 'Bengali', flag: '🇧🇩' },
    { code: 'tam', name: 'Tamil', flag: '🇮🇳' },
    { code: 'tel', name: 'Telugu', flag: '🇮🇳' },
    { code: 'mar', name: 'Marathi', flag: '🇮🇳' },
    { code: 'guj', name: 'Gujarati', flag: '🇮🇳' },
    { code: 'kan', name: 'Kannada', flag: '🇮🇳' },
    { code: 'mal', name: 'Malayalam', flag: '🇮🇳' },
    { code: 'ori', name: 'Odia', flag: '🇮🇳' },
    { code: 'pan', name: 'Punjabi', flag: '🇮🇳' },
    { code: 'urd', name: 'Urdu', flag: '🇵🇰' },
  ];

  async initialize(languages: string[] = ['eng']): Promise<void> {
    if (this.isInitialized) return;

    try {
      toast.loading('Initializing OCR engine...', { id: 'ocr-init' });

      // Create scheduler for better performance with multiple workers
      this.scheduler = createScheduler();

      // Create workers for each language
      const workerPromises = languages.map(async (lang) => {
        const worker = await createWorker(lang, 1, {
          logger: (m) => this.handleWorkerLog(m),
          errorHandler: (err) => this.handleWorkerError(err),
        });

        // Configure worker for better performance
        await worker.setParameters({
          tessedit_pageseg_mode: PSM.AUTO,
          tessedit_ocr_engine_mode: OEM.LSTM_ONLY,
          tessedit_char_whitelist: '', // Allow all characters
          preserve_interword_spaces: '1',
        });

        this.workers.set(lang, worker);
        this.scheduler!.addWorker(worker);
        return worker;
      });

      await Promise.all(workerPromises);

      this.isInitialized = true;
      toast.success(`OCR engine ready! Loaded ${languages.length} language(s)`, { 
        id: 'ocr-init',
        icon: '👁️',
        duration: 3000
      });

    } catch (error) {
      console.error('OCR initialization failed:', error);
      toast.error('Failed to initialize OCR engine', { id: 'ocr-init' });
      throw error;
    }
  }

  async processImage(
    imageFile: File | string | HTMLCanvasElement | HTMLImageElement,
    options: OCROptions = { languages: ['eng'] }
  ): Promise<OCRResult> {
    if (!this.isInitialized) {
      await this.initialize(options.languages);
    }

    const startTime = Date.now();
    const toastId = `ocr-${Date.now()}`;

    try {
      toast.loading('Processing image with OCR...', { id: toastId });

      // Configure recognition options
      const recognizeOptions: any = {
        rectangle: options.rectangle,
      };

      // Set page segmentation mode if specified
      if (options.psm !== undefined) {
        await this.setWorkerParameter('tessedit_pageseg_mode', options.psm);
      }

      // Perform OCR - use scheduler if available, otherwise use single worker
      let result;
      if (this.scheduler) {
        result = await this.scheduler.addJob('recognize', imageFile, recognizeOptions);
      } else {
        const worker = this.workers.get(options.languages[0]);
        if (!worker) {
          throw new Error('No OCR worker available');
        }
        result = await worker.recognize(imageFile, recognizeOptions);
      }

      const processingTime = (Date.now() - startTime) / 1000;
      const wordCount = (result.data as any).words?.length || 0;
      const confidence = Math.round(result.data.confidence);

      toast.success(
        `OCR completed! ${wordCount} words extracted (${confidence}% confidence) in ${processingTime.toFixed(1)}s`, 
        { 
          id: toastId,
          icon: '✨',
          duration: 5000
        }
      );

      // Return structured result
      return {
        text: result.data.text.trim(),
        confidence: result.data.confidence,
        words: (result.data as any).words?.map((word: any) => ({
          text: word.text,
          confidence: word.confidence,
          bbox: word.bbox,
        })),
        lines: (result.data as any).lines?.map((line: any) => ({
          text: line.text,
          confidence: line.confidence,
          bbox: line.bbox,
        })),
        paragraphs: (result.data as any).paragraphs?.map((para: any) => ({
          text: para.text,
          confidence: para.confidence,
          bbox: para.bbox,
        })),
      };

    } catch (error) {
      console.error('OCR processing failed:', error);
      toast.error('OCR processing failed', { 
        id: toastId,
        icon: '❌' 
      });
      throw error;
    }
  }

  async processMultipleImages(
    images: File[],
    options: OCROptions = { languages: ['eng'] }
  ): Promise<{ file: File; result: OCRResult; error?: string }[]> {
    if (!this.isInitialized) {
      await this.initialize(options.languages);
    }

    const results = [];
    const totalImages = images.length;

    toast.loading(`Processing ${totalImages} images with OCR...`, { id: 'batch-ocr' });

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      
      try {
        const result = await this.processImage(image, options);
        results.push({ file: image, result });

        // Update progress
        toast.loading(`Processing image ${i + 1}/${totalImages}...`, { id: 'batch-ocr' });

      } catch (error) {
        results.push({ 
          file: image, 
          result: { text: '', confidence: 0 },
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = results.filter(r => !r.error).length;
    toast.success(`Batch OCR completed! ${successCount}/${totalImages} images processed`, {
      id: 'batch-ocr',
      icon: '🔥',
      duration: 4000
    });

    return results;
  }

  async extractTextFromRegion(
    imageFile: File,
    region: { x: number; y: number; width: number; height: number },
    options: OCROptions = { languages: ['eng'] }
  ): Promise<OCRResult> {
    const regionOptions = {
      ...options,
      rectangle: {
        left: region.x,
        top: region.y,
        width: region.width,
        height: region.height,
      },
    };

    return this.processImage(imageFile, regionOptions);
  }

  async preprocessImage(file: File, options: {
    enhanceContrast?: boolean;
    removeNoise?: boolean;
    sharpen?: boolean;
    threshold?: number;
  } = {}): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx!.drawImage(img, 0, 0);

        let imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height);

        // Apply preprocessing filters
        if (options.enhanceContrast) {
          imageData = this.enhanceContrast(imageData);
        }

        if (options.removeNoise) {
          imageData = this.removeNoise(imageData);
        }

        if (options.sharpen) {
          imageData = this.sharpenImage(imageData);
        }

        if (options.threshold !== undefined) {
          imageData = this.applyThreshold(imageData, options.threshold);
        }

        ctx!.putImageData(imageData, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            const processedFile = new File([blob], `preprocessed_${file.name}`, {
              type: 'image/png',
              lastModified: Date.now(),
            });
            resolve(processedFile);
          } else {
            reject(new Error('Failed to preprocess image'));
          }
        }, 'image/png');
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  getSupportedLanguages() {
    return this.supportedLanguages;
  }

  async terminate(): Promise<void> {
    try {
      // Terminate all workers
      const terminatePromises = Array.from(this.workers.values()).map(worker => 
        worker.terminate()
      );

      await Promise.all(terminatePromises);

      // Terminate scheduler
      if (this.scheduler) {
        await this.scheduler.terminate();
        this.scheduler = null;
      }

      this.workers.clear();
      this.isInitialized = false;

      console.log('OCR service terminated successfully');
    } catch (error) {
      console.error('Error terminating OCR service:', error);
    }
  }

  // Private helper methods

  private handleWorkerLog(message: any) {
    if (message.status === 'recognizing text') {
      const progress = Math.round(message.progress * 100);
      console.log(`OCR Progress: ${progress}%`);
    }
  }

  private handleWorkerError(error: any) {
    console.error('OCR Worker Error:', error);
  }

  private async setWorkerParameter(key: string, value: any): Promise<void> {
    const promises = Array.from(this.workers.values()).map(worker =>
      worker.setParameters({ [key]: value })
    );
    await Promise.all(promises);
  }

  private enhanceContrast(imageData: ImageData): ImageData {
    const data = imageData.data;
    const factor = 1.5; // Contrast factor

    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, (data[i] - 128) * factor + 128));     // R
      data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * factor + 128)); // G
      data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * factor + 128)); // B
    }

    return imageData;
  }

  private removeNoise(imageData: ImageData): ImageData {
    // Simple noise reduction using median filter
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const newData = new Uint8ClampedArray(data);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        // Get surrounding pixels
        const pixels = [];
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const i = ((y + dy) * width + (x + dx)) * 4;
            pixels.push(data[i]); // R channel
          }
        }
        
        // Apply median filter
        pixels.sort((a, b) => a - b);
        const median = pixels[4]; // Middle value
        
        newData[idx] = median;     // R
        newData[idx + 1] = median; // G
        newData[idx + 2] = median; // B
      }
    }

    return new ImageData(newData, width, height);
  }

  private sharpenImage(imageData: ImageData): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const newData = new Uint8ClampedArray(data);

    // Sharpening kernel
    const kernel = [
      0, -1, 0,
      -1, 5, -1,
      0, -1, 0
    ];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        let sum = 0;

        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const ki = (ky + 1) * 3 + (kx + 1);
            const pi = ((y + ky) * width + (x + kx)) * 4;
            sum += data[pi] * kernel[ki];
          }
        }

        sum = Math.min(255, Math.max(0, sum));
        newData[idx] = sum;     // R
        newData[idx + 1] = sum; // G
        newData[idx + 2] = sum; // B
      }
    }

    return new ImageData(newData, width, height);
  }

  private applyThreshold(imageData: ImageData, threshold: number): ImageData {
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      // Convert to grayscale
      const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
      
      // Apply threshold
      const binary = gray > threshold ? 255 : 0;
      
      data[i] = binary;     // R
      data[i + 1] = binary; // G
      data[i + 2] = binary; // B
    }

    return imageData;
  }
}

// Export singleton instance
export const ocrService = new OCRService();