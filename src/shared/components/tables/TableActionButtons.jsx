import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { Eye, SquarePen, Trash2, Copy, Archive, MoreVertical } from "lucide-react";

/**
 * TableActionButtons - Standardized action buttons for admin tables
 *
 * Provides consistent View, Edit, Delete, Duplicate, and Archive actions across all admin tables.
 * Follows the design system with proper variants and accessibility.
 * Mobile responsive with stacked button layout.
 *
 * @param {Object} props
 * @param {Function} props.onView - Handler for view action
 * @param {Function} props.onEdit - Handler for edit action
 * @param {Function} props.onDelete - Handler for delete action
 * @param {Function} [props.onDuplicate] - Handler for duplicate action
 * @param {Function} [props.onArchive] - Handler for archive action
 * @param {boolean} [props.showView=true] - Show view button
 * @param {boolean} [props.showEdit=true] - Show edit button
 * @param {boolean} [props.showDelete=true] - Show delete button
 * @param {boolean} [props.showDuplicate=false] - Show duplicate button
 * @param {boolean} [props.showArchive=false] - Show archive button
 * @param {string} [props.itemName] - Name of item for aria-labels
 * @param {boolean} [props.disabled=false] - Disable all actions
 *
 * @example
 * <TableActionButtons
 *   onView={() => handleView(user)}
 *   onEdit={() => handleEdit(user)}
 *   onDelete={() => handleDelete(user)}
 *   onDuplicate={() => handleDuplicate(user)}
 *   onArchive={() => handleArchive(user)}
 *   showDuplicate
 *   showArchive
 *   itemName={user.name}
 * />
 */
const TableActionButtons = ({
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
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleResize = () => {
      if (isOpen) setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen]);

  const toggleMenu = (e) => {
    e.stopPropagation();
    if (disabled) return;

    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      // Position: align right edge of menu with right edge of button, below button
      // Menu width is w-48 (12rem = 192px)
      const menuWidth = 192;
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.right + window.scrollX - menuWidth,
      });
    }
    setIsOpen(!isOpen);
  };

  const handleAction = (action) => {
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
