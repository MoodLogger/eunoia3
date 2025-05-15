
'use server';

/**
 * @fileOverview Server action to export mood logger data to a Google Sheet.
 *
 * - exportToGoogleSheets - Appends data rows to a specified Google Sheet.
 * - ExportInput - The input type for the export function.
 * - ExportResult - The return type indicating success or failure.
 * - testReadGoogleSheet - Attempts to read a sample range from the sheet for diagnostics.
 * - TestReadResult - The return type for the test read function.
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

// Define the result type for export
export interface ExportResult {
    success: boolean;
    rowsAppended?: number;
    error?: string;
}

// Define the result type for test read
export interface TestReadResult {
    success: boolean;
    data?: any[][];
    error?: string;
    details?: any;
}

// Environment variables (ensure these are set in your .env.local or environment)
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || 'Sheet1'; // Default sheet tab name
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const RAW_GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;
let GOOGLE_PRIVATE_KEY: string | undefined;

console.log("[ExportToSheets] Initializing environment variables...");
console.log("[ExportToSheets] SPREADSHEET_ID:", SPREADSHEET_ID);
console.log("[ExportToSheets] SHEET_NAME:", SHEET_NAME);
console.log("[ExportToSheets] GOOGLE_SERVICE_ACCOUNT_EMAIL:", GOOGLE_SERVICE_ACCOUNT_EMAIL);
console.log("[ExportToSheets] RAW_GOOGLE_PRIVATE_KEY (exists):", !!RAW_GOOGLE_PRIVATE_KEY);


if (RAW_GOOGLE_PRIVATE_KEY) {
    try {
        console.log("[ExportToSheets] Processing GOOGLE_PRIVATE_KEY...");
        GOOGLE_PRIVATE_KEY = RAW_GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
        console.log("[ExportToSheets] GOOGLE_PRIVATE_KEY processed (exists):", !!GOOGLE_PRIVATE_KEY);
    } catch (e) {
        console.error("[ExportToSheets] Error processing GOOGLE_PRIVATE_KEY format:", e);
    }
}

function isPrivateKeyFormatValid(key: string | undefined): boolean {
    const isValid = !!key && key.startsWith('-----BEGIN PRIVATE KEY-----') && key.endsWith('-----END PRIVATE KEY-----\n');
    console.log("[ExportToSheets] isPrivateKeyFormatValid check:", isValid, "Key provided:", !!key);
    if (key) {
        console.log("[ExportToSheets] Key starts with '-----BEGIN PRIVATE KEY-----':", key.startsWith('-----BEGIN PRIVATE KEY-----'));
        console.log("[ExportToSheets] Key ends with '-----END PRIVATE KEY-----\\n':", key.endsWith('-----END PRIVATE KEY-----\n'));
    }
    return isValid;
}

export async function exportToGoogleSheets(input: ExportInput): Promise<ExportResult> {
    console.log("[ExportToSheets] exportToGoogleSheets called with input:", JSON.stringify(input, null, 2));
    const missingVars: string[] = [];
    if (!SPREADSHEET_ID) missingVars.push("GOOGLE_SHEET_ID");
    if (!GOOGLE_SERVICE_ACCOUNT_EMAIL) missingVars.push("GOOGLE_SERVICE_ACCOUNT_EMAIL");
    if (!GOOGLE_PRIVATE_KEY) missingVars.push("GOOGLE_PRIVATE_KEY (missing or format error in .env.local)");

    if (missingVars.length > 0) {
        const errorMsg = `Server configuration error: Missing or invalid environment variables: ${missingVars.join(', ')}. Check .env.local and README.`;
        console.error("[ExportToSheets]", errorMsg);
        return { success: false, error: errorMsg };
    }

     if (!isPrivateKeyFormatValid(GOOGLE_PRIVATE_KEY)) {
        const errorMsg = `Invalid GOOGLE_PRIVATE_KEY format in .env.local. Ensure it starts with '-----BEGIN PRIVATE KEY-----', ends with '-----END PRIVATE KEY-----\\n', and uses '\\n' for newlines.`;
        console.error("[ExportToSheets]", errorMsg);
        return { success: false, error: errorMsg };
    }

     console.log("[ExportToSheets] Validating input data with Zod...");
     const validationResult = ExportInputSchema.safeParse(input);
     if (!validationResult.success) {
         console.error("[ExportToSheets] Invalid input data for export:", validationResult.error.errors);
         const errorMessage = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
         return { success: false, error: `Invalid data format: ${errorMessage}` };
     }
     console.log("[ExportToSheets] Input data validated successfully.");

     const { headers, data } = validationResult.data;

     let auth;
     try {
        console.log("[ExportToSheets] Attempting to authenticate with Google Sheets API...");
         auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
                private_key: GOOGLE_PRIVATE_KEY!,
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
         await auth.getClient();
         console.log('[ExportToSheets] Successfully authenticated with Google Sheets API.');
    } catch (authError: any) {
        console.error('[ExportToSheets] Error initializing Google Auth:', authError);
         let detailedError = "Failed to authenticate with Google. Check service account credentials.";
         if (authError.message?.includes('PEM_read_bio_PrivateKey') || authError.message?.includes('DECODER routines') || authError.message?.includes('bad base64 decode')) {
            detailedError = "Authentication failed. Potential issue with GOOGLE_PRIVATE_KEY format or value in .env.local. Please verify it matches the downloaded JSON key exactly, including the BEGIN/END lines and using '\\n' for newlines."
         } else if (authError.message) {
             detailedError += ` Specific error: ${authError.message}`;
         }
        console.error('[ExportToSheets] Detailed Auth Error:', detailedError, authError.stack);
        return { success: false, error: detailedError };
    }

    try {
        console.log("[ExportToSheets] Creating Google Sheets API client...");
        const sheets = google.sheets({ version: 'v4', auth });
        console.log("[ExportToSheets] Google Sheets API client created.");

        let existingHeaders: string[] = [];
        console.log(`[ExportToSheets] Attempting to get existing headers from sheet: ${SHEET_NAME}, range: A1:Z1`);
        try {
            const headerResponse = await sheets.spreadsheets.values.get({
                spreadsheetId: SPREADSHEET_ID,
                range: `${SHEET_NAME}!A1:Z1`, 
            });
            existingHeaders = headerResponse.data.values?.[0] as string[] || [];
            console.log("[ExportToSheets] Existing headers fetched:", existingHeaders);
        } catch (getHeaderError: any) {
             console.error("[ExportToSheets] Error fetching existing headers:", getHeaderError.code, getHeaderError.message, getHeaderError.response?.data?.error);
             if (getHeaderError.code === 400 && getHeaderError.message?.includes('Unable to parse range')) {
                 console.log(`[ExportToSheets] Sheet "${SHEET_NAME}" in spreadsheet ${SPREADSHEET_ID} might be empty or range A1:Z1 doesn't exist. Will attempt to write headers.`);
                 existingHeaders = [];
             } else if (getHeaderError.code === 403 || getHeaderError.response?.data?.error?.status === 'PERMISSION_DENIED') {
                 const errMsg = `Permission denied reading headers from sheet "${SHEET_NAME}" (ID: ${SPREADSHEET_ID}). Ensure the service account ${GOOGLE_SERVICE_ACCOUNT_EMAIL} has view/edit access.`;
                 console.error("[ExportToSheets]", errMsg);
                 return { success: false, error: `Permission denied reading from Google Sheet. Ensure the service account has access.`};
             } else if (getHeaderError.code === 404) {
                const errMsg = `Spreadsheet not found (ID: ${SPREADSHEET_ID}). Verify GOOGLE_SHEET_ID.`;
                console.error("[ExportToSheets]", errMsg);
                return { success: false, error: `Spreadsheet not found. Check GOOGLE_SHEET_ID.` };
             } else {
                 if (getHeaderError.message?.includes('DECODER routines') || getHeaderError.message?.includes('bad base64 decode')) {
                     const keyErrorMsg = "Error reading from sheet (auth related). This might indicate an issue with the GOOGLE_PRIVATE_KEY format in .env.local. Please double-check it.";
                     console.error("[ExportToSheets]", keyErrorMsg, getHeaderError);
                     return { success: false, error: keyErrorMsg };
                 }
                console.error('[ExportToSheets] Unhandled error fetching existing headers:', getHeaderError);
                throw new Error(`Could not read from sheet: ${getHeaderError.message || 'Unknown error during header fetch'}`);
             }
        }

        const headersMatch = existingHeaders.length > 0 && JSON.stringify(existingHeaders) === JSON.stringify(headers);
        const sheetIsEmpty = existingHeaders.length === 0;
        console.log(`[ExportToSheets] Headers match: ${headersMatch}, Sheet is empty: ${sheetIsEmpty}`);

        if (sheetIsEmpty && headers.length > 0) {
            console.log(`[ExportToSheets] Sheet "${SHEET_NAME}" is empty. Writing headers: ${headers.join(', ')}`);
            try {
                await sheets.spreadsheets.values.update({
                    spreadsheetId: SPREADSHEET_ID,
                    range: `${SHEET_NAME}!A1`,
                    valueInputOption: 'USER_ENTERED',
                    requestBody: {
                        values: [headers],
                    },
                });
                console.log("[ExportToSheets] Headers written successfully.");
            } catch(writeHeaderError: any) {
                 console.error(`[ExportToSheets] Error writing headers to sheet "${SHEET_NAME}" (ID: ${SPREADSHEET_ID}). Error: ${writeHeaderError.message}`, writeHeaderError.response?.data?.error);
                  if (writeHeaderError.code === 403 || writeHeaderError.response?.data?.error?.status === 'PERMISSION_DENIED') {
                      return { success: false, error: `Permission denied writing headers to Google Sheet. Ensure the service account has Editor access.` };
                  }
                   if (writeHeaderError.message?.includes('DECODER routines') || writeHeaderError.message?.includes('bad base64 decode')) {
                      const keyErrorMsg = "Error writing headers (auth related). This might indicate an issue with the GOOGLE_PRIVATE_KEY format in .env.local. Please double-check it.";
                      console.error("[ExportToSheets]",keyErrorMsg, writeHeaderError);
                      return { success: false, error: keyErrorMsg };
                   }
                  return { success: false, error: `Failed to write headers: ${writeHeaderError.message || 'Unknown error during header write'}` };
            }
        } else if (!headersMatch && !sheetIsEmpty) {
            const errorMsg = `Header mismatch in Google Sheet "${SHEET_NAME}". Expected: [${headers.join(', ')}], Found: [${existingHeaders.join(', ')}]. Please update the sheet or clear headers.`;
            console.error('[ExportToSheets] Header mismatch:', { expected: headers, found: existingHeaders });
            return { success: false, error: errorMsg };
        }

        if (data.length > 0) {
             console.log(`[ExportToSheets] Attempting to append ${data.length} rows to sheet "${SHEET_NAME}"...`);
             try {
                const appendResponse = await sheets.spreadsheets.values.append({
                    spreadsheetId: SPREADSHEET_ID,
                    range: `${SHEET_NAME}!A:A`, 
                    valueInputOption: 'USER_ENTERED', 
                    insertDataOption: 'INSERT_ROWS', 
                    requestBody: {
                        values: data,
                    },
                });
                const rowsAppended = appendResponse.data.updates?.updatedRows ?? data.length; 
                console.log(`[ExportToSheets] ${rowsAppended} rows appended successfully.`);
                return { success: true, rowsAppended: rowsAppended };
             } catch (appendError: any) {
                 console.error(`[ExportToSheets] Error appending data to sheet "${SHEET_NAME}" (ID: ${SPREADSHEET_ID}). Error: ${appendError.message}`, appendError.response?.data?.error);
                  if (appendError.code === 403 || appendError.response?.data?.error?.status === 'PERMISSION_DENIED') {
                      return { success: false, error: `Permission denied appending data to Google Sheet. Ensure the service account has Editor access.` };
                  }
                   if (appendError.message?.includes('DECODER routines') || appendError.message?.includes('bad base64 decode')) {
                      const keyErrorMsg = "Error appending data (auth related). This might indicate an issue with the GOOGLE_PRIVATE_KEY format in .env.local. Please double-check it.";
                      console.error("[ExportToSheets]", keyErrorMsg, appendError);
                      return { success: false, error: keyErrorMsg };
                   }
                  return { success: false, error: `Failed to append data: ${appendError.message || 'Unknown error during data append'}` };
             }
        } else {
            console.log("[ExportToSheets] No data rows provided to append.");
             if ((sheetIsEmpty && headers.length > 0) || headersMatch) {
                 console.log("[ExportToSheets] Headers are present/written, but no data to append. Considered success.");
                 return { success: true, rowsAppended: 0 };
             }
            return { success: true, rowsAppended: 0, error: "No data rows provided to append." };
        }

    } catch (error: any) {
        console.error('[ExportToSheets] General error exporting to Google Sheets:', error.message, error.stack, error.response?.data?.error);
        let errorMessage = "Failed to export data to Google Sheets.";
        if (error.message?.includes('DECODER routines') || error.message?.includes('bad base64 decode')) {
             errorMessage = "A credential error occurred (DECODER routines/bad base64). Please verify the GOOGLE_PRIVATE_KEY format in your .env.local file. Ensure it's correctly copied from the JSON key file, enclosed in quotes, and uses '\\n' for newlines.";
        } else if (error.code === 403 || error.response?.data?.error?.status === 'PERMISSION_DENIED') {
            errorMessage = "Permission denied. Ensure the service account has editor access to the Google Sheet.";
        } else if (error.code === 404) {
            errorMessage = `Spreadsheet not found. Verify the GOOGLE_SHEET_ID (${SPREADSHEET_ID}) is correct.`;
        } else if (error.message) {
            errorMessage = `Failed to export: ${error.message}`;
        }
        return { success: false, error: errorMessage };
    }
}


/**
 * Attempts to read a sample range from the configured Google Sheet for diagnostic purposes.
 * @param testRange Optional. The range to test read from, e.g., "Sheet1!A1:B2". Defaults to "Sheet1!A1:A1".
 * @returns {Promise<TestReadResult>} An object indicating success or failure, and the data or error.
 */
