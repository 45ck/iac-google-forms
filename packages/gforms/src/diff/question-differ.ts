/**
 * Question diffing logic
 */

import type { Question } from '../schema/index.js';
import type { QuestionDiff } from '../types/index.js';
import { getQuestionChanges } from './comparators.js';

/**
 * Collect all questions including nested ones from sections
 */
export function collectAllQuestions(
  questions: Question[]
): (Question & { id: string })[] {
  const result: (Question & { id: string })[] = [];

  for (const q of questions) {
    if (q.type === 'section') {
      result.push(...collectAllQuestions(q.questions));
    } else {
      result.push(q as Question & { id: string });
    }
  }

  return result;
}

/**
 * Compare questions and return diffs
 */
export function diffQuestions(
  localQuestions: Question[],
  remoteQuestions: Question[]
): QuestionDiff[] {
  const localFlat = collectAllQuestions(localQuestions);
  const remoteFlat = collectAllQuestions(remoteQuestions);

  const localMap = new Map(localFlat.map((q) => [q.id, q]));
  const remoteMap = new Map(remoteFlat.map((q) => [q.id, q]));

  const diffs = findAddedAndModified(localMap, remoteMap);
  const removedDiffs = findRemoved(localMap, remoteMap);

  return [...diffs, ...removedDiffs];
}

function findAddedAndModified(
  localMap: Map<string, Question & { id: string }>,
  remoteMap: Map<string, Question & { id: string }>
): QuestionDiff[] {
  const diffs: QuestionDiff[] = [];

  for (const [id, localQ] of localMap) {
    const remoteQ = remoteMap.get(id);
    diffs.push(createQuestionDiff(id, localQ, remoteQ));
  }

  return diffs;
}

function createQuestionDiff(
  id: string,
  localQ: Question & { id: string },
  remoteQ: (Question & { id: string }) | undefined
): QuestionDiff {
  if (!remoteQ) {
    return {
      action: 'add',
      questionId: id,
      local: localQ,
      remote: undefined,
      changes: [],
    };
  }

  const changes = getQuestionChanges(localQ, remoteQ);
  return {
    action: changes.length > 0 ? 'modify' : 'unchanged',
    questionId: id,
    local: localQ,
    remote: remoteQ,
    changes,
  };
}

function findRemoved(
  localMap: Map<string, Question & { id: string }>,
  remoteMap: Map<string, Question & { id: string }>
): QuestionDiff[] {
  const diffs: QuestionDiff[] = [];

  for (const [id, remoteQ] of remoteMap) {
    if (!localMap.has(id)) {
      diffs.push({
        action: 'remove',
        questionId: id,
        local: undefined,
        remote: remoteQ,
        changes: [],
      });
    }
  }

  return diffs;
}

/**
 * Check if question order has changed
 */
export function checkOrderChanged(
  localQuestions: Question[],
  remoteQuestions: Question[]
): boolean {
  const localIds = collectAllQuestions(localQuestions).map((q) => q.id);
  const remoteIds = collectAllQuestions(remoteQuestions).map((q) => q.id);

  if (localIds.length !== remoteIds.length) {
    return false;
  }

  return isReordered(localIds, remoteIds);
}

function isReordered(localIds: string[], remoteIds: string[]): boolean {
  for (let i = 0; i < localIds.length; i++) {
    if (localIds[i] !== remoteIds[i]) {
      const localSet = new Set(localIds);
      const remoteSet = new Set(remoteIds);
      return (
        localIds.every((id) => remoteSet.has(id)) &&
        remoteIds.every((id) => localSet.has(id))
      );
    }
  }
  return false;
}
