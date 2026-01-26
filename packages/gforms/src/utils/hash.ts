/**
 * Content hashing utility for change detection
 */

import { createHash } from 'node:crypto';
import type { FormDefinition } from '../schema/index.js';

/**
 * Recursively serialize a value with sorted object keys
 * for deterministic output regardless of property insertion order.
 */
function stableStringify(value: unknown): string {
  if (value === null || value === undefined || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return '[' + value.map(stableStringify).join(',') + ']';
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return '{' + keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',') + '}';
}

/**
 * Compute a deterministic SHA-256 hash of a form definition.
 * Used to detect whether a form has changed since last deploy.
 */
export function hashFormDefinition(definition: FormDefinition): string {
  const canonical = stableStringify(definition);
  return createHash('sha256').update(canonical, 'utf-8').digest('hex');
}
