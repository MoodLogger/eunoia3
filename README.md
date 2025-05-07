
# Mood Logger App

This is a Next.js application for tracking daily mood and related factors. It allows users to assess various life themes, visualizes the overall mood, analyzes patterns using AI, and exports data.

## Features

- Daily theme assessment (Dreaming, Mood, Training, Diet, Social Relations, Family Relations, Self Education) with detailed questions.
- Scoring system (-0.25, 0, +0.25 per question, summed to -2 to +2 per theme).
- Automatic calculation and display of overall daily mood (Bad, Normal, Good) based on theme scores.
- AI-powered analysis of mood patterns over time (requires at least 3 days of data).
- Data persistence:
    - Browser Local Storage (default).
    - Firebase Firestore (optional, recommended for backup and multi-device access).
- Export daily assessment data (Date and overall theme scores) to:
    - Google Sheets (Recommended)
    - CSV file (Fallback - *Not yet implemented*)

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

3.  **Set up Environment Variables:**

    Create a `.env.local` file in the root of your project and add the following variables:

    ```env
    # Genkit/Gemini API Key (Required for Mood Analysis feature)
    # Get yours from Google AI Studio: https://aistudio.google.com/app/apikey
    # IMPORTANT: Ensure you enable the Gemini API in your Google Cloud project
    # if you haven't already. Search for "Vertex AI API" and enable it.
    # GOOGLE_GENAI_API_KEY=YOUR_GEMINI_API_KEY

    # --- Google Sheets API Credentials (Required for Google Sheets Export) ---
    # (Instructions for Google Sheets API remain the same)
    GOOGLE_SHEET_ID="YOUR_SPREADSHEET_ID"
    # GOOGLE_SHEET_NAME="YourSheetTabName" # e.g., "DailyLogs"
    GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@your-project-id.iam.gserviceaccount.com"
    GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYOUR_MULTI_LINE_KEY_HERE_WITH_ALL_NEWLINES_REPLACED_BY_DOUBLE_BACKSLASH_N\\n-----END PRIVATE KEY-----\\n"

    # --- Firebase Configuration (Strongly Recommended for Data Persistence via Firestore) ---
    # These are required if you want to save data to Firestore.
    # 1. Create a Firebase project at https://console.firebase.google.com/
    # 2. In your Firebase project, go to Project settings > General.
    # 3. Under "Your apps", click the Web icon (</>) to "Add an app".
    # 4. Register your app (give it a nickname, e.g., "Mood Logger Web").
    # 5. Firebase will provide you with a configuration object. Copy the values into these .env.local variables.
    NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_FIREBASE_API_KEY"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_FIREBASE_AUTH_DOMAIN"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_FIREBASE_PROJECT_ID" # Crucial for Firestore
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_FIREBASE_STORAGE_BUCKET"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_FIREBASE_MESSAGING_SENDER_ID"
    NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_FIREBASE_APP_ID"

    ```
    **Security Note:** Never commit your `.env.local` file or your service account JSON key file to version control. Add `.env*.local` and `*.json` (if you store the key file in the project) to your `.gitignore` file.

4.  **Set up Firebase Firestore (if using for data persistence):**
    *   In your Firebase project console, navigate to **Firestore Database** (under Build).
    *   Click **"Create database"**.
    *   Choose **"Start in production mode"** or **"Start in test mode"**.
        *   **Test mode** allows open read/write access for 30 days. Good for initial development.
        *   **Production mode** starts with locked-down rules. You'll need to configure them.
    *   Select a Cloud Firestore location (choose one close to your users).
    *   Click **"Enable"**.
    *   **Security Rules:** You MUST configure security rules for Firestore. For initial development *only*, you can use insecure rules that allow all reads and writes. **DO NOT use these in a production app with real user data without understanding the security implications.**
        *   Go to the "Rules" tab in Firestore.
        *   Example *insecure* development rules for the `moodEntries` collection:
            ```
            rules_version = '2';
            service cloud.firestore {
              match /databases/{database}/documents {
                match /moodEntries/{date} { // Or /moodEntries/{document=**} for wider access
                  allow read, write: if true; // Allows anyone to read/write
                }
              }
            }
            ```
        *   For a production app, you would implement proper authentication and authorization rules (e.g., only allow authenticated users to write their own data).

5.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    ```
    The app will be available at `http://localhost:9002` (or the port specified in `package.json`).

6.  **Run Genkit Dev Server (for AI features):**
    In a separate terminal, run:
    ```bash
    npm run genkit:dev
    # or
    npm run genkit:watch # (Watches for changes)
    ```

## Usage

- Open the app in your browser.
- The current date's assessment form will be displayed.
- Expand each theme accordion (e.g., "Dreaming / Sleep Quality").
- Answer the 8 questions within each theme using the Negative (-0.25), Neutral (0), or Positive (+0.25) radio buttons.
- Your selections are automatically saved:
    - To the browser's local storage.
    - To Firebase Firestore (if configured with `NEXT_PUBLIC_FIREBASE_PROJECT_ID` and other Firebase variables).
- The overall score for each theme (-2 to +2) and the calculated overall mood icon (Bad/Normal/Good) will update automatically.
- **Analyze Moods:** After logging data for at least 3 days, click "Analyze Moods" (requires Genkit server running and API key) to get AI-powered insights.
- **Export to Sheets:** Click "Export to Sheets" to append the daily assessment data (date and all overall theme scores) as new rows to the configured Google Sheet (requires Google Sheets API setup as described above). Data is appended, preserving existing rows.

## Data Storage

- Daily assessment data is primarily stored in the browser's **Local Storage**. Clearing your browser data will remove these local logs.
- If Firebase is configured (specifically `NEXT_PUBLIC_FIREBASE_PROJECT_ID` and related variables in `.env.local`), data will also be saved to **Firebase Firestore**. This provides a cloud backup and allows data to be potentially accessed across devices (if user authentication were implemented).
- The "Export to Sheets" feature provides a way to back up your data externally to the specific Google Sheet you configured.

## Building for Production

```bash
npm run build
npm run start
```

