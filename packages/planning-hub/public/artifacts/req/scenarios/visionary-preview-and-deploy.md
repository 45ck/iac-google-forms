# Scenario: Preview and Deploy Changes (Visionary)

**Type:** Visionary (Future State with Tool)
**Persona:** Alex Chen (Platform Engineer)
**Goal:** Modify an existing form, preview changes, and deploy safely

## Preconditions

- Customer feedback form exists (deployed previously via `gforms deploy`)
- Form ID is tracked in local state file (`.gforms/state.json`)
- Product team requests adding "How did you hear about us?" question

## Steps

| Step | Actor  | Action                                          | System Response                                |
| ---- | ------ | ----------------------------------------------- | ---------------------------------------------- |
| 1    | Alex   | Opens `forms/customer-feedback.ts` in IDE       | Existing form definition loads                 |
| 2    | Alex   | Adds new dropdown question after `company_size` | IDE validates types                            |
| 3    | Alex   | Runs `gforms diff forms/customer-feedback.ts`   | CLI fetches current form from Google, compares |
| 4    | System | Shows detailed diff of changes                  | Clear before/after comparison                  |
| 5    | Alex   | Reviews diff, confirms changes are correct      | -                                              |
| 6    | Alex   | Runs `gforms deploy forms/customer-feedback.ts` | CLI applies changes                            |
| 7    | System | Updates form via Google Forms API               | Only changed parts updated                     |
| 8    | Alex   | Commits TypeScript file to git                  | Change recorded in history                     |

## Code Change

```typescript
// Add this question after company_size:
dropdown('referral_source', {
  title: 'How did you hear about us?',
  options: [
    'Search engine',
    'Social media',
    'Friend/colleague',
    'Blog/article',
    'Conference/event',
    'Other'
  ],
}),
```

## CLI Output

```
$ gforms diff forms/customer-feedback.ts

📋 Form: Customer Feedback
   Status: MODIFIED
   Form ID: 1ABC123...

   Questions:
   ~ [email]    email - Your email address (no changes)
   ~ [text]     name - Your name (no changes)
   ~ [dropdown] company_size - Company size (no changes)
   + [dropdown] referral_source - How did you hear about us? (NEW)
   ~ [choice]   satisfaction - Overall satisfaction (no changes)
   ~ [section]  detailed_feedback - Detailed Feedback (no changes)

   Summary:
   - 1 question added
   - 0 questions modified
   - 0 questions removed
   - Integrations unchanged

$ gforms deploy forms/customer-feedback.ts

⠋ Fetching current form state...
⠋ Calculating changes...
⠋ Applying changes...

Changes applied:
✓ Added question "How did you hear about us?" at position 4

Form URL: https://docs.google.com/forms/d/e/1FAIp.../viewform

Done in 1.8s
```

## Postconditions

- Form updated with new question
- Existing responses preserved
- **Change is visible in git diff**
- **Can rollback** by reverting commit and redeploying

## Git Workflow

```bash
$ git diff forms/customer-feedback.ts
+    dropdown('referral_source', {
+      title: 'How did you hear about us?',
+      options: [
+        'Search engine',
+        'Social media',
+        'Friend/colleague',
+        'Blog/article',
+        'Conference/event',
+        'Other'
+      ],
+    }),

$ git add forms/customer-feedback.ts
$ git commit -m "Add referral source question to feedback form"
```

## Rollback Scenario

If the change causes issues:

```bash
$ git revert HEAD
$ gforms deploy forms/customer-feedback.ts

📋 Form: Customer Feedback
   Status: MODIFIED

   Questions:
   - [dropdown] referral_source - How did you hear about us? (REMOVE)

$ gforms deploy forms/customer-feedback.ts --yes

✓ Removed question "How did you hear about us?"

Done in 1.2s
```

## Benefits

| Aspect          | Description                                      |
| --------------- | ------------------------------------------------ |
| **Preview**     | See exactly what will change before applying     |
| **Incremental** | Only modified parts are updated                  |
| **Reversible**  | Git revert + redeploy to rollback                |
| **Auditable**   | Git history shows who changed what when          |
| **Safe**        | No accidental changes - explicit deploy required |
