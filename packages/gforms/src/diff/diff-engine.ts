/**
 * Diff Engine
 * Compares local form definitions with remote forms to detect changes
 *
 * Implements TC-DIFF-001 through TC-DIFF-008 from test plan
 */

import type { FormDefinition } from '../schema/index.js';
import type { DiffResult, IntegrationDiff, QuestionDiff, SettingsDiff } from '../types/index.js';

import { diffIntegrations } from './integration-differ.js';
import { checkOrderChanged, collectAllQuestions, diffQuestions } from './question-differ.js';

export type { DiffResult } from '../types/index.js';

export interface DiffSummary {
  added: number;
  removed: number;
  modified: number;
  unchanged: number;
}

interface DiffParts {
  title: { local: string; remote: string } | undefined;
  description: { local?: string; remote?: string } | undefined;
  questions: QuestionDiff[];
  integrations: IntegrationDiff[];
  settings: SettingsDiff | undefined;
  orderChanged: boolean;
}

/**
 * Compares form definitions and generates a diff result
 */
export class DiffEngine {
  /**
   * Compare a local form definition with a remote form
   */
  diff(local: FormDefinition, remote: FormDefinition | null): DiffResult {
    if (remote === null) {
      return this.createNewFormDiff(local);
    }
    return this.createModifiedFormDiff(local, remote);
  }

  private createModifiedFormDiff(local: FormDefinition, remote: FormDefinition): DiffResult {
    const diffs: DiffParts = {
      title: this.diffTitle(local, remote),
      description: this.diffDescription(local, remote),
      questions: diffQuestions(local.questions, remote.questions),
      integrations: diffIntegrations(local.integrations ?? [], remote.integrations ?? []),
      settings: this.diffSettings(local.settings, remote.settings),
      orderChanged: checkOrderChanged(local.questions, remote.questions),
    };

    const hasChanges = this.detectChanges(diffs);
    return this.buildResult(hasChanges, diffs);
  }

  private detectChanges(diffs: DiffParts): boolean {
    return (
      diffs.title !== undefined ||
      diffs.description !== undefined ||
      diffs.questions.some((q) => q.action !== 'unchanged') ||
      diffs.integrations.some((i) => i.action !== 'unchanged') ||
      (diffs.settings?.changes.length ?? 0) > 0 ||
      diffs.orderChanged
    );
  }

  private buildResult(hasChanges: boolean, diffs: DiffParts): DiffResult {
    const result: DiffResult = {
      status: hasChanges ? 'modified' : 'unchanged',
      hasChanges,
      questions: diffs.questions,
      integrations: diffs.integrations,
      orderChanged: diffs.orderChanged,
    };

    if (diffs.title !== undefined) {
      result.title = diffs.title;
    }
    if (diffs.description !== undefined) {
      result.description = diffs.description;
    }
    if (diffs.settings !== undefined) {
      result.settings = diffs.settings;
    }

    return result;
  }

  private createNewFormDiff(local: FormDefinition): DiffResult {
    const questions = collectAllQuestions(local.questions).map(
      (q): QuestionDiff => ({
        action: 'add',
        questionId: q.id,
        local: q,
        remote: undefined,
        changes: [],
      })
    );

    const integrations = (local.integrations ?? []).map(
      (i): IntegrationDiff => ({
        action: 'add',
        integrationType: i.type,
        local: i,
        remote: undefined,
        changes: [],
      })
    );

    return {
      status: 'new',
      hasChanges: true,
      questions,
      integrations,
      orderChanged: false,
    };
  }

  private diffTitle(
    local: FormDefinition,
    remote: FormDefinition
  ): { local: string; remote: string } | undefined {
    if (local.title !== remote.title) {
      return { local: local.title, remote: remote.title };
    }
    return undefined;
  }

  private diffDescription(
    local: FormDefinition,
    remote: FormDefinition
  ): { local?: string; remote?: string } | undefined {
    if (local.description === remote.description) {
      return undefined;
    }
    const result: { local?: string; remote?: string } = {};
    if (local.description !== undefined) {
      result.local = local.description;
    }
    if (remote.description !== undefined) {
      result.remote = remote.description;
    }
    return result;
  }

  private diffSettings(
    local: FormDefinition['settings'],
    remote: FormDefinition['settings']
  ): SettingsDiff | undefined {
    if (!local && !remote) {
      return undefined;
    }
    if (!local || !remote) {
      return { changes: ['settings'], local, remote };
    }

    const changes = this.getSettingsChanges(local, remote);
    if (changes.length === 0) {
      return undefined;
    }

    return { changes, local, remote };
  }

  private getSettingsChanges(
    local: NonNullable<FormDefinition['settings']>,
    remote: NonNullable<FormDefinition['settings']>
  ): string[] {
    const changes: string[] = [];

    if (local.collectEmail !== remote.collectEmail) {
      changes.push('collectEmail');
    }
    if (local.limitOneResponse !== remote.limitOneResponse) {
      changes.push('limitOneResponse');
    }
    if (local.editAfterSubmit !== remote.editAfterSubmit) {
      changes.push('editAfterSubmit');
    }
    if (local.confirmationMessage !== remote.confirmationMessage) {
      changes.push('confirmationMessage');
    }

    return changes;
  }

  /**
   * Generate a summary of the diff
   */
  getSummary(result: DiffResult): DiffSummary {
    const counts = { add: 0, remove: 0, modify: 0, unchanged: 0 };

    for (const q of result.questions) {
      counts[q.action]++;
    }

    return {
      added: counts.add,
      removed: counts.remove,
      modified: counts.modify,
      unchanged: counts.unchanged,
    };
  }
}
