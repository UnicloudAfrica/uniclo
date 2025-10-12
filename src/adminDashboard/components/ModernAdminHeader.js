import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  Settings, 
  User, 
  ChevronDown,
  Moon,
  Sun,
  HelpCircle,
  LogOut,
  Menu
} from 'lucide-react';
import { designTokens } from '../../styles/designTokens';
import useAuthStore from '../../stores/userAuthStore';

const ModernAdminHeader = ({ 
  onMenuClick,
  title = "Dashboard",
  showSearch = true,
  user = { name: 'Admin User', email: 'admin@unicloudafrica.com', avatar: null }
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const profileRef = useRef(null);
  const notificationRef = useRef(null);
  const { clearToken } = useAuthStore();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearToken();
    window.location.href = '/admin-signin';
  };

  // Dummy notifications
  const notifications = [
    {
      id: 1,
      title: 'New lead created',
      message: 'John Doe submitted a new lead request',
      time: '2 minutes ago',
      unread: true
    },
    {
      id: 2,
      title: 'Instance deployed',
      message: 'Instance i-1234567 has been successfully deployed',
      time: '1 hour ago',
      unread: true
    },
    {
      id: 3,
      title: 'Payment received',
      message: 'Payment of $299.99 has been processed',
      time: '3 hours ago',
      unread: false
    }
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  const headerStyles = {
    position: 'sticky',
    top: 0,
    left: 0,
    right: 0,
    height: '72px',
    backgroundColor: designTokens.colors.neutral[0],
    borderBottom: `1px solid ${designTokens.colors.neutral[200]}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    zIndex: 100,
    fontFamily: designTokens.typography.fontFamily.sans.join(', '),
    boxShadow: designTokens.shadows.xs
  };

  const leftSectionStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flex: 1
  };

  const titleStyles = {
    fontSize: designTokens.typography.fontSize['2xl'][0],
    fontWeight: designTokens.typography.fontWeight.semibold,
    color: designTokens.colors.neutral[900],
    margin: 0
  };

  const searchContainerStyles = {
    position: 'relative',
    maxWidth: '400px',
    flex: 1
  };

  const searchInputStyles = {
    width: '100%',
    height: '44px',
    paddingLeft: '44px',
    paddingRight: '16px',
    border: `1px solid ${isSearchFocused ? designTokens.colors.primary[300] : designTokens.colors.neutral[300]}`,
    borderRadius: designTokens.borderRadius.xl,
    backgroundColor: designTokens.colors.neutral[50],
    fontSize: designTokens.typography.fontSize.sm[0],
    outline: 'none',
    transition: 'all 0.2s ease',
    fontFamily: designTokens.typography.fontFamily.sans.join(', ')
  };

  const searchIconStyles = {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: isSearchFocused ? designTokens.colors.primary[500] : designTokens.colors.neutral[400],
    transition: 'color 0.2s ease'
  };

  const rightSectionStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const iconButtonStyles = {
    position: 'relative',
    padding: '10px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: designTokens.borderRadius.lg,
    cursor: 'pointer',
    color: designTokens.colors.neutral[600],
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const profileButtonStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 12px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: designTokens.borderRadius.xl,
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  };

  const avatarStyles = {
    width: '36px',
    height: '36px',
    borderRadius: designTokens.borderRadius.full,
    backgroundColor: designTokens.colors.primary[500],
    color: designTokens.colors.neutral[0],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: designTokens.typography.fontSize.sm[0],
    fontWeight: designTokens.typography.fontWeight.semibold
  };

  const dropdownStyles = {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '8px',
    width: '280px',
    backgroundColor: designTokens.colors.neutral[0],
    border: `1px solid ${designTokens.colors.neutral[200]}`,
    borderRadius: designTokens.borderRadius.xl,
    boxShadow: designTokens.shadows.lg,
    zIndex: 1000,
    overflow: 'hidden'
  };

  const dropdownItemStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: 'transparent',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    fontSize: designTokens.typography.fontSize.sm[0],
    color: designTokens.colors.neutral[700]
  };

  const notificationItemStyles = {
    padding: '16px',
    borderBottom: `1px solid ${designTokens.colors.neutral[100]}`,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease'
  };

  const badgeStyles = {
    position: 'absolute',
    top: '6px',
    right: '6px',
    width: '18px',
    height: '18px',
    backgroundColor: designTokens.colors.error[500],
    color: designTokens.colors.neutral[0],
    borderRadius: designTokens.borderRadius.full,
    fontSize: '11px',
    fontWeight: designTokens.typography.fontWeight.medium,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `2px solid ${designTokens.colors.neutral[0]}`
  };

  return (
    <header style={headerStyles}>
      {/* Left Section */}
      <div style={leftSectionStyles}>
        {/* Mobile Menu Button */}
        <button
          style={{
            ...iconButtonStyles,
            display: window.innerWidth < 1024 ? 'flex' : 'none'
          }}
          onClick={onMenuClick}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = designTokens.colors.neutral[100];
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
          }}
        >
          <Menu size={20} />
        </button>

        {/* Page Title */}
        <h1 style={titleStyles}>{title}</h1>

        {/* Search Bar */}
        {showSearch && (
          <div style={searchContainerStyles}>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={searchIconStyles} />
              <input
                type="text"
                placeholder="Search anything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                style={searchInputStyles}
              />
            </div>
          </div>
        )}
      </div>

      {/* Right Section */}
      <div style={rightSectionStyles}>
        {/* Theme Toggle */}
        <button
          style={iconButtonStyles}
          onClick={() => setIsDarkMode(!isDarkMode)}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = designTokens.colors.neutral[100];
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
          }}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Help Button */}
        <button
          style={iconButtonStyles}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = designTokens.colors.neutral[100];
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
          }}
        >
          <HelpCircle size={20} />
        </button>

        {/* Notifications */}
        <div style={{ position: 'relative' }} ref={notificationRef}>
          <button
            style={iconButtonStyles}
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = designTokens.colors.neutral[100];
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <div style={badgeStyles}>{unreadCount}</div>
            )}
          </button>

          {isNotificationOpen && (
            <div style={dropdownStyles}>
              <div style={{
                padding: '16px',
                borderBottom: `1px solid ${designTokens.colors.neutral[200]}`,
                fontSize: designTokens.typography.fontSize.sm[0],
                fontWeight: designTokens.typography.fontWeight.semibold,
                color: designTokens.colors.neutral[900]
              }}>
                Notifications
              </div>
              
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  style={{
                    ...notificationItemStyles,
                    backgroundColor: notification.unread ? designTokens.colors.primary[25] : 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = designTokens.colors.neutral[50];
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = notification.unread ? designTokens.colors.primary[25] : 'transparent';
                  }}
                >
                  <div>
                    <div style={{
                      fontSize: designTokens.typography.fontSize.sm[0],
                      fontWeight: designTokens.typography.fontWeight.medium,
                      color: designTokens.colors.neutral[900],
                      marginBottom: '4px'
                    }}>
                      {notification.title}
                    </div>
                    <div style={{
                      fontSize: designTokens.typography.fontSize.xs[0],
                      color: designTokens.colors.neutral[600],
                      marginBottom: '4px'
                    }}>
                      {notification.message}
                    </div>
                    <div style={{
                      fontSize: designTokens.typography.fontSize.xs[0],
                      color: designTokens.colors.neutral[500]
                    }}>
                      {notification.time}
                    </div>
                  </div>
                </div>
              ))}
              
              <div style={{
                padding: '12px 16px',
                textAlign: 'center'
              }}>
                <button style={{
                  background: 'none',
                  border: 'none',
                  color: designTokens.colors.primary[600],
                  fontSize: designTokens.typography.fontSize.sm[0],
                  fontWeight: designTokens.typography.fontWeight.medium,
                  cursor: 'pointer'
                }}>
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div style={{ position: 'relative' }} ref={profileRef}>
          <button
            style={profileButtonStyles}
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = designTokens.colors.neutral[50];
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            <div style={avatarStyles}>
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', borderRadius: 'inherit' }} />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>
            <div style={{ display: window.innerWidth < 768 ? 'none' : 'block' }}>
              <div style={{
                fontSize: designTokens.typography.fontSize.sm[0],
                fontWeight: designTokens.typography.fontWeight.medium,
                color: designTokens.colors.neutral[900],
                textAlign: 'left'
              }}>
                {user.name}
              </div>
              <div style={{
                fontSize: designTokens.typography.fontSize.xs[0],
                color: designTokens.colors.neutral[600],
                textAlign: 'left'
              }}>
                {user.email}
              </div>
            </div>
            <ChevronDown 
              size={16} 
              style={{
                color: designTokens.colors.neutral[500],
                transform: isProfileOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }} 
            />
          </button>

          {isProfileOpen && (
            <div style={dropdownStyles}>
              <button
                style={dropdownItemStyles}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = designTokens.colors.neutral[50];
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                <User size={18} />
                Profile Settings
              </button>
              
              <button
                style={dropdownItemStyles}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = designTokens.colors.neutral[50];
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                <Settings size={18} />
                Account Settings
              </button>
              
              <hr style={{
                margin: '8px 0',
                border: 'none',
                borderTop: `1px solid ${designTokens.colors.neutral[200]}`
              }} />
              
              <button
                style={{
                  ...dropdownItemStyles,
                  color: designTokens.colors.error[600]
                }}
                onClick={handleLogout}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = designTokens.colors.error[50];
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                <LogOut size={18} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default ModernAdminHeader;