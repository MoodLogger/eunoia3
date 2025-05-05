# Mood Logger App

This is a Next.js application for tracking daily mood and related factors. It allows users to assess various life themes, visualizes the overall mood, analyzes patterns using AI, and exports data.

## Features

- Daily theme assessment (Dreaming, Mood, Training, Diet, Social Relations, Family Relations, Self Education) with detailed questions.
- Scoring system (-0.25, 0, +0.25 per question, summed to -2 to +2 per theme).
- Automatic calculation and display of overall daily mood (Bad, Normal, Good) based on theme scores.
- AI-powered analysis of mood patterns over time (requires at least 3 days of data).
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

    # 1. Google Sheet ID (Required):
    #    This is the unique identifier for your spreadsheet file (e.g., your "MoodLogger" sheet).
    #    Find this ID in the URL of your Google Sheet:
    #    https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID/edit
    #    The API uses this ID to find the correct file, regardless of its folder location (like \\hobby\MoodLogger) in your Google Drive.
    GOOGLE_SHEET_ID="YOUR_SPREADSHEET_ID"

    # 2. Sheet Name (Optional):
    #    The name of the specific tab (sheet) within your spreadsheet file where data should be written.
    #    If you omit this, it defaults to "Sheet1".
    # GOOGLE_SHEET_NAME="YourSheetTabName" # e.g., "DailyLogs"

    # 3. Google Cloud Service Account (Required):
    #    Follow these steps to create a service account and get its credentials:
    #    - Go to the Google Cloud Console: https://console.cloud.google.com/
    #    - Select your project or create a new one.
    #    - Enable the "Google Sheets API": Navigate to APIs & Services > Library, search for "Google Sheets API", and enable it.
    #    - Create a Service Account: Navigate to APIs & Services > Credentials > Create Credentials > Service account.
    #      - Give it a name (e.g., "mood-logger-sheets-writer").
    #      - Grant it the "Editor" role for basic access (this allows it to write to sheets shared with it). Or create a more restricted custom role if needed.
    #      - Click "Done".
    #    - Generate a Key: Find the created service account, click on it, go to the "Keys" tab, click "Add Key" > "Create new key", choose "JSON", and click "Create". A JSON file will be downloaded.
    #    - !! Keep this JSON file secure !! Do not commit it to version control.

    # 4. Service Account Email (Required):
    #    Copy the service account's email address from the Credentials page or the downloaded JSON file (it's the value for the `client_email` key).
    #    It looks like: your-service-account-name@your-project-id.iam.gserviceaccount.com
    GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@your-project-id.iam.gserviceaccount.com"

    # 5. Private Key (Required):
    #    Open the downloaded JSON key file with a text editor. Copy the ENTIRE private key string, including the header and footer lines (`-----BEGIN PRIVATE KEY-----` to `-----END PRIVATE KEY-----`).
    #    VERY IMPORTANT: In your .env.local file, paste the key within DOUBLE QUOTES ("").
    #    Replace the literal newline characters (`\n`) *within* the key string with the sequence `\\n` (double backslash n).
    #    Example structure:
    #    GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYOUR_PRIVATE_KEY_CONTENT_WITH_NEWLINES_AS_DOUBLE_BACKSLASH_N\\nMORE_CONTENT\\nEVEN_MORE_CONTENT\\n-----END PRIVATE KEY-----\\n"
    #    Ensure the final "-----END PRIVATE KEY-----\n" also has the `\\n` at the end.
    #    Incorrect formatting WILL cause authentication errors (like DECODER routines errors).
    GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYOUR_MULTI_LINE_KEY_HERE_WITH_ALL_NEWLINES_REPLACED_BY_DOUBLE_BACKSLASH_N\\n-----END PRIVATE KEY-----\\n"


    # 6. Share the Google Sheet (Required):
    #    Open your specific Google Sheet file (the one identified by GOOGLE_SHEET_ID).
    #    Click the "Share" button (top right).
    #    Paste the Service Account Email (from step 4) into the sharing dialog.
    #    Grant it "Editor" access.
    #    Click "Send" or "Share". This allows the service account (and thus the app) to write to this specific sheet.

    # --- Firebase Configuration (Optional - If using Firebase features) ---
    # NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_FIREBASE_API_KEY"
    # NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_FIREBASE_AUTH_DOMAIN"
    # NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_FIREBASE_PROJECT_ID"
    # NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_FIREBASE_STORAGE_BUCKET"
    # NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_FIREBASE_MESSAGING_SENDER_ID"
    # NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_FIREBASE_APP_ID"

    ```
    **Security Note:** Never commit your `.env.local` file or your service account JSON key file to version control. Add `.env*.local` and `*.json` (if you store the key file in the project) to your `.gitignore` file.

4.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    ```
    The app will be available at `http://localhost:9002` (or the port specified in `package.json`).

5.  **Run Genkit Dev Server (for AI features):**
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
- Your selections are automatically saved to the browser's local storage.
- The overall score for each theme (-2 to +2) and the calculated overall mood icon (Bad/Normal/Good) will update automatically.
- **Analyze Moods:** After logging data for at least 3 days, click "Analyze Moods" (requires Genkit server running and API key) to get AI-powered insights.
- **Export to Sheets:** Click "Export to Sheets" to append the daily assessment data (date and all overall theme scores) as new rows to the configured Google Sheet (requires Google Sheets API setup as described above). Data is appended, preserving existing rows.

## Data Storage

- Daily assessment data is stored in the browser's **Local Storage**. Clearing your browser data will remove the stored logs.
- The "Export to Sheets" feature provides a way to back up your data externally to the specific Google Sheet you configured via `GOOGLE_SHEET_ID` and shared with the service account.

## Building for Production

```bash
npm run build
npm run start
```
