# E2E and Integration Test Gap Analysis - gforms Package

**Date**: 2026-01-27
**Package**: `packages/gforms`
**Analyzer**: Quality Engineer Agent
**Quality Score**: 4/10

---

## Executive Summary

The gforms package currently has **zero E2E tests and zero integration tests**, despite having a test infrastructure configured for them (`test:integration` script in package.json). All existing tests are **pure unit tests** with heavily mocked dependencies. This creates significant risk for production deployment as critical workflows have never been tested end-to-end.

**Critical Finding**: The `tests/integration` directory referenced in `package.json` does not exist.

---

## Test Plan Requirements vs. Actual Coverage

### Expected Test Structure (from test-plan.md)

| Test Type | Expected | Actual | Gap |
|-----------|----------|--------|-----|
| **Unit Tests** | Validation, diff logic, converters | ✅ Present | Low complexity coverage |
| **Integration Tests** | StateManager with real file I/O, FormsClient with mock HTTP server, CLI with real FS | ❌ None | 100% missing |
| **E2E Tests** | Full deploy flow, full destroy flow, multi-command workflows | ❌ None | 100% missing |

---

## Test File Classification

### 1. CLI Command Tests

#### `deploy.test.ts` - **PURE UNIT TEST**
**Classification**: Unit test with mocked dependencies
**Coverage**: Command structure, error messages, logic paths
**Missing Integration**:
- ❌ No real file system operations
- ❌ No actual state file writes
- ❌ No real API calls (even to mock server)
- ❌ No validation of actual JSON parsing from disk

**Evidence**:
```typescript
vi.mock('node:fs/promises');  // File system mocked
vi.mock('../../state/state-manager.js');  // State completely mocked
vi.mock('../../api/forms-client.js');  // API completely mocked
```

**Test Cases Present**:
- ✅ TC-CLI-006: dry-run mode
- ✅ TC-CLI-007: auto-approve flag
- ✅ File validation (TypeScript rejection, invalid JSON)
- ✅ Error handling for auth/API failures
- ⚠️ Diff display (mocked remote response)

**Critical Gaps**:
1. **Real file loading**: No test reads an actual JSON file from disk
2. **State persistence**: No test verifies state.json is actually written correctly
3. **End-to-end flow**: No test for: read file → validate → API call → save state
4. **Error recovery**: No test for partially failed deploy (API succeeded but state save failed)

---

#### `destroy.test.ts` - **PURE UNIT TEST**
**Classification**: Unit test with mocked dependencies
**Coverage**: Command options, confirmation logic, error paths

**Missing Integration**:
- ❌ No real state file deletion
- ❌ No validation of state.json structure after removal
- ❌ No test for concurrent destroy operations

**Critical Gaps**:
1. **State consistency**: No test that state file is actually updated after destroy
2. **Edge cases**: No test for destroy during ongoing deploy
3. **File system errors**: No test for permission denied on state file

---

#### `diff.test.ts` - **PURE UNIT TEST**
**Classification**: Unit test with mocked dependencies
**Coverage**: Output formats (markdown, JSON, text), CI mode exit codes

**Missing Integration**:
- ❌ No real file reading from disk
- ❌ No actual remote form fetching
- ❌ No validation of diff accuracy with real API responses

**Critical Gaps**:
1. **Real diff accuracy**: No verification that diff matches actual API response format
2. **Complex forms**: No test with deeply nested sections, 50+ questions
3. **Performance**: No test for diff of large forms (100+ questions)

---

### 2. State Management Tests

#### `state-manager.test.ts` - **INTEGRATION TEST (Good!)**
**Classification**: Integration test with real file I/O
**Coverage**: State file CRUD operations with real temp directory
**Quality**: ✅ **This is the only true integration test in the codebase**

**What's Good**:
- ✅ TC-STATE-001: Real file creation
- ✅ TC-STATE-002: Real state updates
- ✅ TC-STATE-003: Real file loading
- ✅ TC-STATE-004: Corrupted file handling
- ✅ TC-STATE-005: Real file deletion
- ✅ Uses real `fs.mkdtemp()` for isolated test environment
- ✅ Proper cleanup with `afterEach`

**Remaining Gaps**:
- ⚠️ **Concurrency**: Line 304-322 tests concurrent writes but doesn't assert both forms were saved
  ```typescript
  // Test expects >= 1 form, should expect exactly 2
  expect(Object.keys(state.forms).length).toBeGreaterThanOrEqual(1);
  ```
- ❌ **File locking**: No test for what happens if state file is locked by another process
- ❌ **Symlinks**: No test for state file as symlink
- ❌ **Large state files**: No test with 1000+ forms

