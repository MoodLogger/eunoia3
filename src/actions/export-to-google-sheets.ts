
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
// GOOGLE_SHEET_ID identifies the specific spreadsheet file.
// GOOGLE_SHEET_NAME identifies the specific tab/sheet within that file.
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || 'Sheet1'; // Default sheet tab name
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
// Ensure GOOGLE_PRIVATE_KEY is read and newlines are handled correctly
const RAW_GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;
let GOOGLE_PRIVATE_KEY: string | undefined;
if (RAW_GOOGLE_PRIVATE_KEY) {
    try {
        // Replace literal '\n' strings with actual newline characters
        GOOGLE_PRIVATE_KEY = RAW_GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
    } catch (e) {
        console.error("Error processing GOOGLE_PRIVATE_KEY format:", e);
        // GOOGLE_PRIVATE_KEY remains undefined if processing fails
    }
}

// Basic validation for the private key format
function isPrivateKeyFormatValid(key: string | undefined): boolean {
    return !!key && key.startsWith('-----BEGIN PRIVATE KEY-----') && key.endsWith('-----END PRIVATE KEY-----\n');
}

export async function exportToGoogleSheets(input: ExportInput): Promise<ExportResult> {
    // Validate environment variables
    const missingVars: string[] = [];
    if (!SPREADSHEET_ID) missingVars.push("GOOGLE_SHEET_ID");
    if (!GOOGLE_SERVICE_ACCOUNT_EMAIL) missingVars.push("GOOGLE_SERVICE_ACCOUNT_EMAIL");
    if (!GOOGLE_PRIVATE_KEY) missingVars.push("GOOGLE_PRIVATE_KEY (missing or format error in .env.local)");

    if (missingVars.length > 0) {
        const errorMsg = `Server configuration error: Missing or invalid environment variables: ${missingVars.join(', ')}. Check .env.local and README.`;
        console.error(errorMsg);
        return { success: false, error: errorMsg };
    }

     // More specific check for private key format after replacement
     if (!isPrivateKeyFormatValid(GOOGLE_PRIVATE_KEY)) {
        const errorMsg = `Invalid GOOGLE_PRIVATE_KEY format in .env.local. Ensure it starts with '-----BEGIN PRIVATE KEY-----', ends with '-----END PRIVATE KEY-----\\n', and uses '\\n' for newlines.`;
        console.error(errorMsg);
        return { success: false, error: errorMsg };
    }


     // Validate input data using Zod
     const validationResult = ExportInputSchema.safeParse(input);
     if (!validationResult.success) {
         console.error("Invalid input data for export:", validationResult.error.errors);
         const errorMessage = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
         return { success: false, error: `Invalid data format: ${errorMessage}` };
     }

     const { headers, data } = validationResult.data;

     let auth;
     try {
        // Configure Google Auth using the service account credentials
         auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
                // GOOGLE_PRIVATE_KEY is already processed and validated above
                private_key: GOOGLE_PRIVATE_KEY!,
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'], // Scope needed to edit sheets
        });
         // Optionally, try to get a client to force authentication early
         await auth.getClient();
    } catch (authError: any) {
        console.error('Error initializing Google Auth:', authError);
         let detailedError = "Failed to authenticate with Google. Check service account credentials.";
         if (authError.message?.includes('PEM_read_bio_PrivateKey') || authError.message?.includes('DECODER routines')) {
            detailedError = "Authentication failed. Potential issue with GOOGLE_PRIVATE_KEY format or value in .env.local. Please verify it matches the downloaded JSON key exactly, including the BEGIN/END lines and using '\\n' for newlines."
         } else if (authError.message) {
             detailedError += ` Specific error: ${authError.message}`;
         }
         return { success: false, error: detailedError };
    }


    try {
        const sheets = google.sheets({ version: 'v4', auth });

        // 1. Get existing headers (or check if sheet is empty)
        let existingHeaders: string[] = [];
        try {
            const headerResponse = await sheets.spreadsheets.values.get({
                spreadsheetId: SPREADSHEET_ID,
                range: `${SHEET_NAME}!A1:Z1`, // Get the first row of the specified sheet tab
            });
             existingHeaders = headerResponse.data.values?.[0] as string[] || [];
        } catch (getHeaderError: any) {
             // Handle specific error if sheet/range doesn't exist yet, might indicate an empty sheet
             if (getHeaderError.code === 400 && getHeaderError.message?.includes('Unable to parse range')) {
                 console.log(`Sheet "${SHEET_NAME}" in spreadsheet ${SPREADSHEET_ID} might be empty or range A1:Z1 doesn't exist. Will attempt to write headers.`);
                 existingHeaders = [];
             } else if (getHeaderError.code === 403) {
                 console.error(`Permission denied reading headers from sheet "${SHEET_NAME}" (ID: ${SPREADSHEET_ID}). Ensure the service account ${GOOGLE_SERVICE_ACCOUNT_EMAIL} has view/edit access.`);
                 return { success: false, error: `Permission denied reading from Google Sheet. Ensure the service account has access.`};
             } else if (getHeaderError.code === 404) {
                console.error(`Spreadsheet not found (ID: ${SPREADSHEET_ID}). Verify GOOGLE_SHEET_ID.`);
                return { success: false, error: `Spreadsheet not found. Check GOOGLE_SHEET_ID.` };
             }
             else {
                 // Handle potential key/auth errors manifesting during API call
                 if (getHeaderError.message?.includes('DECODER routines')) {
                     const keyErrorMsg = "Error reading from sheet. This might indicate an issue with the GOOGLE_PRIVATE_KEY format in .env.local. Please double-check it.";
                     console.error(keyErrorMsg, getHeaderError);
                     return { success: false, error: keyErrorMsg };
                 }
                console.error('Error fetching existing headers:', getHeaderError);
                throw new Error(`Could not read from sheet: ${getHeaderError.message}`);
             }
        }

        // 2. Check if headers match or if the sheet is empty
        const headersMatch = existingHeaders.length > 0 && JSON.stringify(existingHeaders) === JSON.stringify(headers);
        const sheetIsEmpty = existingHeaders.length === 0;

        // 3. Update headers if necessary (only if sheet is empty and headers are provided)
        if (sheetIsEmpty && headers.length > 0) {
            console.log(`Sheet "${SHEET_NAME}" is empty. Writing headers: ${headers.join(', ')}`);
            try {
                await sheets.spreadsheets.values.update({
                    spreadsheetId: SPREADSHEET_ID,
                    range: `${SHEET_NAME}!A1`, // Write headers starting at A1
                    valueInputOption: 'USER_ENTERED',
                    requestBody: {
                        values: [headers],
                    },
                });
            } catch(writeHeaderError: any) {
                 console.error(`Error writing headers to sheet "${SHEET_NAME}" (ID: ${SPREADSHEET_ID}). Error: ${writeHeaderError.message}`);
                  if (writeHeaderError.code === 403) {
                      return { success: false, error: `Permission denied writing headers to Google Sheet. Ensure the service account has Editor access.` };
                  }
                   if (writeHeaderError.message?.includes('DECODER routines')) {
                      const keyErrorMsg = "Error writing headers. This might indicate an issue with the GOOGLE_PRIVATE_KEY format in .env.local. Please double-check it.";
                      console.error(keyErrorMsg, writeHeaderError);
                      return { success: false, error: keyErrorMsg };
                   }
                  return { success: false, error: `Failed to write headers: ${writeHeaderError.message}` };
            }
        } else if (!headersMatch && !sheetIsEmpty) {
             // Headers exist but don't match the input headers
            console.error('Header mismatch:', { expected: headers, found: existingHeaders });
            return { success: false, error: `Header mismatch in Google Sheet "${SHEET_NAME}". Expected: [${headers.join(', ')}], Found: [${existingHeaders.join(', ')}]. Please update the sheet or clear headers.` };
        }


        // 4. Append the data rows
        if (data.length > 0) {
             console.log(`Appending ${data.length} rows to sheet "${SHEET_NAME}"...`);
             try {
                const appendResponse = await sheets.spreadsheets.values.append({
                    spreadsheetId: SPREADSHEET_ID,
                    range: `${SHEET_NAME}!A:A`, // Append starting from column A in the specified sheet tab
                    valueInputOption: 'USER_ENTERED', // Interpret values as if user typed them
                    insertDataOption: 'INSERT_ROWS', // Insert new rows for the data
                    requestBody: {
                        values: data,
                    },
                });

                const rowsAppended = appendResponse.data.updates?.updatedRows ?? data.length; // Get actual appended rows count
                console.log(`${rowsAppended} rows appended successfully.`);
                return { success: true, rowsAppended: rowsAppended };
             } catch (appendError: any) {
                 console.error(`Error appending data to sheet "${SHEET_NAME}" (ID: ${SPREADSHEET_ID}). Error: ${appendError.message}`);
                  if (appendError.code === 403) {
                      return { success: false, error: `Permission denied appending data to Google Sheet. Ensure the service account has Editor access.` };
                  }
                   if (appendError.message?.includes('DECODER routines')) {
                      const keyErrorMsg = "Error appending data. This might indicate an issue with the GOOGLE_PRIVATE_KEY format in .env.local. Please double-check it.";
                      console.error(keyErrorMsg, appendError);
                      return { success: false, error: keyErrorMsg };
                   }
                  return { success: false, error: `Failed to append data: ${appendError.message}` };
             }
        } else {
            console.log("No data rows provided to append.");
             // If headers were written or matched but no data, still consider it a success
             if ((sheetIsEmpty && headers.length > 0) || headersMatch) {
                 return { success: true, rowsAppended: 0 };
             }
             // If headers didn't exist and no data provided, it's not really an error, but nothing happened.
             // User might expect an empty sheet to be created with headers only if headers were provided.
             // Zod validation should prevent this case if headers are required.
            return { success: true, rowsAppended: 0, error: "No data rows provided to append." };
        }

    } catch (error: any) {
        console.error('General error exporting to Google Sheets:', error);
        // Provide more specific error messages if possible
        let errorMessage = "Failed to export data to Google Sheets.";
        if (error.message?.includes('DECODER routines')) {
             errorMessage = "A credential error occurred (DECODER routines). Please verify the GOOGLE_PRIVATE_KEY format in your .env.local file. Ensure it's correctly copied from the JSON key file, enclosed in quotes, and uses '\\n' for newlines.";
        } else if (error.code === 403) {
            errorMessage = "Permission denied. Ensure the service account has editor access to the Google Sheet.";
        } else if (error.code === 404) {
            errorMessage = `Spreadsheet not found. Verify the GOOGLE_SHEET_ID (${SPREADSHEET_ID}) is correct.`;
        } else if (error.message) {
            errorMessage = `Failed to export: ${error.message}`;
        }
        return { success: false, error: errorMessage };
    }
}
