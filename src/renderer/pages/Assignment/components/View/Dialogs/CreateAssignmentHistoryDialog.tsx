import React, { useState, useEffect } from "react";
import {
  X,
  Clock,
  History,
  User,
  MapPin,
  Hash,
  Calendar,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import type { AuditLogEntry } from "../../../../../api/core/audit";
import auditLogAPI from "../../../../../api/core/audit";

interface AssignmentHistoryDialogProps {
  assignmentId: number;
  onClose: () => void;
}

// Transform an audit log entry into the format expected by the UI
const mapAuditToHistoryItem = (log: AuditLogEntry) => {
  let type = log.action; // e.g., "CREATE", "UPDATE", "DELETE"
  let details = log.description || "";
  let fromValue: string | undefined;
  let toValue: string | undefined;

  // Try to extract meaningful "from" and "to" values from previousData/newData
  if (log.previousData || log.newData) {
    try {
      const prev = log.previousData ? JSON.parse(log.previousData) : null;
      const next = log.newData ? JSON.parse(log.newData) : null;
      // Look for changed fields like status, luwangCount, workerId, pitakId
      if (prev && next) {
        const changedFields = Object.keys(next).filter(
          (key) => JSON.stringify(prev[key]) !== JSON.stringify(next[key])
        );
        if (changedFields.length > 0) {
          const field = changedFields[0]; // just show the first changed field
          fromValue = prev[field]?.toString();
          toValue = next[field]?.toString();
          details = `Changed ${field}`;
        }
      }
    } catch {
      // ignore JSON parse errors
    }
  }

  return {
    type,
    timestamp: log.timestamp,
    details,
    from: fromValue,
    to: toValue,
    reason: log.user ? `By ${log.user}` : undefined,
    content: log.description,
  };
};

const AssignmentHistoryDialog: React.FC<AssignmentHistoryDialogProps> = ({
  assignmentId,
  onClose,
}) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch audit logs for entity "assignment" with this ID
        const response = await auditLogAPI.getByEntity({
          entity: "assignment",
          entityId: assignmentId,
          // You can add pagination if needed, but we'll fetch a reasonable amount
          limit: 100,
        });

        if (response.status) {
          // Transform each log into a history item
          const items = response.data.map(mapAuditToHistoryItem);
          setHistory(items);
        } else {
          setError(response.message || "Failed to load history");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load history");
        console.error("Error fetching assignment history:", err);
      } finally {
        setLoading(false);
      }
    };

    if (assignmentId) {
      fetchHistory();
    }
  }, [assignmentId]);

  const getHistoryIcon = (type: string) => {
    switch (type) {
      case "CREATE":
        return <Clock className="w-3.5 h-3.5 text-green-600" />;
      case "UPDATE":
        return <History className="w-3.5 h-3.5 text-blue-600" />;
      case "DELETE":
        return <Hash className="w-3.5 h-3.5 text-red-600" />;
      default:
        return <History className="w-3.5 h-3.5 text-gray-600" />;
    }
  };

  const getHistoryColor = (type: string) => {
    switch (type) {
      case "CREATE":
        return "bg-green-50 border-green-200";
      case "UPDATE":
        return "bg-blue-50 border-blue-200";
      case "DELETE":
        return "bg-red-50 border-red-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl shadow-lg border border-gray-200 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <History className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                Assignment History
              </h3>
              <p className="text-xs text-gray-600">ID: #{assignmentId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded flex items-center justify-center hover:bg-gray-200 transition-colors"
            title="Close"
          >
            <X className="w-3 h-3 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-130px)] p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-sm text-gray-600">Loading history...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-900 mb-1">
                Error Loading History
              </p>
              <p className="text-xs text-gray-600">{error}</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <History className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-900 mb-1">
                No History Available
              </p>
              <p className="text-xs text-gray-600">
                No audit records found for this assignment
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item, index) => (
                <div
                  key={index}
                  className={`p-3 rounded border ${getHistoryColor(item.type)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-white border flex items-center justify-center flex-shrink-0">
                      {getHistoryIcon(item.type)}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {item.type}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDateTime(item.timestamp)}
                        </span>
                      </div>

                      {item.details && (
                        <p className="text-sm text-gray-700 mb-2">
                          {item.details}
                        </p>
                      )}

                      {(item.from || item.to) && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          {item.from && (
                            <div className="flex items-center gap-1">
                              <span className="px-2 py-0.5 bg-gray-100 rounded">
                                From: {item.from}
                              </span>
                            </div>
                          )}
                          {item.to && (
                            <>
                              <ArrowRight className="w-3 h-3" />
                              <div className="flex items-center gap-1">
                                <span className="px-2 py-0.5 bg-gray-100 rounded">
                                  To: {item.to}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {item.reason && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs text-gray-600">
                            <span className="font-medium">Actor:</span>{" "}
                            {item.reason}
                          </p>
                        </div>
                      )}

                      {item.content && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs text-gray-700">
                            {item.content}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-600">
              {history.length} history record{history.length !== 1 ? "s" : ""}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded text-sm font-medium bg-gray-600 hover:bg-gray-700 text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentHistoryDialog;