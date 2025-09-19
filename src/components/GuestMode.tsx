'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { User, AlertTriangle, Zap, FileText, Package, Globe, GraduationCap, BookOpen } from 'lucide-react'

// Types matching your existing schemas
interface ExamType {
  id: 'ssc' | 'upsc' | 'ielts' | 'cat' | 'gate' | 'neet'
  name: string
  description: string
  icon: React.ReactNode
  category: 'government' | 'entrance' | 'language'
}

interface GuestModeProps {
  onExamSelect?: (examType: string) => void
  isLoading?: boolean
  redirectTo?: string
}

// Floating background elements component
const FloatingElements: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className={`absolute rounded-full bg-white/5 ${
            i === 0 ? 'w-20 h-20 left-[10%] animate-bounce' :
            i === 1 ? 'w-16 h-16 left-[80%] animate-pulse' :
            'w-24 h-24 left-[60%] animate-ping'
          }`}
          style={{
            animationDelay: `${i * 5}s`,
            animationDuration: '15s'
          }}
        />
      ))}
    </div>
  )
}

// Background pattern component using Tailwind
const BackgroundPattern: React.FC = () => {
  return (
    <div className="absolute inset-0 opacity-30">
      <div className="w-full h-full bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.1)_1px,transparent_1px),radial-gradient(circle_at_80%_50%,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[length:50px_50px] animate-pulse" />
    </div>
  )
}

// Guest indicator component
const GuestIndicator: React.FC = () => {
  return (
    <div className="flex items-center bg-white/15 backdrop-blur-xl px-5 py-3 rounded-full border border-white/20 text-white font-medium transition-all duration-300 hover:bg-white/20 hover:-translate-y-0.5 shadow-lg">
      <div className="w-6 h-6 mr-3 bg-white/30 rounded-full flex items-center justify-center">
        <User size={14} />
      </div>
      <div>
        <div className="font-semibold text-sm">Guest Mode</div>
        <div className="text-xs opacity-80">Files won't be saved permanently</div>
      </div>
    </div>
  )
}

// Auth buttons component with NextAuth integration
interface AuthButtonsProps {
  redirectTo?: string
}

const AuthButtons: React.FC<AuthButtonsProps> = ({ redirectTo }) => {
  const router = useRouter()

  const handleSignIn = async () => {
    await signIn(undefined, { 
      callbackUrl: redirectTo || '/dashboard',
      redirect: true 
    })
  }

  const handleCreateAccount = () => {
    router.push('/auth/signup')
  }

  return (
    <div className="flex gap-4">
      <button
        onClick={handleSignIn}
        className="px-6 py-3 rounded-full font-semibold text-sm text-white bg-white/10 border-2 border-white/30 backdrop-blur-xl transition-all duration-300 hover:bg-white/20 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-white/50"
      >
        Sign In
      </button>
      <button
        onClick={handleCreateAccount}
        className="px-6 py-3 rounded-full font-semibold text-sm text-white bg-gradient-to-r from-blue-400 to-cyan-400 shadow-lg shadow-blue-500/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
      >
        Create Account
      </button>
    </div>
  )
}

// Limitations card component
interface LimitationsCardProps {
  onUpgrade?: () => void
}

const LimitationsCard: React.FC<LimitationsCardProps> = ({ onUpgrade }) => {
  const router = useRouter()

  const limitations = [
    'Files are processed locally and not saved permanently',
    'No document history or cloud backup',
    'Limited to basic validation features',
    'No personalized DOP bands (manual name entry required)'
  ]

  const handleUpgrade = () => {
    router.push('/auth/signup')
  }

  return (
    <div className="relative bg-white/95 backdrop-blur-2xl rounded-2xl p-8 mb-12 border border-white/30 shadow-xl max-w-lg w-full overflow-hidden">
      {/* Animated top border using Tailwind */}
      <div className="absolute top-0 left-0 right-0 h-1">
        <div className="w-full h-full bg-gradient-to-r from-red-400 via-yellow-400 via-blue-400 to-pink-400 animate-gradient-shift" />
      </div>
      
      <div className="flex items-center mb-6 text-gray-800">
        <div className="w-7 h-7 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center mr-3 text-white">
          <AlertTriangle size={16} />
        </div>
        <h3 className="text-xl font-bold">Guest Mode Limitations</h3>
      </div>
      
      <ul className="space-y-3 text-left mb-6">
        {limitations.map((limitation, index) => (
          <li key={index} className="flex items-start text-gray-600 text-sm leading-relaxed">
            <span className="text-red-400 font-bold mr-3 mt-1 select-none">•</span>
            {limitation}
          </li>
        ))}
      </ul>
      
      <div className="pt-6 border-t border-gray-200 text-center">
        <button
          onClick={handleUpgrade}
          className="inline-flex items-center bg-gradient-to-r from-red-400 to-orange-500 text-white px-7 py-3.5 rounded-full font-semibold text-sm transition-all duration-300 hover:-translate-y-0.5 shadow-lg hover:shadow-xl shadow-red-500/30 hover:shadow-red-500/40 mb-2 focus:outline-none focus:ring-2 focus:ring-red-400/50"
        >
          <Zap size={16} className="mr-2" />
          Upgrade to Full Account
        </button>
        <div className="text-xs text-gray-500 font-medium">Free • Takes 30 seconds</div>
      </div>
    </div>
  )
}

// Exam card component
interface ExamCardProps {
  exam: ExamType
  isSelected: boolean
  onClick: () => void
  isAnimating: boolean
}

const ExamCard: React.FC<ExamCardProps> = ({ exam, isSelected, onClick, isAnimating }) => {
  return (
    <div
      onClick={onClick}
      className={`
        relative bg-white/95 backdrop-blur-2xl rounded-2xl p-8 text-center border border-white/30 
        transition-all duration-300 cursor-pointer overflow-hidden group
        hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/20
        ${isSelected ? 'bg-gradient-to-br from-blue-400 to-cyan-400 text-white scale-105 shadow-2xl shadow-blue-500/40' : ''}
        ${isAnimating ? 'scale-95' : ''}
      `}
    >
      {/* Hover shine effect using Tailwind */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
      
      <div className={`
        w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center text-2xl transition-all duration-300
        ${isSelected ? 'bg-white/20 text-white' : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'}
        group-hover:scale-110 group-hover:rotate-3
      `}>
        {exam.icon}
      </div>
      
      <h3 className={`text-xl font-bold mb-2 ${isSelected ? 'text-white' : 'text-gray-800'}`}>
        {exam.name}
      </h3>
      <p className={`text-sm leading-relaxed ${isSelected ? 'text-white/90' : 'text-gray-600'}`}>
        {exam.description}
      </p>
      
      {/* Category badge */}
      <div className={`
        inline-block mt-3 px-3 py-1 rounded-full text-xs font-medium
        ${isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}
      `}>
        {exam.category}
      </div>
    </div>
  )
}

// Main component
const GuestMode: React.FC<GuestModeProps> = ({
  onExamSelect,
  isLoading = false,
  redirectTo
}) => {
  const router = useRouter()
  const [selectedExam, setSelectedExam] = useState<string | null>(null)
  const [animatingCard, setAnimatingCard] = useState<string | null>(null)

  // Updated exam types to match your schemas
  const exams: ExamType[] = [
    {
      id: 'ssc',
      name: 'SSC',
      description: 'Staff Selection Commission examinations and related documents',
      icon: <FileText />,
      category: 'government'
    },
    {
      id: 'upsc',
      name: 'UPSC',
      description: 'Union Public Service Commission civil services examinations',
      icon: <Package />,
      category: 'government'
    },
    {
      id: 'ielts',
      name: 'IELTS',
      description: 'International English Language Testing System assessments',
      icon: <Globe />,
      category: 'language'
    }
  ]

  const handleExamSelect = (examId: string) => {
    setAnimatingCard(examId)
    
    setTimeout(() => {
      setSelectedExam(examId)
      setAnimatingCard(null)
      onExamSelect?.(examId)
      
      // Navigate to upload page with exam type and guest mode
      setTimeout(() => {
        router.push(`/upload?examType=${examId}&mode=guest`)
      }, 300)
    }, 150)
  }

  // Card entrance animation
  useEffect(() => {
    const timer = setTimeout(() => {
      const cards = document.querySelectorAll('.exam-card')
      cards.forEach((card, index) => {
        setTimeout(() => {
          card.classList.remove('opacity-0', 'translate-y-8')
          card.classList.add('opacity-100', 'translate-y-0')
        }, index * 100)
      })
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-700 to-indigo-800 relative overflow-hidden">
      <FloatingElements />
      <BackgroundPattern />
      
      <div className="relative z-10 max-w-6xl mx-auto px-5 min-h-screen flex flex-col">
        {/* Header */}
        <header className="flex flex-col lg:flex-row justify-between items-center py-5 mb-10 gap-5 lg:gap-0">
          <GuestIndicator />
          <AuthButtons redirectTo={redirectTo} />
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center text-center py-10">
          <LimitationsCard />

          <div className="w-full">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 drop-shadow-lg">
              Select Your Exam
            </h1>
            <p className="text-xl text-white/90 mb-12 font-light">
              Choose from our supported examination formats
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {exams.map((exam, index) => (
                <div
                  key={exam.id}
                  className="exam-card opacity-0 translate-y-8 transition-all duration-500 ease-out"
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <ExamCard
                    exam={exam}
                    isSelected={selectedExam === exam.id}
                    onClick={() => handleExamSelect(exam.id)}
                    isAnimating={animatingCard === exam.id}
                  />
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Footer with proper Next.js routing */}
        <footer className="text-center py-8 text-white/70 text-sm">
          Made by{' '}
          <Link 
            href="/about" 
            className="text-white/90 font-medium hover:text-white transition-colors duration-200"
          >
            Abhinav
          </Link>
          {' • '}
          Powered by{' '}
          <Link 
            href="/docs" 
            className="text-white/90 font-medium hover:text-white transition-colors duration-200"
          >
            Registry Engine
          </Link>
        </footer>
      </div>

      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 text-center shadow-2xl">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium">Loading...</p>
          </div>
        </div>
      )}

      {/* Custom Tailwind animations */}
      <style jsx global>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animate-gradient-shift {
          background-size: 300% 100%;
          animation: gradient-shift 3s ease infinite;
        }
      `}</style>
    </div>
  )
}

export default GuestMode