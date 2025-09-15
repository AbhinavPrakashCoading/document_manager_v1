import React, { useState, useEffect } from 'react';
import { ChevronRight, Upload, Shield, Package, Smartphone, CheckCircle, ArrowRight, FileText, Users, Clock, Zap, Bell, Home, BarChart3, User } from 'lucide-react';

const DocumentManagerLanding = () => {
  const [activeExam, setActiveExam] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const examTypes = ['UPSC', 'SSC', 'IELTS'];
  
  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setActiveExam((prev) => (prev + 1) % examTypes.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: Shield,
      title: "Smart Validation",
      description: "Real-time format, size, and dimension validation",
      color: "bg-blue-500"
    },
    {
      icon: Package,
      title: "Auto ZIP Packaging",
      description: "Organize documents by roll number automatically",
      color: "bg-green-500"
    },
    {
      icon: Smartphone,
      title: "Mobile-First Design",
      description: "Upload from any device, anywhere",
      color: "bg-purple-500"
    },
    {
      icon: Zap,
      title: "Dynamic Schema",
      description: "Adapts to UPSC, SSC, IELTS requirements",
      color: "bg-orange-500"
    }
  ];

  const stats = [
    { number: "3+", label: "Exam Types", color: "text-blue-600" },
    { number: "100%", label: "Mobile Ready", color: "text-green-600" },
    { number: "Real-time", label: "Validation", color: "text-purple-600" },
    { number: "Zero", label: "Manual Work", color: "text-orange-600" }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Status Bar */}
      <div className="bg-white px-6 py-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-1">
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-black rounded-full"></div>
              <div className="w-1 h-1 bg-black rounded-full"></div>
              <div className="w-1 h-1 bg-black rounded-full"></div>
            </div>
            <span className="ml-2 text-black font-medium">DocManager</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="flex space-x-1">
              <div className="w-1 h-4 bg-black rounded-sm"></div>
              <div className="w-1 h-4 bg-black rounded-sm"></div>
              <div className="w-1 h-4 bg-black rounded-sm"></div>
              <div className="w-1 h-4 bg-gray-300 rounded-sm"></div>
            </div>
            <span className="text-black font-medium">9:41</span>
          </div>
        </div>
      </div>

      {/* Header Card */}
      <div className="px-6 pt-6 pb-4">
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Welcome back,</h1>
                <p className="text-gray-600">Document Manager!</p>
              </div>
            </div>
            <Bell className="h-6 w-6 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Main Hero Card */}
      <div className="px-6 pb-6">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-6 text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium opacity-90">Smart Document Manager</div>
              <div className="w-8 h-5 bg-white rounded-sm flex items-center justify-center">
                <span className="text-blue-600 text-xs font-bold">DOC</span>
              </div>
            </div>
            
            <div className="mb-6">
              <div className="text-2xl font-bold mb-2">Built for {examTypes[activeExam]}</div>
              <div className="text-blue-100">Exam Workflows</div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">Upload & Validate</div>
                <div className="text-sm text-blue-100 mt-1">Documents Instantly</div>
              </div>
            </div>
          </div>
          
          {/* Card decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 right-0 w-20 h-20 bg-white opacity-5 rounded-full -mr-10 -mb-10"></div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-2 gap-4">
          {stats.slice(0, 2).map((stat, index) => (
            <div key={index} className="bg-white rounded-2xl p-5 shadow-sm">
              <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.number}</div>
              <div className="text-gray-600 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 pb-6">
        <div className="grid grid-cols-2 gap-4">
          {stats.slice(2, 4).map((stat, index) => (
            <div key={index} className="bg-white rounded-2xl p-5 shadow-sm">
              <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.number}</div>
              <div className="text-gray-600 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="px-6 pb-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Key Features</h2>
            <button className="text-blue-600 text-sm font-medium">See All</button>
          </div>
          
          <div className="space-y-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-2xl">
                  <div className={`w-12 h-12 ${feature.color} rounded-2xl flex items-center justify-center`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Supported Exams Card */}
      <div className="px-6 pb-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Supported Exams</h2>
            <div className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs font-medium">
              3 Active
            </div>
          </div>
          
          <div className="space-y-4">
            {[
              { name: 'UPSC', desc: 'Union Public Service Commission', color: 'bg-red-500' },
              { name: 'SSC', desc: 'Staff Selection Commission', color: 'bg-blue-500' },
              { name: 'IELTS', desc: 'International English Language Testing', color: 'bg-green-500' }
            ].map((exam, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-2xl">
                <div className={`w-12 h-12 ${exam.color} rounded-2xl flex items-center justify-center`}>
                  <span className="text-white font-bold text-sm">{exam.name.slice(0, 2)}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{exam.name}</h3>
                  <p className="text-gray-600 text-sm">{exam.desc}</p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Card */}
      <div className="px-6 pb-6">
        <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl p-6 text-white">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Ready to Start?</h2>
            <p className="text-purple-100 mb-6 text-sm">
              Upload, validate, and package your documents in seconds
            </p>
            
            <button className="w-full bg-white text-purple-600 py-4 rounded-2xl font-semibold text-lg flex items-center justify-center space-x-2 hover:bg-gray-50 transition-colors">
              <Upload className="h-5 w-5" />
              <span>Start Uploading</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-around">
            <div className="flex flex-col items-center space-y-1">
              <Home className="h-6 w-6 text-blue-600" />
              <span className="text-xs font-medium text-blue-600">Home</span>
            </div>
            <div className="flex flex-col items-center space-y-1">
              <Upload className="h-6 w-6 text-gray-400" />
              <span className="text-xs text-gray-400">Upload</span>
            </div>
            <div className="flex flex-col items-center space-y-1">
              <BarChart3 className="h-6 w-6 text-gray-400" />
              <span className="text-xs text-gray-400">Statistics</span>
            </div>
            <div className="flex flex-col items-center space-y-1">
              <User className="h-6 w-6 text-gray-400" />
              <span className="text-xs text-gray-400">Profile</span>
            </div>
          </div>
        </div>
      </div>

      {/* Padding for bottom nav */}
      <div className="h-20"></div>
    </div>
  );
};

export default DocumentManagerLanding;