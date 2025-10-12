import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { designTokens } from '../../styles/designTokens';
import ModernButton from './ModernButton';

const ModernModal = ({
  isOpen = false,
  onClose = () => {},
  title = '',
  size = 'md', // sm, md, lg, xl, full
  children,
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  actions = [],
  className = '',
  contentClassName = '',
  loading = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsAnimating(true);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      setIsAnimating(false);
      // Restore body scroll after animation
      const timer = setTimeout(() => {
        setIsVisible(false);
        document.body.style.overflow = 'unset';
      }, 200);
      return () => clearTimeout(timer);
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (closeOnEscape && event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [closeOnEscape, isOpen, onClose]);

  const sizes = {
    sm: { maxWidth: '400px', width: '90%' },
    md: { maxWidth: '600px', width: '90%' },
    lg: { maxWidth: '800px', width: '95%' },
    xl: { maxWidth: '1200px', width: '95%' },
    full: { maxWidth: '100vw', width: '100%', height: '100vh' }
  };

  const backdropStyles = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: size === 'full' ? 'stretch' : 'center',
    justifyContent: 'center',
    padding: size === 'full' ? 0 : '16px',
    zIndex: 9999,
    opacity: isAnimating ? 1 : 0,
    transition: 'opacity 0.2s ease-in-out'
  };

  const modalStyles = {
    backgroundColor: designTokens.colors.neutral[0],
    borderRadius: size === 'full' ? 0 : designTokens.borderRadius.xl,
    boxShadow: designTokens.shadows['2xl'],
    maxWidth: sizes[size].maxWidth,
    width: sizes[size].width,
    height: sizes[size].height || 'auto',
    maxHeight: size === 'full' ? '100vh' : '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    transform: isAnimating ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(-20px)',
    opacity: isAnimating ? 1 : 0,
    transition: 'all 0.2s ease-in-out',
    fontFamily: designTokens.typography.fontFamily.sans.join(', ')
  };

  const headerStyles = {
    padding: '20px 24px',
    borderBottom: `1px solid ${designTokens.colors.neutral[200]}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0
  };

  const titleStyles = {
    fontSize: designTokens.typography.fontSize.lg[0],
    fontWeight: designTokens.typography.fontWeight.semibold,
    color: designTokens.colors.neutral[900],
    margin: 0
  };

  const closeButtonStyles = {
    padding: '8px',
    border: 'none',
    borderRadius: designTokens.borderRadius.lg,
    backgroundColor: 'transparent',
    color: designTokens.colors.neutral[400],
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const contentStyles = {
    padding: '24px',
    flex: 1,
    overflow: 'auto'
  };

  const footerStyles = {
    padding: '16px 24px',
    borderTop: `1px solid ${designTokens.colors.neutral[200]}`,
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    alignItems: 'center',
    flexShrink: 0,
    backgroundColor: designTokens.colors.neutral[25]
  };

  const loadingOverlayStyles = {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderRadius: size === 'full' ? 0 : designTokens.borderRadius.xl
  };

  const handleBackdropClick = (event) => {
    if (closeOnBackdrop && event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div 
      style={backdropStyles} 
      onClick={handleBackdropClick}
      className={className}
    >
      <div style={{ ...modalStyles, position: 'relative' }}>
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
            {title && <h2 style={titleStyles}>{title}</h2>}
            {showCloseButton && (
              <button
                onClick={onClose}
                style={closeButtonStyles}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = designTokens.colors.neutral[100];
                  e.target.style.color = designTokens.colors.neutral[600];
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = designTokens.colors.neutral[400];
                }}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div style={contentStyles} className={contentClassName}>
          {children}
        </div>

        {/* Footer with Actions */}
        {actions.length > 0 && (
          <div style={footerStyles}>
            {actions.map((action, index) => (
              <ModernButton
                key={index}
                variant={action.variant || 'outline'}
                size={action.size || 'md'}
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