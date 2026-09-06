# Rei — See yourself. Shape yourself.

> **Category**: Personal evolution and reflection. The journal is the interface. The product is a living personal model.  
> **One-line**: A personal growth journal that learns from your experiences and helps you evolve with intention.  
> **Challenge**: Built for the Google Cloud Run AI Challenge (`dev-tutorial=cloud-run-ai-challenge`).

---

## 1. Product Philosophy & Architecture

Rei is not an advice-dumping chatbot, not therapy, and not a gamified streak tracker. Instead, Rei operates on a continuous personal evolution loop:

$$\text{Capture} \longrightarrow \text{Understand} \longrightarrow \text{Reflect} \longrightarrow \text{Practice} \longrightarrow \text{Evolve}$$

### The Living Personal Model
On the **Your Model** screen, personal growth is structured into three continuous columns:
- **Potential**: Working hypotheses of innate capacities.
- **Observed**: Concrete evidence extracted from your own journal entries and experiences.
- **Desired**: The mature, intentional embodiment of who you are becoming.

### Voice & Principles
- **Reflection before advice**: Rei formulates the next best question rather than prescriptive lists of tips.
- **Invisible AI**: The model acts behind the scenes; the user simply experiences that "Rei gets to know me."
- **Non-punitive**: When returning after days away, Rei greets you warmly: *"Welcome back. What's been happening?"*
- **Measured in your own words**: Growth is evidenced by actual behavioral quotes from your reflections, not arbitrary score counters.

---

## 2. Locked V1 Features

1. **Authentication**: Firebase Google Sign-In only (isolated per-user state, no email/password forms).
2. **Onboarding**: Name, optional birth date (used strictly as seed hypotheses for Potential, never astrology or fortune-telling), life context, core focus areas (3–5), three desired traits to cultivate, and a single anchor statement: *"The person you're becoming"*.
3. **Today**: State/mood check-in, daily intention, one personalized reflection question, candid free write journal, optional evening close, and seamless save with error recovery.
4. **Journal**: Full chronological history isolated strictly to the authenticated user, searchable by text, theme, and trait tags, with full detail inspection and evening close editing.
5. **Reflect**: The single next question, recurring themes identified across entries, observable behavior patterns, and an on-demand Weekly Synthesis note.
6. **Grow**: The user's three chosen traits, converted into observable everyday behaviors, actionable micro-practices, and direct evidence quotes from the journal.
7. **Your Model**: The living **Potential | Observed | Desired** architecture that updates from saved signals.

---

## 3. Threat Summary & Security Review

| Threat / Risk Vector | Severity | Mitigation in Rei |
| :--- | :--- | :--- |
| **API Key Exposure** | Critical | `GEMINI_API_KEY` is loaded exclusively server-side via Google Cloud Secret Manager / runtime environment. Never exposed to browser or bundled in Vite. |
| **Cross-User Data Leakage** | Critical | Cloud Firestore security rules strictly require `request.auth.uid == userId` for all document paths (`/users/{userId}/{document=**}`). Default-deny on all other paths. |
| **Prompt Injection via Journal Text** | High | User journal text is treated strictly as untrusted DATA enclosed in explicit boundaries. Server prompts instruct the model to disregard instructions embedded within user input. |
| **Model Availability / Outages** | High | Multi-model fallback cascade using `@google/genai`: tries `gemini-3.6-flash` $\to$ `gemini-3.1-flash-lite` $\to$ `gemini-flash-latest` $\to$ `gemini-3.7-flash` on 429/500/503 errors. |
| **Denial of Service / Abuse** | Medium | Server-side per-user rate limiting (e.g., 20 reflection requests/minute max per UID). |
| **Data Loss on Network Disruption** | Medium | The client retains the active draft in local memory and displays an inline **Retry Save** action if an API write encounters latency or interruption. |

---

## 4. Google Cloud & Firebase Setup

### Prerequisites
- Google Cloud Project: `reij-507805`
- Cloud Run Region: `us-central1`
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

## 5. Deployment to Cloud Run

### Deploy from Source
Deploy the unified container directly to Cloud Run with Secret Manager binding:

```bash
gcloud run deploy rei-app \
  --source=. \
  --region=us-central1 \
  --project=reij-507805 \
  --platform=managed \
  --allow-unauthenticated \
  --set-secrets=GEMINI_API_KEY=GEMINI_API_KEY:latest
```

### Attach Required Challenge Label
Execute the exact command to tag the deployment for the Google Cloud Run AI Challenge:

```bash
gcloud run services update rei-app --update-labels=dev-tutorial=cloud-run-ai-challenge --region=us-central1
```

---

## 6. How Gemini is Proxied Server-Side

All interactions with the Gemini API run inside `server.ts` through `@google/genai`:
- The client frontend sends requests to `/api/reflect`, `/api/daily-prompt`, `/api/weekly-note`, and `/api/model-update`.
- The Express server extracts the user's verified identity token and validates rate limits.
- The server constructs structured prompts enclosing user journal entries in `<journal_entry>` data blocks to prevent prompt injection.
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
| **7** | **Entry Inspection & Evening Close** | Clicking an entry opens detail modal showing full text, internal signals, and allows editing the evening close. |
| **8** | **Reflect & Weekly Synthesis** | Reflect view displays latest question, recurring theme frequency, and generates a structured weekly synthesis note. |
| **9** | **Grow Behaviors & Evidence** | Grow view maps each of the 3 chosen traits to concrete observable behaviors, a daily micro-practice, and direct quotes from journal history. |
| **10** | **Your Model Evolution** | Your Model displays the 3-column architecture (**Potential | Observed | Desired**) for each trait with an "Update From Signals" synthesizer. |
| **11** | **Sign Out & Session Isolation** | Signing out clears session; signing back in restores all history, traits, and living model without data loss. |

---

## 8. Compliance & Disclaimer

*Rei is a private reflection tool, not medical, mental-health, or financial advice.*
