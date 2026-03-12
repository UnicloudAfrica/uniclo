import React, { memo } from "react";
import { ShieldOff } from "lucide-react";
import { designTokens } from "@/styles/designTokens";

interface UnsupportedFeatureProps {
  feature: string;
  provider: string;
}

const UnsupportedFeatureBase: React.FC<UnsupportedFeatureProps> = ({ feature, provider }) => {
  return (
    <div
      className="flex w-full flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-16 text-center"
      style={{
        borderColor: designTokens.colors.neutral[200],
        backgroundColor: designTokens.colors.neutral[50],
        color: designTokens.colors.neutral[500],
      }}
    >
      <div
        className="mb-4 flex h-12 w-12 items-center justify-center rounded-full"
        style={{
          backgroundColor: designTokens.colors.neutral[100],
          color: designTokens.colors.neutral[400],
        }}
      >
        <ShieldOff size={20} />
      </div>
      <p className="text-base font-semibold" style={{ color: designTokens.colors.neutral[700] }}>
        Feature Not Available
      </p>
      <p
        className="mt-2 max-w-xl text-sm leading-relaxed"
        style={{ color: designTokens.colors.neutral[500] }}
      >
        {feature} is not available for the {provider} provider.
      </p>
    </div>
  );
};

export const UnsupportedFeature = memo(UnsupportedFeatureBase);
export default UnsupportedFeature;
