'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  CheckIcon, 
  DocumentTextIcon, 
  CloudArrowUpIcon, 
  ShieldCheckIcon,
  DevicePhoneMobileIcon,
  CogIcon,
  BoltIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

// Types
interface StepCardProps {
  number: string;
  icon: string;
  title: string;
  description: string;
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface ExamCardProps {
  icon: string;
  title: string;
  description: string;
}

// Components
const StepCard: React.FC<StepCardProps> = ({ number, icon, title, description }) => (
  <div className="relative bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
    <div className="absolute -top-4 left-8 bg-gradient-to-r from-indigo-500 to-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm">
      {number}
    </div>
    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-4xl">
      {icon}
    </div>
    <h3 className="text-xl font-semibold mb-4 text-gray-900">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </div>
);

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
  <div className="flex gap-6 p-8 rounded-2xl transition-all duration-300 hover:bg-gray-50 hover:-translate-y-1 border border-gray-100">
    <div className="w-15 h-15 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center flex-shrink-0">
      {icon}
    </div>
    <div>
      <h3 className="text-xl font-semibold mb-3 text-gray-900">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  </div>
);

const ExamCard: React.FC<ExamCardProps> = ({ icon, title, description }) => (
  <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-2xl text-center transition-all duration-300 hover:bg-white/15 hover:-translate-y-1">
    <div className="w-20 h-20 mx-auto mb-5 rounded-xl bg-white/10 flex items-center justify-center text-4xl">
      {icon}
    </div>
    <h3 className="text-xl font-semibold mb-3 text-white">{title}</h3>
    <p className="text-white/80 text-sm leading-relaxed">{description}</p>
  </div>
);

