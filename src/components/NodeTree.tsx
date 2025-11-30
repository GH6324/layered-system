import { TreeNode, StatusLabels } from "../types";

type Props = {
  data: TreeNode[];
  selectedId: string;
  onSelect: (id: string) => void;
  statusLabels: StatusLabels;
  t: (key: string, options?: any) => string;
};

export function NodeTree({ data, selectedId, onSelect, statusLabels, t }: Props) {
  const statusTone: Record<TreeNode["status"], string> = {
    normal: "border border-emerald-200 bg-emerald-50 text-emerald-700",
    missing_file: "border border-rose-200 bg-rose-50 text-rose-700",
    missing_parent: "border border-amber-200 bg-amber-50 text-amber-700",
    missing_bcd: "border border-yellow-200 bg-yellow-50 text-yellow-800",
    mounted: "border border-peach-200 bg-peach-50 text-ink-900",
    error: "border border-rose-200 bg-rose-50 text-rose-700",
  };

  const renderTree = (list: TreeNode[]) => {
    if (!list.length)
      return (
        <div className="rounded-xl border border-dashed border-peach-300/60 bg-white/70 px-4 py-6 text-center text-sm text-ink-700 shadow-inner shadow-peach-300/20">
          {t("tree-empty")}
        </div>
      );
    return (
      <ul className="space-y-2 border-l border-peach-300/50">
        {list.map((node) => (
          <li key={node.id} className="pl-3">
            <div
              className={`group rounded-2xl border px-3 py-2 shadow-sm transition ${
                selectedId === node.id
                  ? "border-peach-400 bg-white/95 shadow-peach-300/40"
                  : "border-white/70 bg-white/70 hover:-translate-y-0.5 hover:border-peach-300 hover:bg-white"
              }`}
              onClick={() => onSelect(node.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-ink-900">{node.name}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span
                      className={`rounded-full px-2 py-1 font-semibold shadow-sm ${statusTone[node.status]}`}
                    >
                      {statusLabels[node.status]}
                    </span>
                    <span
                      className={`rounded-full px-2 py-1 font-semibold shadow-sm ${
                        node.boot_files_ready
                          ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border border-amber-200 bg-amber-50 text-amber-800"
                      }`}
                    >
                      {node.boot_files_ready ? t("boot-ready-short") : t("boot-not-ready-short")}
                    </span>
                  </div>
                </div>
                <span className="rounded-full bg-peach-50 px-2 py-1 text-[11px] font-mono text-ink-700 shadow-inner shadow-peach-300/30">
                  {node.children.length}
                </span>
              </div>
            </div>
            {node.children.length > 0 && <div className="ml-3 mt-2">{renderTree(node.children)}</div>}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="h-full rounded-2xl border border-white/60 bg-white/70 p-4 shadow-lg shadow-peach-300/25 backdrop-blur">
      <div className="max-h-full space-y-3 overflow-y-auto pr-1">{renderTree(data)}</div>
    </div>
  );
}
