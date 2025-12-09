import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { designTokens } from "../../../styles/designTokens";
import ModernButton from "./ModernButton";

export interface ModalAction {
  label: string;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  onClick: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  props?: Record<string, any>;
}

export interface ModernModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  title?: string;
  subtitle?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  children: React.ReactNode;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  actions?: ModalAction[];
  className?: string;
  contentClassName?: string;
  loading?: boolean;
  backdropClassName?: string;
}

const mergeClassNames = (...values: any[]): string => values.flat().filter(Boolean).join(" ");

const ModernModal: React.FC<ModernModalProps> = ({
  isOpen = false,
  onClose = () => {},
  title = "",
  subtitle = "",
  size = "md",
  children,
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  actions = [],
  className = "",
  contentClassName = "",
  loading = false,
  backdropClassName = "",
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsAnimating(true);
      // Prevent body scroll
      document.body.style.overflow = "hidden";
    } else {
      setIsAnimating(false);
      // Restore body scroll after animation
      const timer = setTimeout(() => {
        setIsVisible(false);
        document.body.style.overflow = "unset";
      }, 200);
      return () => clearTimeout(timer);
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [closeOnEscape, isOpen, onClose]);

  const sizes: Record<string, { maxWidth: string; width: string; height?: string }> = {
    sm: { maxWidth: "400px", width: "90%" },
    md: { maxWidth: "600px", width: "90%" },
    lg: { maxWidth: "800px", width: "95%" },
    xl: { maxWidth: "1200px", width: "95%" },
    full: { maxWidth: "100vw", width: "100%", height: "100vh" },
  };

  const backdropStyles: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: size === "full" ? "stretch" : "center",
    justifyContent: "center",
    padding: size === "full" ? 0 : "16px",
    zIndex: 9999,
    opacity: isAnimating ? 1 : 0,
    transition: "opacity 0.2s ease-in-out",
  };

  const modalStyles: React.CSSProperties = {
    backgroundColor: designTokens.colors.neutral[0],
    borderRadius: size === "full" ? 0 : designTokens.borderRadius.xl,
    border: size === "full" ? "none" : `1px solid ${designTokens.colors.neutral[200]}`,
    boxShadow: designTokens.shadows.xl,
    maxWidth: sizes[size].maxWidth,
    width: sizes[size].width,
    height: sizes[size].height || "auto",
    maxHeight: size === "full" ? "100vh" : "calc(100vh - 64px)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    transform: isAnimating ? "scale(1) translateY(0)" : "scale(0.95) translateY(-20px)",
    opacity: isAnimating ? 1 : 0,
    transition: "all 0.2s ease-in-out",
    fontFamily: designTokens.typography.fontFamily.sans.join(", "),
  };

  const headerStyles: React.CSSProperties = {
    padding: "20px 24px",
    borderBottom: `1px solid ${designTokens.colors.neutral[200]}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexShrink: 0,
  };

  const titleStyles: React.CSSProperties = {
    fontSize: "18px" as any,
    fontWeight: designTokens.typography.fontWeight.semibold,
    color: designTokens.colors.neutral[900],
    margin: 0,
  };

  const closeButtonStyles: React.CSSProperties = {
    padding: "8px",
    border: "none",
    borderRadius: designTokens.borderRadius.lg,
    backgroundColor: "transparent",
    color: designTokens.colors.neutral[400],
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const contentStyles: React.CSSProperties = {
    padding: "24px",
    flex: 1,
    overflowY: "auto",
    overflowX: "hidden",
    color: designTokens.colors.neutral[700],
    backgroundColor: designTokens.colors.neutral[0],
  };

  const footerStyles: React.CSSProperties = {
    padding: "16px 24px",
    borderTop: `1px solid ${designTokens.colors.neutral[200]}`,
    display: "flex",
    gap: "12px",
    justifyContent: "flex-end",
    alignItems: "center",
    flexShrink: 0,
    backgroundColor: designTokens.colors.neutral[50],
  };

  const loadingOverlayStyles: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    borderRadius: size === "full" ? 0 : designTokens.borderRadius.xl,
  };

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdrop && event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div style={backdropStyles} onClick={handleBackdropClick} className={backdropClassName}>
      <div
        style={{ ...modalStyles, position: "relative" }}
        className={mergeClassNames("modern-modal-container", className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modern-modal-title" : undefined}
      >
        {loading && (
          <div style={loadingOverlayStyles}>
            <div
              className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent"
              style={{ borderColor: designTokens.colors.primary[500] }}
            />
          </div>
        )}

        {/* Header */}
        {(title || showCloseButton) && (
          <div style={headerStyles}>
            <div>
              {title && (
                <h2 id="modern-modal-title" style={titleStyles}>
                  {title}
                </h2>
              )}
              {subtitle ? (
                <p className="mt-1 text-sm" style={{ color: designTokens.colors.neutral[500] }}>
                  {subtitle}
                </p>
              ) : null}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                style={closeButtonStyles}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor =
                    designTokens.colors.neutral[100];
                  (e.target as HTMLButtonElement).style.color = designTokens.colors.neutral[600];
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = "transparent";
                  (e.target as HTMLButtonElement).style.color = designTokens.colors.neutral[400];
                }}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div
          style={contentStyles}
          className={mergeClassNames(
            "modern-modal-content space-y-6 text-sm leading-relaxed",
            contentClassName
          )}
        >
          {children}
        </div>

        {/* Footer with Actions */}
        {actions.length > 0 && (
          <div style={footerStyles}>
            {actions.map((action, index) => (
              <ModernButton
                key={index}
                variant={action.variant || "outline"}
                size={action.size || "md"}
                onClick={action.onClick}
                disabled={action.disabled || loading}
                {...action.props}
              >
                {action.icon && action.icon}
                {action.label}
              </ModernButton>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernModal;
