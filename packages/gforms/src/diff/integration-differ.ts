/**
 * Integration diffing logic
 */

import type { Integration } from '../schema/index.js';
import type { IntegrationDiff } from '../types/index.js';
import { getIntegrationChanges } from './comparators.js';

/**
 * Build a composite key for an integration that handles duplicate types.
 * Keys are `type:index` where index counts within each type.
 */
function buildKey(integration: Integration, counters: Map<string, number>): string {
  const count = counters.get(integration.type) ?? 0;
  counters.set(integration.type, count + 1);
  return `${integration.type}:${String(count)}`;
}

/**
 * Compare integrations and return diffs
 */
export function diffIntegrations(
  localIntegrations: Integration[],
  remoteIntegrations: Integration[]
): IntegrationDiff[] {
  const localCounters = new Map<string, number>();
  const remoteCounters = new Map<string, number>();

  const localMap = new Map(localIntegrations.map((i) => [buildKey(i, localCounters), i]));
  const remoteMap = new Map(remoteIntegrations.map((i) => [buildKey(i, remoteCounters), i]));

  const diffs = findAddedAndModified(localMap, remoteMap);
  const removedDiffs = findRemoved(localMap, remoteMap);

  return [...diffs, ...removedDiffs];
}

function findAddedAndModified(
  localMap: Map<string, Integration>,
  remoteMap: Map<string, Integration>
): IntegrationDiff[] {
  const diffs: IntegrationDiff[] = [];

  for (const [key, localI] of localMap) {
    const remoteI = remoteMap.get(key);
    diffs.push(createIntegrationDiff(localI.type, localI, remoteI));
  }

  return diffs;
}

function createIntegrationDiff(
  type: string,
  localI: Integration,
  remoteI: Integration | undefined
): IntegrationDiff {
  if (!remoteI) {
    return {
      action: 'add',
      integrationType: type,
      local: localI,
      remote: undefined,
      changes: [],
    };
  }

  const changes = getIntegrationChanges(localI, remoteI);
  return {
    action: changes.length > 0 ? 'modify' : 'unchanged',
    integrationType: type,
    local: localI,
    remote: remoteI,
    changes,
  };
}

function findRemoved(
  localMap: Map<string, Integration>,
  remoteMap: Map<string, Integration>
): IntegrationDiff[] {
  const diffs: IntegrationDiff[] = [];

  for (const [key, remoteI] of remoteMap) {
    if (!localMap.has(key)) {
      diffs.push({
        action: 'remove',
        integrationType: remoteI.type,
        local: undefined,
        remote: remoteI,
        changes: [],
      });
    }
  }

  return diffs;
}
