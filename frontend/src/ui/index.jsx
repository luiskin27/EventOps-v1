import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export function Button({ variant = "primary", size, className = "", ...props }) {
  const cls = ["btn", `btn-${variant}`, size && `btn-${size}`, className].filter(Boolean).join(" ");
  return <button type="button" className={cls} {...props} />;
}

export function Field({ label, hint, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

export function Modal({ title, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog ref={ref} className="modal" onCancel={onClose} onClick={(e) => e.target === ref.current && onClose()}>
      <div className="modal-head">
        <h3>{title}</h3>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Закрыть">
          <X size={18} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

const tones = {
  TODO: "neutral",
  IN_PROGRESS: "wheat",
  DONE: "pine",
  PENDING: "wheat",
  APPROVED: "pine",
  REJECTED: "felt",
};
export function Pill({ status, children }) {
  return <span className={`pill pill-${tones[status] || "neutral"}`}>{children}</span>;
}

export function Empty({ title, children, action }) {
  return (
    <div className="empty">
      <p className="empty-title">{title}</p>
      {children ? <p className="empty-text">{children}</p> : null}
      {action}
    </div>
  );
}

export function Loading() {
  return <div className="loading" role="status">Загрузка…</div>;
}

export function ErrorNote({ error }) {
  if (!error) return null;
  return <div className="note note-error">{error.message || String(error)}</div>;
}

// Состояния запроса react-query в одном месте
export function QueryState({ query, children }) {
  if (query.isPending) return <Loading />;
  if (query.isError) return <ErrorNote error={query.error} />;
  return children(query.data);
}