---

### 3. API Client Tests

#### `forms-client.test.ts` - **PURE UNIT TEST**
**Classification**: Unit test with mocked fetch
**Coverage**: API call construction, error handling, pagination

**Missing Integration**:
- ❌ No mock HTTP server (e.g., MSW, nock)
- ❌ No validation of actual Google API request format
- ❌ No test with real OAuth tokens (even expired ones)

**Critical Gaps**:
1. **Request validation**: Tests don't validate the actual HTTP request body structure
   - Does the API actually accept the question format we send?
   - Are batch update requests correctly ordered?
2. **Retry logic**: `retry.test.ts` tests retry in isolation, but not integrated with FormsClient
3. **Network conditions**: No test for slow responses, timeouts, partial responses

---

#### `retry.test.ts` - **PURE UNIT TEST**
**Classification**: Unit test for retry logic
**Coverage**: Exponential backoff, retryable vs. non-retryable errors
**Quality**: ✅ Good coverage of retry mechanics

**Missing Integration**:
- ❌ No test of retry with FormsClient (is it actually applied to API calls?)
- ❌ No test for retry exhaustion in a real scenario (e.g., Google API rate limit)

---

### 4. Validation and Diff Tests

All validation tests (`form-definition.test.ts`, `diff-engine.test.ts`, `comparators.test.ts`) are **pure unit tests** with hardcoded objects. These are appropriate for their domains.

---

## Missing E2E Test Scenarios

### Critical User Journeys (Never Tested End-to-End)

#### 1. **New Form Deployment Flow**
**Scenario**: User creates a form definition, runs deploy, form appears in Google Forms

**Required E2E Test**:
```typescript
test('E2E: Deploy new form from JSON file', async () => {
  // 1. Create real temp JSON file with form definition
  const formPath = await createTempFormFile({
    title: 'E2E Test Form',
    questions: [...]
  });

  // 2. Run actual CLI command (spawn process)
  const result = await runCLI(['deploy', formPath, '--auto-approve']);

  // 3. Verify state file was created
  const state = await readStateFile();
  expect(state.forms[formPath]).toBeDefined();
  expect(state.forms[formPath].formId).toMatch(/^[a-zA-Z0-9_-]+$/);

  // 4. Verify form is accessible via API (or mock API server)
  const form = await formsClient.getForm(state.forms[formPath].formId);
  expect(form.info.title).toBe('E2E Test Form');

  // 5. Cleanup
  await runCLI(['destroy', formPath, '--auto-approve']);
});
```

**Why This Matters**: Current tests mock every step. We've never verified:
- CLI correctly spawns and exits
- File parsing works with real files
- State JSON is valid and parseable after write
- Error messages reach stdout/stderr correctly

---

#### 2. **Update Existing Form Flow**
**Never Tested**:
- Deploy form → Modify form definition → Deploy again → Verify changes applied
- Verify content hash correctly detects changes
- Verify content hash correctly skips no-change deploys

---

#### 3. **Diff Accuracy Validation**
**Never Tested**:
- Deploy form → Modify remotely in Google Forms UI → Run diff → Verify detected changes match reality

---

#### 4. **Destroy Flow with Remote Already Deleted**
**Scenario**: User deletes form in Google Forms UI, then runs `gforms destroy`

**Test Plan Coverage**: TC-ERR-003 mentions this, but it's never tested end-to-end.

**Required E2E Test**:
```typescript
test('E2E: Destroy handles remote form already deleted', async () => {
  // 1. Deploy form
  const formPath = await deployTestForm();

  // 2. Manually delete remote form (mock API returns 404)
  // or simulate by modifying state to invalid formId

  // 3. Run destroy
  const result = await runCLI(['destroy', formPath, '--auto-approve']);

  // 4. Verify warning shown but state cleared
  expect(result.stderr).toContain('may have been deleted already');
  expect(result.exitCode).toBe(0);

  const state = await readStateFile();
  expect(state.forms[formPath]).toBeUndefined();
});
```

---

#### 5. **Multi-Form Project**
**Never Tested**:
- Deploy 3 forms
- Destroy 1 form
- Verify other 2 forms still in state and functional
- Run `gforms list` and verify output

---

#### 6. **Authentication Flows**
**Test Plan Coverage**: TC-AUTH-001 through TC-AUTH-006, but **NONE implemented**

**Missing E2E Tests**:
- OAuth login flow (can use mock OAuth server)
- Token refresh on expired access token
- Service account authentication with real key file
- Error message when no credentials available
- Logout clears credentials file

