import React from "react";
import { Network, Globe, Lock, Layers, Database, ChevronRight, Box } from "lucide-react";

export interface NetworkPreset {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  recommended?: boolean;
  isPublic?: boolean;
  requiresEip?: boolean;
}

export const DEFAULT_PRESETS: NetworkPreset[] = [
  {
    id: "standard",
    name: "Standard",
    description: "Public network with SSH, HTTP, and HTTPS access",
    icon: <Globe className="w-5 h-5" />,
    features: ["Public subnet", "Internet Gateway", "SSH/HTTP/HTTPS ports"],
    recommended: true,
    isPublic: true,
    requiresEip: true,
  },
  {
    id: "private",
    name: "Private",
    description: "Internal network with no public access",
    icon: <Lock className="w-5 h-5" />,
    features: ["Private subnet", "No internet gateway", "Internal traffic only"],
    isPublic: false,
    requiresEip: false,
  },
  {
    id: "multi-tier",
    name: "Multi-Tier",
    description: "Public and private subnets for web + app layers",
    icon: <Layers className="w-5 h-5" />,
    features: ["Public + private subnets", "Internet Gateway", "Separate security groups"],
    isPublic: true,
    requiresEip: true,
  },
  {
    id: "database",
    name: "Database",
    description: "Optimized for database deployments",
    icon: <Database className="w-5 h-5" />,
    features: ["Private subnet", "MySQL/PostgreSQL/MongoDB/Redis ports", "Internal access only"],
    isPublic: false,
    requiresEip: false,
  },
  {
    id: "empty",
    name: "Empty Project",
    description:
      "A clean slate. Creates the project container but provisions NO network resources. Perfect for custom topologies.",
    icon: <Box className="w-5 h-5" />,
    features: [
      "VPC Container Only",
      "No Subnets",
      "No Route Tables",
      "Manual Network Setup Required",
    ],
    isPublic: false,
    requiresEip: false,
  },
];

interface NetworkPresetSelectorProps {
  value: string | null;
  onChange: (presetId: string) => void;
  presets?: NetworkPreset[];
  disabled?: boolean;
  showAdvancedOption?: boolean;
  onAdvancedClick?: () => void;
}

const NetworkPresetSelector: React.FC<NetworkPresetSelectorProps> = ({
  value,
  onChange,
  presets = DEFAULT_PRESETS,
  disabled = false,
  showAdvancedOption = true,
  onAdvancedClick,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Network className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">Network Configuration</h3>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Choose a network preset for your project. This determines the VPC, subnets, and security
        rules.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(preset.id)}
            className={`
              relative p-4 rounded-xl border-2 text-left transition-all duration-200
              ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:shadow-md"}
              ${
                value === preset.id
                  ? "border-blue-500 bg-blue-50 shadow-sm"
                  : "border-gray-200 bg-white hover:border-blue-300"
              }
            `}
          >
            {preset.recommended && (
              <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                Recommended
              </span>
            )}

            <div className="flex items-start gap-3">
              <div
                className={`
                  p-2 rounded-lg
                  ${value === preset.id ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"}
                `}
              >
                {preset.icon}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900">{preset.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{preset.description}</p>

                <ul className="mt-2 space-y-1">
                  {preset.features.map((feature, i) => (
                    <li key={i} className="text-xs text-gray-500 flex items-center gap-1">
                      <span className="w-1 h-1 bg-gray-400 rounded-full" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {value === preset.id && (
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {showAdvancedOption && (
        <button
          type="button"
          onClick={onAdvancedClick}
          className="w-full mt-3 p-3 rounded-lg border border-dashed border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors flex items-center justify-center gap-2"
        >
          <span className="text-sm">Advanced Network Configuration</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default NetworkPresetSelector;
