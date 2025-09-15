// Draft Status Indicator Component
'use client';

import React from 'react';
import { Save, RefreshCw, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { AutoSaveStatus } from '@/hooks/useAutoSave';

interface DraftStatusProps {
  status: AutoSaveStatus;
  onForceSave?: () => void;
  onRestore?: () => void;
  className?: string;
}

export function DraftStatus({ status, onForceSave, onRestore, className = '' }: DraftStatusProps) {
  const getStatusIcon = () => {
    switch (status.status) {
      case 'saving':
        return <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />;
      case 'saved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (status.status) {
      case 'saving':
        return 'Auto-saving...';
      case 'saved':
        return status.lastSaved 
          ? `Saved ${formatTimeAgo(status.lastSaved)}${status.isDraft ? ' (Draft)' : ''}`
          : 'Saved';
      case 'error':
        return status.error || 'Save error';
      default:
        return 'Ready';
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 5) return 'just now';
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'saving':
        return 'text-blue-600 bg-blue-50';
      case 'saved':
        return 'text-green-600 bg-green-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg ${getStatusColor()} ${className}`}>
      {getStatusIcon()}
      <span className="text-sm font-medium">{getStatusText()}</span>
      
      {status.status === 'error' && onForceSave && (
        <button
          onClick={onForceSave}
          className="ml-2 p-1 rounded hover:bg-red-100 transition-colors"
          title="Retry save"
        >
          <Save className="w-3 h-3" />
        </button>
      )}
      
      {status.isDraft && onRestore && (
        <button
          onClick={onRestore}
          className="ml-2 text-xs underline hover:no-underline"
          title="Restore draft"
        >
          Restore
        </button>
      )}
      
      {status.version && status.version > 1 && (
        <span className="text-xs opacity-75">v{status.version}</span>
      )}
    </div>
  );
}

// Mini status indicator for compact spaces
export function DraftStatusMini({ status, className = '' }: Pick<DraftStatusProps, 'status' | 'className'>) {
  const getStatusDot = () => {
    switch (status.status) {
      case 'saving':
        return 'bg-blue-500 animate-pulse';
      case 'saved':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500 animate-pulse';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className={`flex items-center space-x-1 ${className}`} title={status.status}>
      <div className={`w-2 h-2 rounded-full ${getStatusDot()}`} />
      {status.isDraft && (
        <span className="text-xs text-gray-500 font-medium">Draft</span>
      )}
    </div>
  );
}

// Draft recovery banner
export function DraftRecoveryBanner({ 
  onRestore, 
  onDismiss,
  draftDate,
  className = ''
}: {
  onRestore: () => void;
  onDismiss: () => void;
  draftDate?: Date;
  className?: string;
}) {
  return (
    <div className={`bg-amber-50 border-l-4 border-amber-400 p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-amber-500 mr-2" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              Draft found from {draftDate ? draftDate.toLocaleString() : 'previous session'}
            </p>
            <p className="text-sm text-amber-600">
              Would you like to restore your previous work?
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onRestore}
            className="px-3 py-1 bg-amber-500 text-white text-sm rounded hover:bg-amber-600 transition-colors"
          >
            Restore
          </button>
          <button
            onClick={onDismiss}
            className="px-3 py-1 bg-white text-amber-700 text-sm rounded border border-amber-300 hover:bg-amber-50 transition-colors"
          >
            Start Fresh
          </button>
        </div>
      </div>
    </div>
  );
}