---

#### 7. **Error Handling Edge Cases**

**From Test Plan but Never Tested**:
- **TC-ERR-001**: Network failure during deploy (disconnect mid-request)
- **TC-ERR-002**: API rate limit with retry → verify exponential backoff actually works
- **TC-ERR-004**: Permission denied error → verify helpful message shown

---

## Integration Test Gaps

### 1. StateManager + CLI Integration
**Gap**: CLI tests mock StateManager completely. No test verifies:
- CLI correctly initializes StateManager with right directory
- CLI correctly handles StateManager errors (permission denied, disk full)
- State file format written by CLI is readable by StateManager.load()

**Required Integration Test**:
```typescript
test('Integration: CLI deploy writes valid state file', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gforms-int-'));
  const formPath = path.join(tempDir, 'form.json');

  // Write real form file
  await fs.writeFile(formPath, JSON.stringify({ title: 'Test', questions: [...] }));

  // Mock only the API client (allow real StateManager)
  const mockFormsClient = createMockFormsClient();

  // Run deploy with real file system
  await runDeployCommand(formPath, { autoApprove: true }, mockFormsClient);

  // Verify state file is valid
  const stateManager = new StateManager(path.join(tempDir, '.gforms'));
  const state = await stateManager.load();
  expect(state.forms[formPath]).toBeDefined();

  // Verify state is parseable JSON
  const rawState = await fs.readFile(path.join(tempDir, '.gforms', 'state.json'), 'utf-8');
  const parsed = JSON.parse(rawState);
  expect(parsed.version).toBe('1.0.0');
});
```

---

### 2. FormsClient + Retry Integration
**Gap**: Retry logic is tested in isolation. No test verifies FormsClient actually retries failed requests.

**Required Integration Test**:
```typescript
test('Integration: FormsClient retries on 429 rate limit', async () => {
  let callCount = 0;
  const mockServer = createMockHttpServer((req, res) => {
    callCount++;
    if (callCount <= 2) {
      res.statusCode = 429;
      res.end(JSON.stringify({ error: { message: 'Rate limit' } }));
    } else {
      res.statusCode = 200;
      res.end(JSON.stringify({ formId: 'test-id' }));
    }
  });

  const client = new FormsClient(() => 'token', { baseUrl: mockServer.url });
  const result = await client.getForm('test-id');

  expect(callCount).toBe(3); // Failed twice, succeeded third time
  expect(result.formId).toBe('test-id');
});
```

---

### 3. Diff Engine + API Response Converter Integration
**Gap**: Diff engine tests use hardcoded FormDefinition objects. No test verifies:
- Real API response → convertResponseToFormDefinition → DiffEngine produces accurate diff
- Diff accurately handles Google Forms API quirks (e.g., missing fields, default values)

**Required Integration Test**:
```typescript
test('Integration: Diff engine handles real Google API response format', async () => {
  const realApiResponse = {
    formId: 'test',
    info: { title: 'Real Form' },
    items: [
      {
        itemId: 'item1',
        title: 'Question 1',
        questionItem: {
          question: {
            questionId: 'q1',
            required: true,
            textQuestion: { paragraph: false }
          }
        }
      }
    ],
    revisionId: 'rev-1'
  };

  const localDef = { title: 'Real Form', questions: [/* modified */] };

  // Convert real API response
  const remoteDef = convertResponseToFormDefinition(realApiResponse);

  // Run diff
  const diff = computeDiff(localDef, remoteDef);

  // Verify diff accuracy
  expect(diff.questions).toBeDefined();
  // Validate specific changes detected
});
```

---

## Risk Assessment

### High Risk (Production-Blocking)

1. **State File Corruption** (Probability: High, Impact: Critical)
   - **Risk**: State file write failure during deploy leaves state inconsistent
   - **Never Tested**: Partial write scenarios, disk full, permission denied
   - **Mitigation Gap**: No atomic write validation, no backup/rollback

2. **API Request Format Mismatch** (Probability: Medium, Impact: Critical)
   - **Risk**: Our generated API requests don't match Google Forms API expectations
   - **Never Tested**: Real API request structure validation
   - **Evidence**: All API tests mock fetch, never validate actual HTTP body

3. **CLI Exit Code Handling** (Probability: High, Impact: High)
   - **Risk**: CI/CD pipelines rely on exit codes, but exit code correctness never tested
   - **Never Tested**: CLI process exit codes in error scenarios
   - **Example**: `diff --ci` supposed to exit 1 on changes, but test mocks `process.exit()`

4. **Concurrent Operations** (Probability: Medium, Impact: High)
   - **Risk**: Two `gforms deploy` commands run simultaneously → state corruption
   - **Never Tested**: Concurrent state file access, file locking
   - **Evidence**: state-manager.test.ts line 304 tests concurrent writes but doesn't assert both succeeded

---

### Medium Risk

5. **Authentication Token Refresh** (Probability: High, Impact: Medium)
   - **Risk**: Expired access token not refreshed → deploy fails
   - **Never Tested**: Token refresh flow (TC-AUTH-002 not implemented)
   - **Mitigation Gap**: No test verifies AuthManager.getAccessToken() actually refreshes

6. **Large Form Handling** (Probability: Low, Impact: Medium)
   - **Risk**: Form with 100+ questions causes performance issues or API timeouts
   - **Never Tested**: Large form deployment, pagination, batch API limits

7. **File Path Edge Cases** (Probability: Medium, Impact: Medium)
   - **Risk**: Paths with spaces, special characters, symlinks cause failures
   - **Never Tested**: File path normalization, cross-platform compatibility

---

### Low Risk

8. **Diff Output Formatting** (Probability: Low, Impact: Low)
   - **Risk**: Markdown/JSON output malformed but doesn't break functionality
   - **Tested**: Output contains expected strings, but not validated as parseable

---

## Recommendations

### Immediate Actions (Before Production Release)

1. **Create `tests/integration` directory structure**:
   ```
   tests/
   ├── integration/
   │   ├── cli-deploy.integration.test.ts
   │   ├── cli-destroy.integration.test.ts
   │   ├── state-persistence.integration.test.ts
   │   └── api-client-retry.integration.test.ts
   └── e2e/
       ├── new-form-deployment.e2e.test.ts
       ├── form-update.e2e.test.ts
       ├── destroy-flow.e2e.test.ts
       └── multi-form-project.e2e.test.ts
   ```

2. **Integration Test Priority Queue**:
   - **P0** (Critical): CLI + StateManager integration (verify state file written correctly)
   - **P0** (Critical): FormsClient + Retry integration (verify retry actually happens)
   - **P1** (High): CLI exit codes with real process spawn
   - **P1** (High): Concurrent state access safety
   - **P2** (Medium): Large form performance testing

3. **E2E Test Priority Queue**:
   - **P0** (Critical): Full deploy flow (file → validate → API → state)
   - **P0** (Critical): Full destroy flow
   - **P1** (High): Update existing form flow
   - **P1** (High): Authentication error handling (no credentials, expired token)
   - **P2** (Medium): Multi-form project workflows
   - **P2** (Medium): Diff accuracy validation

4. **Test Infrastructure Setup**:
   - Install MSW (Mock Service Worker) or nock for HTTP mocking
   - Create test fixtures: valid/invalid form definitions, mock API responses
   - Create CLI test harness: spawn actual CLI process, capture stdout/stderr/exitCode
   - Create mock OAuth server for authentication tests (or use recorded responses)

---

### Test Patterns to Adopt

#### For Integration Tests
```typescript
describe('Integration: StateManager + CLI', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gforms-int-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should persist state correctly after deploy', async () => {
    // Use real file system, mock only network
    const formPath = path.join(tempDir, 'form.json');
    await fs.writeFile(formPath, JSON.stringify(validFormDef));

    // Mock API calls only
    const mockApi = createMockFormsApi();

    // Run actual CLI logic (not spawn)
    await deployCommand.parseAsync(['deploy', formPath, '--auto-approve']);

    // Verify real state file
    const state = JSON.parse(
      await fs.readFile(path.join(tempDir, '.gforms', 'state.json'), 'utf-8')
    );
    expect(state.forms[formPath]).toBeDefined();
  });
});
```

#### For E2E Tests
```typescript
describe('E2E: Deploy Flow', () => {
  it('should deploy form end-to-end', async () => {
    // Spawn actual CLI process
    const result = await spawnCLI(['deploy', 'test-form.json', '--auto-approve'], {
      cwd: testProjectDir,
      env: { GOOGLE_APPLICATION_CREDENTIALS: mockCredPath }
    });

    // Verify exit code
    expect(result.exitCode).toBe(0);

    // Verify stdout contains success message
    expect(result.stdout).toContain('Form created');

    // Verify state file exists and is valid
    const state = await readStateFile(testProjectDir);
    expect(state.forms['test-form.json']).toBeDefined();
  });
});
```

---

## Test Coverage Goals

