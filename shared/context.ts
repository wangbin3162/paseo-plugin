import { defineRpc } from "@getpaseo/plugin";
import { z } from "zod";

export const ProjectFileSchema = z.object({
  name: z.string(),
  path: z.string(),
  sizeBytes: z.number(),
});

export const ContextInfoRpc = defineRpc({
  name: "claude.context.get_info",
  input: z.object({
    workspaceId: z.string(),
    agentId: z.string().optional(),
  }),
  output: z.object({
    environment: z.object({
      computerName: z.string(),
      osInfo: z.string(),
      workspaceName: z.string(),
      directory: z.string(),
      displayDirectory: z.string(),
      branch: z.string().nullable(),
      commitHash: z.string().nullable(),
      commitMessage: z.string().nullable(),
      gitStatus: z.object({
        clean: z.boolean(),
        summary: z.string(),
        additions: z.number(),
        deletions: z.number(),
        modifiedFiles: z.number(),
        untrackedFiles: z.number(),
      }),
      worktree: z.object({
        isWorktree: z.boolean(),
        worktreePath: z.string().nullable(),
        cleaned: z.boolean(),
      }),
    }),
    agent: z
      .object({
        id: z.string(),
        title: z.string().nullable(),
        provider: z.string(),
        model: z.string().nullable(),
        status: z.string(),
      })
      .nullable(),
    context: z.object({
      usedTokens: z.number().nullable(),
      maxTokens: z.number().nullable(),
      usedPercentage: z.number().nullable(),
      freeTokens: z.number().nullable(),
      freePercentage: z.number().nullable(),
      inputTokens: z.number().nullable(),
      cachedInputTokens: z.number().nullable(),
      outputTokens: z.number().nullable(),
      totalCostUsd: z.number().nullable(),
    }),
    projectFiles: z.array(ProjectFileSchema),
  }),
});

export type ContextInfoInput = z.infer<typeof ContextInfoRpc.input>;
export type ContextInfoOutput = z.infer<typeof ContextInfoRpc.output>;
