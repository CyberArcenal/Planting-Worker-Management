// src/renderer/pages/audit/components/AuditViewDialog.tsx
import React, { useState } from 'react';
import Modal from '../../../components/UI/Modal';
import {
  History, User, Calendar, FileText, Code, GitCompare, X
} from 'lucide-react';
import type { AuditLogEntry } from '../../../api/core/audit';
import { formatDate } from '../../../utils/formatters';

interface AuditViewDialogProps {
  log: AuditLogEntry | null;
  loading: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const AuditViewDialog: React.FC<AuditViewDialogProps> = ({
  log,
  loading,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'changes' | 'raw'>('overview');

  if (!log && !loading) return null;

  const getActionColor = (action: string) => {
    const actionMap: Record<string, string> = {
      CREATE: 'text-green-600 bg-green-100',
      UPDATE: 'text-blue-600 bg-blue-100',
      DELETE: 'text-red-600 bg-red-100',
      VIEW: 'text-gray-600 bg-gray-100',
      LOGIN: 'text-purple-600 bg-purple-100',
      LOGOUT: 'text-orange-600 bg-orange-100',
      EXPORT: 'text-cyan-600 bg-cyan-100',
    };
    return actionMap[action] || 'text-gray-600 bg-gray-100';
  };

  const parseJSON = (data: string | null | undefined) => {
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  };

  const previousData = parseJSON(log?.previousData);
  const newData = parseJSON(log?.newData);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Audit Log Details" size="xl">
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-blue)]"></div>
        </div>
      ) : log ? (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[var(--card-secondary-bg)] rounded-md flex items-center justify-center">
                <History className="w-6 h-6 text-[var(--text-tertiary)]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--sidebar-text)]">
                  Log #{log.id}
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  {log.action} on {log.entity} • {log.user || 'System'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                {log.action}
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-[var(--border-color)]">
            <nav className="flex gap-4">
              {(['overview', 'changes', 'raw'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? 'border-[var(--accent-blue)] text-[var(--accent-blue)]'
                      : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--sidebar-text)]'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="mt-4">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left column: Basic info */}
                <div className="space-y-4">
                  <div className="bg-[var(--card-secondary-bg)] p-3 rounded-md">
                    <h4 className="font-medium mb-2 flex items-center text-[var(--sidebar-text)]">
                      <History className="w-4 h-4 mr-1" /> Basic Information
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-[var(--text-secondary)]">ID:</span> {log.id}</div>
                      <div><span className="text-[var(--text-secondary)]">Action:</span> {log.action}</div>
                      <div><span className="text-[var(--text-secondary)]">Entity:</span> {log.entity}</div>
                      <div><span className="text-[var(--text-secondary)]">Entity ID:</span> {log.entityId || '-'}</div>
                      <div><span className="text-[var(--text-secondary)]">User:</span> {log.user || 'System'}</div>
                      <div><span className="text-[var(--text-secondary)]">Timestamp:</span> {formatDate(log.timestamp, 'MMM dd, yyyy HH:mm:ss')}</div>
                    </div>
                  </div>

                  {log.description && (
                    <div className="bg-[var(--card-secondary-bg)] p-3 rounded-md">
                      <h4 className="font-medium mb-2 flex items-center text-[var(--sidebar-text)]">
                        <FileText className="w-4 h-4 mr-1" /> Description
                      </h4>
                      <p className="text-sm text-[var(--text-secondary)] whitespace-pre-line">{log.description}</p>
                    </div>
                  )}
                </div>

                {/* Right column: Data summary */}
                <div className="space-y-4">
                  {previousData && (
                    <div className="bg-[var(--card-secondary-bg)] p-3 rounded-md">
                      <h4 className="font-medium mb-2 flex items-center text-[var(--sidebar-text)]">
                        <Code className="w-4 h-4 mr-1" /> Previous Data Summary
                      </h4>
                      <pre className="text-xs bg-[var(--card-bg)] p-2 rounded max-h-40 overflow-auto">
                        {JSON.stringify(previousData, null, 2)}
                      </pre>
                    </div>
                  )}
                  {newData && (
                    <div className="bg-[var(--card-secondary-bg)] p-3 rounded-md">
                      <h4 className="font-medium mb-2 flex items-center text-[var(--sidebar-text)]">
                        <Code className="w-4 h-4 mr-1" /> New Data Summary
                      </h4>
                      <pre className="text-xs bg-[var(--card-bg)] p-2 rounded max-h-40 overflow-auto">
                        {JSON.stringify(newData, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'changes' && (
              <div>
                <h4 className="font-medium mb-2 text-[var(--sidebar-text)]">Data Changes</h4>
                {!previousData && !newData ? (
                  <p className="text-center py-4 text-[var(--text-secondary)]">No data changes recorded.</p>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {previousData && (
                      <div className="bg-[var(--card-secondary-bg)] p-3 rounded-md">
                        <h5 className="text-sm font-medium mb-2 text-[var(--sidebar-text)]">Previous Data</h5>
                        <pre className="text-xs bg-[var(--card-bg)] p-2 rounded max-h-96 overflow-auto">
                          {JSON.stringify(previousData, null, 2)}
                        </pre>
                      </div>
                    )}
                    {newData && (
                      <div className="bg-[var(--card-secondary-bg)] p-3 rounded-md">
                        <h5 className="text-sm font-medium mb-2 text-[var(--sidebar-text)]">New Data</h5>
                        <pre className="text-xs bg-[var(--card-bg)] p-2 rounded max-h-96 overflow-auto">
                          {JSON.stringify(newData, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'raw' && (
              <div>
                <h4 className="font-medium mb-2 text-[var(--sidebar-text)]">Raw Log Data</h4>
                <div className="bg-[var(--card-secondary-bg)] p-3 rounded-md">
                  <pre className="text-xs bg-[var(--card-bg)] p-2 rounded max-h-96 overflow-auto">
                    {JSON.stringify(log, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="text-center py-4 text-[var(--text-secondary)]">Log not found.</p>
      )}
    </Modal>
  );
};

export default AuditViewDialog;