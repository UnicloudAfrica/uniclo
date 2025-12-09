import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, X, ChevronLeft, ChevronRight, Menu } from "lucide-react";
import CollapsibleMenu from "./CollapsibleMenu";
import type { MenuEntry } from "./CollapsibleMenu";
import useSidebarStore from "../../../stores/sidebarStore";
import { clearAllAuthSessions } from "../../../stores/sessionUtils";

export interface DashboardSidebarProps {
  /** Menu items to display */
  menuItems: MenuEntry[];
  /** Label to show at the top of the sidebar (e.g., "ADMIN", "TENANT") */
  sidebarLabel?: string;
  /** Theme color for active states */
  themeColor?: string;
  /** Logout redirect path */
  logoutPath?: string;
  /** Mobile menu open state (controlled from parent) */
  isMobileMenuOpen?: boolean;
  /** Callback when mobile menu should close */
  onCloseMobileMenu?: () => void;
  /** User profile data for mobile header */
  userProfile?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    initials?: string;
  };
  /** Custom logout handler (optional, defaults to clearAllAuthSessions + navigate) */
  onLogout?: () => void;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  menuItems,
  sidebarLabel = "MENU",
  themeColor,
  logoutPath = "/sign-in",
  isMobileMenuOpen = false,
  onCloseMobileMenu,
  userProfile,
  onLogout,
}) => {
  const navigate = useNavigate();
  const { isCollapsed, toggleCollapse, closeMobile } = useSidebarStore();

  const handleItemClick = () => {
    onCloseMobileMenu?.();
    closeMobile();
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      clearAllAuthSessions();
      navigate(logoutPath);
    }
    onCloseMobileMenu?.();
    closeMobile();
  };

  const getInitials = () => {
    if (userProfile?.initials) return userProfile.initials;
    const first = userProfile?.firstName?.trim()?.[0]?.toUpperCase() || "";
    const last = userProfile?.lastName?.trim()?.[0]?.toUpperCase() || "";
    return first + last || "--";
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={`hidden md:block fixed top-[74px] left-0 z-[999] h-full border-r border-[#C8CBD9] bg-[#fff] font-Outfit transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-16" : "w-60 xl:w-[20%] min-w-[240px]"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header with collapse toggle */}
          <div className="px-3 py-4 md:px-0 md:pl-3.5 md:py-6 w-full border-b border-[#ECEDF0] flex justify-between items-center">
            {!isCollapsed && (
              <button className="py-1 px-2 text-[#676767] font-normal text-sm lg:text-sm">
                {sidebarLabel}
              </button>
            )}
            <button
              onClick={toggleCollapse}
              className={`p-1 rounded-md hover:bg-gray-100 text-gray-500 transition-colors ${
                isCollapsed ? "mx-auto" : "mr-2"
              }`}
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 w-full mt-3 px-2 max-h-[80vh] overflow-y-auto overflow-x-hidden">
            <CollapsibleMenu
              items={menuItems}
              isCollapsed={isCollapsed}
              onItemClick={handleItemClick}
              themeColor={themeColor}
            />
            <ul className="mt-auto">
              <li>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center py-2 px-3.5 space-x-2 text-left text-[#DC3F41] transition-all duration-200 hover:bg-[#FDF2F2]"
                  title={isCollapsed ? "Logout" : ""}
                >
                  <div className="relative flex items-center justify-center w-5 h-5 flex-shrink-0">
                    <LogOut size={16} />
                  </div>
                  {!isCollapsed && (
                    <span className="text-sm font-normal font-Outfit whitespace-nowrap">
                      Logout
                    </span>
                  )}
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile Overlay Sidebar */}
      <div className="md:hidden">
        <div
          className={`fixed inset-0 bg-black z-[999] transition-all duration-300 ease-in-out ${
            isMobileMenuOpen
              ? "bg-opacity-50 pointer-events-auto"
              : "bg-opacity-0 pointer-events-none"
          }`}
          onClick={onCloseMobileMenu}
        >
          <div
            className={`fixed top-0 left-0 h-full w-[280px] bg-[#14547F] text-white flex flex-col transform transition-transform duration-300 ease-in-out ${
              isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
            style={themeColor ? { backgroundColor: themeColor } : undefined}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Close Button */}
            <div className="flex justify-between items-center p-6">
              <div className="flex items-center space-x-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ffffff20] text-base font-semibold">
                  {getInitials()}
                </div>
                {userProfile && (
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{userProfile.email || "No email"}</span>
                    <span className="text-xs text-white/80">
                      {userProfile.firstName || userProfile.lastName
                        ? `${userProfile.firstName ?? ""} ${userProfile.lastName ?? ""}`
                        : sidebarLabel}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={onCloseMobileMenu}
                className="text-white hover:bg-[#ffffff20] p-2 rounded-lg transition-colors duration-200"
              >
                <X size={20} />
              </button>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 overflow-y-auto py-4">
              <CollapsibleMenu
                items={menuItems}
                isMobile={true}
                onItemClick={handleItemClick}
                themeColor={themeColor}
              />
              <ul className="space-y-1 px-4 mt-2">
                <li>
                  <button
                    className="w-full flex items-center py-3 px-4 space-x-3 text-left text-[#DC3F41] hover:bg-[#ffffff15] rounded-lg transition-colors duration-200"
                    onClick={handleLogout}
                  >
                    <div className="flex items-center justify-center w-5 h-5 flex-shrink-0">
                      <LogOut size={16} />
                    </div>
                    <span className="text-xs font-medium">Logout</span>
                  </button>
                </li>
              </ul>
            </nav>

            {/* Footer */}
            <div className="text-xs text-[#F1F1F1CC] font-Outfit px-6 py-4 border-t border-[#ffffff20]">
              Version 1.0 - Live • Terms of Service
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardSidebar;
