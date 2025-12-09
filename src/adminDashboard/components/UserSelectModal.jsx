import React, { useState, useEffect } from "react";
import { X, Search, User } from "lucide-react";
import { ModernButton } from "../../shared/components/ui";
import adminSilentApi from "../../index/admin/silent";

/**
 * UserSelectModal - Modal for selecting a user to assign leads to
 */
const UserSelectModal = ({ isOpen, onClose, onSelect, title = "Select User to Assign" }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch admins who can be assigned leads
      const response = await adminSilentApi("GET", "/admins");
      setUsers(response.data || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    );
  });

  const handleSelect = () => {
    if (selectedUser) {
      onSelect(selectedUser);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedUser(null);
    setSearchTerm("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>

        {/* User List */}
        <div className="mb-4 max-h-96 space-y-2 overflow-y-auto">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
            </div>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => setSelectedUser(user)}
                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition ${
                  selectedUser?.id === user.id
                    ? "border-primary-500 bg-primary-50"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-sm font-bold text-white">
                  {user.name?.[0] || user.email?.[0] || "U"}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{user.name || "Unnamed User"}</p>
                  <p className="text-sm text-slate-500">{user.email}</p>
                </div>
                {selectedUser?.id === user.id && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-500">
                    <svg
                      className="h-3 w-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </button>
            ))
          ) : (
            <div className="flex h-32 flex-col items-center justify-center text-slate-500">
              <User className="mb-2 h-8 w-8" />
              <p className="text-sm">No users found</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            Cancel
          </button>
          <ModernButton onClick={handleSelect} disabled={!selectedUser} className="px-4 py-2">
            Assign
          </ModernButton>
        </div>
      </div>
    </div>
  );
};

export default UserSelectModal;
