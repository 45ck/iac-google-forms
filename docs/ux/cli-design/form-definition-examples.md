# Form Definition Examples

## Overview

This document shows example form definitions in TypeScript, demonstrating all supported features and patterns.

---

## Basic Form

The simplest possible form with a single question:

```typescript
// forms/simple.ts
import { defineForm } from 'iac-google-forms';

export default defineForm({
  title: 'Quick Survey',
  questions: [
    {
      id: 'feedback',
      type: 'text',
      title: 'Any feedback for us?',
    },
  ],
});
```

---

## Customer Feedback Form

A complete feedback form with multiple question types and Sheets integration:

```typescript
// forms/customer-feedback.ts
import { defineForm } from 'iac-google-forms';

export default defineForm({
  title: 'Customer Feedback',
  description: 'Help us improve by sharing your experience.',

  questions: [
    // Email collection
    {
      id: 'email',
      type: 'email',
      title: 'Your email address',
      description: 'We may follow up with you about your feedback.',
      required: true,
    },

    // Rating scale
    {
      id: 'satisfaction',
      type: 'scale',
      title: 'How satisfied are you with our service?',
      min: 1,
      max: 5,
      minLabel: 'Very Unsatisfied',
      maxLabel: 'Very Satisfied',
      required: true,
    },

    // Multiple choice
    {
      id: 'department',
      type: 'choice',
      title: 'Which department did you interact with?',
      options: ['Sales', 'Support', 'Billing', 'Technical'],
      allowOther: true,
      required: true,
    },

    // Dropdown
    {
      id: 'frequency',
      type: 'dropdown',
      title: 'How often do you use our service?',
      options: ['Daily', 'Weekly', 'Monthly', 'Rarely', 'First time'],
    },

    // Long text
    {
      id: 'comments',
      type: 'text',
      title: 'Additional comments',
      description: 'Please share any other thoughts or suggestions.',
      paragraph: true,
    },
  ],

  integrations: [
    {
      type: 'sheets',
      spreadsheetName: 'Customer Feedback Responses',
    },
  ],

  settings: {
    confirmationMessage: 'Thank you for your feedback!',
  },
});
```

---

## NPS Survey

Net Promoter Score survey with conditional follow-up:

```typescript
// forms/nps-survey.ts
import { defineForm } from 'iac-google-forms';

export default defineForm({
  title: 'NPS Survey',
  description: 'Quick question about your experience.',

  questions: [
    {
      id: 'nps',
      type: 'scale',
      title: 'How likely are you to recommend us to a friend or colleague?',
      min: 0,
      max: 10,
      minLabel: 'Not at all likely',
      maxLabel: 'Extremely likely',
      required: true,
    },

    // Detractors section (0-6)
    {
      type: 'section',
      title: 'We\'d love to improve',
      description: 'Sorry to hear that. What could we do better?',
      showIf: { field: 'nps', in: ['0', '1', '2', '3', '4', '5', '6'] },
      questions: [
        {
          id: 'improvement',
          type: 'text',
          title: 'What\'s the main reason for your score?',
          paragraph: true,
          required: true,
        },
      ],
    },

    // Promoters section (9-10)
    {
      type: 'section',
      title: 'Thank you!',
      description: 'We\'re glad you\'re enjoying our service!',
      showIf: { field: 'nps', in: ['9', '10'] },
      questions: [
        {
          id: 'testimonial',
          type: 'text',
          title: 'Would you like to share a testimonial?',
          paragraph: true,
        },
      ],
    },
  ],

  integrations: [
    {
      type: 'sheets',
      spreadsheetName: 'NPS Responses',
    },
    // Alert on detractors
    {
      type: 'email',
      to: ['support-team@company.com'],
      subject: 'New Detractor Alert - NPS Score',
      condition: { field: 'nps', in: ['0', '1', '2', '3', '4', '5', '6'] },
    },
  ],
});
```

---

## Employee Survey

Multi-section employee survey:

