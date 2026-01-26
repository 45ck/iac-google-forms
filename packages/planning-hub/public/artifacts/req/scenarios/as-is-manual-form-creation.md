# Scenario: Manual Form Creation (As-Is)

**Type:** As-Is (Current Reality)
**Persona:** Alex Chen (Platform Engineer)
**Goal:** Create a new customer feedback form with 10 questions

## Preconditions

- Alex has access to Google Forms via browser
- Product team has provided requirements for the feedback form
- Alex has the Google account credentials

## Steps

| Step | Actor | Action | System Response | Pain Point |
|------|-------|--------|-----------------|------------|
| 1 | Alex | Opens browser, navigates to forms.google.com | Google Forms dashboard loads | Context switch from IDE |
| 2 | Alex | Clicks "Blank" to create new form | Empty form editor appears | - |
| 3 | Alex | Types form title and description | Form updates | - |
| 4 | Alex | Adds first question (short answer for email) | Question added | - |
| 5 | Alex | Configures validation (email format) | Validation set | Buried in menu |
| 6 | Alex | Repeats steps 4-5 for remaining 9 questions | Questions added one by one | **Repetitive clicking** |
| 7 | Alex | Adds conditional section (show questions 7-10 only if answer to Q6 is "Yes") | Logic configured | **Complex UI navigation** |
| 8 | Alex | Opens Settings → Responses → Link to Sheets | Prompted to create spreadsheet | Separate step |
| 9 | Alex | Creates new spreadsheet, names columns | Sheet created and linked | Manual column setup |
| 10 | Alex | Opens Settings → Email notifications | Notification configured | Yet another settings page |
| 11 | Alex | Copies form URL, shares with product team | Form is "live" | No review process |

## Postconditions

- Form exists in Google Forms
- Responses will go to a Google Sheet
- Email notification enabled
- **No record of what was configured** - no version control
- **No way to recreate** exactly in staging/prod

## Time Spent

- Total: **35-45 minutes**
- Could not be reviewed by teammates before going live
- No audit trail of configuration choices

## Exceptions

| Exception | What Happens |
|-----------|--------------|
| Accidental deletion of question | Must manually recreate, no undo history |
| Wrong validation rule | May not notice until user complaints |
| Need same form in staging | Must recreate manually from scratch |

## Pain Points Summary

1. **No version control** - Can't see history of changes
2. **No code review** - Goes live without peer review
3. **No reproducibility** - Can't recreate exactly
4. **Context switching** - Must leave development environment
5. **Manual repetition** - Each question requires multiple clicks
