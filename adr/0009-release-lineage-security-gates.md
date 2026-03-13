# ADR-0009: Release Lineage & Security Gates

## Status
Accepted

## Context

### Why frontend lineage requires its own security model

Meridian Studio is the frontend to a governed AI platform. While the backend ADR-0017 establishes a four-artifact release lineage model (code, prompts, index, config), the frontend has its own deployment pipeline with distinct security concerns. A code-identical frontend deployment can behave differently if auth configuration changes (MSAL client ID, tenant), API endpoints shift (pointing to a different backend), or the npm dependency tree introduces a supply-chain vulnerability. Each of these changes is invisible to backend-only lineage.

The frontend has four artifacts that change independently:

| Artifact | What it controls | Example change |
|----------|-----------------|----------------|
| **Code version** | UI behavior, routing, API integration | New page, bug fix, auth flow |
| **Auth config** | Who can access the application | MSAL client ID, tenant, redirect URI |
| **API endpoints** | Which backend the frontend talks to | VITE_API_BASE_URL, VITE_MCP_BASE_URL |
| **Bundle artifacts** | What JavaScript ships to the browser | Vite build output, chunk splitting |

A frontend security failure looks different from a backend one: XSS via unsanitized markdown rendering, leaked credentials in the JS bundle, dependency supply-chain attacks (npm ecosystem), or misconfigured auth that exposes the app without authentication.

**Current state:** Meridian Studio has CI (lint, test, build) and CD (Docker, ACR, Container Apps) pipelines, pre-commit hooks (lint/test/build), post-commit hooks (release tagging), and post-deploy verification (smoke tests). But there is no unified release record, no dependency vulnerability scanning, no container image scanning, and no secret detection in the pipeline.

**Problem:** Without security gates in the CI/CD pipeline and a release record that captures what was deployed, security validation is manual and incomplete. The frontend ships npm dependencies that may contain known vulnerabilities, and the Docker image is pushed without scanning.

## Decision

Introduce a release lineage model and security gates adapted for the frontend (React/TypeScript/Vite/npm) pipeline, aligned with the backend's ADR-0017 four-artifact model.

### Frontend Release Record

Every deployment produces an immutable release record:

```yaml
release_id:        "meridian-studio-v0.13.0"
timestamp:         "2026-03-13T02:21:00Z"
deployed_by:       "github-actions"

code:
  git_sha:         "6bbc633"
  image_digest:    "sha256:8f3a..."
  image_tag:       "meridian.azurecr.io/meridian-studio:6bbc633"
  eslint_passed:   true
  tests_passed:    true
  build_clean:     true

dependencies:
  npm_audit:       "0 critical, 0 high"
  lock_hash:       "sha256:a1b2..."
  msal_version:    "@azure/msal-browser@5.4.0"

auth_config:
  auth_enabled:    false
  client_id:       "(not set)"
  tenant_id:       "(not set)"
  redirect_uri:    "window.location.origin"

api_config:
  api_base_url:    "https://api.vplsolutions.com"
  mcp_base_url:    "https://mcp.vplsolutions.com"

bundle:
  total_size:      "921 KB (gzip: 253 KB)"
  chunk_count:     7
  source_maps:     false

security_gates:
  secret_scan:     "passed"
  npm_audit:       "passed"
  container_scan:  "passed"
  smoke_test:      "passed"
```

### Strategic Context

Security is part of the release lineage — not a separate compliance exercise. Every frontend deployment produces an immutable release record covering code, dependencies, auth configuration, and bundle artifacts, with all security gate results attached. The compliance evidence package is an aggregation of release records across both frontend and backend, not a documentation exercise assembled before a review.

This positions Meridian Studio for enterprise security assessments where the key question is: "Can you prove what is running in the browser, what dependencies it includes, and what you verified before deploying it?" The release record is the answer.

### Compliance Framework Alignment

The release record is designed to align with configuration management (CM) and audit/accountability (AU) control families common across enterprise security frameworks. Formal control mapping to a specific framework (e.g., NIST 800-53, FedRAMP, SOC 2) is deferred until a target compliance framework is selected for a specific deployment. The architecture supports this mapping without redesign — the release record fields map directly to control implementation statements. The frontend record complements the backend record (ADR-0017) to form a complete platform audit trail.

### Security Controls by Pipeline Stage

#### Pre-commit (existing + new)

| Control | Tool | Status |
|---------|------|--------|
| Lint | ESLint + React Compiler | **Existing** |
| Tests | Vitest + MSW | **Existing** |
| Build | TypeScript + Vite | **Existing** |
| Secret scanning | `git-secrets` or GitHub secret scanning | **New** |

**Secret scanning** catches leaked API keys, Azure credentials, or MSAL secrets committed to source. The `.env` file is already gitignored, but `.env.example` and build-time `VITE_` variables must be validated to not contain real credentials.

#### CI — Build Gate

| Control | Tool | Status |
|---------|------|--------|
| ESLint (0 errors) | `npm run lint` | **Existing** |
| Unit/contract tests | `npm test` (Vitest) | **Existing** |
| TypeScript + Vite build | `npm run build` | **Existing** |
| Dependency vulnerability scan | `npm audit --audit-level=high` | **New** |
| License compliance | `license-checker` or `npm-license-crawler` | **New** |
| Bundle size guard | Vite build output check | **New** |

**npm audit** is the frontend equivalent of `pip audit`. It catches known CVEs in the npm dependency tree before they ship in the production bundle. Gate on `high` and `critical` severity.

