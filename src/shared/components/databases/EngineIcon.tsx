/**
 * EngineIcon — Maps database engine names to visual representations.
 */
import React from "react";
import { Database } from "lucide-react";
import type { DatabaseEngine } from "@/types/managedDatabase";

interface EngineIconProps {
  engine: DatabaseEngine | string;
  size?: number;
  className?: string;
  showLabel?: boolean;
}

const ENGINE_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  mongodb: { label: "MongoDB", color: "text-green-600", bgColor: "bg-green-100" },
  postgresql: { label: "PostgreSQL", color: "text-blue-600", bgColor: "bg-blue-100" },
  mysql: { label: "MySQL", color: "text-orange-600", bgColor: "bg-orange-100" },
  redis: { label: "Redis", color: "text-red-600", bgColor: "bg-red-100" },
};

const EngineIcon: React.FC<EngineIconProps> = ({
  engine,
  size = 20,
  className = "",
  showLabel = false,
}) => {
  const config = ENGINE_CONFIG[engine] ?? {
    label: engine,
    color: "text-gray-600",
    bgColor: "bg-gray-100",
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`inline-flex items-center justify-center rounded-lg p-1.5 ${config.bgColor}`}>
        <Database size={size} className={config.color} />
      </div>
      {showLabel && (
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{config.label}</span>
      )}
    </div>
  );
};

export const getEngineLabel = (engine: string): string => ENGINE_CONFIG[engine]?.label ?? engine;

export const getEngineColor = (engine: string): string =>
  ENGINE_CONFIG[engine]?.color ?? "text-gray-600";

export default EngineIcon;
