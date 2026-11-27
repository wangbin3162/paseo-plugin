# Claude Context Sidebar

Claude Context Sidebar brings the familiar Claude Code and Claude Desktop inspection panel into Paseo. It displays live environment details, git branch status, and real context window usage for the active agent.

## What it does

The plugin contributes a workspace panel and an agent tab that give you immediate visibility into:

1. **Environment and repository status**: Host details, workspace directory, active git branch, recent commit hash, clean/unpushed states, and worktree info.
2. **Real context usage**: Context window used/free totals from the agent's last usage report, visualized with a thin used/free bar. Input, cached input, output, and cost are shown when the provider reports them.
3. **Instruction files**: Workspace and user instruction files detected on disk (AGENTS.md, CLAUDE.md, CONTEXT.md, MEMORY.md, .cursorrules, ~/.claude/CLAUDE.md) with their real file sizes.
4. **Claude-style themes**: Two warm neutral themes, "Claude Soft Light" and "Claude Soft Dark", available in Settings → Appearance.

## Known limits

- **Provider subagents are not listed.** Paseo 0.17.4 renders provider-native subagents (for example Claude Code's Task tool) in its own chat UI, but the plugin SDK exposes no way to read them: the plugin agent snapshot covers regular agents only, and provider-subagent data comes from a daemon RPC that plugins cannot call. The panel omits a subagents section instead of showing one that could never populate.

## How to use

- **Explorer & Workspace**: Open the "Environment & Context" panel from the Explorer side pane or as a workspace tab.
- **Command Center**: Press Cmd+K (or Ctrl+K) and select "Open Environment & Context (Claude Sidebar)".
- **Composer**: Type `/context` in the prompt box to jump directly to the panel.
