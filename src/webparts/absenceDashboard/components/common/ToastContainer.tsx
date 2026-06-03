import { useToastStore } from './ToastStore';

const toastColors = {
  success: 'bg-success text-white',
  error: 'bg-error text-white',
  warning: 'bg-warning text-ink',
  info: 'bg-info text-white',
};

const toastIcons = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex min-w-[280px] items-center gap-3 rounded-xl px-4 py-3 shadow-lg ${toastColors[toast.type]}`}
        >
          <span className="text-lg">{toastIcons[toast.type]}</span>
          <p className="flex-1 text-sm font-medium">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}