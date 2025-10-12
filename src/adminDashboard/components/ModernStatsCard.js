import React from 'react';
import { TrendingUp, TrendingDown, ArrowUp, ArrowDown } from 'lucide-react';
import { designTokens } from '../../styles/designTokens';

const ModernStatsCard = ({
  title = '',
  value = '',
  previousValue = null,
  change = null,
  changeType = 'percentage', // 'percentage', 'absolute', 'custom'
  trend = 'neutral', // 'up', 'down', 'neutral'
  icon = null,
  color = 'primary', // 'primary', 'success', 'warning', 'error', 'info'
  size = 'md', // 'sm', 'md', 'lg'
  loading = false,
  onClick = null,
  className = '',
  prefix = '',
  suffix = '',
  description = ''
}) => {
  const colors = {
    primary: {
      bg: designTokens.colors.primary[50],
      border: designTokens.colors.primary[200],
      icon: designTokens.colors.primary[500],
      text: designTokens.colors.primary[700]
    },
    success: {
      bg: designTokens.colors.success[50],
      border: designTokens.colors.success[200],
      icon: designTokens.colors.success[500],
      text: designTokens.colors.success[700]
    },
    warning: {
      bg: designTokens.colors.warning[50],
      border: designTokens.colors.warning[200],
      icon: designTokens.colors.warning[500],
      text: designTokens.colors.warning[700]
    },
    error: {
      bg: designTokens.colors.error[50],
      border: designTokens.colors.error[200],
      icon: designTokens.colors.error[500],
      text: designTokens.colors.error[700]
    },
    info: {
      bg: designTokens.colors.neutral[50],
      border: designTokens.colors.neutral[200],
      icon: designTokens.colors.neutral[500],
      text: designTokens.colors.neutral[700]
    }
  };

  const sizes = {
    sm: {
      padding: '16px',
      titleSize: designTokens.typography.fontSize.xs[0],
      valueSize: designTokens.typography.fontSize.lg[0],
      iconSize: 20,
      changeSize: designTokens.typography.fontSize.xs[0]
    },
    md: {
      padding: '20px',
      titleSize: designTokens.typography.fontSize.sm[0],
      valueSize: designTokens.typography.fontSize['2xl'][0],
      iconSize: 24,
      changeSize: designTokens.typography.fontSize.sm[0]
    },
    lg: {
      padding: '24px',
      titleSize: designTokens.typography.fontSize.base[0],
      valueSize: designTokens.typography.fontSize['3xl'][0],
      iconSize: 28,
      changeSize: designTokens.typography.fontSize.base[0]
    }
  };

  const calculateChange = () => {
    if (change !== null) return change;
    if (previousValue === null || previousValue === 0) return null;
    
    const numericValue = parseFloat(value.toString().replace(/[^0-9.-]/g, ''));
    const numericPrevious = parseFloat(previousValue.toString().replace(/[^0-9.-]/g, ''));
    
    if (isNaN(numericValue) || isNaN(numericPrevious)) return null;
    
    const changeValue = ((numericValue - numericPrevious) / numericPrevious) * 100;
    return Math.round(changeValue * 100) / 100;
  };

  const changeValue = calculateChange();
  const isPositive = changeValue > 0;
  const isNegative = changeValue < 0;

  const getTrendColor = () => {
    if (trend === 'up' || (isPositive && trend !== 'neutral')) {
      return designTokens.colors.success[600];
    }
    if (trend === 'down' || (isNegative && trend !== 'neutral')) {
      return designTokens.colors.error[600];
    }
    return designTokens.colors.neutral[500];
  };

  const getTrendIcon = () => {
    const iconSize = 16;
    const trendColor = getTrendColor();
    
    if (trend === 'up' || (isPositive && trend !== 'neutral')) {
      return <ArrowUp size={iconSize} color={trendColor} />;
    }
    if (trend === 'down' || (isNegative && trend !== 'neutral')) {
      return <ArrowDown size={iconSize} color={trendColor} />;
    }
    return null;
  };

  const formatChangeValue = () => {
    if (changeValue === null) return null;
    
    switch (changeType) {
      case 'percentage':
        return `${Math.abs(changeValue)}%`;
      case 'absolute':
        return Math.abs(changeValue).toString();
      case 'custom':
        return changeValue.toString();
      default:
        return `${Math.abs(changeValue)}%`;
    }
  };

  const cardStyles = {
    backgroundColor: designTokens.colors.neutral[0],
    border: `1px solid ${designTokens.colors.neutral[200]}`,
    borderRadius: designTokens.borderRadius.xl,
    padding: sizes[size].padding,
    boxShadow: designTokens.shadows.sm,
    transition: 'all 0.2s ease',
    cursor: onClick ? 'pointer' : 'default',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: designTokens.typography.fontFamily.sans.join(', ')
  };

  const headerStyles = {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '12px'
  };

  const titleStyles = {
    fontSize: sizes[size].titleSize,
    fontWeight: designTokens.typography.fontWeight.medium,
    color: designTokens.colors.neutral[600],
    margin: 0,
    lineHeight: '1.4'
  };

  const iconContainerStyles = {
    padding: '8px',
    borderRadius: designTokens.borderRadius.lg,
    backgroundColor: colors[color].bg,
    border: `1px solid ${colors[color].border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  };

  const valueContainerStyles = {
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px',
    marginBottom: description || changeValue !== null ? '8px' : '0'
  };

  const valueStyles = {
    fontSize: sizes[size].valueSize,
    fontWeight: designTokens.typography.fontWeight.bold,
    color: designTokens.colors.neutral[900],
    margin: 0,
    lineHeight: '1'
  };

  const prefixSuffixStyles = {
    fontSize: sizes[size].titleSize,
    fontWeight: designTokens.typography.fontWeight.medium,
    color: designTokens.colors.neutral[500]
  };

  const changeContainerStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginTop: '4px'
  };

  const changeTextStyles = {
    fontSize: sizes[size].changeSize,
    fontWeight: designTokens.typography.fontWeight.medium,
    color: getTrendColor()
  };

  const descriptionStyles = {
    fontSize: designTokens.typography.fontSize.xs[0],
    color: designTokens.colors.neutral[500],
    marginTop: '4px',
    lineHeight: '1.4'
  };

  const loadingOverlayStyles = {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: designTokens.borderRadius.xl
  };

  const handleClick = () => {
    if (onClick && !loading) {
      onClick();
    }
  };

  const handleMouseEnter = (event) => {
    if (onClick && !loading) {
      event.target.closest('[data-stats-card]').style.transform = 'translateY(-2px)';
      event.target.closest('[data-stats-card]').style.boxShadow = designTokens.shadows.md;
    }
  };

  const handleMouseLeave = (event) => {
    if (onClick && !loading) {
      event.target.closest('[data-stats-card]').style.transform = 'translateY(0)';
      event.target.closest('[data-stats-card]').style.boxShadow = designTokens.shadows.sm;
    }
  };

  return (
    <div
      data-stats-card
      style={cardStyles}
      className={className}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {loading && (
        <div style={loadingOverlayStyles}>
          <div 
            className="animate-spin rounded-full h-6 w-6 border-2 border-t-transparent"
            style={{ borderColor: designTokens.colors.primary[500] }}
          />
        </div>
      )}

      {/* Header */}
      <div style={headerStyles}>
        <h3 style={titleStyles}>{title}</h3>
        {icon && (
          <div style={iconContainerStyles}>
            {React.cloneElement(icon, { 
              size: sizes[size].iconSize, 
              color: colors[color].icon 
            })}
          </div>
        )}
      </div>

      {/* Value */}
      <div style={valueContainerStyles}>
        {prefix && <span style={prefixSuffixStyles}>{prefix}</span>}
        <div style={valueStyles}>{loading ? '---' : value}</div>
        {suffix && <span style={prefixSuffixStyles}>{suffix}</span>}
      </div>

      {/* Change Indicator */}
      {changeValue !== null && !loading && (
        <div style={changeContainerStyles}>
          {getTrendIcon()}
          <span style={changeTextStyles}>
            {formatChangeValue()} {trend !== 'neutral' ? (isPositive ? 'increase' : 'decrease') : 'change'}
          </span>
        </div>
      )}

      {/* Description */}
      {description && (
        <div style={descriptionStyles}>
          {description}
        </div>
      )}
    </div>
  );
};

export default ModernStatsCard;