import type { PluginServerContext } from "@getpaseo/plugin/server";
import { getContextInfo } from "./server/context";
import { ContextInfoRpc } from "./shared/context";

export default function contribute(server: PluginServerContext) {
  server.handle(ContextInfoRpc, (input, meta) => getContextInfo(input, meta));
  return () => {};
}
