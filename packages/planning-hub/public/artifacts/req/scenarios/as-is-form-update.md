# Scenario: Updating an Existing Form (As-Is)

**Type:** As-Is (Current Reality)
**Persona:** Alex Chen (Platform Engineer)
**Goal:** Add a new required question to an existing form and update it across dev/staging/prod

## Preconditions

- Customer feedback form exists in 3 environments (dev, staging, prod)
- Product team requests adding "Company Size" dropdown question
- All three forms were created manually and may have drifted

## Steps

| Step | Actor | Action | System Response | Pain Point |
|------|-------|--------|-----------------|------------|
| 1 | Alex | Opens Google Forms, finds production form | Form editor loads | Must find correct form |
| 2 | Alex | Scrolls to find correct position for new question | - | No search/jump |
| 3 | Alex | Adds dropdown question "Company Size" | Question added | - |
| 4 | Alex | Adds options: "1-10", "11-50", "51-200", "201+" | Options configured | Manual typing |
| 5 | Alex | Marks question as required | Requirement set | - |
| 6 | Alex | Clicks somewhere else to "save" | Auto-saved | **No explicit save/deploy** |
| 7 | Alex | Opens staging form in new tab | Different form loads | **Must track 3 URLs** |
| 8 | Alex | Repeats steps 2-6 for staging | Question added | **Duplicate work** |
| 9 | Alex | Opens dev form in another tab | Another form loads | - |
| 10 | Alex | Repeats steps 2-6 for dev | Question added | **Triple duplicate work** |
| 11 | Alex | Compares all three forms visually | - | **No diff tool** |
| 12 | Alex | Notices staging has different option order | Drift detected | **Manual verification** |
| 13 | Alex | Fixes staging to match production | Manually corrected | - |

## Postconditions

- All three forms now have the new question
- Alex spent time fixing drift discovered during update
- **No record** of what changed or when
- **No guarantee** all three are actually identical

## Time Spent

- Total: **20-30 minutes** for a single question
- Multiply by 3 environments
- Additional time fixing discovered drift

## Exceptions

| Exception | What Happens |
|-----------|--------------|
| Forgot to update one environment | Drift continues, discovered later |
| Made typo in one environment | Inconsistent data collected |
| Stakeholder asks "what changed?" | Cannot produce change log |

## Pain Points Summary

1. **Triple work** - Same change in 3 places
2. **No change tracking** - Can't see what was modified
3. **Drift accumulation** - Environments slowly diverge
4. **No diff tool** - Must compare forms visually
5. **No atomicity** - Changes go live immediately with no review
