import React from "react";
import { LayoutGrid, List } from "lucide-react";

/**
 * ViewToggle - Toggle between table and card view
 */
const ViewToggle = ({ view, onViewChange }) => {
    return (
        <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-1">
            <button
                type="button"
                onClick={() => onViewChange("table")}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition ${view === "table"
                        ? "bg-primary-500 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
            >
                <List className="h-4 w-4" />
                Table
            </button>
            <button
                type="button"
                onClick={() => onViewChange("card")}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition ${view === "card"
                        ? "bg-primary-500 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
            >
                <LayoutGrid className="h-4 w-4" />
                Cards
            </button>
        </div>
    );
};

export default ViewToggle;
