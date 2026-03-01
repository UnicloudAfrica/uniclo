import React from "react";
import { ModernButton } from "../../ui";

export interface ProjectTeamMember {
  id: string | number;
  name?: string;
  email?: string;
  role?: string;
}

interface ProjectDetailsTeamAccessProps {
  members?: ProjectTeamMember[];
  disableManageButton?: boolean;
  manageLabel?: string;
}

const ProjectDetailsTeamAccess: React.FC<ProjectDetailsTeamAccessProps> = ({
  members = [],
  disableManageButton = true,
  manageLabel = "Manage Team",
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Team Access</h3>
        <ModernButton size="sm" variant="outline" isDisabled={disableManageButton}>
          {manageLabel}
        </ModernButton>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {members.length > 0 ? (
              members.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.name || "Unknown"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.email || "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.role || "Member"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                  No team members found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProjectDetailsTeamAccess;
