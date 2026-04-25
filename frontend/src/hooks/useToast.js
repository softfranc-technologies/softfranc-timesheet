import { useState, useCallback, useEffect } from 'react';

let _setToasts = null;

export const toast = {
  success: (msg) => _setToasts?.(prev => [...prev, { id: Date.now(), type: 'success', msg }]),
  error: (msg) => _setToasts?.(prev => [...prev, { id: Date.now(), type: 'error', msg }]),
  warning: (msg) => _setToasts?.(prev => [...prev, { id: Date.now(), type: 'warning', msg }]),
  info: (msg) => _setToasts?.(prev => [...prev, { id: Date.now(), type: 'info', msg }]),
};

export const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);
  _setToasts = setToasts;

  const remove = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  useEffect(() => {
    if (!toasts.length) return;
    const timer = setTimeout(() => remove(toasts[0].id), 3500);
    return () => clearTimeout(timer);
  }, [toasts, remove]);

  const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`} onClick={() => remove(t.id)}>
          <span>{icons[t.type]}</span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
};

export default toast;
