/**
 * Converts Google Forms API responses to local FormDefinition format
 * Enables DiffEngine comparison between local and remote forms
 */

import type { Question } from '../schema/index.js';
import type { GoogleFormItem, GoogleFormResponse } from './forms-client.js';

/**
 * Minimal FormDefinition shape for diff comparison.
 * We avoid importing the full Zod-inferred type since
 * the remote form may not pass all local validation rules.
 */
export interface RemoteFormDefinition {
  title: string;
  description?: string | undefined;
  questions: Question[];
  integrations?: undefined;
  settings?: undefined;
}

/**
 * Convert a Google Forms API response to a form definition
 * suitable for comparison with local definitions via DiffEngine
 */
export function convertResponseToFormDefinition(
  response: GoogleFormResponse
): RemoteFormDefinition {
  const questions = convertItems(response.items ?? []);

  const def: RemoteFormDefinition = {
    title: response.info.title,
    questions,
  };

  if (response.info.description) {
    def.description = response.info.description;
  }

  return def;
}

function convertItems(items: GoogleFormItem[]): Question[] {
  const questions: Question[] = [];

  for (const item of items) {
    if (item.questionItem) {
      const q = convertQuestionItem(item);
      if (q) {
        questions.push(q);
      }
    }
  }

  return questions;
}

function convertQuestionItem(item: GoogleFormItem): Question | undefined {
  const qi = item.questionItem;
  if (!qi) {
    return undefined;
  }

  const q = qi.question;
  const id = q.questionId || item.itemId;
  const required = q.required ?? false;

  if (q.scaleQuestion) {
    return convertScaleItem(item, id, required, q.scaleQuestion);
  }

  if (q.choiceQuestion) {
    return convertChoiceItem(item, id, required, q.choiceQuestion);
  }

  if (q.textQuestion) {
    return convertTextItem(item, id, required, q.textQuestion);
  }

  // Unknown question type - treat as text
  return {
    id,
    type: 'text' as const,
    title: item.title,
    required,
    paragraph: false,
    ...(item.description !== undefined && { description: item.description }),
  };
}

interface ScaleData {
  low: number;
  high: number;
  lowLabel?: string | undefined;
  highLabel?: string | undefined;
}

function convertScaleItem(
  item: GoogleFormItem,
  id: string,
  required: boolean,
  scale: ScaleData
): Question {
  return {
    id,
    type: 'scale' as const,
    title: item.title,
    required,
    min: scale.low,
    max: scale.high,
    ...(scale.lowLabel !== undefined && { minLabel: scale.lowLabel }),
    ...(scale.highLabel !== undefined && { maxLabel: scale.highLabel }),
    ...(item.description !== undefined && { description: item.description }),
  };
}

interface ChoiceData {
  type: 'RADIO' | 'CHECKBOX' | 'DROP_DOWN';
  options: { value: string }[];
}

function convertChoiceItem(
  item: GoogleFormItem,
  id: string,
  required: boolean,
  choice: ChoiceData
): Question {
  const options = choice.options.map((o) => o.value);

  if (choice.type === 'DROP_DOWN') {
    return {
      id,
      type: 'dropdown' as const,
      title: item.title,
      required,
      options,
      ...(item.description !== undefined && { description: item.description }),
    };
  }

  return {
    id,
    type: 'choice' as const,
    title: item.title,
    required,
    options,
    allowOther: false,
    multiple: choice.type === 'CHECKBOX',
    ...(item.description !== undefined && { description: item.description }),
  };
}

interface TextData {
  paragraph: boolean;
}

function convertTextItem(
  item: GoogleFormItem,
  id: string,
  required: boolean,
  text: TextData
): Question {
  return {
    id,
    type: 'text' as const,
    title: item.title,
    required,
    paragraph: text.paragraph,
    ...(item.description !== undefined && { description: item.description }),
  };
}
