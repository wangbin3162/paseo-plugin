import type {
  PluginClientContext,
  PluginWorkspacePanelProps,
  PluginAgentPanelProps,
  PluginButtonRegistration,
} from "@getpaseo/plugin/client";
import { ClaudeSidebar } from "./client/ClaudeSidebar";
import { contributeClaudeThemes } from "./client/themes";

function WorkspaceContextPanel(props: PluginWorkspacePanelProps) {
  return (
    <ClaudeSidebar
      theme={props.theme}
      layout={props.layout}
      workspaceId={props.workspaceId}
    />
  );
}

function AgentContextPanel(props: PluginAgentPanelProps) {
  return (
    <ClaudeSidebar
      theme={props.theme}
      layout={props.layout}
      workspaceId={props.workspaceId}
      agentId={props.params.agentId}
    />
  );
}

export default function contribute(client: PluginClientContext) {
  // 0. Claude-style themes (Settings → Appearance)
  const removeClaudeThemes = contributeClaudeThemes(client);

  // 1. Workspace Panel (accessible in Explorer sidebar and tab bar)
  client.addWorkspacePanel({
    id: "claude-context",
    title: "Environment & Context",
    icon: "Layers",
    locations: ["explorer", "workspace"],
    Component: WorkspaceContextPanel,
  });

  // 2. Agent Tab Panel (alongside chat turns)
  client.addAgentPanel({
    id: "claude-agent-context",
    title: "Context & Env",
    icon: "Activity",
    locations: ["explorer", "workspace"],
    Component: AgentContextPanel,
  });

  // 3. Command Center (⌘K)
  client.addCommandCenterItem({
    id: "open-claude-sidebar",
    title: "Open Environment & Context (Claude Sidebar)",
    icon: "Layers",
    context: "workspace",
    onSelect({ openPanel }) {
      openPanel("claude-context", { location: "explorer" });
    },
  });

  // 4. Slash Command in composer (/context)
  client.addSlashCommand({
    name: "context",
    description: "Open the Environment & Context sidebar panel",
    argumentHint: "",
    context: "workspace",
    onSubmit({ openPanel }) {
      openPanel("claude-context", { location: "explorer" });
    },
  });

  // 5. Dedicated Header Button (top-right toolbar, exactly like Claude's sidebar toggle)
  const headerButtons = new Map<string, PluginButtonRegistration>();
  let isCleanedUp = false;

  const registerHeaderButton = (workspace: { id: string }) => {
    if (isCleanedUp || !workspace?.id) return;
    const workspaceId = workspace.id;
    headerButtons.get(workspaceId)?.remove();
    headerButtons.set(
      workspaceId,
      client.addHeaderButton({
        id: "claude-context-btn",
        workspaceId,
        button: {
          title: "Environment & Context",
          icon: "Gauge",
          behavior: {
            kind: "action",
            onPress() {
              client.openPanel("claude-context", {
                workspaceId,
                location: "explorer",
              });
            },
          },
        },
      }),
    );
  };

  const removeAll = () => {
    for (const btn of headerButtons.values()) btn.remove();
    headerButtons.clear();
  };

  // Initial fetch for immediate buttons
  void client.paseo.workspaces
    .list()
    .then((res) => {
      for (const workspace of res.entries || []) {
        registerHeaderButton(workspace);
      }
    })
    .catch(() => {});

  // Observe live workspace changes
  void client.paseo.workspaces
    .list({ subscribe: {} })
    .then(({ subscription }) => {
      subscription.subscribe({
        snapshot: ({ entries }) => {
          for (const btn of headerButtons.values()) btn.remove();
          headerButtons.clear();
          for (const workspace of entries) registerHeaderButton(workspace);
        },
        update: (message) => {
          if (message.type !== "workspace_update") return;
          const update = message.payload;
          if (update.kind === "upsert") return registerHeaderButton(update.workspace);
          if (update.kind === "remove") {
            headerButtons.get(update.id)?.remove();
            headerButtons.delete(update.id);
          }
        },
      });
      return undefined;
    })
    .catch((err) => {
      if (!isCleanedUp) console.warn("Workspace observation failed", err);
    });

  return () => {
    isCleanedUp = true;
    removeAll();
    removeClaudeThemes();
  };
}
