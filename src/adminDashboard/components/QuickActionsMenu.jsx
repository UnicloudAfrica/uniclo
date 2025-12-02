import React, { useState } from "react";
import { Mail, Phone, Eye, MoreVertical, Edit, Trash2, UserCheck } from "lucide-react";

/**
 * QuickActionsMenu - Dropdown menu for lead actions
 */
const QuickActionsMenu = ({ lead, onView, onEdit, onEmail, onCall, onDelete, onAssign }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleAction = (action) => {
        setIsOpen(false);
        action();
    };

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
            >
                <MoreVertical className="h-4 w-4" />
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Menu */}
                    <div className="absolute right-0 top-10 z-20 w-48 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                        <div className="py-1">
                            <button
                                type="button"
                                onClick={() => handleAction(() => onView?.(lead))}
                                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                            >
                                <Eye className="h-4 w-4" />
                                View details
                            </button>

                            <button
                                type="button"
                                onClick={() => handleAction(() => onEdit?.(lead))}
                                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                            >
                                <Edit className="h-4 w-4" />
                                Edit lead
                            </button>

                            <button
                                type="button"
                                onClick={() => handleAction(() => onEmail?.(lead))}
                                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                            >
                                <Mail className="h-4 w-4" />
                                Send email
                            </button>

                            <button
                                type="button"
                                onClick={() => handleAction(() => onCall?.(lead))}
                                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                            >
                                <Phone className="h-4 w-4" />
                                Call lead
                            </button>

                            <button
                                type="button"
                                onClick={() => handleAction(() => onAssign?.(lead))}
                                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                            >
                                <UserCheck className="h-4 w-4" />
                                Assign to...
                            </button>

                            <div className="my-1 border-t border-slate-200" />

                            <button
                                type="button"
                                onClick={() => handleAction(() => onDelete?.(lead))}
                                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-rose-600 transition hover:bg-rose-50"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete lead
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default QuickActionsMenu;
