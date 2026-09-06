# Rei — See yourself. Shape yourself.

> **Category**: Personal evolution and reflection. The journal is the interface. The product is a living personal model.  
> **One-line**: A personal growth journal that learns from your experiences and helps you evolve with intention.  
> **Challenge**: Built for the Google Cloud Run AI Challenge (`dev-tutorial=cloud-run-ai-challenge`).  
> **Target Region**: `asia-south1` (Mumbai)  
> **Google Cloud Project ID**: `reij-507805`  
> **Service Name**: `rei-app`

---

## 1. Product Philosophy & Architecture

Rei is not an advice-dumping chatbot, not therapy, and not a gamified streak tracker. Instead, Rei operates on a continuous personal evolution loop:

$$\text{Capture} \longrightarrow \text{Understand} \longrightarrow \text{Reflect} \longrightarrow \text{Practice} \longrightarrow \text{Evolve}$$

### The Living Personal Model
On the **Your Model** screen, personal growth is structured into three continuous columns:
- **Potential**: Working hypotheses of innate capacities.
- **Observed**: Concrete evidence extracted from your own journal entries and experiences, substantiated in your own words.
- **Desired**: The mature, intentional embodiment of who you are becoming.

### Voice & Principles
- **Reflection before advice**: Rei formulates the next best question rather than prescriptive lists of tips.
- **Invisible AI**: The model acts behind the scenes; the user simply experiences that "Rei gets to know me."
- **Non-punitive**: When returning after days away, Rei greets you warmly: *"Welcome back. What's been happening?"*
- **Measured in your own words**: Growth is evidenced by actual behavioral quotes from your reflections, not arbitrary score counters.

---

## 2. Full V1 & V2 Capabilities

1. **Authentication**: Firebase Google Sign-In only (isolated per-user tenant state, no email/password forms).
2. **Onboarding**: Name, optional birth date (used strictly as seed hypotheses for Potential, never astrology or fortune-telling), life context, core focus areas (3–5), three desired traits to cultivate, and a single anchor statement: *"The person you're becoming"*.
3. **Today**: State/mood check-in, daily intention, one personalized reflection question, candid free write journal, optional evening close, and seamless save with offline error recovery.
4. **Journal**: Full chronological history isolated strictly to the authenticated user, searchable by text, theme, and trait tags, with full detail inspection and evening close editing.
5. **Journey (V2)**: Complete evolutionary timeline organized across time horizons (This Week, Last Week, Earlier This Month, Previous Milestones) and filterable by recurring themes and traits.
6. **Reflect**: The single next question, recurring themes identified across entries, observable behavior patterns, and an on-demand Weekly Synthesis note.
7. **Patterns (V2)**: Connects similar past entries for this user only, quoting the user's actual words and dates (never inventing history), and provides one deep follow-up question with saveable reflection.
8. **Grow Practice Loop (V2)**: Converts the 3 chosen traits into observable behaviors and micro-practices to test. Next visit asks *"What happened when you tried [practice]?"* and saves user evidence directly to the trait and living model.
9. **Your Model (V2)**: Potential / Observed / Desired columns updated from stored signals, displaying *"Why Rei observed this in your own words"*.
10. **Profile & Evolution Edit (V2)**: Allows updating life context, focus areas, 3 traits, and *"the person you're becoming"* directly at any time without going through full initial onboarding.
11. **Optional Email Check-in (V2)**: Safe opt-in toggle with exact gentle reminder *"Take a moment to check in with yourself."*. Zero journal content in emails; secrets managed exclusively via Secret Manager / environment; safely disabled if mailer secrets are absent.

---

## 3. Threat Summary & Security Review

| Threat / Risk Vector | Severity | Mitigation in Rei |
| :--- | :--- | :--- |
| **Client-Side Key Leakage** | Critical | `GEMINI_API_KEY` is loaded exclusively server-side via Google Cloud Secret Manager / runtime environment. Never exposed to browser or bundled in Vite. |
| **Cross-User Tenant Isolation** | Critical | Cloud Firestore security rules strictly require `request.auth.uid == userId` for all document paths (`/users/{userId}/{document=**}`). Default-deny on all other paths. |
| **Prompt Injection via Journal Text** | High | User journal text is treated strictly as untrusted DATA enclosed in `<user_journal_data>` delimiters. Server prompts command the model to disregard instructions embedded within user input. |
| **Model Availability / Outages** | High | Multi-model fallback cascade using `@google/genai`: rotates through `gemini-3.6-flash` $\to$ `gemini-3.1-flash-lite` $\to$ `gemini-flash-latest` $\to$ `gemini-3.7-flash` on 429/500/503 errors. |
| **Unauthorized / Spam Outbound Email** | Medium | Email check-in is strictly opt-in; body is hardcoded to *"Take a moment to check in with yourself."*; no journal text included; safely disabled if keys are absent. |
| **Denial of Service / Abuse** | Medium | Server-side per-user rate limiting (e.g., 30 reflection requests/minute max per UID/IP). Payload size caps enforced. |
| **Data Loss on Network Disruption** | Medium | The client retains drafts in local storage and displays an inline **Retry Save** action if an API write encounters latency or interruption. |

