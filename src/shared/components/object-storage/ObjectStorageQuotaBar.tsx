// @ts-nocheck
import React from "react";

interface ObjectStorageQuotaBarProps {
  usedGb: number;
  quotaGb: number | null;
  className?: string;
}

const ObjectStorageQuotaBar: React.FC<ObjectStorageQuotaBarProps> = ({
  usedGb = 0,
  quotaGb,
  className = "",
}) => {
  const isUnlimited = !quotaGb || quotaGb <= 0;
  const percentage = isUnlimited ? 0 : Math.min(100, (usedGb / quotaGb) * 100);

  const getBarColor = () => {
    if (percentage >= 90) return "bg-rose-500";
    if (percentage >= 75) return "bg-amber-500";
    return "bg-primary-500";
  };

  const formatSize = (gb: number) => {
    if (gb >= 1024) return `${(gb / 1024).toFixed(2)} TB`;
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    return `${(gb * 1024).toFixed(0)} MB`;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">Storage Used</span>
        <span className="text-gray-600">
          {formatSize(usedGb)} / {isUnlimited ? "Unlimited" : formatSize(quotaGb)}
        </span>
      </div>
      <div className="h-3 w-full rounded-full bg-gray-200 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${getBarColor()}`}
          style={{ width: `${isUnlimited ? 0 : percentage}%` }}
        />
      </div>
      {!isUnlimited && percentage >= 90 && (
        <p className="text-xs text-rose-600">
          Warning: Storage is almost full ({percentage.toFixed(0)}% used)
        </p>
      )}
    </div>
  );
};

export default ObjectStorageQuotaBar;
