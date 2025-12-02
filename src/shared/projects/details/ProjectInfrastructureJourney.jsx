import React from "react";
import { designTokens } from "../../../styles/designTokens";

const ProjectInfrastructureJourney = ({
    infrastructureSections = [],
    activeSection,
    onSectionClick,
    getStatusForSection,
}) => {
    return (
        <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: designTokens.colors.neutral[800] }}>
                Infrastructure Journey
            </h3>
            <div className="relative pl-3">
                <div className="absolute left-[23px] top-3 bottom-3 hidden w-px bg-gray-200 md:block" />
                <div className="space-y-3">
                    {infrastructureSections.map((section, index) => {
                        const isComplete = Boolean(getStatusForSection(section.key));
                        const isActive = activeSection === section.key;
                        const iconNode = React.cloneElement(section.icon, {
                            size: 18,
                            style: {
                                color: isComplete
                                    ? designTokens.colors.success[500]
                                    : designTokens.colors.neutral[400],
                            },
                        });

                        return (
                            <button
                                key={section.key}
                                onClick={() => onSectionClick(section.key)}
                                className="relative w-full rounded-xl border px-4 py-3 text-left transition"
                                style={{
                                    backgroundColor: isActive
                                        ? designTokens.colors.primary[50]
                                        : "#FFFFFF",
                                    borderColor: isActive
                                        ? designTokens.colors.primary[200]
                                        : designTokens.colors.neutral[200],
                                    boxShadow: isActive ? "0 4px 8px rgba(11, 99, 206, 0.08)" : "none",
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center">
                                        <div
                                            className="flex h-10 w-10 items-center justify-center rounded-full border"
                                            style={{
                                                borderColor: isComplete
                                                    ? designTokens.colors.success[200]
                                                    : designTokens.colors.neutral[200],
                                                backgroundColor: isComplete
                                                    ? designTokens.colors.success[50]
                                                    : "#FFFFFF",
                                            }}
                                        >
                                            {iconNode}
                                        </div>
                                        {index > 0 && (
                                            <div className="absolute -top-10 left-1/2 hidden h-10 w-px -translate-x-1/2 bg-gray-200 md:block" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p
                                            className="text-sm font-semibold"
                                            style={{
                                                color: isActive
                                                    ? designTokens.colors.primary[700]
                                                    : designTokens.colors.neutral[800],
                                            }}
                                        >
                                            {section.label}
                                        </p>
                                        {section.key === "user-provisioning" ? (
                                            <p className="text-xs" style={{ color: designTokens.colors.neutral[500] }}>
                                                Keep collaborators aligned—invite operators or tweak roles fast.
                                            </p>
                                        ) : (
                                            <p className="text-xs" style={{ color: designTokens.colors.neutral[500] }}>
                                                {isComplete ? "Ready to provision" : "Pending configuration"}
                                            </p>
                                        )}
                                    </div>
                                    <span
                                        className="rounded-full px-2 py-1 text-xs font-medium"
                                        style={{
                                            backgroundColor: isComplete
                                                ? designTokens.colors.success[50]
                                                : designTokens.colors.neutral[100],
                                            color: isComplete
                                                ? designTokens.colors.success[600]
                                                : designTokens.colors.neutral[600],
                                        }}
                                    >
                                        {isComplete ? "Ready" : "Pending"}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ProjectInfrastructureJourney;
