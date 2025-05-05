
'use server';

/**
 * @fileOverview Server action to export mood logger data to a Google Sheet.
 *
 * - exportToGoogleSheets - Appends data rows to a specified Google Sheet.
 * - ExportInput - The input type for the export function.
 * - ExportResult - The return type indicating success or failure.
 */

import { google } from 'googleapis';
import { z } from 'zod';

// Define input schema for the server action
const ExportInputSchema = z.object({
    headers: z.array(z.string()).describe("The header row for the sheet."),
    data: z.array(z.array(z.union([z.string(), z.number(), z.null()])))
           .describe("An array of arrays, where each inner array represents a row of data matching the headers."),
});
export type ExportInput = z.infer<typeof ExportInputSchema>;

// Define the result type
export interface ExportResult {
    success: boolean;
    rowsAppended?: number;
    error?: string;
}

// Environment variables (ensure these are set in your .env.local or environment)
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || 'Sheet1'; // Default sheet name
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'); // Handle newline characters in private key

export async function exportToGoogleSheets(input: ExportInput): Promise<ExportResult> {
    // Validate environment variables
    if (!SPREADSHEET_ID || !GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
        const missingVars = [
            !SPREADSHEET_ID && "GOOGLE_SHEET_ID",
            !GOOGLE_SERVICE_ACCOUNT_EMAIL && "GOOGLE_SERVICE_ACCOUNT_EMAIL",
            !GOOGLE_PRIVATE_KEY && "GOOGLE_PRIVATE_KEY"
        ].filter(Boolean).join(', ');
        console.error(`Missing required environment variables for Google Sheets: ${missingVars}`);
        return { success: false, error: `Server configuration error: Missing environment variables (${missingVars}).` };
    }

     // Validate input data using Zod
     const validationResult = ExportInputSchema.safeParse(input);
     if (!validationResult.success) {
         console.error("Invalid input data for export:", validationResult.error.errors);
         // Provide a more user-friendly error message if possible
         const errorMessage = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
         return { success: false, error: `Invalid data format: ${errorMessage}` };
     }

     const { headers, data } = validationResult.data;


    try {
        // Configure Google Auth
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
                private_key: GOOGLE_PRIVATE_KEY,
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });

        // 1. Get existing headers (or check if sheet is empty)
        let existingHeaders: string[] = [];
        try {
            const headerResponse = await sheets.spreadsheets.values.get({
                spreadsheetId: SPREADSHEET_ID,
                range: `${SHEET_NAME}!A1:Z1`, // Get the first row
            });
             existingHeaders = headerResponse.data.values?.[0] as string[] || [];
        } catch (getHeaderError: any) {
             // Handle specific error if sheet/range doesn't exist yet, might indicate an empty sheet
             if (getHeaderError.code === 400 && getHeaderError.message?.includes('Unable to parse range')) {
                 console.log(`Sheet "${SHEET_NAME}" might be empty or range A1:Z1 doesn't exist. Will attempt to write headers.`);
                 existingHeaders = [];
             } else {
                console.error('Error fetching existing headers:', getHeaderError);
                throw new Error(`Could not read from sheet: ${getHeaderError.message}`);
             }
        }

        // 2. Check if headers match or if the sheet is empty
        const headersMatch = existingHeaders.length > 0 && JSON.stringify(existingHeaders) === JSON.stringify(headers);
        const sheetIsEmpty = existingHeaders.length === 0;

        // 3. Update headers if necessary (only if sheet is empty and headers are provided)
        if (sheetIsEmpty && headers.length > 0) {
            console.log(`Sheet "${SHEET_NAME}" is empty. Writing headers.`);
            await sheets.spreadsheets.values.update({
                spreadsheetId: SPREADSHEET_ID,
                range: `${SHEET_NAME}!A1`,
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [headers],
                },
            });
        } else if (!headersMatch && !sheetIsEmpty) {
             // Headers exist but don't match the input headers
            console.error('Header mismatch:', { expected: headers, found: existingHeaders });
            return { success: false, error: `Header mismatch in Google Sheet "${SHEET_NAME}". Expected: [${headers.join(', ')}], Found: [${existingHeaders.join(', ')}]. Please ensure the sheet structure is correct or clear the existing headers.` };
        }


        // 4. Append the data rows
        if (data.length > 0) {
            const appendResponse = await sheets.spreadsheets.values.append({
                spreadsheetId: SPREADSHEET_ID,
                range: `${SHEET_NAME}!A:A`, // Append starting from column A
                valueInputOption: 'USER_ENTERED',
                insertDataOption: 'INSERT_ROWS',
                requestBody: {
                    values: data,
                },
            });

            const rowsAppended = appendResponse.data.updates?.updatedRows ?? data.length; // Get actual appended rows count
            console.log(`${rowsAppended} rows appended successfully.`);
            return { success: true, rowsAppended: rowsAppended };
        } else {
            console.log("No data rows provided to append.");
             // If headers were written but no data, still consider it a success
             if (sheetIsEmpty && headers.length > 0) {
                 return { success: true, rowsAppended: 0 };
             }
             // If headers matched but no data, also success (but maybe warn?)
             if (headersMatch) {
                 return { success: true, rowsAppended: 0 };
             }
            return { success: false, error: "No data provided to export." }; // Should have been caught by Zod, but good practice
        }

    } catch (error: any) {
        console.error('Error exporting to Google Sheets:', error);
        // Provide more specific error messages if possible
        let errorMessage = "Failed to export data to Google Sheets.";
        if (error.code === 403) {
            errorMessage = "Permission denied. Ensure the service account has editor access to the Google Sheet.";
        } else if (error.code === 404) {
            errorMessage = `Spreadsheet not found. Verify the GOOGLE_SHEET_ID (${SPREADSHEET_ID}) is correct.`;
        } else if (error.message) {
            errorMessage = error.message;
        }
        return { success: false, error: errorMessage };
    }
}