**Bundle size guard** prevents accidental inclusion of large dependencies or source maps in production builds. Alert if total gzip size exceeds 300 KB (current: ~253 KB).

#### CD — Deployment Gate

| Control | Tool | Status |
|---------|------|--------|
| Container image scan | Trivy or Azure Defender | **New** |
| Image digest pinning | ACR content trust | **New** |
| Environment variable validation | CI step to verify VITE_ vars | **New** |

**Container image scan** checks the Docker image for OS-level vulnerabilities (Alpine/nginx base image) and application-level issues before pushing to ACR.

**Environment variable validation** ensures `VITE_AUTH_ENABLED`, `VITE_API_BASE_URL`, and `VITE_MCP_BASE_URL` are set correctly for the target environment. Prevents deploying a dev-configured build to production.

#### Post-deployment (existing + new)

| Control | Tool | Status |
|---------|------|--------|
| CI pipeline monitoring | `gh run watch` | **Existing** |
| Studio smoke test | WebFetch title check | **Existing** |
| API health verification | WebFetch /health | **Existing** |
| MCP health verification | WebFetch /health | **Existing** |
| Version consistency check | package.json vs API /health | **Existing** |
| Auth configuration verification | Confirm auth state matches intent | **New** |

### Implementation

#### Phase 1 (v0.14.0) — Establish the model

1. **Add `npm audit` to CI pipeline**
   ```yaml
   - name: Dependency vulnerability scan
     run: npm audit --audit-level=high
   ```

2. **Add secret scanning**
   - Enable GitHub secret scanning on the repository
   - Add `.env` pattern validation to pre-commit hook

3. **Generate release record**
   - CI step after all gates pass
   - Output as YAML build artifact
   - Include git SHA, npm audit results, build output sizes, env var state

#### Phase 2 (v1.0) — Harden the pipeline

1. **Add Trivy container scan**
   ```yaml
   - name: Container image scan
     uses: aquasecurity/trivy-action@master
     with:
       image-ref: meridian.azurecr.io/meridian-studio:${{ github.sha }}
       severity: CRITICAL,HIGH
       exit-code: 1
   ```

2. **Bundle size guard**
   ```yaml
   - name: Bundle size check
     run: |
       TOTAL=$(du -sb dist/ | cut -f1)
       if [ "$TOTAL" -gt 2097152 ]; then
         echo "Bundle exceeds 2MB limit: $TOTAL bytes"
         exit 1
       fi
   ```

3. **Image digest pinning** — deploy by digest, not tag

#### Phase 3 (v1.1) — Full lineage

1. **Immutable release record** with all four artifacts
2. **Release record committed** to `releases/` directory
3. **Compliance evidence export** aligned with backend ADR-0017 format

### Phased Rollout

| Phase | Scope | Target |
|-------|-------|--------|
| **Phase 1** (v0.14.0) | `npm audit` in CI, secret scanning, release record generation | Establishes the lineage model |
| **Phase 2** (v1.0) | Trivy container scan, image digest pinning, bundle size guard | Hardens the deployment pipeline |
| **Phase 3** (v1.1) | Full immutable release record with all four artifacts, compliance evidence export | Complete security posture |

### Alignment with Backend ADR-0017

| Backend artifact | Frontend equivalent |
|-----------------|-------------------|
| Code version (git SHA, image digest) | Same — git SHA, Docker image digest |
| Prompt version (hash) | N/A — frontend has no prompts |
| Index snapshot | N/A — frontend has no index |
| Provider config (LLM, threshold) | Auth config (MSAL), API endpoints, feature flags |
| `pip audit` | `npm audit` |
| Bandit (Python SAST) | ESLint security rules |
| Eval harness gate | Vitest contract tests |
| Smoke eval | Post-deploy WebFetch verification |

The frontend release record and the backend release record together form a **complete system release record** for the Meridian platform.

## Alternatives Considered

### Rely on backend ADR-0017 only
- Backend gates don't cover frontend-specific risks (XSS, npm supply chain, bundle leaks)
- Rejected: frontend has its own attack surface and deployment pipeline

### Use a third-party CI security platform (Snyk, Socket)
- Comprehensive but adds external dependency and cost
- Partially adopted: may use for npm audit enrichment in Phase 2, but core gates are built-in

### Skip container scanning (frontend is "just static files")
- The Docker image includes nginx and Alpine — both have CVE surfaces
- Rejected: container scanning is standard practice regardless of application type

## Consequences

**Positive:**
- Every frontend deployment is fully auditable — code, dependencies, auth config, bundle artifacts, and security gate results in one record
- Compliance evidence is generated automatically by the pipeline, not assembled manually before a review
- npm supply-chain attacks caught before deployment (npm audit gate)
- Container vulnerabilities caught before push to ACR (Trivy gate)
- Secret leaks prevented at commit time (secret scanning)
- Bundle size regressions caught automatically
- Frontend and backend release records together provide complete platform audit trail
- The release record is structured to align with CM and AU control families; formal compliance mapping is a configuration exercise, not a redesign
- Post-deploy verification is already automated via Claude Code hooks

**Negative:**
- CI pipeline time increases with npm audit, container scanning, and bundle size checks
- Release record generation adds build complexity
- Image digest pinning requires changes to the deploy workflow
- Phase 1 alone does not provide full coverage; requires commitment to all three phases
- npm audit can produce false positives or flag dev dependencies that don't ship in production
