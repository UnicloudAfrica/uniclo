// @ts-nocheck
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  TrendingUp,
  CreditCard,
  Package,
  Database,
  DollarSign,
  FolderOpen,
  Server,
  Calculator,
  FileText,
  Settings,
  LogOut,
  X,
  Menu,
  ChevronLeft,
  ChevronRight,
  Building2,
  MapPin,
  BarChart3,
} from "lucide-react";
import { designTokens } from "../../styles/designTokens";
import { clearAllAuthSessions } from "../../stores/sessionUtils";

const ModernAdminSidebar = ({ isMobileMenuOpen, onCloseMobileMenu }: any) => {
  const [activeItem, setActiveItem] = useState("Home");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Map of paths to menu item names
  const pathToItemMap = {
    "/admin-dashboard": "Home",
    "/admin-dashboard/partners": "Tenants & Users",
    "/admin-dashboard/clients": "Clients",
    "/admin-dashboard/leads": "Leads",
    "/admin-dashboard/payment": "Payment",
    "/admin-dashboard/products": "Products",
    "/admin-dashboard/inventory": "Inventory",
    "/admin-dashboard/pricing": "Pricing",
    "/admin-dashboard/projects": "Projects",
    "/admin-dashboard/instances": "Instances",
    "/admin-dashboard/regions": "Regions",
    "/admin-dashboard/pricing-calculator": "Calculator",
    "/admin-dashboard/create-invoice": "Generate Invoice",
    "/admin-dashboard/tax-configuration": "Tax Configuration",
    "/admin-dashboard/enhanced-profile-settings": "Profile Settings",
  };

  // Update activeItem based on the current path
  useEffect(() => {
    const currentPath = location.pathname;
    const itemName = pathToItemMap[currentPath] || "Home";
    setActiveItem(itemName);
  }, [location.pathname, pathToItemMap]);

  const menuItems = [
    {
      name: "Home",
      icon: Home,
      path: "/admin-dashboard",
      category: "main",
    },
    {
      name: "Tenants & Users",
      icon: Users,
      path: "/admin-dashboard/partners",
      category: "main",
    },
    {
      name: "Leads",
      icon: TrendingUp,
      path: "/admin-dashboard/leads",
      category: "main",
    },
    {
      name: "Products",
      icon: Package,
      path: "/admin-dashboard/products",
      category: "catalog",
    },
    {
      name: "Inventory",
      icon: Database,
      path: "/admin-dashboard/inventory",
      category: "catalog",
    },
    {
      name: "Pricing",
      icon: DollarSign,
      path: "/admin-dashboard/pricing",
      category: "catalog",
    },
    {
      name: "Projects",
      icon: FolderOpen,
      path: "/admin-dashboard/projects",
      category: "management",
    },
    {
      name: "Instances",
      icon: Server,
      path: "/admin-dashboard/instances",
      category: "management",
    },
    {
      name: "Regions",
      icon: MapPin,
      path: "/admin-dashboard/regions",
      category: "management",
    },
    {
      name: "Payment",
      icon: CreditCard,
      path: "/admin-dashboard/payment",
      category: "financial",
    },
    {
      name: "Calculator",
      icon: Calculator,
      path: "/admin-dashboard/pricing-calculator",
      category: "tools",
    },
    {
      name: "Generate Invoice",
      icon: FileText,
      path: "/admin-dashboard/create-invoice",
      category: "tools",
    },
    {
      name: "Tax Configuration",
      icon: BarChart3,
      path: "/admin-dashboard/tax-configuration",
      category: "settings",
    },
    {
      name: "Profile Settings",
      icon: Settings,
      path: "/admin-dashboard/enhanced-profile-settings",
      category: "settings",
    },
  ];

  const categoryLabels = {
    main: "Main",
    catalog: "Catalog",
    management: "Management",
    financial: "Financial",
    tools: "Tools",
    settings: "Settings",
  };

  const handleItemClick = (itemName: any, path: any) => {
    setActiveItem(itemName);
    navigate(path);
    onCloseMobileMenu();
  };

  const handleLogout = () => {
    clearAllAuthSessions();
    navigate("/admin-signin");
    onCloseMobileMenu();
  };

  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  const MenuItem = ({ item, isActive }: any) => {
    const Icon = item.icon;
    const isHovered = hoveredItem === item.name;

    const menuItemStyles = {
      display: "flex",
      alignItems: "center",
      padding: isCollapsed ? "12px 16px" : "12px 16px",
      margin: "4px 8px",
      borderRadius: designTokens.borderRadius.lg,
      cursor: "pointer",
      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      textDecoration: "none",
      fontSize: designTokens.typography.fontSize.sm[0],
      fontWeight: isActive
        ? designTokens.typography.fontWeight.medium
        : designTokens.typography.fontWeight.normal,
      color: isActive ? designTokens.colors.primary[700] : designTokens.colors.neutral[600],
      backgroundColor: isActive
        ? `${designTokens.colors.primary[50]}`
        : isHovered
          ? designTokens.colors.neutral[50]
          : "transparent",
      border: isActive ? `1px solid ${designTokens.colors.primary[100]}` : "1px solid transparent",
      position: "relative",
    };

    const iconStyles = {
      width: "20px",
      height: "20px",
      marginRight: isCollapsed ? 0 : "12px",
      flexShrink: 0,
      color: isActive ? designTokens.colors.primary[600] : designTokens.colors.neutral[500],
    };

    return (
      <div
        style={menuItemStyles}
        onClick={() => handleItemClick(item.name, item.path)}
        onMouseEnter={() => setHoveredItem(item.name)}
        onMouseLeave={() => setHoveredItem(null)}
      >
        {/* Active indicator */}
        {isActive && (
          <div
            style={{
              position: "absolute",
              left: "0px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "3px",
              height: "20px",
              backgroundColor: designTokens.colors.primary[500],
              borderRadius: "0 2px 2px 0",
            }}
          />
        )}

        <Icon style={iconStyles} />
        {!isCollapsed && (
          <span
            style={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {item.name}
          </span>
        )}
      </div>
    );
  };

  const CategoryLabel = ({ label }: any) => {
    if (isCollapsed) return null;

    return (
      <div
        style={{
          padding: "16px 16px 8px 16px",
          fontSize: designTokens.typography.fontSize.xs[0],
          fontWeight: designTokens.typography.fontWeight.semibold,
          color: designTokens.colors.neutral[400],
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {label}
      </div>
    );
  };

  const sidebarStyles = {
    position: "fixed",
    top: 0,
    left: 0,
    height: "100vh",
    width: isCollapsed ? "80px" : "280px",
    backgroundColor: designTokens.colors.neutral[0],
    borderRight: `1px solid ${designTokens.colors.neutral[200]}`,
    transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
    boxShadow: designTokens.shadows.sm,
    fontFamily: designTokens.typography.fontFamily.sans.join(", "),
  };

  const headerStyles = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 16px",
    borderBottom: `1px solid ${designTokens.colors.neutral[100]}`,
    backgroundColor: designTokens.colors.neutral[0],
  };

  const logoStyles = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  };

  const logoTextStyles = {
    fontSize: "20px",
    fontWeight: designTokens.typography.fontWeight.bold,
    color: designTokens.colors.primary[600],
    display: isCollapsed ? "none" : "block",
  };

  const toggleButtonStyles = {
    padding: "8px",
    borderRadius: designTokens.borderRadius.md,
    border: "none",
    backgroundColor: "transparent",
    color: designTokens.colors.neutral[500],
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const contentStyles = {
    flex: 1,
    overflowY: "auto",
    overflowX: "hidden",
    padding: "16px 0",
  };

  const footerStyles = {
    padding: "16px",
    borderTop: `1px solid ${designTokens.colors.neutral[100]}`,
  };

  const logoutButtonStyles = {
    display: "flex",
    alignItems: "center",
    padding: "12px 16px",
    margin: "0",
    borderRadius: designTokens.borderRadius.lg,
    cursor: "pointer",
    transition: "all 0.2s ease",
    border: "none",
    backgroundColor: "transparent",
    color: designTokens.colors.error[600],
    fontSize: designTokens.typography.fontSize.sm[0],
    fontWeight: designTokens.typography.fontWeight.medium,
    width: "100%",
    justifyContent: isCollapsed ? "center" : "flex-start",
  };

  // Mobile overlay
  const mobileOverlayStyles = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 999,
    display: isMobileMenuOpen ? "block" : "none",
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div style={mobileOverlayStyles} onClick={onCloseMobileMenu} />

      {/* Sidebar */}
      <div
        style={{
          ...sidebarStyles,
          transform: `translateX(${isMobileMenuOpen || window.innerWidth >= 1024 ? "0" : "-100%"})`,
          "@media (max-width: 1024px)": {
            width: "280px",
          },
        }}
      >
        {/* Header */}
        <div style={headerStyles}>
          <div style={logoStyles}>
            {/* UniCloud Logo - could be an actual image */}
            <div
              style={{
                width: "32px",
                height: "32px",
                backgroundColor: designTokens.colors.primary[500],
                borderRadius: designTokens.borderRadius.lg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: designTokens.colors.neutral[0],
                fontSize: "16px",
                fontWeight: "bold",
              }}
            >
              U
            </div>
            <span style={logoTextStyles}>UniCloud Admin</span>
          </div>

          {/* Mobile close button */}
          {isMobileMenuOpen && window.innerWidth < 1024 && (
            <button
              style={{
                ...toggleButtonStyles,
                color: designTokens.colors.neutral[500],
              }}
              onClick={onCloseMobileMenu}
            >
              <X size={20} />
            </button>
          )}

          {/* Desktop collapse toggle */}
          {window.innerWidth >= 1024 && (
            <button
              style={toggleButtonStyles}
              onClick={() => setIsCollapsed(!isCollapsed)}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = designTokens.colors.neutral[100];
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "transparent";
              }}
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          )}
        </div>

        {/* Navigation Content */}
        <div style={contentStyles}>
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category}>
              <CategoryLabel label={categoryLabels[category]} />
              {items.map((item: any) => (
                <MenuItem key={item.name} item={item} isActive={activeItem === item.name} />
              ))}
            </div>
          ))}
        </div>

        {/* Footer with Logout */}
        <div style={footerStyles}>
          <button
            style={logoutButtonStyles}
            onClick={handleLogout}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = designTokens.colors.error[50];
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "transparent";
            }}
          >
            <LogOut size={20} style={{ marginRight: isCollapsed ? 0 : "12px" }} />
            {!isCollapsed && "Logout"}
          </button>
        </div>
      </div>

      {/* Mobile Menu Toggle Button */}
      {window.innerWidth < 1024 && !isMobileMenuOpen && (
        <button
          style={{
            position: "fixed",
            top: "16px",
            left: "16px",
            zIndex: 1001,
            padding: "12px",
            backgroundColor: designTokens.colors.neutral[0],
            border: `1px solid ${designTokens.colors.neutral[200]}`,
            borderRadius: designTokens.borderRadius.lg,
            boxShadow: designTokens.shadows.sm,
            color: designTokens.colors.neutral[700],
            cursor: "pointer",
          }}
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Menu size={20} />
        </button>
      )}
    </>
  );
};

export default ModernAdminSidebar;
