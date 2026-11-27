import type { PluginTheme } from "@getpaseo/plugin";
import { useRpc } from "@getpaseo/plugin/client";
import { Icon, ScrollView, useToast, copyText } from "@getpaseo/plugin/client/ui";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ContextInfoRpc } from "../shared/context";

interface ClaudeSidebarProps {
  theme: PluginTheme;
  layout: { compact: boolean; platform: "ios" | "android" | "web" };
  workspaceId: string;
  agentId?: string;
  onClose?: () => void;
}

const COMPACT_GUIDE_PERCENT = 80;

function formatTokens(tokens: number): string {
  if (tokens <= 0) return "0";
  if (tokens >= 1_000_000) {
    return (tokens / 1_000_000).toFixed(1) + "M";
  }
  if (tokens >= 1_000) {
    const k = tokens / 1_000;
    return k >= 100 ? `${Math.round(k)}K` : `${k.toFixed(1)}K`;
  }
  return String(tokens);
}

function formatTokensOrDash(tokens: number | null): string {
  return tokens === null ? "—" : formatTokens(tokens);
}

function formatPercent(value: number | null): string {
  return value === null ? "—" : `${value.toFixed(1)}%`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatCost(value: number | null): string | null {
  if (value === null || value <= 0) return null;
  return value < 0.01 ? "<$0.01" : `$${value.toFixed(2)}`;
}

export function ClaudeSidebar({ theme, layout, workspaceId, agentId }: ClaudeSidebarProps) {
  const getContextInfo = useRpc(ContextInfoRpc);
  const toast = useToast();

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["claude-context-info", workspaceId, agentId],
    queryFn: () => getContextInfo({ workspaceId, agentId }),
    refetchInterval: 8000,
  });

  const styles = useMemo(() => {
    const c = theme.colors;
    return StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: c.surface0,
      },
      scrollContent: {
        paddingHorizontal: layout.compact ? 12 : 16,
        paddingVertical: 14,
        gap: 18,
      },
      section: {
        gap: 8,
      },
      sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingBottom: 2,
      },
      sectionTitle: {
        fontSize: 12,
        fontWeight: "600",
        color: c.foreground,
        letterSpacing: 0.3,
      },
      sectionCount: {
        fontSize: 11,
        color: c.foregroundMuted,
      },
      refreshButton: {
        padding: 4,
        borderRadius: 4,
        backgroundColor: c.surface2,
      },
      // Environment card items
      envCard: {
        backgroundColor: c.surface1,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: c.border,
        overflow: "hidden",
      },
      envRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 10,
        gap: 8,
        borderBottomWidth: 1,
        borderBottomColor: c.border,
      },
      envRowLast: {
        borderBottomWidth: 0,
      },
      envIconWrapper: {
        width: 18,
        alignItems: "center",
        justifyContent: "center",
      },
      envLabel: {
        fontSize: 12,
        color: c.foreground,
        flex: 1,
      },
      envBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        backgroundColor: c.surface2,
      },
      envBadgeText: {
        fontSize: 11,
        fontWeight: "500",
        color: c.foregroundMuted,
      },
      // Context Section
      contextTotalRow: {
        flexDirection: "row",
        alignItems: "baseline",
        justifyContent: "space-between",
        marginTop: 2,
      },
      contextTotalNumber: {
        fontSize: 24,
        fontWeight: "700",
        color: c.foreground,
      },
      contextTotalSub: {
        fontSize: 12,
        color: c.foregroundMuted,
      },
      // Segmented progress bar
      progressBarWrap: {
        height: 12,
        justifyContent: "center",
        marginVertical: 2,
      },
      progressBarContainer: {
        height: 4,
        borderRadius: 2,
        backgroundColor: c.surface2,
        flexDirection: "row",
        overflow: "hidden",
      },
      compactTick: {
        position: "absolute",
        top: 0,
        bottom: 0,
        width: 1,
        backgroundColor: c.foregroundMuted,
        opacity: 0.7,
      },
      progressSegment: {
        height: "100%",
      },
      note: {
        fontSize: 10,
        color: c.foregroundMuted,
        lineHeight: 14,
      },
      // Breakdown rows
      breakdownList: {
        gap: 6,
        marginTop: 4,
      },
      breakdownRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 1,
      },
      breakdownLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 7,
        flex: 1,
      },
      colorSquare: {
        width: 8,
        height: 8,
        borderRadius: 2,
      },
      breakdownLabel: {
        fontSize: 12,
        color: c.foregroundMuted,
      },
      breakdownRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
      },
      breakdownTokens: {
        fontSize: 12,
        color: c.foreground,
        minWidth: 44,
        textAlign: "right",
      },
      breakdownPct: {
        fontSize: 11,
        color: c.foregroundMuted,
        minWidth: 38,
        textAlign: "right",
      },
      // Project files
      projectList: {
        gap: 4,
      },
      projectRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 5,
        paddingHorizontal: 6,
        borderRadius: 4,
        gap: 6,
      },
      projectName: {
        fontSize: 12,
        color: c.foreground,
        flex: 1,
      },
      projectSize: {
        fontSize: 11,
        color: c.foregroundMuted,
      },
      // Empty states
      emptyText: {
        fontSize: 12,
        color: c.foregroundMuted,
        fontStyle: "italic",
      },
    });
  }, [theme, layout.compact]);

  if (isLoading) {
    return (
      <View style={[styles.container, { alignItems: "center", justifyContent: "center", padding: 24 }]}>
        <Text style={{ color: theme.colors.foregroundMuted, fontSize: 13 }}>Loading environment & context...</Text>
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={[styles.container, { padding: 16, gap: 12 }]}>
        <Text style={{ color: theme.colors.foreground, fontSize: 13, fontWeight: "600" }}>Unable to load context data</Text>
        <Pressable
          style={{ padding: 8, backgroundColor: theme.colors.surface2, borderRadius: 6, alignItems: "center" }}
          onPress={() => refetch()}
        >
          <Text style={{ color: theme.colors.foreground, fontSize: 12 }}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const { environment, agent, context, projectFiles } = data;
  const cost = formatCost(context.totalCostUsd);
  const hasUsage = context.usedTokens !== null || context.maxTokens !== null;

  const handleCopy = async (text: string, label: string) => {
    try {
      await copyText(text);
      toast.show(`Copied ${label} to clipboard`);
    } catch {
      toast.show(text);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* 1. Environment Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Environment</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Refresh environment"
            style={styles.refreshButton}
            onPress={() => refetch()}
          >
            <Icon name="RefreshCw" size={12} color={theme.colors.foregroundMuted} />
          </Pressable>
        </View>

        <View style={styles.envCard}>
          {/* Host */}
          <Pressable
            style={styles.envRow}
            onPress={() => handleCopy(environment.osInfo, "host information")}
          >
            <View style={styles.envIconWrapper}>
              <Icon name="Monitor" size={13} color={theme.colors.foregroundMuted} />
            </View>
            <Text style={styles.envLabel} numberOfLines={1}>
              {environment.computerName}
            </Text>
          </Pressable>

          {/* Directory */}
          <Pressable
            style={styles.envRow}
            onPress={() => handleCopy(environment.directory, "directory path")}
          >
            <View style={styles.envIconWrapper}>
              <Icon name="Folder" size={13} color={theme.colors.foregroundMuted} />
            </View>
            <Text style={styles.envLabel} numberOfLines={1}>
              {environment.displayDirectory}
            </Text>
          </Pressable>

          {/* Git Branch */}
          <Pressable
            style={[styles.envRow, agent ? undefined : styles.envRowLast]}
            onPress={() => handleCopy(environment.branch ?? "HEAD", "branch name")}
          >
            <View style={styles.envIconWrapper}>
              <Icon name="GitBranch" size={13} color={theme.colors.foregroundMuted} />
            </View>
            <Text style={styles.envLabel} numberOfLines={1}>
              {environment.branch ?? "detached"}
            </Text>
            {environment.gitStatus.summary ? (
              <View style={styles.envBadge}>
                <Text style={styles.envBadgeText} numberOfLines={1}>
                  {environment.gitStatus.clean ? "clean" : `+${environment.gitStatus.additions} -${environment.gitStatus.deletions}`}
                </Text>
              </View>
            ) : null}
          </Pressable>

          {/* Active agent */}
          {agent ? (
            <View style={[styles.envRow, styles.envRowLast]}>
              <View style={styles.envIconWrapper}>
                <Icon name="Bot" size={13} color={theme.colors.foregroundMuted} />
              </View>
              <Text style={styles.envLabel} numberOfLines={1}>
                {agent.title || agent.id.slice(0, 8)}
              </Text>
              <View style={styles.envBadge}>
                <Text style={styles.envBadgeText} numberOfLines={1}>
                  {agent.status}
                </Text>
              </View>
            </View>
          ) : null}
        </View>
      </View>

      {/* 2. Context Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Context</Text>
          {isFetching ? (
            <Text style={{ fontSize: 10, color: theme.colors.foregroundMuted }}>Updating...</Text>
          ) : null}
        </View>

        <View style={styles.contextTotalRow}>
          <Text style={styles.contextTotalNumber}>{formatTokensOrDash(context.usedTokens)}</Text>
          <Text style={styles.contextTotalSub}>
            {context.usedPercentage !== null && context.maxTokens !== null
              ? `${formatPercent(context.usedPercentage)} of ${formatTokens(context.maxTokens)}`
              : "Not reported by this provider"}
          </Text>
        </View>

        {/* Thin used/free bar with a compaction guide tick */}
        <View style={styles.progressBarWrap}>
          <View style={styles.progressBarContainer}>
            {context.usedPercentage !== null ? (
              <>
                <View
                  style={[
                    styles.progressSegment,
                    {
                      flex: Math.max(0.5, context.usedPercentage),
                      backgroundColor: theme.colors.accent,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.progressSegment,
                    {
                      flex: Math.max(0.5, context.freePercentage ?? 0),
                      backgroundColor: theme.colors.surface2,
                    },
                  ]}
                />
              </>
            ) : null}
          </View>
          {context.usedPercentage !== null ? (
            <View
              pointerEvents="none"
              style={[
                styles.compactTick,
                { left: `${COMPACT_GUIDE_PERCENT}%` as `${number}%` },
              ]}
            />
          ) : null}
        </View>

        {!hasUsage ? (
          <Text style={styles.note}>This provider does not report context window usage.</Text>
        ) : null}

        <View style={styles.breakdownList}>
          {/* Used */}
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownLeft}>
              <View style={[styles.colorSquare, { backgroundColor: theme.colors.accent }]} />
              <Text style={styles.breakdownLabel}>Used</Text>
            </View>
            <View style={styles.breakdownRight}>
              <Text style={styles.breakdownTokens}>{formatTokensOrDash(context.usedTokens)}</Text>
              <Text style={styles.breakdownPct}>{formatPercent(context.usedPercentage)}</Text>
            </View>
          </View>

          {/* Free space */}
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownLeft}>
              <View
                style={[
                  styles.colorSquare,
                  {
                    backgroundColor: theme.colors.surface2,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                  },
                ]}
              />
              <Text style={styles.breakdownLabel}>Free space</Text>
            </View>
            <View style={styles.breakdownRight}>
              <Text style={styles.breakdownTokens}>{formatTokensOrDash(context.freeTokens)}</Text>
              <Text style={styles.breakdownPct}>{formatPercent(context.freePercentage)}</Text>
            </View>
          </View>

          {/* Input */}
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownLeft}>
              <View style={[styles.colorSquare, { backgroundColor: "transparent" }]} />
              <Text style={styles.breakdownLabel}>Input tokens</Text>
            </View>
            <View style={styles.breakdownRight}>
              <Text style={styles.breakdownTokens}>{formatTokensOrDash(context.inputTokens)}</Text>
              <Text style={styles.breakdownPct}>—</Text>
            </View>
          </View>

          {/* Cached input */}
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownLeft}>
              <View style={[styles.colorSquare, { backgroundColor: "transparent" }]} />
              <Text style={styles.breakdownLabel}>Cached input</Text>
            </View>
            <View style={styles.breakdownRight}>
              <Text style={styles.breakdownTokens}>{formatTokensOrDash(context.cachedInputTokens)}</Text>
              <Text style={styles.breakdownPct}>—</Text>
            </View>
          </View>

          {/* Output */}
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownLeft}>
              <View style={[styles.colorSquare, { backgroundColor: "transparent" }]} />
              <Text style={styles.breakdownLabel}>Output tokens</Text>
            </View>
            <View style={styles.breakdownRight}>
              <Text style={styles.breakdownTokens}>{formatTokensOrDash(context.outputTokens)}</Text>
              <Text style={styles.breakdownPct}>—</Text>
            </View>
          </View>

          {/* Cost */}
          {cost ? (
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLeft}>
                <View style={[styles.colorSquare, { backgroundColor: "transparent" }]} />
                <Text style={styles.breakdownLabel}>Total cost</Text>
              </View>
              <View style={styles.breakdownRight}>
                <Text style={styles.breakdownTokens}>{cost}</Text>
                <Text style={styles.breakdownPct}>—</Text>
              </View>
            </View>
          ) : null}
        </View>

        <Text style={styles.note}>
          Totals come from the agent's last usage report. Paseo does not expose a per-category
          context breakdown. The tick is an {COMPACT_GUIDE_PERCENT}% compact guide, not a
          provider-reported threshold.
        </Text>
      </View>

      {/* 3. Instruction files Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Instruction files</Text>
          <Text style={styles.sectionCount}>{projectFiles.length}</Text>
        </View>
        {projectFiles.length === 0 ? (
          <Text style={styles.emptyText}>No project instruction files found</Text>
        ) : (
          <View style={styles.projectList}>
            {projectFiles.map((file) => (
              <Pressable
                key={file.path}
                style={styles.projectRow}
                onPress={() => handleCopy(file.path, file.name)}
              >
                <Icon name="FileText" size={12} color={theme.colors.foregroundMuted} />
                <Text style={styles.projectName} numberOfLines={1}>
                  {file.name}
                </Text>
                <Text style={styles.projectSize}>{formatBytes(file.sizeBytes)}</Text>
              </Pressable>
            ))}
          </View>
        )}
        <Text style={styles.note}>
          Detected on disk. Their context share is not reported by Paseo.
        </Text>
      </View>
    </ScrollView>
  );
}
