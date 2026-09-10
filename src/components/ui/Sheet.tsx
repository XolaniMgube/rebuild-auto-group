"use client";

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Button, IconButton } from "./Button";

/** Bottom sheet on phones, centred dialog on larger screens. Built on <dialog> for focus and Escape handling. */
export function Sheet({ open, onClose, title, description, children, footer }: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return <dialog ref={ref} aria-labelledby={titleId} className="sheet" onClose={onClose}
    onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="sheet-body">
      <div aria-hidden="true" className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line sm:hidden" />
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1 pt-1.5">
          <h2 id={titleId} className="text-section">{title}</h2>
          {description && <p className="mt-1.5 text-body text-secondary">{description}</p>}
        </div>
        <IconButton label="Close" icon="close" variant="plain" onClick={onClose} className="-mr-2" />
      </div>
      {children && <div className="mt-5">{children}</div>}
      {footer && <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">{footer}</div>}
    </div>
  </dialog>;
}

type ConfirmOptions = { title: string; message?: string; confirmLabel?: string };
type Pending = ConfirmOptions & { resolve: (confirmed: boolean) => void };

const ConfirmContext = createContext<(options: ConfirmOptions) => Promise<boolean>>(async () => false);

/** Replaces window.confirm with an in-app sheet: `if (await confirm({ title })) …` */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);
  const confirm = useCallback((options: ConfirmOptions) => new Promise<boolean>(resolve => setPending({ ...options, resolve })), []);

  function finish(confirmed: boolean) {
    pending?.resolve(confirmed);
    setPending(null);
  }

  return <ConfirmContext.Provider value={confirm}>
    {children}
    <Sheet open={pending !== null} onClose={() => finish(false)} title={pending?.title ?? ""} description={pending?.message}
      footer={<>
        <Button variant="secondary" block className="sm:w-auto" onClick={() => finish(false)}>Cancel</Button>
        <Button block className="sm:w-auto" onClick={() => finish(true)}>{pending?.confirmLabel ?? "Confirm"}</Button>
      </>} />
  </ConfirmContext.Provider>;
}

export function useConfirm() {
  return useContext(ConfirmContext);
}
