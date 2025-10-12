import React, { useState, forwardRef } from 'react';
import { Eye, EyeOff, AlertCircle, Check } from 'lucide-react';
import { designTokens } from '../../styles/designTokens';

const ModernInput = forwardRef(({
  type = 'text',
  label = '',
  placeholder = '',
  value = '',
  onChange = () => {},
  onBlur = () => {},
  error = '',
  success = '',
  helper = '',
  required = false,
  disabled = false,
  size = 'md', // sm, md, lg
  variant = 'default', // default, filled, outline
  icon = null,
  endIcon = null,
  className = '',
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const sizes = {
    sm: {
      height: '36px',
      padding: icon ? '0 12px 0 36px' : '0 12px',
      fontSize: designTokens.typography.fontSize.sm[0],
      iconSize: 16
    },
    md: {
      height: '44px',
      padding: icon ? '0 16px 0 44px' : '0 16px',
      fontSize: designTokens.typography.fontSize.base[0],
      iconSize: 18
    },
    lg: {
      height: '52px',
      padding: icon ? '0 20px 0 52px' : '0 20px',
      fontSize: designTokens.typography.fontSize.lg[0],
      iconSize: 20
    }
  };

  const getVariantStyles = () => {
    const baseStyles = {
      width: '100%',
      height: sizes[size].height,
      padding: endIcon ? `${sizes[size].padding.split(' ')[0]} 44px ${sizes[size].padding.split(' ')[2] || '0'} ${sizes[size].padding.split(' ')[3] || sizes[size].padding.split(' ')[1]}` : sizes[size].padding,
      fontSize: sizes[size].fontSize,
      fontFamily: designTokens.typography.fontFamily.sans.join(', '),
      borderRadius: designTokens.borderRadius.lg,
      outline: 'none',
      transition: 'all 0.2s ease',
      backgroundColor: disabled ? designTokens.colors.neutral[100] : designTokens.colors.neutral[0],
      color: disabled ? designTokens.colors.neutral[400] : designTokens.colors.neutral[900]
    };

    if (error) {
      return {
        ...baseStyles,
        border: `1px solid ${designTokens.colors.error[500]}`,
        boxShadow: isFocused ? `0 0 0 3px ${designTokens.colors.error[100]}` : 'none'
      };
    }

    if (success) {
      return {
        ...baseStyles,
        border: `1px solid ${designTokens.colors.success[500]}`,
        boxShadow: isFocused ? `0 0 0 3px ${designTokens.colors.success[100]}` : 'none'
      };
    }

    switch (variant) {
      case 'filled':
        return {
          ...baseStyles,
          backgroundColor: disabled ? designTokens.colors.neutral[200] : designTokens.colors.neutral[50],
          border: `1px solid transparent`,
          boxShadow: isFocused ? `0 0 0 2px ${designTokens.colors.primary[500]}` : 'none'
        };
      
      case 'outline':
        return {
          ...baseStyles,
          border: `2px solid ${isFocused ? designTokens.colors.primary[500] : designTokens.colors.neutral[300]}`,
          boxShadow: 'none'
        };
      
      default:
        return {
          ...baseStyles,
          border: `1px solid ${isFocused ? designTokens.colors.primary[500] : designTokens.colors.neutral[300]}`,
          boxShadow: isFocused ? `0 0 0 3px ${designTokens.colors.primary[100]}` : 'none'
        };
    }
  };

  const labelStyles = {
    display: 'block',
    fontSize: designTokens.typography.fontSize.sm[0],
    fontWeight: designTokens.typography.fontWeight.medium,
    color: error ? designTokens.colors.error[700] : designTokens.colors.neutral[700],
    marginBottom: '6px',
    fontFamily: designTokens.typography.fontFamily.sans.join(', ')
  };

  const helperTextStyles = {
    fontSize: designTokens.typography.fontSize.xs[0],
    marginTop: '6px',
    fontFamily: designTokens.typography.fontFamily.sans.join(', ')
  };

  const getHelperTextColor = () => {
    if (error) return designTokens.colors.error[600];
    if (success) return designTokens.colors.success[600];
    return designTokens.colors.neutral[500];
  };

  const containerStyles = {
    position: 'relative',
    width: '100%'
  };

  const iconStyles = {
    position: 'absolute',
    left: size === 'sm' ? '10px' : size === 'md' ? '14px' : '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: error ? designTokens.colors.error[500] : success ? designTokens.colors.success[500] : designTokens.colors.neutral[400],
    pointerEvents: 'none',
    zIndex: 1
  };

  const endIconStyles = {
    position: 'absolute',
    right: size === 'sm' ? '10px' : size === 'md' ? '14px' : '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: designTokens.colors.neutral[400],
    cursor: type === 'password' ? 'pointer' : 'default',
    zIndex: 1
  };

  const handlePasswordToggle = () => {
    setShowPassword(!showPassword);
  };

  const getInputType = () => {
    if (type === 'password') {
      return showPassword ? 'text' : 'password';
    }
    return type;
  };

  const renderEndIcon = () => {
    if (type === 'password') {
      return (
        <button
          type="button"
          onClick={handlePasswordToggle}
          style={endIconStyles}
          onMouseEnter={(e) => {
            e.target.style.color = designTokens.colors.neutral[600];
          }}
          onMouseLeave={(e) => {
            e.target.style.color = designTokens.colors.neutral[400];
          }}
        >
          {showPassword ? <EyeOff size={sizes[size].iconSize} /> : <Eye size={sizes[size].iconSize} />}
        </button>
      );
    }

    if (error) {
      return (
        <div style={endIconStyles}>
          <AlertCircle size={sizes[size].iconSize} color={designTokens.colors.error[500]} />
        </div>
      );
    }

    if (success) {
      return (
        <div style={endIconStyles}>
          <Check size={sizes[size].iconSize} color={designTokens.colors.success[500]} />
        </div>
      );
    }

    if (endIcon) {
      return <div style={endIconStyles}>{endIcon}</div>;
    }

    return null;
  };

  return (
    <div style={containerStyles} className={className}>
      {label && (
        <label style={labelStyles}>
          {label}
          {required && <span style={{ color: designTokens.colors.error[500], marginLeft: '2px' }}>*</span>}
        </label>
      )}
      
      <div style={{ position: 'relative' }}>
        {icon && (
          <div style={iconStyles}>
            {React.cloneElement(icon, { size: sizes[size].iconSize })}
          </div>
        )}
        
        <input
          ref={ref}
          type={getInputType()}
          value={value}
          onChange={onChange}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur(e);
          }}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          disabled={disabled}
          style={getVariantStyles()}
          {...props}
        />
        
        {renderEndIcon()}
      </div>
      
      {(error || success || helper) && (
        <div style={{ ...helperTextStyles, color: getHelperTextColor() }}>
          {error || success || helper}
        </div>
      )}
    </div>
  );
});

ModernInput.displayName = 'ModernInput';

export default ModernInput;