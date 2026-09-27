import { useEffect, useRef, useState } from 'react';
import { Button } from '../components/ui';
import { ApiError } from '../api/client';

/** Drill 页通用确认框/输入框。从 Drill.tsx 拆出。 */

export function ConfirmDialog({
  title,
  message,
  confirmText = '确定',
  danger = false,
  busy = false,
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  confirmText?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="app-modal-backdrop" onClick={onClose}>
      <div className="app-modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <h3 className="app-modal-title">{title}</h3>
        <p className="app-modal-message">{message}</p>
        <div className="app-modal-actions">
          <Button variant="ghost" onClick={onClose} disabled={busy}>取消</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} disabled={busy}>
            {busy ? '处理中…' : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

// —— 应用内输入弹窗（Electron 不支持 window.prompt）——
export function PromptDialog({
  title,
  placeholder,
  initial = '',
  submitText = '确定',
  onSubmit,
  onClose,
}: {
  title: string;
  placeholder?: string;
  initial?: string;
  submitText?: string;
  onSubmit: (value: string) => Promise<void>;
  onClose: () => void;
}) {
  const [value, setValue] = useState(initial);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = async () => {
    const v = value.trim();
    if (!v) { setErr('不能为空'); return; }
    setBusy(true);
    setErr('');
    try {
      await onSubmit(v);
      onClose();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : '操作失败');
      setBusy(false);
    }
  };

  return (
    <div className="app-modal-backdrop" onClick={onClose}>
      <div className="app-modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <h3 className="app-modal-title">{title}</h3>
        {err && <div className="banner info">{err}</div>}
        <input
          ref={inputRef}
          className="app-modal-input"
          value={value}
          placeholder={placeholder}
          disabled={busy}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter' && !busy) { e.preventDefault(); void submit(); }
            if (e.key === 'Escape') onClose();
          }}
        />
        <div className="app-modal-actions">
          <Button variant="ghost" onClick={onClose} disabled={busy}>取消</Button>
          <Button onClick={submit} disabled={busy || !value.trim()}>
            {busy ? '处理中…' : submitText}
          </Button>
        </div>
      </div>
    </div>
  );
}
