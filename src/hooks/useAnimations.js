import { useEffect, useRef, useState } from 'react';

// Hook for managing element animations and micro-interactions
export const useAnimations = () => {
  // Intersection Observer for scroll animations
  const useInView = (threshold = 0.1) => {
    const [isInView, setIsInView] = useState(false);
    const ref = useRef();

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          setIsInView(entry.isIntersecting);
        },
        { threshold }
      );

      if (ref.current) {
        observer.observe(ref.current);
      }

      return () => {
        if (ref.current) {
          observer.unobserve(ref.current);
        }
      };
    }, [threshold]);

    return [ref, isInView];
  };

  // Staggered animation for lists
  const useStaggeredAnimation = (items, delay = 100) => {
    const [animatedItems, setAnimatedItems] = useState([]);

    useEffect(() => {
      const timeouts = [];
      items.forEach((item, index) => {
        const timeout = setTimeout(() => {
          setAnimatedItems(prev => [...prev, item]);
        }, index * delay);
        timeouts.push(timeout);
      });

      return () => {
        timeouts.forEach(clearTimeout);
      };
    }, [items, delay]);

    return animatedItems;
  };

  // Loading state animation
  const useLoadingAnimation = (isLoading) => {
    const [showLoading, setShowLoading] = useState(false);

    useEffect(() => {
      let timer;
      if (isLoading) {
        setShowLoading(true);
      } else {
        timer = setTimeout(() => {
          setShowLoading(false);
        }, 300); // Delay to allow fade out
      }

      return () => clearTimeout(timer);
    }, [isLoading]);

    return showLoading;
  };

  // Success/Error flash animation
  const useFlashAnimation = () => {
    const [flashState, setFlashState] = useState('');

    const triggerSuccess = () => {
      setFlashState('success');
      setTimeout(() => setFlashState(''), 500);
    };

    const triggerError = () => {
      setFlashState('error');
      setTimeout(() => setFlashState(''), 500);
    };

    return { flashState, triggerSuccess, triggerError };
  };

  // Hover animation utilities
  const useHoverAnimation = () => {
    const [isHovered, setIsHovered] = useState(false);

    const hoverProps = {
      onMouseEnter: () => setIsHovered(true),
      onMouseLeave: () => setIsHovered(false)
    };

    return { isHovered, hoverProps };
  };

  // Focus animation utilities
  const useFocusAnimation = () => {
    const [isFocused, setIsFocused] = useState(false);

    const focusProps = {
      onFocus: () => setIsFocused(true),
      onBlur: () => setIsFocused(false)
    };

    return { isFocused, focusProps };
  };

  // Page transition animation
  const usePageTransition = () => {
    const [isTransitioning, setIsTransitioning] = useState(false);

    const startTransition = () => {
      setIsTransitioning(true);
      setTimeout(() => setIsTransitioning(false), 300);
    };

    return { isTransitioning, startTransition };
  };

  return {
    useInView,
    useStaggeredAnimation,
    useLoadingAnimation,
    useFlashAnimation,
    useHoverAnimation,
    useFocusAnimation,
    usePageTransition
  };
};

// Utility functions for CSS classes
export const animationUtils = {
  // Get CSS classes based on animation state
  getAnimationClasses: (state) => {
    const classes = [];
    
    switch (state) {
      case 'fadeIn':
        classes.push('fade-in');
        break;
      case 'fadeInUp':
        classes.push('fade-in-up');
        break;
      case 'bounceIn':
        classes.push('bounce-in');
        break;
      case 'slideIn':
        classes.push('page-transition');
        break;
      case 'stagger':
        classes.push('stagger-item');
        break;
      default:
        break;
    }
    
    return classes.join(' ');
  },

  // Get hover classes
  getHoverClasses: (type = 'lift') => {
    return type === 'lift' ? 'hover-lift' : 'hover-scale';
  },

  // Get loading classes
  getLoadingClasses: (type = 'pulse') => {
    return type === 'pulse' ? 'pulse' : 'skeleton';
  },

  // Get button animation classes
  getButtonClasses: () => {
    return 'modern-button';
  },

  // Get card animation classes
  getCardClasses: (hover = false) => {
    return hover ? 'modern-card-hover' : '';
  },

  // Get modal animation classes
  getModalClasses: () => {
    return {
      backdrop: 'modal-backdrop',
      content: 'modal-content'
    };
  },

  // Get table row animation classes
  getTableRowClasses: () => {
    return 'table-row';
  },

  // Get form animation classes
  getFormClasses: () => {
    return {
      input: 'modern-input focus-ring',
      success: 'success-flash',
      error: 'error-shake'
    };
  },

  // Get notification animation classes
  getNotificationClasses: (entering = true) => {
    return entering ? 'notification-enter' : 'notification-exit';
  }
};

// Higher-order component for adding animations
export const withAnimation = (Component, animationType = 'fadeIn') => {
  return (props) => {
    const [isVisible, setIsVisible] = useState(false);
    
    useEffect(() => {
      setIsVisible(true);
    }, []);

    const className = `${props.className || ''} ${isVisible ? animationUtils.getAnimationClasses(animationType) : ''}`;

    return <Component {...props} className={className} />;
  };
};

// Custom hook for managing reduced motion preference
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};

export default useAnimations;