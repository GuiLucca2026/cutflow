// Ponto de entrada público do motor de personalidade — quem for consumir
// isso fora de src/lib/flow importa só daqui (ver flow-message.tsx).
export { computeFlowContext, computeWorkContext } from "./context";
export type { FlowVideoLite, FlowCaptureLite, FlowWorkInput } from "./context";
export { computeTimeContext, timeBandFor, G2_TIMEZONE } from "./time";
export { pickFlowMessage } from "./engine";
export { readFlowHistory, recordFlowMessage, recentFlowMessageIds } from "./history";
export type { FlowContext, FlowMessage, FlowCategory, FlowTimeContext, FlowWorkContext, TimeBand, Weekday } from "./types";
