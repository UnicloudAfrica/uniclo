import React, { useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight, LucideIcon } from "lucide-react";

// ============= Types =============

export interface MenuItem {
  name: string;
  icon: LucideIcon | string;
  isLucide?: boolean;
  path: string;
  activeIcon?: string;
}

export interface MenuGroup {
  name: string;
  icon: LucideIcon | string;
  isLucide?: boolean;
  children: MenuItem[];
  defaultOpen?: boolean;
}

export type MenuEntry = MenuItem | MenuGroup;

export interface CollapsibleMenuProps {
  items: MenuEntry[];
  isCollapsed?: boolean;
  isMobile?: boolean;
  onItemClick?: (path: string) => void;
  themeColor?: string;
}

// ============= Helper Functions =============

export const isMenuGroup = (entry: MenuEntry): entry is MenuGroup => {
  return "children" in entry && Array.isArray((entry as MenuGroup).children);
};

// ============= Sub-Components =============

interface MenuItemComponentProps {
  item: MenuItem;
  isActive: boolean;
  isCollapsed?: boolean;
  isMobile?: boolean;
  onClick: () => void;
  themeColor?: string;
  isNested?: boolean;
}

const MenuItemComponent: React.FC<MenuItemComponentProps> = ({
  item,
  isActive,
  isCollapsed = false,
  isMobile = false,
  onClick,
  themeColor,
  isNested = false,
}) => {
  const Icon = item.icon as LucideIcon;
  const isLucide = item.isLucide !== false && typeof item.icon !== "string";

  if (isMobile) {
    return (
      <li>
        <button
          onClick={onClick}
          className={`w-full flex items-center py-2 px-4 space-x-3 text-left transition-all duration-200 rounded-lg ${isActive
            ? "bg-[#ffffff15] text-white"
            : "text-gray-200 hover:bg-[#ffffff15] hover:text-white"
            }`}
        >
          <div className="flex items-center justify-center w-4 h-4 flex-shrink-0">
            {isLucide ? (
              <Icon size={16} className="text-white" />
            ) : (
              <img
                src={isActive ? item.activeIcon : (item.icon as string)}
                className="w-4 h-4 brightness-0 invert"
                alt={item.name}
              />
            )}
          </div>
          <span className="text-xs font-medium">{item.name}</span>
        </button>
      </li>
    );
  }

  return (
    <li>
      <button
        onClick={onClick}
        className={`w-full flex items-center py-2 ${isNested ? "px-6" : "px-3.5"} space-x-2 text-left transition-all duration-200 hover:bg-gray-50 ${isActive ? "text-[#1C1C1C]" : "text-[#676767] hover:text-[#1C1C1C]"
          }`}
        title={isCollapsed ? item.name : ""}
        style={themeColor && isActive ? { backgroundColor: `${themeColor}15` } : undefined}
      >
        <div className="relative flex items-center justify-center w-5 h-5 flex-shrink-0">
          {isActive && !isNested && (
            <div
              className="absolute left-[-14px] w-1 h-4 rounded-[3px]"
              style={{ backgroundColor: themeColor || "#1C1C1C" }}
            />
          )}
          {isLucide ? (
            <Icon size={16} className={isActive ? "text-[#1C1C1C]" : "text-[#676767]"} />
          ) : (
            <img
              src={isActive ? item.activeIcon : (item.icon as string)}
              className="w-4 h-4"
              alt={item.name}
            />
          )}
        </div>
        {!isCollapsed && (
          <span className="text-sm font-normal font-Outfit whitespace-nowrap overflow-hidden text-ellipsis">
            {item.name}
          </span>
        )}
      </button>
    </li>
  );
};

interface MenuGroupComponentProps {
  group: MenuGroup;
  isCollapsed?: boolean;
  isMobile?: boolean;
  activePath: string;
  onItemClick: (path: string) => void;
  themeColor?: string;
}

