// Database Status Component
'use client';

import React, { useState, useEffect } from 'react';
import { Database, Wifi, WifiOff, Cloud, HardDrive } from 'lucide-react';
import { supabaseStorageService } from '@/features/storage/SupabaseStorageService';

export const DatabaseStatusIndicator: React.FC = () => {
  const [status, setStatus] = useState<{
    connected: boolean;
    type: 'supabase' | 'local';
    message: string;
  } | null>(null);

  const [stats, setStats] = useState<{
    totalDocuments: number;
    totalSizeBytes: number;
    completedDocuments: number;
    recentSessions: number;
    storageType: 'supabase' | 'local';
  } | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const connectionStatus = await supabaseStorageService.getConnectionStatus();
        const storageStats = await supabaseStorageService.getStorageStats();
        setStatus(connectionStatus);
        setStats(storageStats);
      } catch (error) {
        setStatus({
          connected: false,
          type: 'local',
          message: 'Using local storage (offline mode)'
        });
      }
    };

    checkStatus();
    // Check status every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!status) return null;

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">Database Status</h3>
        {status.connected ? (
          <div className="flex items-center space-x-1 text-green-600">
            <Cloud className="w-4 h-4" />
            <span className="text-xs font-medium">Online</span>
          </div>
        ) : (
          <div className="flex items-center space-x-1 text-orange-600">
            <HardDrive className="w-4 h-4" />
            <span className="text-xs font-medium">Offline</span>
          </div>
        )}
      </div>

      <div className="space-y-2 text-xs text-gray-600">
        <div className="flex items-center space-x-2">
          <Database className="w-3 h-3" />
          <span>{status.message}</span>
        </div>

        {stats && (
          <>
            <div className="flex justify-between">
              <span>Documents:</span>
              <span className="font-medium">{stats.totalDocuments}</span>
            </div>
            <div className="flex justify-between">
              <span>Storage Used:</span>
              <span className="font-medium">{formatSize(stats.totalSizeBytes)}</span>
            </div>
            <div className="flex justify-between">
              <span>Completed:</span>
              <span className="font-medium text-green-600">{stats.completedDocuments}</span>
            </div>
            <div className="flex justify-between">
              <span>Recent Sessions:</span>
              <span className="font-medium">{stats.recentSessions}</span>
            </div>
          </>
        )}

        {!status.connected && (
          <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-orange-700">
            <p className="text-xs">
              🔄 To use cloud storage for free: Sign up at{' '}
              <a 
                href="https://supabase.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:no-underline"
              >
                supabase.com
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabaseStatusIndicator;