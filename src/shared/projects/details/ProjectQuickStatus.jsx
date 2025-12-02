import React from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { designTokens } from "../../../styles/designTokens";

const StatusBadge = ({ label, active, tone = "primary" }) => {
    const palette = {
        primary: {
            base: designTokens.colors.primary[50],
            text: designTokens.colors.primary[700],
            icon: designTokens.colors.primary[500],
        },
        success: {
            base: designTokens.colors.success[50],
            text: designTokens.colors.success[700],
            icon: designTokens.colors.success[500],
        },
        danger: {
            base: designTokens.colors.error[50],
            text: designTokens.colors.error[700],
            icon: designTokens.colors.error[500],
        },
        neutral: {
            base: designTokens.colors.neutral[100],
            text: designTokens.colors.neutral[600],
            icon: designTokens.colors.neutral[400],
        },
    };
    const colors = palette[tone] || palette.primary;
    return (
        <span
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
            style={{
                backgroundColor: colors.base,
                color: colors.text,
            }}
        >
            {active ? (
                <CheckCircle2 size={14} style={{ color: colors.icon }} />
            ) : (
                <XCircle size={14} style={{ color: palette.danger.icon }} />
            )}
            {label}
        </span>
    );
};

const ProjectQuickStatus = ({ quickStatusItems = [] }) => {
    return (
        <div>
            <h3 className="text-sm font-semibold" style={{ color: designTokens.colors.neutral[800] }}>
                Quick Status
            </h3>
            <div className="mt-3 grid grid-cols-1 gap-2 text-xs">
                {quickStatusItems.map((item, index) => (
                    <StatusBadge
                        key={index}
                        label={item.label}
                        active={item.active}
                        tone={item.tone}
                    />
                ))}
            </div>
        </div>
    );
};

export default ProjectQuickStatus;
