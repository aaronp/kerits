import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface ToastProps {
  message: string;
  show: boolean;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, show, onClose, duration = 5000 }: ToastProps) {
  React.useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, onClose, duration]);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-2">
      <div className={cn(
        "bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg",
        "flex items-center gap-3 min-w-[250px] max-w-md"
      )}>
        <svg
          className="h-5 w-5 text-green-400 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
        <span className="text-sm flex-1">{message}</span>
        <button
          onClick={onClose}
          className="flex-shrink-0 hover:bg-gray-800 rounded p-1 transition-colors"
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Hook for using toasts
export function useToast() {
  const [toast, setToast] = React.useState<{ message: string; show: boolean }>({
    message: '',
    show: false,
  });

  const showToast = React.useCallback((message: string) => {
    setToast({ message, show: true });
  }, []);

  const hideToast = React.useCallback(() => {
    setToast(prev => ({ ...prev, show: false }));
  }, []);

  return { toast, showToast, hideToast };
}
