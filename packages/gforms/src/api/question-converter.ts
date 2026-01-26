/**
 * Question converter utilities
 * Converts form definition questions to Google Forms API format
 */

import type {
  Question,
  TextQuestion,
  ChoiceQuestion,
  DropdownQuestion,
  ScaleQuestion,
} from '../schema/index.js';

export interface ApiQuestion {
  questionItem: {
    question: {
      questionId: string;
      required: boolean;
      textQuestion?: { paragraph: boolean };
      choiceQuestion?: {
        type: 'RADIO' | 'CHECKBOX' | 'DROP_DOWN';
        options: { value: string }[];
        shuffle?: boolean;
      };
      scaleQuestion?: {
        low: number;
        high: number;
        lowLabel?: string;
        highLabel?: string;
      };
    };
  };
  title: string;
  description?: string | undefined;
}

/**
 * Convert a question to Google Forms API format
 */
export function convertQuestionToApiFormat(question: Question): ApiQuestion {
  const base = createBaseQuestion(question);
  return applyQuestionType(question, base);
}

function createBaseQuestion(question: Question): ApiQuestion {
  const base: ApiQuestion = {
    title: 'title' in question ? question.title : '',
    questionItem: {
      question: {
        questionId: 'id' in question ? question.id : '',
        required: 'required' in question ? question.required : false,
      },
    },
  };

  if ('description' in question && question.description !== undefined) {
    return { ...base, description: question.description };
  }

  return base;
}

function applyQuestionType(question: Question, base: ApiQuestion): ApiQuestion {
  const converters: Record<string, () => ApiQuestion> = {
    text: () => convertTextQuestion(question as TextQuestion, base),
    email: () => convertEmailQuestion(base),
    choice: () => convertChoiceQuestion(question as ChoiceQuestion, base),
    dropdown: () => convertDropdownQuestion(question as DropdownQuestion, base),
    scale: () => convertScaleQuestion(question as ScaleQuestion, base),
  };

  const converter = converters[question.type];
  return converter ? converter() : base;
}

function convertTextQuestion(q: TextQuestion, base: ApiQuestion): ApiQuestion {
  return {
    ...base,
    questionItem: {
      question: {
        ...base.questionItem.question,
        textQuestion: { paragraph: q.paragraph },
      },
    },
  };
}

function convertEmailQuestion(base: ApiQuestion): ApiQuestion {
  return {
    ...base,
    questionItem: {
      question: {
        ...base.questionItem.question,
        textQuestion: { paragraph: false },
      },
    },
  };
}

function convertChoiceQuestion(q: ChoiceQuestion, base: ApiQuestion): ApiQuestion {
  return {
    ...base,
    questionItem: {
      question: {
        ...base.questionItem.question,
        choiceQuestion: {
          type: q.multiple ? 'CHECKBOX' : 'RADIO',
          options: q.options.map((opt: string) => ({ value: opt })),
        },
      },
    },
  };
}

function convertDropdownQuestion(q: DropdownQuestion, base: ApiQuestion): ApiQuestion {
  return {
    ...base,
    questionItem: {
      question: {
        ...base.questionItem.question,
        choiceQuestion: {
          type: 'DROP_DOWN',
          options: q.options.map((opt: string) => ({ value: opt })),
        },
      },
    },
  };
}

function convertScaleQuestion(q: ScaleQuestion, base: ApiQuestion): ApiQuestion {
  return {
    ...base,
    questionItem: {
      question: {
        ...base.questionItem.question,
        scaleQuestion: {
          low: q.min,
          high: q.max,
          ...(q.minLabel !== undefined && { lowLabel: q.minLabel }),
          ...(q.maxLabel !== undefined && { highLabel: q.maxLabel }),
        },
      },
    },
  };
}
