/**
 * OCR Service Test
 * Simple test to validate OCR functionality
 */

// This would typically be run in a browser environment
export const testOCRService = async () => {
  try {
    // Import OCR service (dynamic import for client-side)
    const { ocrService } = await import('@/features/ocr/OCRService');
    
    console.log('🧪 Starting OCR Service Tests...');
    
    // Test 1: Check supported languages
    const languages = ocrService.getSupportedLanguages();
    console.log(`✅ Supported languages: ${languages.length} languages loaded`);
    console.log('📋 Sample languages:', languages.slice(0, 5).map(l => l.name).join(', '));
    
    // Test 2: Initialize OCR with English
    console.log('🚀 Initializing OCR with English...');
    await ocrService.initialize(['eng']);
    console.log('✅ OCR initialization successful');
    
    // Test 3: Create a simple test image (text canvas)
    console.log('🎨 Creating test image...');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    
    canvas.width = 400;
    canvas.height = 100;
    
    // Fill with white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 400, 100);
    
    // Add black text
    ctx.fillStyle = 'black';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Hello World! This is a test.', 200, 50);
    
    // Test 4: Process the test image
    console.log('👁️ Processing test image with OCR...');
    const result = await ocrService.processImage(canvas, {
      languages: ['eng']
    });
    
    console.log('✅ OCR processing complete!');
    console.log(`📄 Extracted text: "${result.text.trim()}"`);
    console.log(`🎯 Confidence: ${result.confidence.toFixed(1)}%`);
    console.log(`🔤 Words found: ${result.words?.length || 0}`);
    
    // Test 5: Cleanup
    await ocrService.terminate();
    console.log('🧹 OCR service terminated successfully');
    
    return {
      success: true,
      extractedText: result.text.trim(),
      confidence: result.confidence,
      wordCount: result.words?.length || 0
    };
    
  } catch (error) {
    console.error('❌ OCR test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Browser console test function
if (typeof window !== 'undefined') {
  (window as any).testOCR = testOCRService;
  console.log('🎯 OCR test available! Run window.testOCR() in browser console to test.');
}