import React from "react";

/**
 * LeadScoreIndicator - Visual indicator for lead score/quality
 */
const LeadScoreIndicator = ({ score, size = "md", showLabel = true }) => {
    const numericScore = typeof score === "number" ? score : parseInt(score, 10) || 0;

    // Determine color based on score
    let colorClass = "text-gray-400 bg-gray-100";
    let ringClass = "ring-gray-200";

    if (numericScore >= 80) {
        colorClass = "text-emerald-600 bg-emerald-50";
        ringClass = "ring-emerald-200";
    } else if (numericScore >= 60) {
        colorClass = "text-blue-600 bg-blue-50";
        ringClass = "ring-blue-200";
    } else if (numericScore >= 40) {
        colorClass = "text-amber-600 bg-amber-50";
        ringClass = "ring-amber-200";
    } else if (numericScore > 0) {
        colorClass = "text-rose-600 bg-rose-50";
        ringClass = "ring-rose-200";
    }

    const sizeClasses = {
        sm: "h-8 w-8 text-xs",
        md: "h-10 w-10 text-sm",
        lg: "h-12 w-12 text-base",
    };

    return (
        <div className="inline-flex items-center gap-2">
            <div
                className={`inline-flex items-center justify-center rounded-full font-semibold ring-2 ${colorClass} ${ringClass} ${sizeClasses[size]}`}
            >
                {numericScore}
            </div>
            {showLabel && (
                <span className="text-xs font-medium text-gray-500">/ 100</span>
            )}
        </div>
    );
};

export default LeadScoreIndicator;