```typescript
// forms/employee-survey.ts
import { defineForm } from 'iac-google-forms';

export default defineForm({
  title: 'Annual Employee Survey 2024',
  description: 'Your feedback helps us build a better workplace. All responses are anonymous.',

  questions: [
    // Demographics section
    {
      type: 'section',
      title: 'About You',
      description: 'Help us understand response patterns (optional).',
      questions: [
        {
          id: 'department',
          type: 'dropdown',
          title: 'Department',
          options: ['Engineering', 'Product', 'Design', 'Sales', 'Marketing', 'Operations', 'HR', 'Finance'],
        },
        {
          id: 'tenure',
          type: 'choice',
          title: 'How long have you been with the company?',
          options: ['Less than 1 year', '1-2 years', '3-5 years', '5+ years'],
        },
      ],
    },

    // Work Environment section
    {
      type: 'section',
      title: 'Work Environment',
      questions: [
        {
          id: 'workspace',
          type: 'scale',
          title: 'I have the tools and resources I need to do my job well.',
          min: 1,
          max: 5,
          minLabel: 'Strongly Disagree',
          maxLabel: 'Strongly Agree',
          required: true,
        },
        {
          id: 'worklife',
          type: 'scale',
          title: 'I have a healthy work-life balance.',
          min: 1,
          max: 5,
          minLabel: 'Strongly Disagree',
          maxLabel: 'Strongly Agree',
          required: true,
        },
        {
          id: 'environment_comments',
          type: 'text',
          title: 'Any comments about your work environment?',
          paragraph: true,
        },
      ],
    },

    // Management section
    {
      type: 'section',
      title: 'Management & Leadership',
      questions: [
        {
          id: 'manager_support',
          type: 'scale',
          title: 'My manager supports my professional development.',
          min: 1,
          max: 5,
          minLabel: 'Strongly Disagree',
          maxLabel: 'Strongly Agree',
          required: true,
        },
        {
          id: 'leadership_trust',
          type: 'scale',
          title: 'I trust the leadership team to make good decisions.',
          min: 1,
          max: 5,
          minLabel: 'Strongly Disagree',
          maxLabel: 'Strongly Agree',
          required: true,
        },
      ],
    },

    // Overall section
    {
      type: 'section',
      title: 'Overall',
      questions: [
        {
          id: 'enps',
          type: 'scale',
          title: 'How likely are you to recommend this company as a place to work?',
          min: 0,
          max: 10,
          minLabel: 'Not at all likely',
          maxLabel: 'Extremely likely',
          required: true,
        },
        {
          id: 'improvements',
          type: 'choice',
          title: 'What areas should we focus on improving? (Select all that apply)',
          options: ['Communication', 'Career Growth', 'Compensation', 'Work-Life Balance', 'Tools & Technology', 'Team Collaboration'],
          multiple: true,
        },
        {
          id: 'final_thoughts',
          type: 'text',
          title: 'Any final thoughts or suggestions?',
          paragraph: true,
        },
      ],
    },
  ],

  integrations: [
    {
      type: 'sheets',
      spreadsheetName: 'Employee Survey 2024 Responses',
      folderId: 'HR_FOLDER_ID', // Keep responses in HR folder
    },
  ],

  settings: {
    collectEmail: false, // Anonymous
    limitOneResponse: true, // One response per person
    confirmationMessage: 'Thank you for your feedback! Your responses help us improve.',
  },
});
```

---

## Event Registration

Event registration with webhook integration:

