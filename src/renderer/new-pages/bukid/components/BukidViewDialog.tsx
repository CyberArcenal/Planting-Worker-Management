// src/renderer/pages/bukid/components/BukidViewDialog.tsx
import React, { useEffect } from "react";
import { Map, Calendar, FileText, List, Edit } from "lucide-react";
import { useBukidView } from "../hooks/useBukidView";
import Modal from "../../../components/UI/Modal";
import { formatDate } from "../../../utils/formatters";

interface BukidViewDialogProps {
  hook: ReturnType<typeof useBukidView>;
}

const BukidViewDialog: React.FC<BukidViewDialogProps> = ({ hook }) => {
  const { isOpen, loading, bukid, pitaks, loadingPitaks, fetchPitaks, close } =
    hook;

  const [activeTab, setActiveTab] = React.useState<"overview" | "pitaks">(
    "overview",
  );

  // Trigger pitaks fetch when tab changes
  useEffect(() => {
    if (activeTab === "pitaks") {
      fetchPitaks();
    }
  }, [activeTab, fetchPitaks]);

  if (!isOpen) return null;

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string }> = {
      active: { bg: "bg-green-100", text: "text-green-700" },
      inactive: { bg: "bg-gray-100", text: "text-gray-700" },
      complete: { bg: "bg-purple-100", text: "text-purple-700" },
      initiated: { bg: "bg-blue-100", text: "text-blue-700" },
    };
    const config = statusMap[status] || {
      bg: "bg-gray-100",
      text: "text-gray-700",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={close} title="Bukid Details" size="xl">
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-blue)]"></div>
        </div>
      ) : bukid ? (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[var(--card-secondary-bg)] rounded-md flex items-center justify-center">
                <Map className="w-6 h-6 text-[var(--text-tertiary)]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--sidebar-text)]">
                  {bukid.name}
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  ID: {bukid.id} • Created {formatDate(bukid.createdAt)}
                </p>
              </div>
            </div>
            <div>{getStatusBadge(bukid.status)}</div>
          </div>

          {/* Tabs */}
          <div className="border-b border-[var(--border-color)]">
            <nav className="flex gap-4">
              {(["overview", "pitaks"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? "border-[var(--accent-blue)] text-[var(--accent-blue)]"
                      : "border-transparent text-[var(--text-secondary)] hover:text-[var(--sidebar-text)]"
                  }`}
                >
                  {tab === "overview" ? "Overview" : "Pitaks"}
                  {tab === "pitaks" && pitaks.length > 0 && (
                    <span className="ml-2 text-xs bg-[var(--accent-blue)] text-white rounded-full px-1.5 py-0.5">
                      {pitaks.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="mt-4">
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left column: Basic info */}
                <div className="space-y-4">
                  <div className="bg-[var(--card-secondary-bg)] p-3 rounded-md">
                    <h4 className="font-medium mb-2 flex items-center text-[var(--sidebar-text)]">
                      <Map className="w-4 h-4 mr-1" /> Bukid Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--text-secondary)] w-24">
                          Name:
                        </span>
                        <span className="font-medium text-[var(--sidebar-text)]">
                          {bukid.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--text-secondary)] w-24">
                          Location:
                        </span>
                        <span className="font-medium text-[var(--sidebar-text)]">
                          {bukid.location || "-"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--text-secondary)] w-24">
                          Status:
                        </span>
                        <span>{getStatusBadge(bukid.status)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--text-secondary)] w-24">
                          Session:
                        </span>
                        <span className="font-medium text-[var(--sidebar-text)]">
                          {bukid.session?.name || "-"}
                        </span>
                      </div>
                      {bukid.notes && (
                        <div className="flex gap-2">
                          <span className="text-[var(--text-secondary)] w-24">
                            Notes:
                          </span>
                          <span className="font-medium text-[var(--sidebar-text)]">
                            {bukid.notes}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-[var(--card-secondary-bg)] p-3 rounded-md">
                    <h4 className="font-medium mb-2 flex items-center text-[var(--sidebar-text)]">
                      <Calendar className="w-4 h-4 mr-1" /> Timeline
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">
                          Created:
                        </span>
                        <span className="font-medium text-[var(--sidebar-text)]">
                          {formatDate(bukid.createdAt)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">
                          Last Updated:
                        </span>
                        <span className="font-medium text-[var(--sidebar-text)]">
                          {bukid.updatedAt ? formatDate(bukid.updatedAt) : "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right column: Summary stats */}
                <div className="space-y-4">
                  <div className="bg-[var(--card-secondary-bg)] p-3 rounded-md">
                    <h4 className="font-medium mb-2 flex items-center text-[var(--sidebar-text)]">
                      <List className="w-4 h-4 mr-1" /> Summary
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-[var(--text-secondary)]">
                          Total Pitaks:
                        </span>
                        <div className="font-medium text-[var(--sidebar-text)]">
                          {bukid.pitaks?.length || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "pitaks" && (
              <div>
                <h4 className="font-medium mb-2 text-[var(--sidebar-text)]">
                  Pitaks in this Bukid
                </h4>
                {loadingPitaks ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--accent-blue)]"></div>
                  </div>
                ) : pitaks.length === 0 ? (
                  <p className="text-center py-4 text-[var(--text-secondary)]">
                    No pitaks found for this bukid.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-[var(--border-color)]">
                      <thead className="bg-[var(--card-secondary-bg)]">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">
                            Location
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">
                            Status
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">
                            Total Luwang
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">
                            Area (sqm)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-[var(--card-bg)] divide-y divide-[var(--border-color)]">
                        {pitaks.map((pitak) => (
                          <tr key={pitak.id}>
                            <td className="px-4 py-2 text-sm text-[var(--sidebar-text)]">
                              {pitak.location}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs ${
                                  pitak.status === "active"
                                    ? "bg-green-100 text-green-700"
                                    : pitak.status === "inactive"
                                      ? "bg-gray-100 text-gray-700"
                                      : "bg-yellow-100 text-yellow-700"
                                }`}
                              >
                                {pitak.status}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm text-[var(--sidebar-text)]">
                              {pitak.totalLuwang}
                            </td>
                            <td className="px-4 py-2 text-sm text-[var(--sidebar-text)]">
                              {pitak.areaSqm}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="text-center py-4 text-[var(--text-secondary)]">
          Bukid not found.
        </p>
      )}
    </Modal>
  );
};

export default BukidViewDialog;
