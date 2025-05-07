'use server';

/**
 * @fileOverview Mood pattern analysis AI agent.
 *
 * - analyzeMoodPatterns - A function that handles the mood pattern analysis process.
 * - AnalyzeMoodPatternsInput - The input type for the analyzeMoodPatterns function.
 * - AnalyzeMoodPatternsOutput - The return type for the analyzeMoodPatterns function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const AnalyzeMoodPatternsInputSchema = z.object({
  moodData: z
    .string()
    .describe(
      'A stringified JSON array of objects, where each object represents a day and its primary logged mood (e.g., "happy", "sad", "neutral", "angry", or null/not specified).'
    ),
  // Keep themeScores for overall analysis, detailedScores are handled client-side for now
  themeScores: z
    .string()
    .describe(
      'A stringified JSON array of objects, where each object represents a day and the *overall* calculated scores (ranging from -2 to +2) for each theme. Each object has date (ISO-8601 format) and scores for themes such as Sen (dreaming/sleep quality), Nastawienie (mood quality/stability assessment), training, diet, social relations, family relations, self education.'
    ),
   // Optional: Add detailedScores if AI needs to analyze question-level data in the future
  // detailedThemeScores: z
  //   .string()
  //   .optional()
  //   .describe(
  //     'A stringified JSON array of objects, where each object represents a day and the detailed scores (-0.25, 0, 0.25) for each of the 8 questions within each theme. Optional for now.'
  //   ),
});
export type AnalyzeMoodPatternsInput = z.infer<typeof AnalyzeMoodPatternsInputSchema>;

const AnalyzeMoodPatternsOutputSchema = z.object({
  insights: z.string().describe('Insights on factors influencing mood based on the logged overall scores, including observed correlations and actionable suggestions.'),
});
export type AnalyzeMoodPatternsOutput = z.infer<typeof AnalyzeMoodPatternsOutputSchema>;

export async function analyzeMoodPatterns(input: AnalyzeMoodPatternsInput): Promise<AnalyzeMoodPatternsOutput> {
  // Currently, the flow primarily uses the overall themeScores for analysis.
  // If detailed scores were passed, they could be incorporated here or in the prompt.
  return analyzeMoodPatternsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeMoodPatternsPrompt',
  input: { // Input schema matches the AnalyzeMoodPatternsInputSchema
    schema: AnalyzeMoodPatternsInputSchema,
  },
  output: { // Output schema matches AnalyzeMoodPatternsOutputSchema
    schema: AnalyzeMoodPatternsOutputSchema,
  },
  prompt: `You are a mood analysis expert. Analyze the primary logged moods and *overall theme scores* provided over time to identify potential factors influencing the user's mood and well-being. The overall theme scores range from -2 (very negative impact/quality) to +2 (very positive impact/quality), with 0 being neutral. The themes assessed are Sen, Nastawienie, Fitness, Odżywianie, Relacje zewnętrzne, Relacje rodzinne, and Rozwój intelektualny.

Primary Mood Data (JSON): {{{moodData}}}

Overall Theme Scores (JSON): {{{themeScores}}}

Based *only* on the provided overall scores and primary moods:
1. Identify any potential correlations (positive or negative) between specific themes (e.g., high 'Fitness' score, low 'Nastawienie') and reported primary moods (e.g., 'happy', 'sad'). Consider the 'Nastawienie' theme alongside others.
2. Note any significant shifts in primary mood and see if they correspond to changes in the *overall* theme scores around the same time.
3. Provide concise, actionable insights on what factors *might* be influencing the user's mood based on these *overall* patterns. Highlight potential positive and negative contributors.
4. Suggest potential, gentle areas of focus to improve well-being based *only* on the observed patterns in the *overall* data. Avoid making medical claims or diagnoses. Do not refer to individual question scores, only the overall theme scores.

Format your response clearly, highlighting the key findings and suggestions. Focus solely on the trends visible in the overall theme scores and primary moods provided.`,
});

const analyzeMoodPatternsFlow = ai.defineFlow<
  typeof AnalyzeMoodPatternsInputSchema,
  typeof AnalyzeMoodPatternsOutputSchema
>(
  {
    name: 'analyzeMoodPatternsFlow',
    inputSchema: AnalyzeMoodPatternsInputSchema,
    outputSchema: AnalyzeMoodPatternsOutputSchema,
  },
  async input => {
    // The flow receives the input matching AnalyzeMoodPatternsInputSchema
    // It passes this input directly to the prompt defined above.
    const {output} = await prompt(input);
    // Ensure output is not null before returning
    if (!output) {
        throw new Error("AI analysis did not return a valid output.");
    }
    return output;
  }
);