import * as React from "react"
import { cn } from "@/lib/utils"

interface ToastProps {
  message: string;
  show: boolean;
  onClose: () => void;
}

export function Toast({ message, show, onClose }: ToastProps) {
  React.useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-2">
      <div className={cn(
        "bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg",
        "flex items-center gap-2 min-w-[200px]"
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
        <span className="text-sm">{message}</span>
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
