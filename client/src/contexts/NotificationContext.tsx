import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';

interface ToastOptions {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

interface NotificationContextType {
  showToast: (options: ToastOptions) => void;
  showConfirm: (options: ConfirmOptions) => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const [confirm, setConfirm] = useState<{
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const showToast = useCallback((options: ToastOptions) => {
    setToast(options);
  }, []);

  const showConfirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirm({ options, resolve });
    });
  }, []);

  const handleConfirm = () => {
    if (confirm) {
      confirm.resolve(true);
      setConfirm(null);
    }
  };

  const handleCancel = () => {
    if (confirm) {
      confirm.resolve(false);
      setConfirm(null);
    }
  };

  return (
    <NotificationContext.Provider value={{ showToast, showConfirm }}>
      {children}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => setToast(null)}
        />
      )}
      {confirm && (
        <ConfirmDialog
          title={confirm.options.title}
          message={confirm.options.message}
          confirmText={confirm.options.confirmText}
          cancelText={confirm.options.cancelText}
          type={confirm.options.type}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};
