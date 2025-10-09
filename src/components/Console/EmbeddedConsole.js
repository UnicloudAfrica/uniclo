import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  Maximize2, 
  Minimize2, 
  X, 
  Settings, 
  Volume2, 
  VolumeX,
  Wifi,
  WifiOff,
  RotateCw,
  Power,
  Monitor
} from 'lucide-react';

const EmbeddedConsole = ({ 
  instanceId, 
  isVisible, 
  onClose, 
  initialPosition = { x: 100, y: 100 },
  initialSize = { width: 800, height: 600 }
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState(initialSize);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [consoleType, setConsoleType] = useState('novnc');
  const [isMuted, setIsMuted] = useState(false);
  const [consoleUrl, setConsoleUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const consoleRef = useRef(null);
  const iframeRef = useRef(null);
  const headerRef = useRef(null);

  // Fetch console URL
  const fetchConsoleUrl = async (type = 'novnc') => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/v1/business/instance-management/${instanceId}/console?type=${type}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setConsoleUrl(data.data.url);
        setConnectionStatus('connected');
      } else {
        throw new Error(data.error || 'Failed to get console URL');
      }
    } catch (err) {
      setError(err.message);
      setConnectionStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isVisible && instanceId) {
      fetchConsoleUrl(consoleType);
    }
  }, [isVisible, instanceId, consoleType]);

  // Handle dragging
  const handleMouseDown = (e) => {
    if (e.target === headerRef.current || headerRef.current?.contains(e.target)) {
      setIsDragging(true);
      const rect = consoleRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  // Handle console type change
  const handleConsoleTypeChange = (newType) => {
    setConsoleType(newType);
    setConsoleUrl(null);
    fetchConsoleUrl(newType);
  };

  // Console actions
  const handleRefresh = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    } else {
      fetchConsoleUrl(consoleType);
    }
  };

  const handleFullscreen = () => {
    if (iframeRef.current && iframeRef.current.requestFullscreen) {
      iframeRef.current.requestFullscreen();
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getConsoleTypeIcon = (type) => {
    switch (type) {
      case 'novnc': return <Monitor className="w-4 h-4" />;
      case 'spice-html5': return <Terminal className="w-4 h-4" />;
      case 'rdp-html5': return <Monitor className="w-4 h-4" />;
      case 'serial': return <Terminal className="w-4 h-4" />;
      default: return <Terminal className="w-4 h-4" />;
    }
  };

  if (!isVisible) return null;

  return (
    <div
      ref={consoleRef}
      className={`fixed bg-gray-900 border border-gray-700 rounded-lg shadow-2xl z-50 overflow-hidden transition-all duration-300 ${
        isDragging ? 'cursor-move' : ''
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: isMinimized ? '300px' : `${size.width}px`,
        height: isMinimized ? '40px' : `${size.height}px`,
        minWidth: '300px',
        minHeight: '200px',
        maxWidth: '90vw',
        maxHeight: '90vh',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div
        ref={headerRef}
        className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700 cursor-move select-none"
      >
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-white font-medium">
            Console - {instanceId}
          </span>
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
        </div>

        <div className="flex items-center space-x-1">
          {/* Console Type Selector */}
          <div className="relative group">
            <button className="p-1 hover:bg-gray-700 rounded text-gray-300 hover:text-white">
              {getConsoleTypeIcon(consoleType)}
            </button>
            <div className="absolute right-0 top-8 hidden group-hover:block bg-gray-800 border border-gray-600 rounded shadow-lg min-w-40 z-50">
              {['novnc', 'spice-html5', 'rdp-html5', 'serial'].map(type => (
                <button
                  key={type}
                  onClick={() => handleConsoleTypeChange(type)}
                  className={`flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-700 w-full text-left ${
                    consoleType === type ? 'bg-gray-700 text-blue-400' : 'text-gray-300'
                  }`}
                >
                  {getConsoleTypeIcon(type)}
                  <span className="capitalize">{type.replace('-', ' ')}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleRefresh}
            className="p-1 hover:bg-gray-700 rounded text-gray-300 hover:text-white"
            title="Refresh Console"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1 hover:bg-gray-700 rounded text-gray-300 hover:text-white"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={handleFullscreen}
            className="p-1 hover:bg-gray-700 rounded text-gray-300 hover:text-white"
            title="Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <button
            onClick={toggleMinimize}
            className="p-1 hover:bg-gray-700 rounded text-gray-300 hover:text-white"
            title={isMinimized ? "Maximize" : "Minimize"}
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="p-1 hover:bg-red-600 rounded text-gray-300 hover:text-white"
            title="Close Console"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Console Content */}
      {!isMinimized && (
        <div className="relative w-full h-full bg-black">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-2" />
                <p className="text-gray-400">Connecting to console...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center p-4">
                <div className="bg-red-900/50 border border-red-600 rounded-lg p-4 mb-4">
                  <h3 className="text-red-400 font-semibold mb-2">Console Error</h3>
                  <p className="text-gray-300 text-sm">{error}</p>
                </div>
                <button
                  onClick={() => fetchConsoleUrl(consoleType)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                >
                  Retry Connection
                </button>
              </div>
            </div>
          )}

          {consoleUrl && !isLoading && !error && (
            <iframe
              ref={iframeRef}
              src={consoleUrl}
              className="w-full h-full border-none"
              title={`Console for ${instanceId}`}
              style={{ height: 'calc(100% - 40px)' }}
              onLoad={() => setConnectionStatus('connected')}
              onError={() => {
                setConnectionStatus('error');
                setError('Failed to load console');
              }}
            />
          )}

          {/* Status Bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 px-3 py-1 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                {connectionStatus === 'connected' ? (
                  <Wifi className="w-3 h-3 text-green-400" />
                ) : (
                  <WifiOff className="w-3 h-3 text-red-400" />
                )}
                <span className="text-gray-300 capitalize">{connectionStatus}</span>
              </div>
              <div className="text-gray-400">
                Type: <span className="text-gray-300 capitalize">{consoleType.replace('-', ' ')}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-gray-400">
              <span>Press Ctrl+Alt to release mouse</span>
            </div>
          </div>

          {/* Resize Handle */}
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-nw-resize opacity-50 hover:opacity-100"
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsResizing(true);
            }}
          >
            <div className="w-full h-full">
              <svg className="w-full h-full text-gray-500" viewBox="0 0 16 16">
                <path d="M16 16V10h-2v4h-4v2h6zM10 16H4v-2h4v-4h2v6z" fill="currentColor" />
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Console Manager Hook
export const useConsoleManager = () => {
  const [consoles, setConsoles] = useState([]);

  const openConsole = (instanceId, options = {}) => {
    const existingConsole = consoles.find(c => c.instanceId === instanceId);
    
    if (existingConsole) {
      // Bring existing console to front
      setConsoles(prev => [
        ...prev.filter(c => c.instanceId !== instanceId),
        { ...existingConsole, zIndex: Math.max(...prev.map(c => c.zIndex), 1000) + 1 }
      ]);
      return;
    }

    const newConsole = {
      id: `console-${instanceId}-${Date.now()}`,
      instanceId,
      position: { 
        x: 100 + (consoles.length * 30), 
        y: 100 + (consoles.length * 30) 
      },
      size: { width: 800, height: 600 },
      zIndex: Math.max(...consoles.map(c => c.zIndex), 1000) + 1,
      ...options,
    };

    setConsoles(prev => [...prev, newConsole]);
  };

  const closeConsole = (instanceId) => {
    setConsoles(prev => prev.filter(c => c.instanceId !== instanceId));
  };

  const closeAllConsoles = () => {
    setConsoles([]);
  };

  return {
    consoles,
    openConsole,
    closeConsole,
    closeAllConsoles,
  };
};

export default EmbeddedConsole;