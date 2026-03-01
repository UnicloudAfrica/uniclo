import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { Eye, SquarePen, Trash2, Copy, Archive, MoreVertical } from "lucide-react";

export interface CustomAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: "danger" | "default";
}

interface TableActionButtonsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onArchive?: () => void;
  showView?: boolean;
  showEdit?: boolean;
  showDelete?: boolean;
  showDuplicate?: boolean;
  showArchive?: boolean;
  itemName?: string;
  disabled?: boolean;
  customActions?: CustomAction[];
}

/**
 * TableActionButtons - Standardized action buttons for admin tables
 */
const TableActionButtons: React.FC<TableActionButtonsProps> = ({
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onArchive,
  showView = true,
  showEdit = true,
  showDelete = true,
  showDuplicate = false,
  showArchive = false,
  itemName = "",
  disabled = false,
  customActions = [],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleResize = () => {
      if (isOpen) setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    globalThis.window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      globalThis.window.removeEventListener("resize", handleResize);
    };
  }, [isOpen]);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;

    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      // Position: align right edge of menu with right edge of button, below button
      // Menu width is w-48 (12rem = 192px)
      const menuWidth = 192;
      setPosition({
        top: rect.bottom + globalThis.window.scrollY + 4,
        left: rect.right + globalThis.window.scrollX - menuWidth,
      });
    }
    setIsOpen(!isOpen);
  };

  const handleAction = (action?: () => void) => {
    setIsOpen(false);
    if (action) action();
  };

  const menuContent = (
    <div
      ref={menuRef}
      style={{
        position: "absolute",
        top: position.top,
        left: position.left,
        zIndex: 9999,
      }}
      className="w-48 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg ring-1 ring-black ring-opacity-5"
    >
      <div className="py-1">
        {showView && onView && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleAction(onView);
            }}
            className="flex w-full items-center gap-3 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
          >
            <Eye className="h-4 w-4" />
            View details
          </button>
        )}

        {showEdit && onEdit && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleAction(onEdit);
            }}
            className="flex w-full items-center gap-3 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
          >
            <SquarePen className="h-4 w-4" />
            Edit {itemName || "item"}
          </button>
        )}

        {showDuplicate && onDuplicate && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleAction(onDuplicate);
            }}
            className="flex w-full items-center gap-3 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
          >
            <Copy className="h-4 w-4" />
            Duplicate
          </button>
        )}

        {showArchive && onArchive && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleAction(onArchive);
            }}
            className="flex w-full items-center gap-3 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
          >
            <Archive className="h-4 w-4" />
            Archive
          </button>
        )}

        {showDelete && onDelete && (
          <>
            <div className="my-1 border-t border-slate-200" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleAction(onDelete);
              }}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-rose-600 transition hover:bg-rose-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </>
        )}

        {customActions &&
          customActions.map((action, index) => (
            <button
              key={index}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleAction(action.onClick);
              }}
              className={`flex w-full items-center gap-3 px-4 py-2 text-sm transition hover:bg-slate-50 ${
                action.variant === "danger" ? "text-rose-600 hover:bg-rose-50" : "text-slate-700"
              }`}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleMenu}
        disabled={disabled}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Actions"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {isOpen && ReactDOM.createPortal(menuContent, document.body)}
    </>
  );
};

export default TableActionButtons;