---

## 4. Google Cloud & Firebase Setup

### Prerequisites
- Google Cloud Project: `reij-507805`
- Cloud Run Region: `asia-south1`
- Google Cloud SDK (`gcloud`) installed and authenticated

### Step 1: Enable Google Cloud APIs
```bash
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  identitytoolkit.googleapis.com \
  --project=reij-507805
```

### Step 2: Configure Firebase Authentication & Authorized Domains
1. In the [Firebase Console](https://console.firebase.google.com/project/reij-507805/authentication), enable the **Google** Sign-In provider under *Sign-in method*.
2. Add your Cloud Run domain and custom domain to the **Authorized Domains** list in the Firebase Authentication settings.

### Step 3: Deploy Cloud Firestore Security Rules
Deploy the following rules to enforce strict single-tenant user isolation:

```text
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

Deploy via Firebase CLI:
```bash
firebase deploy --only firestore:rules --project=reij-507805
```

### Step 4: Configure Secret Manager for Gemini API Key
Store your Gemini API key securely in Google Cloud Secret Manager and grant access to the Cloud Run runtime service account:

```bash
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

gcloud secrets add-iam-policy-binding GEMINI_API_KEY --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" --role="roles/secretmanager.secretAccessor"
```

---

## 5. Deployment to Cloud Run (asia-south1)

### Deploy from Source
Deploy the unified container directly to Cloud Run in `asia-south1` with Secret Manager binding:

```bash
gcloud run deploy rei-app \
  --source=. \
  --region=asia-south1 \
  --project=reij-507805 \
  --platform=managed \
  --allow-unauthenticated \
  --set-secrets=GEMINI_API_KEY=GEMINI_API_KEY:latest
```

### Attach Required Challenge Label
Execute the exact command to tag the deployment for the Google Cloud Run AI Challenge:

```bash
gcloud run services update rei-app --update-labels=dev-tutorial=cloud-run-ai-challenge --region=asia-south1
```

---

## 6. How Gemini is Proxied Server-Side

All interactions with the Gemini API run inside `server.ts` through `@google/genai`:
- The client frontend sends requests to `/api/reflect`, `/api/daily-prompt`, `/api/weekly-note`, `/api/model-update`, `/api/patterns`, and `/api/email-checkin`.
- The Express server extracts the user's verified identity token and validates rate limits.
- The server constructs structured prompts enclosing user journal entries in `<user_journal_data>` data blocks to prevent prompt injection.
- The `generateContentWithFallback` helper safely rotates through the designated fallback models (`gemini-3.6-flash` $\to$ `gemini-3.1-flash-lite` $\to$ `gemini-flash-latest` $\to$ `gemini-3.7-flash`) if rate limits or transient errors arise.
- Raw outputs are sanitized and type-checked before returning to the client.

---

## 7. Verification & Walkthrough Test Cases

| # | Test Scenario | Expected Outcome |
| :--- | :--- | :--- |
| **1** | **Google Sign-In** | User clicks "Begin with Google". Firebase pop-up authenticates user, loads user session. |
| **2** | **First-Time Onboarding** | Guided 5-step modal collects name, optional DOB, context, 3–5 focus areas, 3 traits, and person becoming anchor. Data saved to user profile. |
| **3** | **Today Check-In** | User selects mood ("Grounded"), inputs daily intention, reads personalized prompt question, and enters free write text. |
| **4** | **Save & Reflection** | Clicking "Save & Reflect" calls server-side Gemini, extracts internal signals (emotion, theme, behavior, related trait), and displays Rei's single reflection question. |
| **5** | **Retry on Failure** | If offline or network times out, draft text remains intact and a "Retry Save" button appears. |
| **6** | **Journal History** | Journal tab lists entries in reverse chronological order. Searching by keyword or filtering by trait narrows down the list. |
| **7** | **Journey Timeline (V2)** | Journey tab maps entries across time horizons and filters by theme with direct quotes. |
| **8** | **Patterns (V2)** | Patterns tab groups past entries by recurring themes, quotes real text without inventing history, and provides one follow-up question with saveable user reflection. |
| **9** | **Grow Practice Loop (V2)** | Grow view presents the 3 traits with micro-practices. Next visit asks "What happened when you tried?", saves user evidence, and persists to Your Model. |
| **10** | **Your Model Evolution (V2)** | Your Model displays Potential \| Observed \| Desired columns with "Why Rei observed this in your own words" and update from stored signals. |
| **11** | **Profile Edit & Email Check-in (V2)** | Profile modal allows updating context, traits, person becoming, and optional email check-in toggle ("Take a moment to check in with yourself.") without full onboarding reset. |
| **12** | **Sign Out & Session Isolation** | Signing out clears session; signing back in restores all history, traits, practices, and living model without data loss. |

---

## 8. Compliance & Disclaimer

*Rei is a private reflection tool, not medical, mental-health, or financial advice.*
