/**
 * Form definition validators
 * Extracted to reduce complexity in main schema file
 */

import { z, type RefinementCtx } from 'zod';

interface QuestionLike {
  type: string;
  id?: string;
  min?: number;
  max?: number;
  questions?: QuestionLike[];
}

/**
 * Check for duplicate question IDs in a form
 */
export function checkDuplicateIds(
  questions: QuestionLike[],
  ctx: RefinementCtx
): void {
  const ids = new Set<string>();
  collectAndCheckIds(questions, ids, ctx);
}

function collectAndCheckIds(
  questions: QuestionLike[],
  ids: Set<string>,
  ctx: RefinementCtx
): void {
  for (const q of questions) {
    if ('id' in q && typeof q.id === 'string') {
      if (ids.has(q.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `duplicate question id: ${q.id}`,
          path: ['questions'],
        });
      }
      ids.add(q.id);
    }

    if (q.type === 'section' && q.questions) {
      collectAndCheckIds(q.questions, ids, ctx);
    }
  }
}

/**
 * Validate scale question bounds (max > min)
 */
export function validateScaleBounds(
  questions: QuestionLike[],
  ctx: RefinementCtx
): void {
  validateScalesAtLevel(questions, ctx, []);
}

function validateScalesAtLevel(
  questions: QuestionLike[],
  ctx: RefinementCtx,
  basePath: (string | number)[]
): void {
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!q) {
      continue;
    }

    const currentPath = [...basePath, 'questions', i];

    if (isInvalidScale(q)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'max must be greater than min',
        path: [...currentPath, 'max'],
      });
    }

    if (q.type === 'section' && q.questions) {
      validateScalesAtLevel(q.questions, ctx, currentPath);
    }
  }
}

function isInvalidScale(q: QuestionLike): boolean {
  return (
    q.type === 'scale' &&
    typeof q.min === 'number' &&
    typeof q.max === 'number' &&
    q.max <= q.min
  );
}
