import React, { createContext, useContext } from "react";

type AdminShellContextValue = {
  isActive: boolean;
};

const AdminShellContext = createContext<AdminShellContextValue>({ isActive: false });

export const AdminShellProvider: React.FC<{
  isActive: boolean;
  children: React.ReactNode;
}> = ({ isActive, children }) => {
  return <AdminShellContext.Provider value={{ isActive }}>{children}</AdminShellContext.Provider>;
};

export const useAdminShellContext = () => useContext(AdminShellContext);
