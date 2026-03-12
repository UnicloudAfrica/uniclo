import { useState, useEffect, useRef, useCallback, type JSX } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import {
  Terminal,
  Maximize2,
  Minimize2,
  X,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  RotateCw,
  Monitor,
} from "lucide-react";
import { useApiContext } from "@/hooks/useApiContext";

type Position = {
  x: number;
  y: number;
};

type Size = {
  width: number;
  height: number;
};

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

type ConsoleType = "novnc" | "spice-html5" | "rdp-html5" | "serial";

type ConsoleApiResponse = {
  success?: boolean;
  error?: string;
  message?: { url?: string; console_url?: string } | string;
  data?: { url?: string; console_url?: string };
  url?: string;
  console_url?: string;
};

type EmbeddedConsoleProps = {
  instanceId?: string | number;
  isVisible: boolean;
  onClose: () => void;
  initialPosition?: Position;
  initialSize?: Size;
};

const consoleTypes: ConsoleType[] = ["novnc", "spice-html5", "rdp-html5", "serial"];

const EmbeddedConsole = ({
  instanceId,
  isVisible,
  onClose,
  initialPosition = { x: 100, y: 100 },
  initialSize = { width: 800, height: 600 },
}: EmbeddedConsoleProps): JSX.Element | null => {
  const [position, setPosition] = useState<Position>(initialPosition);
  const [size] = useState<Size>(initialSize);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [consoleType, setConsoleType] = useState<ConsoleType>("novnc");
  const [isMuted, setIsMuted] = useState(false);
  const [consoleUrl, setConsoleUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const consoleRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const { context, apiBaseUrl, authHeaders } = useApiContext();

  const fetchConsoleUrl = useCallback(
    async (type: ConsoleType = "novnc") => {
      if (!instanceId) return;
      setIsLoading(true);
      setError(null);
      setConnectionStatus("connecting");

      try {
        const encodedId = encodeURIComponent(String(instanceId));
        const typeParam = type ? `?type=${encodeURIComponent(type)}` : "";
        const path =
          context === "admin"
            ? `/instance-management/${encodedId}/console`
            : context === "tenant"
              ? `/admin/instance-consoles/${encodedId}`
              : `/business/instance-consoles/${encodedId}`;

        const response = await fetch(`${apiBaseUrl}${path}${typeParam}`, {
          method: "GET",
          headers: authHeaders,
          credentials: "include",
        });
        const data = (await response.json().catch(() => ({}))) as ConsoleApiResponse;

        const messageFromPayload = typeof data?.message === "string" ? data.message : undefined;

        if (!response.ok || data?.success === false) {
          throw new Error(data?.error || messageFromPayload || "Failed to get console URL");
        }

        const url =
          data?.data?.url ||
          data?.data?.console_url ||
          (typeof data?.message === "object"
            ? data?.message?.url || data?.message?.console_url
            : "") ||
          data?.url ||
          data?.console_url;

        if (!url) {
          throw new Error("Console URL not available for this instance.");
        }

        setConsoleUrl(url);
      } catch (err: unknown) {
        setConsoleUrl(null);
        const message = err instanceof Error ? err.message : "Failed to get console access";
        setError(message);
        setConnectionStatus("error");
      } finally {
        setIsLoading(false);
      }
    },
    [instanceId, context, apiBaseUrl, authHeaders]
  );

  useEffect(() => {
    if (isVisible && instanceId) {
      fetchConsoleUrl(consoleType);
    }
  }, [isVisible, instanceId, consoleType, fetchConsoleUrl]);

  // Handle dragging
  const handleMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    const target = event.target;
    const headerElement = headerRef.current;
    const consoleElement = consoleRef.current;
    if (
      headerElement &&
      consoleElement &&
      target instanceof Node &&
      headerElement.contains(target)
    ) {
      setIsDragging(true);
      const rect = consoleElement.getBoundingClientRect();
      setDragOffset({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
    }
  };

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: event.clientX - dragOffset.x,
          y: event.clientY - dragOffset.y,
        });
      }
    },
    [dragOffset, isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
    return undefined;
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Handle console type change
  const handleConsoleTypeChange = (newType: ConsoleType) => {
    setConsoleType(newType);
    setConsoleUrl(null);
    fetchConsoleUrl(newType);
  };

  // Console actions
  const handleRefresh = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src; // eslint-disable-line no-self-assign
    } else {
      fetchConsoleUrl(consoleType);
    }
  };

  const handleFullscreen = () => {
    const iframe = iframeRef.current;
    if (iframe && iframe.requestFullscreen) {
      iframe.requestFullscreen();
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const getStatusColor = (): string => {
    switch (connectionStatus) {
      case "connected":
        return "bg-green-500";
      case "connecting":
        return "bg-yellow-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getConsoleTypeIcon = (type: ConsoleType): JSX.Element => {
    switch (type) {
      case "novnc":
        return <Monitor className="w-4 h-4" />;
      case "spice-html5":
        return <Terminal className="w-4 h-4" />;
      case "rdp-html5":
        return <Monitor className="w-4 h-4" />;
      case "serial":
        return <Terminal className="w-4 h-4" />;
      default:
        return <Terminal className="w-4 h-4" />;
    }
  };

  if (!isVisible) return null;

  return (
    <div
      ref={consoleRef}
      className={`fixed bg-gray-900 border border-gray-700 rounded-lg shadow-2xl z-50 overflow-hidden transition-all duration-300 ${
        isDragging ? "cursor-move" : ""
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: isMinimized ? "300px" : `${size.width}px`,
        height: isMinimized ? "40px" : `${size.height}px`,
        minWidth: "300px",
        minHeight: "200px",
        maxWidth: "90vw",
        maxHeight: "90vh",
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
          <span className="text-sm text-white font-medium">Console - {instanceId}</span>
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
        </div>

        <div className="flex items-center space-x-1">
          {/* Console Type Selector */}
          <div className="relative group">
            <button className="p-1 hover:bg-gray-700 rounded text-gray-300 hover:text-white">
              {getConsoleTypeIcon(consoleType)}
            </button>
            <div className="absolute right-0 top-8 hidden group-hover:block bg-gray-800 border border-gray-600 rounded shadow-lg min-w-40 z-50">
              {consoleTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => handleConsoleTypeChange(type)}
                  className={`flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-700 w-full text-left ${
                    consoleType === type ? "bg-gray-700 text-blue-400" : "text-gray-300"
                  }`}
                >
                  {getConsoleTypeIcon(type)}
                  <span className="capitalize">{type.replace("-", " ")}</span>
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
              style={{ height: "calc(100% - 40px)" }}
              onLoad={() => setConnectionStatus("connected")}
              onError={() => {
                setConnectionStatus("error");
                setError("Failed to load console");
              }}
            />
          )}

          {/* Status Bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 px-3 py-1 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                {connectionStatus === "connected" ? (
                  <Wifi className="w-3 h-3 text-green-400" />
                ) : (
                  <WifiOff className="w-3 h-3 text-red-400" />
                )}
                <span className="text-gray-300 capitalize">{connectionStatus}</span>
              </div>
              <div className="text-gray-400">
                Type:{" "}
                <span className="text-gray-300 capitalize">{consoleType.replace("-", " ")}</span>
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
type ManagedConsole = {
  id: string;
  instanceId: string | number;
  position: Position;
  size: Size;
  zIndex: number;
  isVisible?: boolean;
};

type ConsoleManagerOptions = Partial<Omit<ManagedConsole, "id" | "instanceId">>;

export const useConsoleManager = () => {
  const [consoles, setConsoles] = useState<ManagedConsole[]>([]);

  const openConsole = (instanceId: string | number, options: ConsoleManagerOptions = {}) => {
    const existingConsole = consoles.find((c) => c.instanceId === instanceId);

    if (existingConsole) {
      // Bring existing console to front
      setConsoles((prev) => [
        ...prev.filter((c) => c.instanceId !== instanceId),
        { ...existingConsole, zIndex: Math.max(...prev.map((c) => c.zIndex), 1000) + 1 },
      ]);
      return;
    }

    const newConsole = {
      id: `console-${instanceId}-${Date.now()}`,
      instanceId,
      position: {
        x: 100 + consoles.length * 30,
        y: 100 + consoles.length * 30,
      },
      size: { width: 800, height: 600 },
      zIndex: Math.max(...consoles.map((c) => c.zIndex), 1000) + 1,
      ...options,
    };

    setConsoles((prev) => [...prev, newConsole]);
  };

  const closeConsole = (instanceId: string | number) => {
    setConsoles((prev) => prev.filter((c) => c.instanceId !== instanceId));
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
