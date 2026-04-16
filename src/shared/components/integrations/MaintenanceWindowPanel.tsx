/**
 * MaintenanceWindowPanel — Manages scheduled maintenance windows for a replication pair.
 *
 * Lists configured windows and provides a collapsible form to add new ones.
 * Uses useSetMaintenanceWindows mutation to persist changes.
 */
import React, { useState } from "react";
import { Wrench, Plus, Clock, Trash2 } from "lucide-react";
import { ModernButton } from "../ui";
import { useSetMaintenanceWindows } from "../../hooks/resources/integrationHooks";

interface MaintenanceWindowPanelProps {
  pairId: string;
  className?: string;
}

interface WindowEntry {
  cron: string;
  duration_minutes: number;
  label?: string;
}

const MaintenanceWindowPanel: React.FC<MaintenanceWindowPanelProps> = ({ pairId, className = "" }) => {
  const setWindows = useSetMaintenanceWindows();
  const [showForm, setShowForm] = useState(false);
  const [windows, setWindowsList] = useState<WindowEntry[]>([]);
  const [cronInput, setCronInput] = useState("");
  const [durationInput, setDurationInput] = useState(60);
  const [labelInput, setLabelInput] = useState("");

  const handleAdd = () => {
    if (!cronInput.trim()) return;
    const newWindow: WindowEntry = {
      cron: cronInput.trim(),
      duration_minutes: durationInput,
      label: labelInput.trim() || undefined,
    };
    const updated = [...windows, newWindow];
    setWindowsList(updated);
    setWindows.mutate({ pairId, windows: updated });
    setCronInput("");
    setDurationInput(60);
    setLabelInput("");
    setShowForm(false);
  };

  const handleRemove = (idx: number) => {
    const updated = windows.filter((_, i) => i !== idx);
    setWindowsList(updated);
    setWindows.mutate({ pairId, windows: updated });
  };

  const inputClasses =
    "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100";

  return (
    <div className={`rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 ${className}`}>
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <Wrench size={18} className="text-blue-500" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Maintenance Windows</h3>
        </div>
        {!showForm && (
          <ModernButton variant="outline" size="sm" onClick={() => setShowForm(true)}>
            <Plus size={14} /> Add Window
          </ModernButton>
        )}
      </div>

      <div className="space-y-4 p-5">
        {windows.length === 0 && !showForm ? (
          <p className="text-sm text-gray-500">No maintenance windows configured</p>
        ) : (
          <div className="space-y-2">
            {windows.map((w, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800"
              >
                <div className="flex items-center gap-3">
                  <Clock size={14} className="text-gray-400" />
                  <div>
                    {w.label && (
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{w.label}</p>
                    )}
                    <p className="font-mono text-xs text-gray-500 dark:text-gray-400">{w.cron}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{w.duration_minutes} min</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(idx)}
                  className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-red-500 dark:hover:bg-gray-700"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <div className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Label</label>
              <input
                type="text"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                placeholder="e.g. Weekly maintenance"
                className={inputClasses}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Cron Expression</label>
              <input
                type="text"
                value={cronInput}
                onChange={(e) => setCronInput(e.target.value)}
                placeholder="0 2 * * 0"
                className={inputClasses}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Duration (minutes)</label>
              <input
                type="number"
                value={durationInput}
                onChange={(e) => setDurationInput(Number(e.target.value))}
                min={1}
                className={inputClasses}
              />
            </div>
            <div className="flex gap-2">
              <ModernButton variant="primary" size="sm" onClick={handleAdd} disabled={setWindows.isPending}>
                {setWindows.isPending ? "Saving..." : "Save"}
              </ModernButton>
              <ModernButton variant="outline" size="sm" onClick={() => setShowForm(false)}>
                Cancel
              </ModernButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaintenanceWindowPanel;
