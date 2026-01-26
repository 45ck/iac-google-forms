/**
 * Comparison helper functions for diff engine
 */

import type { Integration, Question } from '../schema/index.js';

/**
 * Compare two arrays for equality
 */
function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

/**
 * Compare common question properties
 */
function compareCommonProps(local: Question, remote: Question): string[] {
  const changes: string[] = [];
  if ('title' in local && 'title' in remote && local.title !== remote.title) {
    changes.push('title');
  }
  if ('description' in local && 'description' in remote) {
    if (local.description !== remote.description) {
      changes.push('description');
    }
  }
  if ('required' in local && 'required' in remote) {
    if (local.required !== remote.required) {
      changes.push('required');
    }
  }
  return changes;
}

/**
 * Compare text question properties
 */
function compareTextQuestion(local: Question, remote: Question): string[] {
  if (local.type !== 'text' || remote.type !== 'text') {
    return [];
  }
  const changes: string[] = [];
  if (local.paragraph !== remote.paragraph) {
    changes.push('paragraph');
  }
  if (local.maxLength !== remote.maxLength) {
    changes.push('maxLength');
  }
  return changes;
}

/**
 * Compare choice question properties
 */
function compareChoiceQuestion(local: Question, remote: Question): string[] {
  if (local.type !== 'choice' || remote.type !== 'choice') {
    return [];
  }
  const changes: string[] = [];
  if (!arraysEqual(local.options, remote.options)) {
    changes.push('options');
  }
  if (local.allowOther !== remote.allowOther) {
    changes.push('allowOther');
  }
  if (local.multiple !== remote.multiple) {
    changes.push('multiple');
  }
  return changes;
}

/**
 * Compare dropdown question properties
 */
function compareDropdownQuestion(local: Question, remote: Question): string[] {
  if (local.type !== 'dropdown' || remote.type !== 'dropdown') {
    return [];
  }
  if (!arraysEqual(local.options, remote.options)) {
    return ['options'];
  }
  return [];
}

/**
 * Compare scale question properties
 */
function compareScaleQuestion(local: Question, remote: Question): string[] {
  if (local.type !== 'scale' || remote.type !== 'scale') {
    return [];
  }
  const changes: string[] = [];
  if (local.min !== remote.min) {
    changes.push('min');
  }
  if (local.max !== remote.max) {
    changes.push('max');
  }
  if (local.minLabel !== remote.minLabel) {
    changes.push('minLabel');
  }
  if (local.maxLabel !== remote.maxLabel) {
    changes.push('maxLabel');
  }
  return changes;
}

/**
 * Get list of changed properties between two questions
 */
export function getQuestionChanges(local: Question, remote: Question): string[] {
  return [
    ...compareCommonProps(local, remote),
    ...compareTextQuestion(local, remote),
    ...compareChoiceQuestion(local, remote),
    ...compareDropdownQuestion(local, remote),
    ...compareScaleQuestion(local, remote),
  ];
}

/**
 * Compare sheets integration properties
 */
function compareSheetsIntegration(local: Integration, remote: Integration): string[] {
  if (local.type !== 'sheets' || remote.type !== 'sheets') {
    return [];
  }
  const changes: string[] = [];
  if (local.spreadsheetName !== remote.spreadsheetName) {
    changes.push('spreadsheetName');
  }
  if (local.spreadsheetId !== remote.spreadsheetId) {
    changes.push('spreadsheetId');
  }
  if (local.folderId !== remote.folderId) {
    changes.push('folderId');
  }
  return changes;
}

/**
 * Compare email integration properties
 */
function compareEmailIntegration(local: Integration, remote: Integration): string[] {
  if (local.type !== 'email' || remote.type !== 'email') {
    return [];
  }
  const changes: string[] = [];
  if (!arraysEqual(local.to, remote.to)) {
    changes.push('to');
  }
  if (local.subject !== remote.subject) {
    changes.push('subject');
  }
  return changes;
}

/**
 * Compare webhook integration properties
 */
function compareWebhookIntegration(local: Integration, remote: Integration): string[] {
  if (local.type !== 'webhook' || remote.type !== 'webhook') {
    return [];
  }
  const changes: string[] = [];
  if (local.url !== remote.url) {
    changes.push('url');
  }
  if (local.method !== remote.method) {
    changes.push('method');
  }
  return changes;
}

/**
 * Get list of changed properties between two integrations
 */
export function getIntegrationChanges(local: Integration, remote: Integration): string[] {
  return [
    ...compareSheetsIntegration(local, remote),
    ...compareEmailIntegration(local, remote),
    ...compareWebhookIntegration(local, remote),
  ];
}
