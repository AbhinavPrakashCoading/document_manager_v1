import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Download, 
  Plus,
  Settings,
  Bell,
  User,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Trash2,
  Edit,
  Grid3X3,
  List,
  Clock,
  HardDrive,
  Zap,
  TrendingUp,
  Package,
  Menu,
  X,
  ChevronDown,
  FolderOpen,
  Cloud,
  Shield,
  Activity,
  BarChart3,
  Archive,
  RefreshCw,
  AlertTriangle,
  Home,
  LogOut
} from 'lucide-react';

interface Document {
  id: string;
  name: string;
  examType: 'UPSC' | 'SSC' | 'IELTS' | 'Other';
  status: 'validated' | 'processing' | 'failed' | 'pending' | 'enhancing';
  uploadDate: string;
  size: string;
  validationScore?: number;
  location: 'drive' | 'local';
  thumbnail?: string;
  processingStage?: string;
}

interface User {
  isAuthenticated: boolean;
  name?: string;
  email?: string;
  avatar?: string;
  driveConnected?: boolean;
  storageUsed?: number;
  storageLimit?: number;
}

interface ProcessingJob {
  id: string;
  documentName: string;
  stage: 'archive' | 'enhance' | 'analyze' | 'package';
  progress: number;
  estimatedTime?: string;
}

const Dashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'overview' | 'upload' | 'documents' | 'packages' | 'analytics' | 'settings'>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Mock data
  const [user] = useState<User>({
    isAuthenticated: true,
    name: 'Alex Johnson',
    email: 'alex@example.com',
    avatar: '/api/placeholder/32/32',
    driveConnected: true,
    storageUsed: 2.4,
    storageLimit: 15
  });

  const [documents] = useState<Document[]>([
    {
      id: '1',
      name: 'UPSC_Application_Form.pdf',
      examType: 'UPSC',
      status: 'validated',
      uploadDate: '2024-01-15',
      size: '2.4 MB',
      validationScore: 98,
      location: 'drive',
      thumbnail: '/api/placeholder/150/200'
    },
    {
      id: '2',
      name: 'SSC_Documents_Package.zip',
      examType: 'SSC',
      status: 'processing',
      uploadDate: '2024-01-14',
      size: '5.1 MB',
      location: 'drive',
      processingStage: 'Enhancing images...'
    },
    {
      id: '3',
      name: 'IELTS_Registration.pdf',
      examType: 'IELTS',
      status: 'failed',
      uploadDate: '2024-01-13',
      size: '1.8 MB',
      validationScore: 45,
      location: 'local'
    },
    {
      id: '4',
      name: 'Additional_Documents.pdf',
      examType: 'Other',
      status: 'enhancing',
      uploadDate: '2024-01-12',
      size: '3.2 MB',
      location: 'drive',
      processingStage: 'Analyzing content...'
    }
  ]);

  const [processingJobs] = useState<ProcessingJob[]>([
    {
      id: '1',
      documentName: 'SSC_Documents_Package.zip',
      stage: 'enhance',
      progress: 65,
      estimatedTime: '2 mins'
    },
    {
      id: '2',
      documentName: 'Additional_Documents.pdf',
      stage: 'analyze',
      progress: 30,
      estimatedTime: '4 mins'
    }
  ]);

  const [notifications] = useState([
    { id: '1', type: 'success', message: 'UPSC Application validated successfully', time: '2 mins ago' },
    { id: '2', type: 'warning', message: 'IELTS document failed validation', time: '1 hour ago' },
    { id: '3', type: 'info', message: 'Storage usage at 80%', time: '2 hours ago' }
  ]);

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'packages', label: 'Packages', icon: Package },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'validated': return 'text-green-600 bg-green-100';
      case 'processing': return 'text-blue-600 bg-blue-100';
      case 'enhancing': return 'text-purple-600 bg-purple-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'validated': return <CheckCircle className="w-4 h-4" />;
      case 'processing': 
      case 'enhancing': 
        return <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      case 'failed': return <AlertTriangle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    // Handle file drop logic here
  };

  const StatsCard = ({ title, value, change, icon: Icon, color }: any) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {change && (
            <p className={`text-sm mt-2 ${change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
              {change} from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  const ProcessingQueue = () => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Processing Queue</h3>
        <Activity className="w-5 h-5 text-gray-400" />
      </div>
      <div className="space-y-4">
        {processingJobs.map((job) => (
          <div key={job.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900">{job.documentName}</span>
              <span className="text-xs text-gray-500">{job.estimatedTime} remaining</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-600 capitalize">{job.stage} stage</span>
              <span className="text-xs font-medium text-gray-900">{job.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${job.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const DocumentCard = ({ doc }: { doc: Document }) => (
    <div className="bg-white rounded-xl border border-gray-100 hover:shadow-lg transition-all duration-200 overflow-hidden group">
      {viewMode === 'grid' ? (
        <>
          <div className="aspect-[3/4] bg-gray-50 relative">
            {doc.thumbnail ? (
              <img src={doc.thumbnail} alt={doc.name} className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center h-full">
                <FileText className="w-12 h-12 text-gray-400" />
              </div>
            )}
            <div className="absolute top-3 right-3">
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)} flex items-center gap-1`}>
                {getStatusIcon(doc.status)}
                <span className="capitalize">{doc.status}</span>
              </div>
            </div>
            {doc.location === 'drive' && (
              <div className="absolute top-3 left-3">
                <Cloud className="w-4 h-4 text-blue-600" />
              </div>
            )}
          </div>
          <div className="p-4">
            <h4 className="font-medium text-gray-900 text-sm truncate">{doc.name}</h4>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span>{doc.examType}</span>
              <span>{doc.size}</span>
            </div>
            {doc.validationScore && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Quality Score</span>
                  <span className="font-medium text-gray-900">{doc.validationScore}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-blue-600 h-1 rounded-full"
                    style={{ width: `${doc.validationScore}%` }}
                  />
                </div>
              </div>
            )}
            {doc.processingStage && (
              <p className="text-xs text-blue-600 mt-2 animate-pulse">{doc.processingStage}</p>
            )}
          </div>
        </>
      ) : (
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{doc.name}</h4>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>{doc.examType}</span>
                <span>{doc.size}</span>
                <span>{doc.uploadDate}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {doc.validationScore && (
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{doc.validationScore}%</div>
                <div className="text-xs text-gray-500">Quality</div>
              </div>
            )}
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)} flex items-center gap-1`}>
              {getStatusIcon(doc.status)}
              <span className="capitalize">{doc.status}</span>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <MoreHorizontal className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const UploadZone = () => (
    <div 
      className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
        dragOver 
          ? 'border-purple-400 bg-purple-50' 
          : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Documents</h3>
      <p className="text-gray-600 mb-4">Drag & drop files here or click to browse</p>
      <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all">
        Select Files
      </button>
      <div className="flex items-center justify-center space-x-6 mt-6 text-sm text-gray-500">
        <span>Supported: PDF, ZIP, DOC, JPG</span>
        <span>Max: 50MB</span>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user.name}!</h1>
                <p className="text-gray-600 mt-1">Here's what's happening with your documents today.</p>
              </div>
              <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Upload
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                title="Total Documents"
                value="24"
                change="+12%"
                icon={FileText}
                color="bg-gradient-to-r from-blue-500 to-blue-600"
              />
              <StatsCard
                title="Validated"
                value="18"
                change="+8%"
                icon={CheckCircle}
                color="bg-gradient-to-r from-green-500 to-green-600"
              />
              <StatsCard
                title="Processing"
                value="3"
                icon={RefreshCw}
                color="bg-gradient-to-r from-purple-500 to-purple-600"
              />
              <StatsCard
                title="Storage Used"
                value={`${user.storageUsed}GB`}
                change={`${Math.round((user.storageUsed! / user.storageLimit!) * 100)}%`}
                icon={HardDrive}
                color="bg-gradient-to-r from-orange-500 to-orange-600"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProcessingQueue />
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Documents</h3>
                <div className="space-y-3">
                  {documents.slice(0, 3).map((doc) => (
                    <div key={doc.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                        <FileText className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                        <p className="text-xs text-gray-500">{doc.examType} • {doc.uploadDate}</p>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(doc.status)}`}>
                        {doc.status}
                      </div>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => setActiveSection('documents')}
                  className="block text-center text-sm text-purple-600 hover:text-purple-700 mt-4 font-medium cursor-pointer"
                >
                  View All Documents
                </button>
              </div>
            </div>
          </div>
        );

      case 'upload':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Upload Documents</h1>
              <p className="text-gray-600 mt-1">Upload your exam documents for validation and enhancement.</p>
            </div>
            <UploadZone />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">UPSC Templates</h4>
                <p className="text-sm text-gray-600 mb-3">Pre-configured for UPSC document requirements</p>
                <button className="w-full bg-blue-50 text-blue-600 py-2 rounded-lg text-sm font-medium hover:bg-blue-100">
                  Use Template
                </button>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">SSC Templates</h4>
                <p className="text-sm text-gray-600 mb-3">Optimized for SSC examination documents</p>
                <button className="w-full bg-green-50 text-green-600 py-2 rounded-lg text-sm font-medium hover:bg-green-100">
                  Use Template
                </button>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">IELTS Templates</h4>
                <p className="text-sm text-gray-600 mb-3">Designed for IELTS document validation</p>
                <button className="w-full bg-purple-50 text-purple-600 py-2 rounded-lg text-sm font-medium hover:bg-purple-100">
                  Use Template
                </button>
              </div>
            </div>
          </div>
        );

      case 'documents':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
                <p className="text-gray-600 mt-1">Manage and organize your uploaded documents.</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Types</option>
                  <option value="UPSC">UPSC</option>
                  <option value="SSC">SSC</option>
                  <option value="IELTS">IELTS</option>
                </select>
                <div className="flex items-center border border-gray-200 rounded-lg">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-purple-100 text-purple-600' : 'text-gray-400'}`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-purple-100 text-purple-600' : 'text-gray-400'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
              {documents.map((doc) => (
                <DocumentCard key={doc.id} doc={doc} />
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900">Coming Soon</h2>
            <p className="text-gray-600 mt-2">This section is under development.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-30 ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}>
        <div className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            {!sidebarCollapsed && <span className="font-bold text-gray-900">ExamDoc</span>}
          </div>
        </div>

        <nav className="mt-8">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id as any)}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-purple-50 transition-colors ${
                  activeSection === item.id ? 'bg-purple-50 text-purple-600 border-r-2 border-purple-600' : 'text-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          {!sidebarCollapsed && user.isAuthenticated && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-3 rounded-lg">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Storage</span>
                <span className="font-medium">{Math.round((user.storageUsed! / user.storageLimit!) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-blue-600 h-1 rounded-full"
                  style={{ width: `${(user.storageUsed! / user.storageLimit!) * 100}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {user.storageUsed}GB of {user.storageLimit}GB used
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Header */}
      <div className={`fixed top-0 right-0 left-0 bg-white border-b border-gray-200 z-20 transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        <div className="flex items-center justify-between px-6 py-4">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 hover:bg-gray-100 rounded-lg relative"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notifications.length}
                </span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                  </div>
                  {notifications.map((notification) => (
                    <div key={notification.id} className="px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0">
                      <div className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          notification.type === 'success' ? 'bg-green-500' :
                          notification.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="px-4 py-2 text-center">
                    <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                      View All Notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="flex items-center space-x-3">
              {user.isAuthenticated ? (
                <>
                  <div className="flex items-center space-x-2">
                    <Cloud className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-gray-600">Drive Connected</span>
                  </div>
                  <img 
                    src={user.avatar} 
                    alt={user.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="hidden md:block">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </>
              ) : (
                <>
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs text-gray-600">Guest Session</span>
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                      25:30 remaining
                    </span>
                  </div>
                  <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-purple-700 hover:to-blue-700 transition-all">
                    Sign In
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'} pt-20`}>
        <div className="p-6">
          {renderContent()}
        </div>
      </div>

      {/* Mobile Navigation (hidden on desktop) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-30">
        <div className="grid grid-cols-5 py-2">
          {sidebarItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id as any)}
                className={`flex flex-col items-center py-2 px-1 ${
                  activeSection === item.id ? 'text-purple-600' : 'text-gray-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs mt-1">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating Action Button (Mobile) */}
      <button className="fixed bottom-20 right-4 md:hidden w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all">
        <Plus className="w-6 h-6" />
      </button>

      {/* Global Loading Overlay (if needed) */}
      {/* <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            <span className="text-gray-900">Processing documents...</span>
          </div>
        </div>
      </div> */}

      {/* Toast Notifications */}
      <div className="fixed top-20 right-4 space-y-2 z-40">
        {/* Example toast - you would map over actual toast notifications here */}
        {/* <div className="bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 max-w-sm">
          <CheckCircle className="w-5 h-5" />
          <span>Document validated successfully!</span>
          <button className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div> */}
      </div>
    </div>
  );
};

export default Dashboard;