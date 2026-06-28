import { useEffect } from 'react';

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-4 md:max-w-sm bg-primary text-primary-foreground px-4 py-3 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-2">
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
