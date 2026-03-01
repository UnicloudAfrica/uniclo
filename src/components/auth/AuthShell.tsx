import React from "react";
import AuthBackdrop from "./AuthBackdrop";

type AuthShellProps = {
  children: React.ReactNode;
  className?: string;
};

export default function AuthShell({ children, className = "" }: AuthShellProps) {
  return (
    <div className={`min-h-screen relative overflow-hidden font-Outfit ${className}`}>
      <AuthBackdrop />
      <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
        {children}
      </div>
    </div>
  );
}