| Test Level | Current | Target | Priority |
|------------|---------|--------|----------|
| Unit Tests | ~18 files | Maintain | Low (sufficient) |
| Integration Tests | 1 file (StateManager only) | 8+ files | **Critical** |
| E2E Tests | 0 files | 6+ files | **Critical** |

**Integration Test Target**: 80% coverage of cross-module interactions
**E2E Test Target**: 100% coverage of critical user journeys (deploy, destroy, diff, list)

---

## Quality Score Breakdown

| Dimension | Score | Justification |
|-----------|-------|---------------|
| Unit Test Coverage | 8/10 | Good coverage of isolated logic |
| Unit Test Quality | 7/10 | Meaningful assertions, but some weak (e.g., "hasSuccess") |
| Integration Test Coverage | 1/10 | Only StateManager tested, all CLI/API mocked |
| Integration Test Quality | 8/10 | StateManager tests are well-written |
| E2E Test Coverage | 0/10 | **Zero E2E tests** |
| E2E Test Quality | N/A | No E2E tests exist |
| Test Organization | 6/10 | Clear structure, but missing integration/e2e dirs |
| **Overall Score** | **4/10** | Heavy mocking masks integration risks |

---

## Test Plan Compliance

### Test Cases from test-plan.md - Implementation Status

#### CLI Commands (TC-CLI-001 to TC-CLI-010)
- ✅ TC-CLI-002: validate valid file (mocked)
- ✅ TC-CLI-003: validate invalid file (mocked)
- ✅ TC-CLI-004: diff new form (mocked)
- ✅ TC-CLI-005: diff markdown output (mocked)
- ✅ TC-CLI-006: deploy dry-run (mocked)
- ✅ TC-CLI-007: deploy auto-approve (mocked)
- ❌ TC-CLI-001: init command (test missing)
- ❌ TC-CLI-008: list command (test exists but minimal)
- ❌ TC-CLI-009: help text (not tested)
- ❌ TC-CLI-010: version flag (not tested)

**All CLI tests use mocks. None test real CLI execution.**

#### State Management (TC-STATE-001 to TC-STATE-005)
- ✅ TC-STATE-001: Create state file (REAL)
- ✅ TC-STATE-002: Update existing state (REAL)
- ✅ TC-STATE-003: Load state file (REAL)
- ✅ TC-STATE-004: Handle corrupted state (REAL)
- ✅ TC-STATE-005: Remove form from state (REAL)

**These are the only true integration tests in the codebase.**

#### Authentication (TC-AUTH-001 to TC-AUTH-006)
- ❌ TC-AUTH-001: OAuth login success (NOT IMPLEMENTED)
- ❌ TC-AUTH-002: OAuth token refresh (NOT IMPLEMENTED)
- ❌ TC-AUTH-003: Service account auth (NOT IMPLEMENTED)
- ❌ TC-AUTH-004: No credentials available (NOT IMPLEMENTED)
- ❌ TC-AUTH-005: Invalid service account key (NOT IMPLEMENTED)
- ❌ TC-AUTH-006: Logout clears credentials (NOT IMPLEMENTED)

**Authentication flow is completely untested.**

#### Error Handling (TC-ERR-001 to TC-ERR-004)
- ⚠️ TC-ERR-001: Network failure (mocked, not real)
- ⚠️ TC-ERR-002: API rate limit (mocked, not real)
- ❌ TC-ERR-003: Form not found (partially mocked)
- ❌ TC-ERR-004: Permission denied (NOT TESTED)

**Error handling logic tested, but not with real errors.**

#### Diff Engine (TC-DIFF-001 to TC-DIFF-008)
- ✅ TC-DIFF-001 to TC-DIFF-008: All implemented **but with mocked data**

#### Validation (TC-VAL-001 to TC-VAL-008)
- ✅ All validation test cases implemented with good coverage

---

## Conclusion

The gforms package has **strong unit test coverage but critical gaps in integration and E2E testing**. All CLI tests mock dependencies completely, meaning we've never verified that:

1. The CLI actually works when spawned as a process
2. State files are written correctly and are parseable
3. API requests match Google Forms API expectations
4. Authentication flows work end-to-end
5. Error messages reach users correctly

**Before production release**, the following must be implemented:

- **8+ integration tests** covering CLI+StateManager, CLI+API, FormsClient+Retry
- **6+ E2E tests** covering deploy, destroy, diff, update, auth error, multi-form workflows
- **Authentication flow tests** (TC-AUTH-001 to TC-AUTH-006 from test plan)

**Current state**: Code is well-written, but **production-readiness is unverified** due to lack of integration testing.

**Recommendation**: Do not deploy to production until integration and E2E test suites are implemented and passing.
