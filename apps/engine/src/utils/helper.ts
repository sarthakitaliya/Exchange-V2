import type { snapshot } from "@ex/shared";
import { tradeManager } from "../classes/TradeManager";
import { userManager } from "../classes/UserManager";

export function getSnapshotObject(
  latestPrices: Record<string, number>,
  offset: Record<string, string>
) {
  return {
    ts: Date.now(),
    engine: {
      latestPrices: { ...latestPrices },
      userManager: userManager.getBalanceData(),
      tradeManager: tradeManager.getOpAndClData(),
    },
    offset: { ...offset },
  };
}

export function restoreFromSnapshot(
  snap: snapshot,
  latestPrices: Record<string, number>,
  offset: Record<string, string>
) {
  if (!snap || !snap.engine) return;
  const e = snap.engine;

  if (e.latestPrices) {
    Object.assign(latestPrices, e.latestPrices);
  }

  if (e.userManager) {
    userManager.restore(snap.engine.userManager);
  }

  if (e.tradeManager) {
    tradeManager.restore(snap.engine.tradeManager);
  }
  if (snap.offset) {
    Object.assign(offset, snap.offset);
  }
}
