import { createContext, useCallback, useContext, useRef, useState } from "react";
import { FiAlertTriangle } from "react-icons/fi";

const ConfirmContext = createContext(() => Promise.resolve(false));

/**
 * Imperative confirmation dialog to replace window.confirm.
 *
 * Usage:
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title, message, confirmText, tone }))) return;
 *
 * Returns a promise that resolves to true (confirmed) or false (cancelled).
 */
export const ConfirmProvider = ({ children }) => {
  const [state, setState] = useState(null); // { title, message, confirmText, cancelText, tone }
  const resolverRef = useRef(null);

  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setState({
        title: options.title || "Are you sure?",
        message: options.message || "",
        confirmText: options.confirmText || "Confirm",
        cancelText: options.cancelText || "Cancel",
        tone: options.tone || "danger", // "danger" | "primary"
      });
    });
  }, []);

  const close = useCallback((result) => {
    setState(null);
    if (resolverRef.current) {
      resolverRef.current(result);
      resolverRef.current = null;
    }
  }, []);

  const isDanger = state?.tone === "danger";

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {state && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => close(false)}
          />

          <div className="relative z-10 w-full max-w-sm animate-scale-in rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div
                className={`grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl ${
                  isDanger
                    ? "bg-red-50 text-red-600"
                    : "bg-brand-50 text-brand-600"
                }`}
              >
                <FiAlertTriangle className="text-xl" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-slate-900">
                  {state.title}
                </h3>
                {state.message && (
                  <p className="mt-1 text-sm text-slate-500">{state.message}</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => close(false)}
                className="btn-ghost"
              >
                {state.cancelText}
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => close(true)}
                className={
                  isDanger
                    ? "inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
                    : "btn-primary"
                }
              >
                {state.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => useContext(ConfirmContext);

export default ConfirmProvider;