// Main Landing Page Component
const LandingPage: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleGetStarted = () => {
    // Integration point for your auth flow
    window.location.href = '/auth/signup';
  };

  const handleSignIn = () => {
    // Integration point for your auth flow
    window.location.href = '/auth/signin';
  };

  const handleTryAsGuest = () => {
    // Integration point for your guest flow
    window.location.href = '/app?guest=true';
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed w-full top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <nav className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-3 font-bold text-xl text-gray-900">
              <span className="text-2xl">📋</span>
              <span>ExamDoc Uploader</span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors relative group">
                Features
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-600 transition-all group-hover:w-full"></span>
              </Link>
              <Link href="#exams" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors relative group">
                Supported Exams
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-600 transition-all group-hover:w-full"></span>
              </Link>
              <Link href="#pricing" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors relative group">
                Pricing
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-600 transition-all group-hover:w-full"></span>
              </Link>
              <Link href="#contact" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors relative group">
                Contact
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-600 transition-all group-hover:w-full"></span>
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <button 
                onClick={handleSignIn}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-600 font-medium hover:border-indigo-500 hover:text-indigo-600 transition-all hover:-translate-y-0.5"
              >
                Sign In
              </button>
              <button 
                onClick={handleGetStarted}
                className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-lg shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all hover:-translate-y-0.5"
              >
                Get Started
              </button>
            </div>

            <button 
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <div className="w-6 h-6 flex flex-col justify-center space-y-1">
                <span className="w-6 h-0.5 bg-gray-900 transition-all"></span>
                <span className="w-6 h-0.5 bg-gray-900 transition-all"></span>
                <span className="w-6 h-0.5 bg-gray-900 transition-all"></span>
              </div>
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-24 bg-gradient-to-br from-indigo-600 via-purple-600 to-purple-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><defs><pattern id=\"grain\" width=\"100\" height=\"100\" patternUnits=\"userSpaceOnUse\"><circle cx=\"25\" cy=\"25\" r=\"1\" fill=\"rgba(255,255,255,0.1)\"/><circle cx=\"75\" cy=\"75\" r=\"1\" fill=\"rgba(255,255,255,0.05)\"/><circle cx=\"50\" cy=\"10\" r=\"0.5\" fill=\"rgba(255,255,255,0.1)\"/></pattern></defs><rect width=\"100\" height=\"100\" fill=\"url(%23grain)\"/></svg>')] opacity-30"></div>
        
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="text-center py-24">
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
              Schema-aware document validation for competitive exams
            </h1>
            <p className="text-lg md:text-xl mb-12 max-w-4xl mx-auto opacity-95 leading-relaxed">
              Upload your files, validate them instantly, and download a submission-ready ZIP — all in one flow. 
              Built specifically for SSC, UPSC, and IELTS document requirements.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-5 justify-center mb-12">
              <button 
                onClick={handleGetStarted}
                className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-semibold text-lg shadow-2xl shadow-black/20 hover:shadow-3xl hover:shadow-black/30 transition-all hover:-translate-y-1"
              >
                Get Started Free
              </button>
              <button 
                onClick={handleSignIn}
                className="bg-white/10 backdrop-blur-lg text-white px-8 py-4 border-2 border-white/30 rounded-xl font-semibold text-lg transition-all hover:bg-white/20 hover:border-white/50 hover:-translate-y-0.5"
              >
                Sign In
              </button>
            </div>
            
            <div className="text-white/80 text-sm">
              <p>or</p>
              <button 
                onClick={handleTryAsGuest}
                className="text-white underline font-medium hover:text-gray-100 transition-colors"
              >
                Try as Guest (no account required)
              </button>
              <div className="text-xs text-white/70 mt-2">
                Limited features • Files not saved • No document history
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5">How It Works</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Three simple steps to get your exam documents submission-ready
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <StepCard 
              number="1"
              icon="🎯"
              title="Select Exam"
              description="Choose your exam type (UPSC, SSC, IELTS) and we'll load the specific document requirements and validation rules for your submission."
            />
            <StepCard 
              number="2"
              icon="📁"
              title="Upload Files"
              description="Drag and drop your documents. Our system validates format, size, dimensions, and compliance with exam-specific requirements in real-time."
            />
            <StepCard 
              number="3"
              icon="📦"
              title="Download ZIP"
              description="Get your validated documents packaged in a properly named ZIP file, ready for submission with your roll number and exam details."
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5">Powerful Features for Exam Success</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Everything you need to ensure your documents meet exact exam requirements
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 mt-16">
            <FeatureCard 
              icon={<BoltIcon className="w-6 h-6" />}
              title="Real-time Validation"
              description="Instant feedback on file format, size, dimensions, and naming conventions. Know immediately if your documents meet requirements."
            />
            <FeatureCard 
              icon={<ArrowPathIcon className="w-6 h-6" />}
              title="Dynamic Schema Loading"
              description="Our system automatically loads the latest document requirements for each exam type, ensuring you're always compliant."
            />
            <FeatureCard 
              icon={<DevicePhoneMobileIcon className="w-6 h-6" />}
              title="Mobile-Friendly"
              description="Upload and validate documents from any device. Perfect for students on the go who need quick document processing."
            />
            <FeatureCard 
              icon={<ShieldCheckIcon className="w-6 h-6" />}
              title="Secure Processing"
              description="Your documents are processed securely and never stored permanently. Privacy and security are our top priorities."
            />
            <FeatureCard 
              icon={<DocumentTextIcon className="w-6 h-6" />}
              title="Roll Number Packaging"
              description="Automatically organize your documents with proper roll number naming and folder structure required by exam boards."
            />
            <FeatureCard 
              icon={<CogIcon className="w-6 h-6" />}
              title="CLI Integration"
              description="Advanced users can leverage our command-line interface for batch processing and automated workflows."
            />
          </div>
        </div>
      </section>

      {/* Supported Exams */}
      <section id="exams" className="py-24 bg-gradient-to-br from-gray-800 to-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-5">Supported Competitive Exams</h2>
            <p className="text-lg text-white/80 max-w-3xl mx-auto">
              Specialized support for India's major competitive examinations
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8 mt-16">
            <ExamCard 
              icon="🏛️"
              title="UPSC"
              description="Union Public Service Commission - Civil Services, Engineering Services, and other central government exams"
            />
            <ExamCard 
              icon="📊"
              title="SSC"
              description="Staff Selection Commission - CGL, CHSL, MTS, and other staff selection examinations"
            />
            <ExamCard 
              icon="🌍"
              title="IELTS"
              description="International English Language Testing System - Academic and General Training modules"
            />
            <ExamCard 
              icon="🔧"
              title="More Coming Soon"
              description="Banking, Railway, State PSC, and other competitive exam support in development"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-5">Ready to streamline your exam submissions?</h2>
          <p className="text-lg mb-10 opacity-90">
            Join thousands of students who trust ExamDoc Uploader for their document validation needs
          </p>
          <button 
            onClick={handleGetStarted}
            className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-semibold text-lg shadow-2xl hover:shadow-3xl transition-all hover:-translate-y-1"
          >
            Start Validating Documents
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">📋</span>
                ExamDoc Uploader
              </h3>
              <p className="text-gray-400 leading-relaxed mb-5">
                Schema-aware document validation and packaging for competitive exams. 
                Built by students, for students.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#features" className="text-gray-400 hover:text-indigo-400 transition-colors">Features</Link></li>
                <li><Link href="#exams" className="text-gray-400 hover:text-indigo-400 transition-colors">Supported Exams</Link></li>
                <li><Link href="/api" className="text-gray-400 hover:text-indigo-400 transition-colors">API Access</Link></li>
                <li><Link href="/cli" className="text-gray-400 hover:text-indigo-400 transition-colors">CLI Tools</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="text-gray-400 hover:text-indigo-400 transition-colors">About</Link></li>
                <li><Link href="/privacy" className="text-gray-400 hover:text-indigo-400 transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="text-gray-400 hover:text-indigo-400 transition-colors">Terms</Link></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-indigo-400 transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-6 text-center text-gray-400">
            <p>© 2024 ExamDoc Uploader. Made with ❤️ for exam success.</p>
            <div className="flex items-center justify-center gap-4 mt-2 text-sm flex-wrap">
              <span>Made by Abhinav</span>
              <span>•</span>
              <span>Powered by Registry Engine</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;