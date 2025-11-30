import { Node, StatusLabels } from "../types";

type Props = {
  selected: Node | null;
  parentNode: Node | null;
  statusLabels: StatusLabels;
  diffName: string;
  diffDesc: string;
  setDiffName: (v: string) => void;
  setDiffDesc: (v: string) => void;
  onCreateDiff: () => void;
  onBoot: () => void;
  onRepair: () => void;
  onDelete: () => void;
  t: (key: string, options?: any) => string;
};

export function NodeDetail({
  selected,
  parentNode,
  statusLabels,
  diffName,
  diffDesc,
  setDiffName,
  setDiffDesc,
  onCreateDiff,
  onBoot,
  onRepair,
  onDelete,
  t,
}: Props) {
  const inputClass =
    "w-full rounded-xl border border-peach-200/80 bg-white/90 px-4 py-3 text-sm font-medium text-ink-900 shadow-inner shadow-peach-300/15 transition focus:border-peach-300 focus:outline-none focus:ring-2 focus:ring-peach-300/60";
  const primaryButtonClass =
    "rounded-xl bg-peach-300 px-4 py-2 text-sm font-semibold text-ink-900 shadow-md shadow-peach-400/40 transition hover:-translate-y-0.5 hover:bg-peach-400 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peach-400";
  const secondaryButtonClass =
    "rounded-xl border border-peach-200/80 bg-white/90 px-4 py-2 text-sm font-semibold text-ink-900 shadow-sm shadow-peach-300/25 transition hover:-translate-y-0.5 hover:border-peach-300 hover:bg-peach-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peach-300";
  const dangerButtonClass =
    "rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-rose-400/40 transition hover:-translate-y-0.5 hover:bg-rose-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400";

  if (!selected)
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-peach-300/70 bg-white/60 p-6 text-center text-sm text-ink-700 shadow-inner shadow-peach-300/30">
        {t("detail-empty")}
      </div>
    );
  return (
    <div className="h-full rounded-2xl border border-white/60 bg-white/80 p-4 shadow-lg shadow-peach-300/25 backdrop-blur">
      <div className="space-y-4">
        <div className="rounded-xl border border-white/70 bg-white/80 p-4 shadow-sm shadow-peach-300/25">
          <div className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-3 text-sm sm:grid-cols-[140px_1fr]">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-700">ID</span>
            <span className="font-mono text-ink-900">{selected.id}</span>
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-700">
              {t("detail-parent")}
            </span>
            <span className="text-ink-900">
              {parentNode ? `${parentNode.name} (${parentNode.id})` : t("common-none")}
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-700">
              {t("detail-path")}
            </span>
            <span className="font-mono text-ink-900">{selected.path}</span>
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-700">
              {t("detail-bcd")}
            </span>
            <span className="font-mono text-ink-900">{selected.bcd_guid ?? t("common-missing")}</span>
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-700">
              {t("detail-created-at")}
            </span>
            <span className="text-ink-900">{selected.created_at}</span>
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-700">
              {t("detail-status")}
            </span>
            <span className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2 py-1 text-xs font-semibold shadow-sm ${
                  selected.status === "normal"
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                    : selected.status === "missing_parent"
                      ? "border border-amber-200 bg-amber-50 text-amber-700"
                      : selected.status === "missing_bcd"
                        ? "border border-yellow-200 bg-yellow-50 text-yellow-800"
                        : selected.status === "mounted"
                          ? "border border-peach-200 bg-peach-50 text-ink-900"
                          : "border border-rose-200 bg-rose-50 text-rose-700"
                }`}
              >
                {statusLabels[selected.status]}
              </span>
              <span
                className={`rounded-full px-2 py-1 text-xs font-semibold shadow-sm ${
                  selected.boot_files_ready
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border border-amber-200 bg-amber-50 text-amber-800"
                }`}
              >
                {selected.boot_files_ready ? t("boot-ready") : t("boot-not-ready")}
              </span>
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-700">
              {t("detail-desc")}
            </span>
            <span className="text-ink-900">{selected.desc || t("common-none")}</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/70 bg-white/80 p-4 shadow-sm shadow-peach-300/25">
          <div className="flex flex-col gap-1">
            <h4 className="text-lg font-semibold text-ink-900">{t("section-diff-title")}</h4>
            <p className="text-sm text-ink-700">{t("diff-desc-placeholder")}</p>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              className={inputClass}
              value={diffName}
              onChange={(e) => setDiffName(e.target.value)}
              placeholder={t("diff-name-placeholder")}
            />
            <input
              className={inputClass}
              value={diffDesc}
              onChange={(e) => setDiffDesc(e.target.value)}
              placeholder={t("diff-desc-placeholder")}
            />
          </div>
          <div className="mt-3 flex justify-end">
            <button className={primaryButtonClass} onClick={onCreateDiff}>
              {t("create-diff-button")}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-white/70 bg-white/80 p-4 shadow-sm shadow-peach-300/25">
          <h4 className="text-lg font-semibold text-ink-900">{t("node-actions")}</h4>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button className={secondaryButtonClass} onClick={onBoot}>
              {t("set-boot-button")}
            </button>
            <button className={secondaryButtonClass} onClick={onRepair}>
              {t("repair-bcd-button")}
            </button>
            <button className={dangerButtonClass} onClick={onDelete}>
              {t("delete-subtree-button")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
