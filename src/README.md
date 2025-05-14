
# Mood Logger App

This is a Next.js application for tracking daily mood and related factors. It allows users to assess various life themes, visualizes the overall mood, analyzes patterns using AI, and exports data. Users can register and login to have their data saved to Firebase Firestore, or use the app anonymously with data stored in browser Local Storage.

## Features

- User authentication (Registration & Login with Email/Password via Firebase Auth).
- Daily theme assessment (Dreaming, Mood, Training, Diet, Social Relations, Family Relations, Self Education) with detailed questions.
- Scoring system (-0.25, 0, +0.25 per question, summed to -2 to +2 per theme).
- Automatic calculation and display of overall daily mood (Bad, Normal, Good) based on theme scores.
- AI-powered analysis of mood patterns over time (requires at least 3 days of data, user must be logged in).
- Data persistence:
    - Firebase Firestore (for authenticated users, recommended for backup and multi-device access).
    - Browser Local Storage (for anonymous users).
- Export daily assessment data (Date and overall theme scores) to:
    - Google Sheets (Recommended, user must be logged in)
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
    GOOGLE_SHEET_ID="YOUR_SPREADSHEET_ID"
    # GOOGLE_SHEET_NAME="YourSheetTabName" # e.g., "DailyLogs" (Optional, defaults to "Sheet1")
    GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@your-project-id.iam.gserviceaccount.com"
    GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYOUR_MULTI_LINE_KEY_HERE_WITH_ALL_NEWLINES_REPLACED_BY_DOUBLE_BACKSLASH_N\\n-----END PRIVATE KEY-----\\n"

    # --- Firebase Configuration (Required for User Authentication and Firestore Data Persistence) ---
    # 1. Create a Firebase project at https://console.firebase.google.com/
    # 2. In your Firebase project, go to Project settings > General.
    # 3. Under "Your apps", click the Web icon (</>) to "Add an app".
    # 4. Register your app (give it a nickname, e.g., "Mood Logger Web").
    # 5. Firebase will provide you with a configuration object. Copy the values into these .env.local variables.
    # 6. In the Firebase console, go to Authentication (under Build) and enable the "Email/Password" sign-in method.
    # 7. In the Firebase console, go to Firestore Database (under Build) and set up Firestore.
    NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_FIREBASE_API_KEY"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_FIREBASE_AUTH_DOMAIN"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_FIREBASE_PROJECT_ID" # Crucial for Firestore & Auth
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_FIREBASE_STORAGE_BUCKET"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_FIREBASE_MESSAGING_SENDER_ID"
    NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_FIREBASE_APP_ID"
    ```
    **Security Note:** Never commit your `.env.local` file or your service account JSON key file to version control. Add `.env*.local` and `*.json` (if you store the key file in the project) to your `.gitignore` file.

4.  **Set up Firebase Firestore & Authentication:**
    *   **Authentication:** In your Firebase project console, navigate to **Authentication** (under Build). Go to the "Sign-in method" tab and **enable Email/Password**.
    *   **Firestore Database:**
        *   Navigate to **Firestore Database** (under Build).
        *   Click **"Create database"**.
        *   Choose **"Start in production mode"**.
        *   Select a Cloud Firestore location.
        *   Click **"Enable"**.
        *   **Security Rules:** You MUST configure security rules for Firestore. For authenticated users to access their own data, use rules like the following:
            ```
            rules_version = '2';
            service cloud.firestore {
              match /databases/{database}/documents {
                // Allow users to read and write their own mood entries
                match /users/{userId}/moodEntries/{date} {
                  allow read, write: if request.auth != null && request.auth.uid == userId;
                }
                // Optionally, allow users to read/write their own user document if you store user profiles
                // match /users/{userId} {
                //   allow read, write: if request.auth != null && request.auth.uid == userId;
                // }
              }
            }
            ```
            Publish these rules in the "Rules" tab of your Firestore database.

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
- You will be prompted to Login or Register. You can also choose to "Continue Anonymously".
- **Authenticated Users:** Your data is saved to Firebase Firestore.
- **Anonymous Users:** Your data is saved to browser Local Storage.
- The current date's assessment form will be displayed.
- Expand each theme accordion (e.g., "Sen").
- Answer the 8 questions within each theme using the Negative (-0.25), Neutral (0), or Positive (+0.25) radio buttons.
- Your selections are automatically saved.
- The overall score for each theme (-2 to +2) and the calculated overall mood icon (Bad/Normal/Good) will update automatically.
- **Analyze Moods:** After logging data for at least 3 days (and if logged in), click "Analyze Moods" (requires Genkit server running and API key) to get AI-powered insights.
- **Export to Sheets:** (If logged in) Click "Export to Sheets" to append the daily assessment data (date and all overall theme scores) as new rows to the configured Google Sheet (requires Google Sheets API setup).

## Data Storage

- **Authenticated Users:** Data is stored in **Firebase Firestore** under a path specific to the user (`users/{userId}/moodEntries/{date}`).
- **Anonymous Users:** Daily assessment data is stored in the browser's **Local Storage**. Clearing browser data will remove these local logs.
- The "Export to Sheets" feature (for authenticated users) provides a way to back up data externally to a Google Sheet.

## Building for Production

```bash
npm run build
npm run start
```
