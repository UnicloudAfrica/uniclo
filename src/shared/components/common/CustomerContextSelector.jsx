import React from "react";
import { Loader2 } from "lucide-react";

const CustomerContextSelector = ({
  contextType,
  setContextType,
  selectedTenantId,
  setSelectedTenantId,
  selectedUserId,
  setSelectedUserId,
  tenants,
  isTenantsFetching,
  userPool,
  isUsersFetching,
}) => {
  // Determine available radio options based on props or internal logic if needed
  // Assuming component should just render what it's given
  return (
    <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Customer Context</h3>
        <p className="text-sm text-slate-500">Select who you are performing this action for.</p>
      </div>

      {/* Context Type Selection */}
      <div className="flex flex-wrap gap-4">
        {["unassigned", "tenant", "user"].map((type) => (
          <label key={type} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="contextType"
              value={type}
              checked={contextType === type}
              onChange={(e) => setContextType(e.target.value)}
              className="h-4 w-4 border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-slate-700 capitalize">{type}</span>
          </label>
        ))}
      </div>

      {/* Tenant Dropdown */}
      {(contextType === "tenant" || contextType === "user") && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Select Tenant {contextType === "user" && "(Optional filter)"}
          </label>
          <div className="relative">
            <select
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              disabled={isTenantsFetching}
              className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:bg-slate-50 disabled:text-slate-500"
            >
              <option value="">{contextType === "user" ? "All Tenants" : "Select a tenant"}</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name || tenant.company_name || `Tenant ${tenant.id}`}
                </option>
              ))}
            </select>
            {isTenantsFetching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* User Dropdown */}
      {contextType === "user" && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Select User</label>
          <div className="relative">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              disabled={isUsersFetching}
              className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:bg-slate-50 disabled:text-slate-500"
            >
              <option value="">Select a user</option>
              {userPool.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.first_name && user.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : user.email || `User ${user.id}`}
                </option>
              ))}
            </select>
            {isUsersFetching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              </div>
            )}
          </div>
          {userPool.length === 0 && !isUsersFetching && (
            <p className="text-xs text-amber-600">No users found for the selected context.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerContextSelector;