export async function testReadGoogleSheet(testRange: string = `${SHEET_NAME}!A1:A1`): Promise<TestReadResult> {
    console.log(`[TestReadGoogleSheet] Attempting to read range "${testRange}"...`);

    const missingVars: string[] = [];
    if (!SPREADSHEET_ID) missingVars.push("GOOGLE_SHEET_ID");
    if (!GOOGLE_SERVICE_ACCOUNT_EMAIL) missingVars.push("GOOGLE_SERVICE_ACCOUNT_EMAIL");
    if (!GOOGLE_PRIVATE_KEY) missingVars.push("GOOGLE_PRIVATE_KEY (missing or format error in .env.local)");

    if (missingVars.length > 0) {
        const errorMsg = `Server configuration error for test read: Missing or invalid environment variables: ${missingVars.join(', ')}. Check .env.local and README.`;
        console.error("[TestReadGoogleSheet]", errorMsg);
        return { success: false, error: errorMsg };
    }

    if (!isPrivateKeyFormatValid(GOOGLE_PRIVATE_KEY)) {
        const errorMsg = `Invalid GOOGLE_PRIVATE_KEY format in .env.local for test read. Ensure it starts with '-----BEGIN PRIVATE KEY-----', ends with '-----END PRIVATE KEY-----\\n', and uses '\\n' for newlines.`;
        console.error("[TestReadGoogleSheet]", errorMsg);
        return { success: false, error: errorMsg };
    }

    let auth;
    try {
        console.log("[TestReadGoogleSheet] Attempting to authenticate with Google Sheets API...");
        auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
                private_key: GOOGLE_PRIVATE_KEY!,
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'], // Readonly scope is sufficient
        });
        await auth.getClient(); // Verify auth works
        console.log('[TestReadGoogleSheet] Successfully authenticated with Google Sheets API.');
    } catch (authError: any) {
        console.error('[TestReadGoogleSheet] Error initializing Google Auth:', authError);
        let detailedError = "Failed to authenticate with Google for test read. Check service account credentials.";
        if (authError.message?.includes('PEM_read_bio_PrivateKey') || authError.message?.includes('DECODER routines') || authError.message?.includes('bad base64 decode')) {
            detailedError = "Authentication failed for test read. Potential issue with GOOGLE_PRIVATE_KEY format or value in .env.local. Please verify it matches the downloaded JSON key exactly, including the BEGIN/END lines and using '\\n' for newlines."
        } else if (authError.message) {
            detailedError += ` Specific error: ${authError.message}`;
        }
        console.error('[TestReadGoogleSheet] Detailed Auth Error:', detailedError, authError.stack);
        return { success: false, error: detailedError, details: authError.response?.data || authError.message };
    }

    try {
        console.log("[TestReadGoogleSheet] Creating Google Sheets API client...");
        const sheets = google.sheets({ version: 'v4', auth });
        console.log("[TestReadGoogleSheet] Google Sheets API client created.");

        console.log(`[TestReadGoogleSheet] Attempting to get data from sheet ID: ${SPREADSHEET_ID}, range: ${testRange}`);
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: testRange,
        });

        const values = response.data.values as any[][] | undefined;
        console.log('[TestReadGoogleSheet] Data fetched successfully:', values);
        return { success: true, data: values };

    } catch (error: any) {
        console.error(`[TestReadGoogleSheet] Error reading from sheet ID ${SPREADSHEET_ID}, range ${testRange}:`, error.message, error.stack, error.response?.data?.error);
        let userFriendlyError = `Failed to read from Google Sheet (range: ${testRange}).`;
         if (error.code === 403 || error.response?.data?.error?.status === 'PERMISSION_DENIED') {
            userFriendlyError = `Permission denied reading from Google Sheet (range: ${testRange}). Ensure the service account ${GOOGLE_SERVICE_ACCOUNT_EMAIL} has at least Viewer access.`;
        } else if (error.code === 404) {
            userFriendlyError = `Spreadsheet not found (ID: ${SPREADSHEET_ID}). Verify GOOGLE_SHEET_ID.`;
        } else if (error.message?.includes('DECODER routines') || error.message?.includes('bad base64 decode')) {
            userFriendlyError = `Authentication-related error during read attempt. Check GOOGLE_PRIVATE_KEY format.`;
        } else if (error.message) {
            userFriendlyError = `Failed to read from sheet: ${error.message}`;
        }
        return { success: false, error: userFriendlyError, details: error.response?.data?.error || error.message };
    }
}

    