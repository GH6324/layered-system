import { RecentWorkspace, WimImageInfo } from "../types";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Input } from "./ui/Input";

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
  recents: RecentWorkspace[];
  onListWim: () => Promise<void>;
  onOpenExisting: (path?: string) => Promise<void>;
  onUseRecent: (path: string) => Promise<void>;
  onRemoveRecent: (path: string) => Promise<void>;
  onClearRecents: () => Promise<void>;
  onRefreshRecents: () => Promise<void>;
  onCreateWorkspace: () => Promise<void>;
  status: "idle" | "initialized" | "error";
  message: string;
  admin: boolean | null;
  adminLabel: string;
  isBusy: (cmd?: string) => boolean;
  t: (key: string, options?: any) => string;
};

export function WorkspaceGate(props: Props) {
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
    recents,
    onListWim,
    onOpenExisting,
    onUseRecent,
    onRemoveRecent,
    onClearRecents,
    onRefreshRecents,
    onCreateWorkspace,
    status,
    message,
    admin,
    adminLabel,
    isBusy,
    t,
  } = props;
  const statusTone = status === "initialized" ? "positive" : status === "error" ? "danger" : "neutral";
  const recentTone = (state: RecentWorkspace["last_status"]) => {
    switch (state) {
      case "ok":
        return "positive";
      case "missing_root":
        return "danger";
      case "missing_state_db":
      case "init_failed":
        return "warn";
      default:
        return "neutral";
    }
  };
  const recentTime = (time: string) => {
    const parsed = new Date(time);
    return Number.isNaN(parsed.getTime()) ? time : parsed.toLocaleString();
  };
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-ink-700">{t("admin-status", { status: "" })}</span>
          <Badge tone={admin ? "positive" : "warn"} className="px-3 py-1">
            {adminLabel}
          </Badge>
        </div>
        <div className="mt-4 space-y-3">
          <Input
            value={rootPath}
            onChange={(e) => setRootPath(e.target.value)}
            placeholder={t("root-placeholder")}
            spellCheck={false}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button
              className="w-full py-3"
              onClick={() => onOpenExisting()}
              disabled={isBusy()}
              loading={isBusy("init_root")}
            >
              {t("init-root")}
            </Button>
          </div>
        </div>
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-ink-800">{t("recent-title")}</h4>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                className="px-3 py-1 text-xs"
                onClick={onRefreshRecents}
                disabled={isBusy()}
                loading={isBusy("list_recent_workspaces")}
              >
                {t("recent-refresh")}
              </Button>
              <Button
                variant="secondary"
                className="px-3 py-1 text-xs"
                onClick={onClearRecents}
                disabled={isBusy() || recents.length === 0}
                loading={isBusy("clear_recent_workspaces")}
              >
                {t("recent-clear")}
              </Button>
            </div>
          </div>
          {recents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-peach-200/70 bg-white/70 px-3 py-4 text-sm text-ink-700 shadow-inner shadow-peach-200/30">
              {t("recent-empty")}
            </div>
          ) : (
            <div className="grid gap-2">
              {recents.map((item) => (
                <div
                  key={item.path}
                  className="rounded-xl border border-peach-200/70 bg-white/80 p-3 shadow-sm shadow-peach-300/20"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 space-y-1">
                      <button
                        type="button"
                        className="text-left"
                        onClick={() => onUseRecent(item.path)}
                        disabled={isBusy()}
                      >
                        <p className="truncate text-sm font-semibold text-ink-900">{item.path}</p>
                        <p className="text-xs text-ink-700">
                          {t("recent-last-opened", { time: recentTime(item.last_opened_at) })}
                        </p>
                      </button>
                      {item.node_count ? (
                        <p className="text-xs text-ink-700">
                          {t("recent-node-count", { count: item.node_count })}
                        </p>
                      ) : null}
                    </div>
                    <Badge tone={recentTone(item.last_status)} className="px-3 py-1">
                      {t(`recent-status.${item.last_status}`)}
                    </Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      className="px-3 py-1 text-xs"
                      onClick={() => onUseRecent(item.path)}
                      disabled={isBusy()}
                      loading={isBusy("init_root")}
                    >
                      {t("recent-open")}
                    </Button>
                    <Button
                      variant="secondary"
                      className="px-3 py-1 text-xs"
                      onClick={() => onRemoveRecent(item.path)}
                      disabled={isBusy()}
                      loading={isBusy("remove_recent_workspace")}
                    >
                      {t("recent-remove")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <Badge tone={statusTone} className="mt-3 w-full justify-start px-4 py-3 text-sm font-semibold">
          {message}
        </Badge>
      </Card>

      <Card>
        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-semibold text-ink-900">{t("section-base-title")}</h3>
          <p className="text-sm text-ink-700">{t("status-uninitialized")}</p>
        </div>
        <div className="mt-4 space-y-3">
          <Input
            value={wimPath}
            onChange={(e) => setWimPath(e.target.value)}
            placeholder={t("wim-path-placeholder")}
            spellCheck={false}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm font-semibold text-ink-700">
              {t("wim-index-label")}
              <Input
                type="number"
                min={1}
                value={wimIndex}
                onChange={(e) => setWimIndex(Number(e.target.value))}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-semibold text-ink-700">
              {t("base-size-label")}
              <Input
                type="number"
                min={20}
                value={baseSize}
                onChange={(e) => setBaseSize(Number(e.target.value))}
              />
            </label>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              value={baseName}
              onChange={(e) => setBaseName(e.target.value)}
              placeholder={t("base-name-placeholder")}
            />
            <Input
              value={baseDesc}
              onChange={(e) => setBaseDesc(e.target.value)}
              placeholder={t("base-desc-placeholder")}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button
              variant="secondary"
              className="w-full py-3"
              onClick={onListWim}
              disabled={isBusy("list_wim_images")}
              loading={isBusy("list_wim_images")}
            >
              {t("list-wim-button")}
            </Button>
            <Button
              className="w-full py-3"
              onClick={onCreateWorkspace}
              disabled={isBusy() || !rootPath.trim()}
              loading={isBusy("create_base_vhd") || isBusy("init_root")}
            >
              {t("create-base-button")}
            </Button>
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
      </Card>
    </div>
  );
}