```typescript
// forms/event-registration.ts
import { defineForm } from 'iac-google-forms';

export default defineForm({
  title: 'Tech Meetup Registration',
  description: 'Join us for our monthly tech meetup!',

  questions: [
    {
      id: 'name',
      type: 'text',
      title: 'Full Name',
      required: true,
    },
    {
      id: 'email',
      type: 'email',
      title: 'Email Address',
      required: true,
    },
    {
      id: 'company',
      type: 'text',
      title: 'Company',
    },
    {
      id: 'dietary',
      type: 'choice',
      title: 'Dietary Requirements',
      options: ['None', 'Vegetarian', 'Vegan', 'Gluten-free', 'Halal', 'Kosher'],
      allowOther: true,
    },
    {
      id: 'topics',
      type: 'choice',
      title: 'Which topics interest you?',
      options: ['Web Development', 'Mobile', 'Cloud/DevOps', 'AI/ML', 'Security'],
      multiple: true,
    },
  ],

  integrations: [
    {
      type: 'sheets',
      spreadsheetName: 'Tech Meetup Registrations',
    },
    // Send to event management system
    {
      type: 'webhook',
      url: 'https://api.eventbrite.com/webhooks/gforms',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ${EVENTBRITE_API_KEY}',
        'Content-Type': 'application/json',
      },
      secret: '${WEBHOOK_SECRET}',
      retry: {
        maxAttempts: 3,
        backoffMs: 1000,
      },
    },
    // Confirmation email
    {
      type: 'email',
      to: ['${email}'], // Dynamic: send to respondent
      subject: 'Registration Confirmed: Tech Meetup',
    },
  ],

  settings: {
    collectEmail: true,
    limitOneResponse: true,
    confirmationMessage: 'You\'re registered! Check your email for confirmation.',
  },
});
```

---

## Quiz

A quiz with correct answers and scoring:

```typescript
// forms/product-quiz.ts
import { defineForm } from 'iac-google-forms';

export default defineForm({
  title: 'Product Knowledge Quiz',
  description: 'Test your knowledge of our product features.',

  questions: [
    {
      id: 'q1',
      type: 'choice',
      title: 'What is the maximum file size for uploads?',
      options: ['10 MB', '50 MB', '100 MB', '500 MB'],
      required: true,
      // Quiz-specific properties
      correctAnswer: '100 MB',
      points: 1,
      feedback: {
        correct: 'Correct! The limit is 100 MB.',
        incorrect: 'Not quite. The limit is 100 MB.',
      },
    },
    {
      id: 'q2',
      type: 'choice',
      title: 'Which integrations are supported?',
      options: ['Slack', 'Teams', 'Discord', 'All of the above'],
      required: true,
      correctAnswer: 'All of the above',
      points: 1,
    },
    {
      id: 'q3',
      type: 'choice',
      title: 'How many team members are included in the Pro plan?',
      options: ['5', '10', '25', 'Unlimited'],
      required: true,
      correctAnswer: '25',
      points: 2,
    },
  ],

  settings: {
    collectEmail: true,
    limitOneResponse: true,
    quiz: {
      isQuiz: true,
      showScore: true,
      showCorrectAnswers: true,
    },
  },
});
```

---

## Using Environment Variables

Form with environment-specific configuration:

```typescript
// forms/contact.ts
import { defineForm } from 'iac-google-forms';

const isProduction = process.env.NODE_ENV === 'production';

export default defineForm({
  title: isProduction ? 'Contact Us' : '[DEV] Contact Us',

  questions: [
    {
      id: 'name',
      type: 'text',
      title: 'Your Name',
      required: true,
    },
    {
      id: 'email',
      type: 'email',
      title: 'Email Address',
      required: true,
    },
    {
      id: 'message',
      type: 'text',
      title: 'Message',
      paragraph: true,
      required: true,
    },
  ],

  integrations: [
    {
      type: 'sheets',
      spreadsheetId: process.env.CONTACT_SHEET_ID,
    },
    {
      type: 'email',
      to: isProduction
        ? ['support@company.com']
        : ['dev-team@company.com'],
      subject: `New Contact Form Submission${isProduction ? '' : ' (DEV)'}`,
    },
    ...(process.env.SLACK_WEBHOOK_URL ? [{
      type: 'webhook' as const,
      url: process.env.SLACK_WEBHOOK_URL,
      method: 'POST' as const,
    }] : []),
  ],
});
```

---

## Type Reference

The `defineForm` function provides full TypeScript support:

```typescript
import { defineForm, FormDefinition } from 'iac-google-forms';

// Option 1: Use defineForm helper (recommended)
export default defineForm({
  title: 'My Form',
  questions: [...],
});

// Option 2: Type annotation
const form: FormDefinition = {
  title: 'My Form',
  questions: [...],
};
export default form;

// Option 3: Satisfies operator
export default {
  title: 'My Form',
  questions: [...],
} satisfies FormDefinition;
```