const MenuGroupComponent: React.FC<MenuGroupComponentProps> = ({
  group,
  isCollapsed = false,
  isMobile = false,
  activePath,
  onItemClick,
  themeColor,
}) => {
  // Check if any child is active to determine if group should be open by default
  const hasActiveChild = group.children.some((child) => activePath.startsWith(child.path));
  const [isOpen, setIsOpen] = useState(group.defaultOpen || hasActiveChild);

  const Icon = group.icon as LucideIcon;
  const isLucide = group.isLucide !== false && typeof group.icon !== "string";

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  if (isMobile) {
    return (
      <li>
        <button
          onClick={toggleOpen}
          className="w-full flex items-center justify-between py-2 px-4 text-left transition-all duration-200 rounded-lg text-gray-200 hover:bg-[#ffffff15] hover:text-white"
        >
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-4 h-4 flex-shrink-0">
              {isLucide ? (
                <Icon size={16} className="text-white" />
              ) : (
                <img
                  src={group.icon as string}
                  className="w-4 h-4 brightness-0 invert"
                  alt={group.name}
                />
              )}
            </div>
            <span className="text-xs font-medium">{group.name}</span>
          </div>
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${isOpen ? "rotate-0" : "-rotate-90"}`}
          />
        </button>
        <ul
          className={`overflow-hidden transition-all duration-200 ${isOpen ? "max-h-96 opacity-100 mt-1" : "max-h-0 opacity-0"
            }`}
        >
          {group.children.map((child) => (
            <MenuItemComponent
              key={child.name}
              item={child}
              isActive={activePath === child.path || activePath.startsWith(child.path + "/")}
              isMobile={true}
              onClick={() => onItemClick(child.path)}
              themeColor={themeColor}
              isNested={true}
            />
          ))}
        </ul>
      </li>
    );
  }

  // Desktop collapsed state - show only icon with tooltip
  // Use a ref and state to position the dropdown using fixed positioning
  // This ensures it escapes any overflow:hidden/auto parent containers
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const [dropdownStyle, setDropdownStyle] = React.useState<React.CSSProperties>({});

  const updateDropdownPosition = React.useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: rect.top,
        left: rect.right + 4,
        zIndex: 9999,
      });
    }
  }, []);

  if (isCollapsed) {
    return (
      <li className="relative group" onMouseEnter={updateDropdownPosition}>
        <button
          ref={buttonRef}
          className="w-full flex items-center justify-center py-2 px-3.5 transition-all duration-200 hover:bg-gray-50 text-[#676767] hover:text-[#1C1C1C]"
          title={group.name}
        >
          <div className="relative flex items-center justify-center w-5 h-5 flex-shrink-0">
            {isLucide ? (
              <Icon size={16} className={hasActiveChild ? "text-[#1C1C1C]" : "text-[#676767]"} />
            ) : (
              <img src={group.icon as string} className="w-4 h-4" alt={group.name} />
            )}
          </div>
        </button>
        {/* Hover dropdown for collapsed state - uses fixed positioning */}
        <div
          className="hidden group-hover:block"
          style={dropdownStyle}
        >
          <div className="bg-white border border-[#C8CBD9] rounded-lg shadow-lg py-2 min-w-[180px]">
            <div className="px-3 py-1 text-xs font-medium text-[#676767] border-b border-[#ECEDF0] mb-1">
              {group.name}
            </div>
            <ul>
              {group.children.map((child) => (
                <li key={child.name}>
                  <button
                    onClick={() => onItemClick(child.path)}
                    className={`w-full flex items-center py-2 px-3 space-x-2 text-left transition-all duration-200 hover:bg-gray-50 ${activePath === child.path || activePath.startsWith(child.path + "/")
                      ? "text-[#1C1C1C] bg-gray-50"
                      : "text-[#676767] hover:text-[#1C1C1C]"
                      }`}
                  >
                    <span className="text-sm font-normal font-Outfit">{child.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </li>
    );
  }

  // Desktop expanded state
  return (
    <li>
      <button
        onClick={toggleOpen}
        className="w-full flex items-center justify-between py-2 px-3.5 text-left transition-all duration-200 hover:bg-gray-50 text-[#676767] hover:text-[#1C1C1C]"
      >
        <div className="flex items-center space-x-2">
          <div className="relative flex items-center justify-center w-5 h-5 flex-shrink-0">
            {isLucide ? (
              <Icon size={16} className={hasActiveChild ? "text-[#1C1C1C]" : "text-[#676767]"} />
            ) : (
              <img src={group.icon as string} className="w-4 h-4" alt={group.name} />
            )}
          </div>
          <span className="text-sm font-normal font-Outfit whitespace-nowrap overflow-hidden text-ellipsis">
            {group.name}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={`text-[#676767] transition-transform duration-200 ${isOpen ? "rotate-0" : "-rotate-90"}`}
        />
      </button>
      <ul
        className={`overflow-hidden transition-all duration-200 pl-2 ${isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
          }`}
      >
        {group.children.map((child) => (
          <MenuItemComponent
            key={child.name}
            item={child}
            isActive={activePath === child.path || activePath.startsWith(child.path + "/")}
            isCollapsed={false}
            onClick={() => onItemClick(child.path)}
            themeColor={themeColor}
            isNested={true}
          />
        ))}
      </ul>
    </li>
  );
};

// ============= Main Component =============

const CollapsibleMenu: React.FC<CollapsibleMenuProps> = ({
  items,
  isCollapsed = false,
  isMobile = false,
  onItemClick,
  themeColor,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const activePath = location.pathname;

  const handleItemClick = useCallback(
    (path: string) => {
      navigate(path);
      onItemClick?.(path);
    },
    [navigate, onItemClick]
  );

  return (
    <ul className={`flex flex-col w-full ${isMobile ? "space-y-1 px-4" : ""}`}>
      {items.map((entry) => {
        if (isMenuGroup(entry)) {
          return (
            <MenuGroupComponent
              key={entry.name}
              group={entry}
              isCollapsed={isCollapsed}
              isMobile={isMobile}
              activePath={activePath}
              onItemClick={handleItemClick}
              themeColor={themeColor}
            />
          );
        }
        return (
          <MenuItemComponent
            key={entry.name}
            item={entry}
            isActive={activePath === entry.path || activePath.startsWith(entry.path + "/")}
            isCollapsed={isCollapsed}
            isMobile={isMobile}
            onClick={() => handleItemClick(entry.path)}
            themeColor={themeColor}
          />
        );
      })}
    </ul>
  );
};

export default CollapsibleMenu;
