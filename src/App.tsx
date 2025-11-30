import { invoke } from "@tauri-apps/api/core";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import "./App.css";

type Settings = {
  root_path: string;
  locale: string;
  seq_counter: number;
  last_boot_guid?: string | null;
};

type NodeStatus = "normal" | "missing_file" | "missing_parent" | "missing_bcd" | "mounted" | "error";

type Node = {
  id: string;
  parent_id?: string | null;
  name: string;
  path: string;
  bcd_guid?: string | null;
  desc?: string | null;
  created_at: string;
  status: NodeStatus;
  boot_files_ready: boolean;
};

type InitResponse = {
  settings: Settings;
};

type WimImageInfo = {
  index: number;
  name: string;
  description?: string;
  size?: string;
};

function App() {
  const { t, i18n } = useTranslation();
  const [rootPath, setRootPath] = useState("");
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "initialized" | "error">("idle");
  const [nodes, setNodes] = useState<Node[]>([]);
  const [baseName, setBaseName] = useState("base");
  const [baseSize, setBaseSize] = useState(60);
  const [baseDesc, setBaseDesc] = useState("");
  const [wimPath, setWimPath] = useState("");
  const [wimIndex, setWimIndex] = useState(1);
  const [wimImages, setWimImages] = useState<WimImageInfo[]>([]);
  const [diffParent, setDiffParent] = useState("");
  const [diffName, setDiffName] = useState("child");
  const [diffDesc, setDiffDesc] = useState("");
  const [selectedNode, setSelectedNode] = useState("");

  type TreeNode = Node & { children: TreeNode[] };
  const statusLabels = useMemo<Record<NodeStatus, string>>(
    () => ({
      normal: t("node-status.normal"),
      missing_file: t("node-status.missing-file"),
      missing_parent: t("node-status.missing-parent"),
      missing_bcd: t("node-status.missing-bcd"),
      mounted: t("node-status.mounted"),
      error: t("node-status.error"),
    }),
    [t],
  );

  const adminLabel = useMemo(() => {
    if (admin === null) return "...";
    return admin ? t("admin-yes") : t("admin-no");
  }, [admin, t]);

  useEffect(() => {
    // Run only once on mount to avoid repeated bootstraps that would spam diskpart.
    const bootstrap = async () => {
      try {
        const isAdmin = await invoke<boolean>("check_admin");
        setAdmin(isAdmin);
      } catch (err) {
        setAdmin(false);
      }

      try {
        const settings = await invoke<Settings | null>("get_settings");
        if (settings) {
          setRootPath(settings.root_path);
          setStatus("initialized");
          setMessage(t("status-initialized", { path: settings.root_path }));
          i18n.changeLanguage(settings.locale || "zh-CN");
          await refreshNodes();
        } else {
          setMessage(t("status-uninitialized"));
        }
      } catch (err) {
        setStatus("error");
        setMessage(t("status-error", { msg: String(err) }));
      }
    };
    bootstrap();
  }, []);

  useEffect(() => {
    if (status === "idle") {
      setMessage(t("status-uninitialized"));
    } else if (status === "initialized" && rootPath) {
      setMessage(t("status-initialized", { path: rootPath }));
    }
  }, [rootPath, status, t]);

  const refreshNodes = async () => {
    try {
      const list = await invoke<Node[]>("scan_workspace");
      setNodes(list);
    } catch (err) {
      setStatus("error");
      setMessage(t("status-error", { msg: String(err) }));
    }
  };

  const handleInit = async () => {
    if (!rootPath.trim()) {
      setMessage(t("status-error", { msg: t("error-empty-root") }));
      setStatus("error");
      return;
    }
    try {
      const result = await invoke<InitResponse>("init_root", {
        rootPath,
        locale: i18n.language,
      });
      setStatus("initialized");
      setMessage(t("status-initialized", { path: result.settings.root_path }));
      await refreshNodes();
    } catch (err) {
      setStatus("error");
      setMessage(t("status-error", { msg: String(err) }));
    }
  };

  const handleLocaleChange = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const handleListWim = async () => {
    try {
      const res = await invoke<WimImageInfo[]>("list_wim_images", { imagePath: wimPath });
      setWimImages(res);
      setMessage(t("message-wim-loaded", { count: res.length }));
    } catch (err) {
      setStatus("error");
      setMessage(t("status-error", { msg: String(err) }));
    }
  };

  const handleCreateBase = async () => {
    try {
      const res = await invoke<{ node: Node }>("create_base_vhd", {
        name: baseName,
        desc: baseDesc || null,
        wimFile: wimPath,
        wimIndex,
        sizeGb: baseSize,
      });
      setMessage(t("message-base-created", { name: res.node.name }));
      await refreshNodes();
    } catch (err) {
      setStatus("error");
      setMessage(t("status-error", { msg: String(err) }));
    }
  };

  const handleCreateDiff = async () => {
    try {
      const res = await invoke<{ node: Node }>("create_diff_vhd", {
        parentId: diffParent,
        name: diffName,
        desc: diffDesc || null,
      });
      setMessage(t("message-diff-created", { name: res.node.name }));
      await refreshNodes();
    } catch (err) {
      setStatus("error");
      setMessage(t("status-error", { msg: String(err) }));
    }
  };

  const handleBootReboot = async () => {
    if (!selectedNode) return;
    try {
      await invoke("set_bootsequence_and_reboot", { nodeId: selectedNode });
      setMessage(t("message-boot-set"));
    } catch (err) {
      setStatus("error");
      setMessage(t("status-error", { msg: String(err) }));
    }
  };

  const handleDelete = async () => {
    if (!selectedNode) return;
    try {
      await invoke("delete_subtree", { nodeId: selectedNode });
      setMessage(t("message-deleted"));
      await refreshNodes();
    } catch (err) {
      setStatus("error");
      setMessage(t("status-error", { msg: String(err) }));
    }
  };

  const handleRepair = async () => {
    if (!selectedNode) return;
    try {
      const guid = await invoke<string | null>("repair_bcd", { nodeId: selectedNode });
      setMessage(t("message-repaired-bcd", { guid: guid ?? t("message-no-guid") }));
      await refreshNodes();
    } catch (err) {
      setStatus("error");
      setMessage(t("status-error", { msg: String(err) }));
    }
  };

  const treeData = useMemo<TreeNode[]>(() => {
    const map = new Map<string, TreeNode>();
    nodes.forEach((n) => map.set(n.id, { ...n, children: [] }));
    const roots: TreeNode[] = [];

    map.forEach((node) => {
      const parentId = node.parent_id || "";
      if (parentId && map.has(parentId)) {
        map.get(parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    const sortRecursively = (list: TreeNode[]) => {
      list.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
      list.forEach((child) => sortRecursively(child.children));
    };
    sortRecursively(roots);
    return roots;
  }, [nodes]);

  const selectedDetail = useMemo(
    () => nodes.find((n) => n.id === selectedNode) || null,
    [nodes, selectedNode],
  );

  const parentNode = useMemo(
    () => nodes.find((n) => n.id === selectedDetail?.parent_id) || null,
    [nodes, selectedDetail],
  );

  useEffect(() => {
    if (!nodes.length) {
      setSelectedNode("");
      return;
    }
    if (!selectedNode) {
      setSelectedNode(nodes[0].id);
    } else if (!nodes.some((n) => n.id === selectedNode)) {
      setSelectedNode(nodes[0].id);
    }
  }, [nodes, selectedNode]);

  const renderTree = (list: TreeNode[]) => {
    if (!list.length) return <div className="empty">{t("tree-empty")}</div>;
    return (
      <ul className="tree-list">
        {list.map((node) => (
          <li key={node.id}>
            <div
              className={`tree-node ${selectedNode === node.id ? "selected" : ""}`}
              onClick={() => setSelectedNode(node.id)}
            >
              <div className="tree-title">
                <span className="node-name">{node.name}</span>
                <span className={`pill tiny status-${node.status}`}>{statusLabels[node.status]}</span>
              </div>
              <div className="node-meta">
                <span className="mono">{node.id}</span>
                <span className={`chip ${node.boot_files_ready ? "ok" : "warn"}`}>
                  {node.boot_files_ready ? t("boot-ready-short") : t("boot-not-ready-short")}
                </span>
              </div>
            </div>
            {node.children.length > 0 && renderTree(node.children)}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <main className="app">
      <header className="header">
        <div>
          <p className="eyebrow">{t("subtitle")}</p>
          <h1>{t("title")}</h1>
        </div>
        <div className="locale-switcher">
          <label htmlFor="locale">{t("locale-label")}</label>
          <select
            id="locale"
            value={i18n.language}
            onChange={(e) => handleLocaleChange(e.target.value)}
          >
            <option value="zh-CN">{t("locale-zh")}</option>
            <option value="en">{t("locale-en")}</option>
          </select>
        </div>
      </header>

      <section className="card">
        <div className="row">
          <span className="label">{t("admin-status", { status: "" })}</span>
          <span className={`pill ${admin ? "ok" : "warn"}`}>{adminLabel}</span>
        </div>
        <div className="form">
          <input
            value={rootPath}
            onChange={(e) => setRootPath(e.target.value)}
            placeholder={t("root-placeholder")}
            spellCheck={false}
          />
          <button onClick={handleInit}>{t("init-root")}</button>
        </div>
        <div className={`message ${status}`}>
          <span>{message}</span>
        </div>
      </section>

      <section className="card">
        <h3>{t("section-base-title")}</h3>
        <div className="form column">
          <input
            value={wimPath}
            onChange={(e) => setWimPath(e.target.value)}
            placeholder={t("wim-path-placeholder")}
            spellCheck={false}
          />
          <div className="form split">
            <label>
              {t("wim-index-label")}
              <input
                type="number"
                min={1}
                value={wimIndex}
                onChange={(e) => setWimIndex(Number(e.target.value))}
              />
            </label>
            <label>
              {t("base-size-label")}
              <input
                type="number"
                min={20}
                value={baseSize}
                onChange={(e) => setBaseSize(Number(e.target.value))}
              />
            </label>
          </div>
          <div className="form split">
            <input
              value={baseName}
              onChange={(e) => setBaseName(e.target.value)}
              placeholder={t("base-name-placeholder")}
            />
            <input
              value={baseDesc}
              onChange={(e) => setBaseDesc(e.target.value)}
              placeholder={t("base-desc-placeholder")}
            />
          </div>
          <div className="form split">
            <button onClick={handleListWim}>{t("list-wim-button")}</button>
            <button onClick={handleCreateBase}>{t("create-base-button")}</button>
          </div>
          {wimImages.length > 0 && (
            <div className="wim-list">
              {wimImages.map((img) => (
                <div key={img.index} className="wim-item">
                  <strong>{img.index}</strong> {img.name} {img.description ? `- ${img.description}` : ""}{" "}
                  {img.size ? `(${img.size})` : ""}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="card">
        <h3>{t("section-diff-title")}</h3>
        <div className="form column">
          <select value={diffParent} onChange={(e) => setDiffParent(e.target.value)}>
            <option value="">{t("diff-parent-placeholder")}</option>
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name} ({n.id.slice(0, 6)})
              </option>
            ))}
          </select>
          <div className="form split">
            <input
              value={diffName}
              onChange={(e) => setDiffName(e.target.value)}
              placeholder={t("diff-name-placeholder")}
            />
            <input
              value={diffDesc}
              onChange={(e) => setDiffDesc(e.target.value)}
              placeholder={t("diff-desc-placeholder")}
            />
          </div>
          <button onClick={handleCreateDiff}>{t("create-diff-button")}</button>
        </div>
      </section>

      <section className="card">
        <h3>{t("section-node-title")}</h3>
        <p className="muted">{t("node-management-tip")}</p>
        <div className="node-panels">
          <div className="tree-pane">
            <div className="pane-head">
              <span>{t("node-tree-title")}</span>
              <button className="ghost-btn" onClick={refreshNodes}>
                {t("refresh-button")}
              </button>
            </div>
            {renderTree(treeData)}
          </div>
          <div className="detail-pane">
            <div className="pane-head">
              <span>{t("node-detail-title")}</span>
              {selectedDetail ? (
                <span className="muted">{selectedDetail.name}</span>
              ) : (
                <span className="muted">{t("node-detail-empty")}</span>
              )}
            </div>
            {selectedDetail ? (
              <>
                <div className="detail-grid">
                  <span className="detail-label">ID</span>
                  <span className="detail-value mono">{selectedDetail.id}</span>
                  <span className="detail-label">{t("detail-parent")}</span>
                  <span className="detail-value">
                    {parentNode ? `${parentNode.name} (${parentNode.id})` : t("common-none")}
                  </span>
                  <span className="detail-label">{t("detail-path")}</span>
                  <span className="detail-value mono">{selectedDetail.path}</span>
                  <span className="detail-label">{t("detail-bcd")}</span>
                  <span className="detail-value mono">{selectedDetail.bcd_guid ?? t("common-missing")}</span>
                  <span className="detail-label">{t("detail-created-at")}</span>
                  <span className="detail-value">{selectedDetail.created_at}</span>
                  <span className="detail-label">{t("detail-status")}</span>
                  <span className="detail-value status-line">
                    <span className={`pill tiny status-${selectedDetail.status}`}>
                      {statusLabels[selectedDetail.status]}
                    </span>
                    <span className={`chip ${selectedDetail.boot_files_ready ? "ok" : "warn"}`}>
                      {selectedDetail.boot_files_ready ? t("boot-ready") : t("boot-not-ready")}
                    </span>
                  </span>
                  <span className="detail-label">{t("detail-desc")}</span>
                  <span className="detail-value">{selectedDetail.desc || t("common-none")}</span>
                </div>
                <div className="form column tight">
                  <div className="form split">
                    <button onClick={handleBootReboot}>{t("set-boot-button")}</button>
                    <button onClick={handleRepair}>{t("repair-bcd-button")}</button>
                  </div>
                  <div className="form split">
                    <button className="danger" onClick={handleDelete}>
                      {t("delete-subtree-button")}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="empty">{t("detail-empty")}</div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
