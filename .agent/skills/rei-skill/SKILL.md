---
name: rei-skill
description: Comprehensive development, testing, architectural, and security skill for the Rei personal evolution platform on Google Cloud Run and Firebase.
---

# Rei Engineering & Security Skill

This skill defines the operational, testing, and security directives when developing, extending, or maintaining the Rei platform within the Antigravity developer environment.

## 1. Product & Architecture Philosophy

Rei is a personal evolution system where journaling is the interface and the living personal model is the product.
- **Core loop**: Capture → Understand → Reflect → Practice → Evolve
- **Living Model columns**: Potential | Observed | Desired
- **Tone**: Calm, intelligent, warm, private, non-judgmental, modern.
- **Brand Guardrails**:
  - Never diagnose or prescribe (Rei is private reflection, not medical/mental-health advice).
  - Never introduce numerology, astrology, or fortunes.
  - Never display clinical scoring, streak pressure, or gamification.

## 2. Cloud Run & Infrastructure Directives

- **Runtime**: Unified Express + Vite single-container deployment on Google Cloud Run.
- **Port**: Must listen on `0.0.0.0:3000`.
- **Labels**: Must maintain `dev-tutorial=cloud-run-ai-challenge`.
- **Database**: Cloud Firestore with owner-only access rules:
  ```
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /users/{userId}/{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /{document=**} {
        allow read, write: if false;
      }
    }
  }
  ```

## 3. Server-Side AI & Prompt Security (@google/genai)

- **Server-Side Only**: All calls to the Gemini API occur exclusively on the Express backend (`server.ts`). Secret keys must **never** touch client code or browser storage.
- **Prompt Injection Defense**: User text must be placed inside delimited tags (e.g. `<user_journal_data>...</user_journal_data>`). System prompts explicitly treat user journal text as strict data, ignoring any embedded instructions or prompt manipulation attempts.
- **Multi-Model Fallback Cascade**: Never rely on a single model endpoint. All generation requests must cascade through:
  1. `gemini-3.6-flash`
  2. `gemini-3.1-flash-lite`
  3. `gemini-flash-latest`
  4. `gemini-3.7-flash`
  5. `gemini-3.8-flash`
  On HTTP 429, 503, 404, or 500, seamlessly advance to the next fallback candidate with intelligent in-memory backoff cooldowns.

## 4. OWASP & Data Privacy

- **SSRF Prevention**: All external outbound webhooks (Slack, Discord) must validate protocol (`https:` only), block private IP ranges (RFC 1918, link-local, loopback), and enforce authorized destination domains.
- **Zero Raw PII in Logs**: Never log entire journal reflections, photos, or authentication tokens to stdout or Cloud Logging.
- **EXIF Stripping**: Photos uploaded to Rei have metadata stripped client-side via HTML5 canvas prior to storage.
- **Defensive Storage**: All Firestore writes pass through `stripUndefined()` to prevent document serialization errors.

## 5. TDD & Automated Verification Workflow

Before pushing any commit or deploying to Cloud Run:
1. Run `npm run lint` (`tsc --noEmit`) to ensure type safety.
2. Run `npm run test:security` to scan for secret leakage and rule integrity.
3. Run `npm run test` (`tsx --test tests/**/*.test.ts`) to verify business logic and resilience.
4. Run `npm run build` to verify the production bundle.
