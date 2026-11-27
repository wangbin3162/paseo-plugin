import type { RpcInput } from "@getpaseo/plugin";
import type { PaseoApi, PaseoAgent } from "@getpaseo/client";
import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { ContextInfoRpc, type ContextInfoOutput } from "../shared/context";

function runGit(cwd: string, args: string): string {
  try {
    return execSync(`git ${args}`, {
      cwd,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 3000,
    }).trim();
  } catch {
    return "";
  }
}

function formatTildePath(fullPath: string): string {
  const home = os.homedir();
  if (fullPath.startsWith(home)) {
    return "~" + fullPath.slice(home.length);
  }
  return fullPath;
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

const PROJECT_FILE_CANDIDATES = [
  "AGENTS.md",
  "CLAUDE.md",
  "CONTEXT.md",
  "MEMORY.md",
  ".cursorrules",
];

export async function getContextInfo(
  input: RpcInput<typeof ContextInfoRpc>,
  { paseo }: { paseo: PaseoApi },
): Promise<ContextInfoOutput> {
  const { workspaceId, agentId } = input;

  // 1. Resolve workspace
  let workspaceDir = process.cwd();
  let workspaceName = path.basename(workspaceDir);

  try {
    const wsHandle = paseo.workspaces.ref(workspaceId);
    let ws = wsHandle.current();
    if (!ws) {
      ws = await wsHandle.refresh();
    }
    if (ws && "workspaceDirectory" in ws && ws.workspaceDirectory) {
      workspaceDir = ws.workspaceDirectory;
    }
    if (ws?.name) {
      workspaceName = ws.name;
    }
  } catch (err) {
    console.warn("[claude-sidebar] Failed to get workspace via SDK, fallback to cwd:", err);
  }

  // 2. Resolve Git environment
  let branch: string | null = null;
  let commitHash: string | null = null;
  let commitMessage: string | null = null;
  let isWorktree = false;
  let worktreePath: string | null = null;
  let additions = 0;
  let deletions = 0;
  let modifiedFiles = 0;
  let untrackedFiles = 0;
  let clean = true;
  let summary = "";

  try {
    const isInside = runGit(workspaceDir, "rev-parse --is-inside-work-tree");
    if (isInside === "true") {
      branch = runGit(workspaceDir, "branch --show-current") || runGit(workspaceDir, "rev-parse --abbrev-ref HEAD");
      if (branch === "HEAD") {
        branch = runGit(workspaceDir, "rev-parse --short HEAD") || "detached";
      }
      if (!branch) {
        branch = null;
      }

      const log = runGit(workspaceDir, "log -1 --format=%h%x00%s");
      if (log) {
        const [h, s] = log.split("\0");
        commitHash = h || null;
        commitMessage = s || null;
      }

      const gitDir = runGit(workspaceDir, "rev-parse --git-dir");
      if (gitDir.includes("/worktrees/") || gitDir.includes("\\worktrees\\")) {
        isWorktree = true;
        worktreePath = workspaceDir;
      }

      const statusOutput = runGit(workspaceDir, "status --porcelain");
      if (statusOutput) {
        const lines = statusOutput.split("\n").filter(Boolean);
        modifiedFiles = lines.filter((l) => !l.startsWith("??")).length;
        untrackedFiles = lines.filter((l) => l.startsWith("??")).length;
        clean = lines.length === 0;

        const diffNumstat = runGit(workspaceDir, "diff --numstat");
        if (diffNumstat) {
          for (const line of diffNumstat.split("\n")) {
            const parts = line.split("\t");
            if (parts.length >= 2) {
              const add = parseInt(parts[0], 10);
              const del = parseInt(parts[1], 10);
              if (!isNaN(add)) additions += add;
              if (!isNaN(del)) deletions += del;
            }
          }
        }

        const unpushed = runGit(workspaceDir, "cherry -v");
        const hasUnpushed = Boolean(unpushed);
        summary = `${commitHash ?? ""} ${hasUnpushed ? "(unpushed)" : ""}, ${lines.length} files changed`.trim();
      } else {
        summary = `${commitHash ?? "latest"} (clean)`;
      }
    }
  } catch (err) {
    console.warn("[claude-sidebar] Error reading git info:", err);
  }

  // 3. Resolve the active agent and its real usage snapshot
  let activeAgentId = agentId;
  let agentSnapshot: PaseoAgent | null = null;

  try {
    if (!activeAgentId) {
      const list = await paseo.agents.list();
      const entries = list.entries || [];
      const workspaceAgents = entries.filter((e) => e.agent.workspaceId === workspaceId);
      const match =
        workspaceAgents.find((e) => e.agent.status === "running") ||
        workspaceAgents[0] ||
        entries.find((e) => e.agent.cwd === workspaceDir);
      if (match) {
        activeAgentId = match.agent.id;
      }
    }

    if (activeAgentId) {
      const agentHandle = paseo.agents.ref(activeAgentId);
      agentSnapshot = agentHandle.current() ?? (await agentHandle.refresh())?.agent ?? null;
    }
  } catch (err) {
    console.warn("[claude-sidebar] Error reading agent usage:", err);
  }

  const usage = agentSnapshot?.lastUsage ?? null;
  const usedTokens = finiteNumber(usage?.contextWindowUsedTokens);
  const maxTokens = finiteNumber(usage?.contextWindowMaxTokens);
  const usedPercentage =
    usedTokens !== null && maxTokens !== null && maxTokens > 0
      ? Math.min(100, Number(((usedTokens / maxTokens) * 100).toFixed(1)))
      : null;
  const freeTokens =
    usedTokens !== null && maxTokens !== null ? Math.max(0, maxTokens - usedTokens) : null;
  const freePercentage =
    usedPercentage !== null ? Number((100 - usedPercentage).toFixed(1)) : null;

  // 4. Real instruction files. Paseo does not expose their context share,
  // so only the on-disk file size is reported.
  const projectFiles: Array<{ name: string; path: string; sizeBytes: number }> = [];
  for (const name of PROJECT_FILE_CANDIDATES) {
    const full = path.join(workspaceDir, name);
    try {
      if (fs.existsSync(full)) {
        const stat = fs.statSync(full);
        projectFiles.push({ name, path: full, sizeBytes: stat.size });
      }
    } catch {
      // Ignore unreadable candidates.
    }
  }

  const userMemory = path.join(os.homedir(), ".claude", "CLAUDE.md");
  try {
    if (fs.existsSync(userMemory)) {
      projectFiles.push({
        name: "~/.claude/CLAUDE.md",
        path: userMemory,
        sizeBytes: fs.statSync(userMemory).size,
      });
    }
  } catch {
    // Ignore an unreadable user memory file.
  }

  const shortDir = formatTildePath(workspaceDir);

  return {
    environment: {
      computerName: os.hostname(),
      osInfo: `${os.type()} ${os.release()} (${os.arch()})`,
      workspaceName,
      directory: workspaceDir,
      displayDirectory: `${workspaceName} · ${shortDir}`,
      branch,
      commitHash,
      commitMessage,
      gitStatus: {
        clean,
        summary,
        additions,
        deletions,
        modifiedFiles,
        untrackedFiles,
      },
      worktree: {
        isWorktree,
        worktreePath,
        cleaned: clean,
      },
    },
    agent: agentSnapshot
      ? {
          id: agentSnapshot.id,
          title: agentSnapshot.title ?? null,
          provider: agentSnapshot.provider,
          model: agentSnapshot.model ?? null,
          status: agentSnapshot.status,
        }
      : null,
    context: {
      usedTokens,
      maxTokens,
      usedPercentage,
      freeTokens,
      freePercentage,
      inputTokens: finiteNumber(usage?.inputTokens),
      cachedInputTokens: finiteNumber(usage?.cachedInputTokens),
      outputTokens: finiteNumber(usage?.outputTokens),
      totalCostUsd: finiteNumber(usage?.totalCostUsd),
    },
    projectFiles,
  };
}
