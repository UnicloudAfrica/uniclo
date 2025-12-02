import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

/**
 * TrendIndicator - Shows trend direction with icon and percentage
 */
const TrendIndicator = ({ value, className = "" }) => {
    if (!value || value === 0) {
        return (
            <span className={`inline-flex items-center gap-1 text-xs font-medium text-gray-500 ${className}`}>
                <Minus className="h-3 w-3" />
                <span>0%</span>
            </span>
        );
    }

    const isPositive = value > 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const colorClass = isPositive ? "text-emerald-600" : "text-rose-600";

    return (
        <span className={`inline-flex items-center gap-1 text-xs font-medium ${colorClass} ${className}`}>
            <Icon className="h-3 w-3" />
            <span>{isPositive ? "+" : ""}{value}%</span>
        </span>
    );
};

export default TrendIndicator;
