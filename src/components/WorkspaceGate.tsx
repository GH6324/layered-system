import { WimImageInfo } from "../types";

type Props = {
  rootPath: string;
  setRootPath: (v: string) => void;
  wimPath: string;
  setWimPath: (v: string) => void;
  wimIndex: number;
  setWimIndex: (v: number) => void;
  baseSize: number;
  setBaseSize: (v: number) => void;
  baseName: string;
  setBaseName: (v: string) => void;
  baseDesc: string;
  setBaseDesc: (v: string) => void;
  wimImages: WimImageInfo[];
  onListWim: () => Promise<void>;
  onOpenExisting: () => Promise<void>;
  onCreateWorkspace: () => Promise<void>;
  status: "idle" | "initialized" | "error";
  message: string;
  admin: boolean | null;
  adminLabel: string;
  t: (key: string, options?: any) => string;
};

export function WorkspaceGate(props: Props) {
  const inputClass =
    "w-full rounded-xl border border-peach-200/80 bg-white/90 px-4 py-3 text-sm font-medium text-ink-900 shadow-inner shadow-peach-300/15 transition focus:border-peach-300 focus:outline-none focus:ring-2 focus:ring-peach-300/60";
  const primaryButtonClass =
    "w-full rounded-xl bg-peach-300 px-4 py-3 text-sm font-semibold text-ink-900 shadow-md shadow-peach-400/40 transition hover:-translate-y-0.5 hover:bg-peach-400 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peach-400";
  const secondaryButtonClass =
    "w-full rounded-xl border border-peach-200/80 bg-white/90 px-4 py-3 text-sm font-semibold text-ink-900 shadow-sm shadow-peach-300/25 transition hover:-translate-y-0.5 hover:border-peach-300 hover:bg-peach-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peach-300";
  const {
    rootPath,
    setRootPath,
    wimPath,
    setWimPath,
    wimIndex,
    setWimIndex,
    baseSize,
    setBaseSize,
    baseName,
    setBaseName,
    baseDesc,
    setBaseDesc,
    wimImages,
    onListWim,
    onOpenExisting,
    onCreateWorkspace,
    status,
    message,
    admin,
    adminLabel,
    t,
  } = props;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-lg shadow-peach-300/25 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-ink-700">{t("admin-status", { status: "" })}</span>
          <span
            className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${
              admin
                ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border border-amber-200 bg-amber-50 text-amber-700"
            }`}
          >
            {adminLabel}
          </span>
        </div>
        <div className="mt-4 space-y-3">
          <input
            className={inputClass}
            value={rootPath}
            onChange={(e) => setRootPath(e.target.value)}
            placeholder={t("root-placeholder")}
            spellCheck={false}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button className={primaryButtonClass} onClick={onOpenExisting}>
              {t("init-root")}
            </button>
          </div>
        </div>
        <div
          className={`mt-3 rounded-xl border px-4 py-3 text-sm font-semibold shadow-sm ${
            status === "initialized"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : status === "error"
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-peach-200 bg-white/80 text-ink-700"
          }`}
        >
          {message}
        </div>
      </section>

      <section className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-lg shadow-peach-300/25 backdrop-blur">
        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-semibold text-ink-900">{t("section-base-title")}</h3>
          <p className="text-sm text-ink-700">{t("status-uninitialized")}</p>
        </div>
        <div className="mt-4 space-y-3">
          <input
            className={inputClass}
            value={wimPath}
            onChange={(e) => setWimPath(e.target.value)}
            placeholder={t("wim-path-placeholder")}
            spellCheck={false}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm font-semibold text-ink-700">
              {t("wim-index-label")}
              <input
                className={inputClass}
                type="number"
                min={1}
                value={wimIndex}
                onChange={(e) => setWimIndex(Number(e.target.value))}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-semibold text-ink-700">
              {t("base-size-label")}
              <input
                className={inputClass}
                type="number"
                min={20}
                value={baseSize}
                onChange={(e) => setBaseSize(Number(e.target.value))}
              />
            </label>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              className={inputClass}
              value={baseName}
              onChange={(e) => setBaseName(e.target.value)}
              placeholder={t("base-name-placeholder")}
            />
            <input
              className={inputClass}
              value={baseDesc}
              onChange={(e) => setBaseDesc(e.target.value)}
              placeholder={t("base-desc-placeholder")}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button className={secondaryButtonClass} onClick={onListWim}>
              {t("list-wim-button")}
            </button>
            <button className={primaryButtonClass} onClick={onCreateWorkspace}>
              {t("create-base-button")}
            </button>
          </div>
          {wimImages.length > 0 && (
            <div className="grid gap-2 rounded-xl border border-peach-200/70 bg-peach-50/50 p-3">
              {wimImages.map((img) => (
                <div
                  key={img.index}
                  className="rounded-lg border border-white/70 bg-white/80 px-3 py-2 text-sm text-ink-900 shadow-sm shadow-peach-300/20"
                >
                  <strong>{img.index}</strong> {img.name} {img.description ? `- ${img.description}` : ""}{" "}
                  {img.size ? `(${img.size})` : ""}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
