import { BUILT_IN_ASSETS } from '../../shared/order-assets';
import {
  useEffect,
  useRef,
  useState,
  useId,
  isValidElement,
  cloneElement,
  type ReactNode,
  type ReactElement,
} from "react";
import {
  X,
  Check,
  AlertCircle,
  Upload,
  Search,
  Image,
  Music,
  Loader2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { Asset } from "../../shared/types";
import { api } from "../api";
import { useStore } from "../store";
export function EyeMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 58"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M3 29C25-3 75-3 97 29C75 61 25 61 3 29Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="50" cy="29" r="17" stroke="currentColor" strokeWidth="2" />
      <circle cx="50" cy="29" r="6" fill="currentColor" />
      <path d="M50 4V12M50 46V54M12 29H23M77 29H88" stroke="currentColor" />
    </svg>
  );
}
export function Logo({ small = false }: { small?: boolean }) {
  return (
    <div className={`logo ${small ? "small" : ""}`}>
      <EyeMark />
      <div>
        ORDER<small>VIRTUAL TABLETOP</small>
      </div>
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
  className = "",
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const items = ref.current?.querySelectorAll<HTMLElement>(
          'button,input,select,textarea,[tabindex="0"]',
        );
        if (!items?.length) return;
        const first = items[0],
          last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", fn);
    ref.current?.querySelector<HTMLElement>("input,button")?.focus();
    return () => {
      document.removeEventListener("keydown", fn);
      previous?.focus();
    };
  }, [onClose]);
  return (
    <div
      className={`modal-backdrop ${className}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`modal ${wide ? "wide" : ""}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="modal-head">
          <div>
            <span className="eyebrow">ARQUIVO ORDER / ACESSO AUTORIZADO</span>
            <h2>{title}</h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Fechar">
            <X size={19} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </motion.div>
    </div>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  const fieldId = useId();
  const native =
    isValidElement(children) &&
    typeof children.type === "string" &&
    ["input", "select", "textarea"].includes(children.type);
  return (
    <div className="field">
      <label htmlFor={native ? fieldId : undefined}>{label}</label>
      {native
        ? cloneElement(children as ReactElement<Record<string, unknown>>, {
            id: fieldId,
            "aria-describedby": hint ? fieldId + "-hint" : undefined,
          })
        : children}
      {hint && <small id={fieldId + "-hint"}>{hint}</small>}
    </div>
  );
}
export function ErrorText({ error }: { error: string }) {
  return error ? (
    <div className="error-box" role="alert">
      <AlertCircle size={16} />
      {error}
    </div>
  ) : null;
}
export function Loading() {
  return (
    <div className="loading">
      <Loader2 className="spin" />
      <span>Consultando os arquivos…</span>
    </div>
  );
}
export function Toasts() {
  const toasts = useStore((s) => s.toasts);
  return (
    <div className="toasts" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className={`toast ${t.error ? "error" : ""}`}
          >
            {t.error ? <AlertCircle size={17} /> : <Check size={17} />}
            <span>{t.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
export function AssetPicker({
  value,
  onChange,
  audioOnly = false,
  kind = "all",
}: {
  value: string;
  onChange: (v: string) => void;
  audioOnly?: boolean;
  kind?: "all" | "portraits" | "backgrounds";
}) {
  const [assets, setAssets] = useState<Asset[]>([]),
    [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [q, setQ] = useState("");
  const notify = useStore((s) => s.notify);
  async function load() {
    try {
      setAssets(await api("/api/assets"));
    } catch (e) {
      notify((e as Error).message, true);
    }
  }
  useEffect(() => {
    if (open) void load();
  }, [open]);
  async function upload(file: File) {
    setBusy(true);
    try {
      const data = new FormData();
      data.append("file", file);
      data.append("category", audioOnly ? "Sons" : kind === "portraits" ? "Personagens" : "Backgrounds");
      const a = await api<Asset>("/api/assets", { method: "POST", body: data });
      onChange(a.url);
      setOpen(false);
    } catch (e) {
      notify((e as Error).message, true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="asset-picker">
      {value && !audioOnly && <img src={value} alt="Imagem selecionada" />}
      <div className="row">
        <button
          type="button"
          className="btn secondary compact"
          onClick={() => setOpen(!open)}
        >
          {audioOnly ? <Music size={15} /> : <Image size={15} />}{" "}
          {value ? "Trocar arquivo" : "Escolher arquivo"}
        </button>
        {value && (
          <button
            type="button"
            className="icon-btn"
            aria-label="Remover arquivo"
            onClick={() => onChange("")}
          >
            <X size={15} />
          </button>
        )}
      </div>
      {open && (
        <div className="asset-popover">
          <div className="search-field">
            <Search size={15} />
            <input
              aria-label="Buscar arquivo"
              placeholder="Buscar na biblioteca"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <label className="btn secondary compact">
            <Upload size={15} />
            {busy ? "Enviando…" : "Enviar do computador"}
            <input
              type="file"
              hidden
              disabled={busy}
              accept={
                audioOnly
                  ? "audio/mpeg,audio/ogg,audio/wav"
                  : "image/jpeg,image/png,image/webp"
              }
              onChange={(e) => {
                if (e.target.files?.[0]) void upload(e.target.files[0]);
              }}
            />
          </label>
          <div className="asset-grid">
            {(audioOnly ? assets : [...BUILT_IN_ASSETS.filter(a => kind === "all" || a.category === (kind === "portraits" ? "Personagens" : "Cenários")), ...assets])
              .filter(
                (a) =>
                  (audioOnly
                    ? a.mime.startsWith("audio/")
                    : a.mime.startsWith("image/")) &&
                  a.name.toLowerCase().includes(q.toLowerCase()),
              )
              .map((a) => (
                <button
                  type="button"
                  key={a.id}
                  onClick={() => {
                    onChange(a.url);
                    setOpen(false);
                  }}
                >
                  {a.thumbnail ? <img src={a.thumbnail} alt="" loading="lazy" decoding="async" /> : <Music />}
                  <span>{a.name}</span>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
