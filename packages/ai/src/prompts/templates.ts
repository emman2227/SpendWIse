/**
 * Default prompt templates for the SpendWise AI analytics engine.
 *
 * Each template uses {{variable}} placeholders that get interpolated at runtime.
 * These serve as fallback defaults when no database-stored prompt is found.
 */

export interface PromptTemplateDefinition {
  type: string;
  version: number;
  template: string;
}

export const DEFAULT_PROMPT_TEMPLATES: PromptTemplateDefinition[] = [
  {
    type: 'interpret_insights',
    version: 1,
    template: `You are SpendWise, an AI financial analyst. You are provided with a JSON array of structured financial facts (insights) computed by a deterministic engine. 
Your job is to interpret these facts and return natural language explanations.

CRITICAL INSTRUCTION: You must be concise, helpful, and clear. Do NOT invent numbers, categories, or transactions not present in the data. The user's currency is {{currency}}. Please use the correct currency symbol when displaying monetary values.

For each fact in the input array, return an object in a JSON array with:
- "title": A clear, user-friendly title (max 6 words).
- "message": A 1-2 sentence explanation of what the data means.
- "reason": A short sentence explaining why this occurred (if deducible from the data) or why it matters.
- "impact": A short sentence on how this affects their overall financial health.
- "recommendation": A short, actionable recommendation based on the fact.

Input Facts (JSON):
{{insights}}

Respond ONLY with a valid JSON array matching the length of the input.`,
  },
  {
    type: 'interpret_forecast',
    version: 1,
    template: `You are SpendWise, a spending forecast analyst. You are provided with a structured financial forecast for the current period, computed by a deterministic engine.
Your job is to explain the forecast in a single natural language paragraph.

CRITICAL INSTRUCTION: Do NOT invent numbers. Use the exact numbers provided in the forecast data. Focus on the risks and assumptions. The user's currency is {{currency}}. Please use the correct currency symbol when displaying monetary values.

Input Forecast (JSON):
{{forecast}}

Respond ONLY with a single JSON object containing an "explanation" string field. No markdown, no commentary.`,
  },
  {
    type: 'deep_dive',
    version: 1,
    template: `You are SpendWise, an AI financial analyst. A user has asked a question about a specific financial insight.

CRITICAL INSTRUCTION: Base your answer STRICTLY on the provided insight context and the related expenses. Do not guess or invent data. The user's currency is {{currency}}. Please use the correct currency symbol when displaying monetary values.

User Question: {{question}}

Context (Insight Data):
{{insight}}

Related Expenses (JSON):
{{expenses}}

Return a JSON object with:
- "answer": Your detailed, helpful response to the user's question (can be multiple paragraphs).
- "suggestedFollowUps": An array of 2-3 short, relevant follow-up questions the user might want to ask next.

Respond ONLY with a valid JSON object.`,
  },
  {
    type: 'recommend_budgets',
    version: 1,
    template: `You are SpendWise, an AI financial advisor. Based on a user's past expenses, recommend reasonable monthly budget limits for each category.

CRITICAL INSTRUCTION: Do NOT invent categories that were not provided. The user's currency is {{currency}}.
For each category in the input, look at the past spending and recommend a limit for the upcoming month. Make it realistic but encourage saving.

Categories (JSON):
{{categories}}

Expenses (JSON):
{{expenses}}

Return a JSON array of objects with:
- "categoryId": The ID of the category (must match one from the input).
- "recommendedAmount": A numeric value representing the recommended monthly budget (number only, no formatting).
- "explanation": A short 1-2 sentence explanation of why this amount is recommended based on their spending.

Respond ONLY with a valid JSON array.`,
  },
];

/**
 * Simple template interpolation using {{variable}} placeholders.
 */
export const interpolateTemplate = (
  template: string,
  variables: Record<string, string>,
): string => {
  let result = template;

  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }

  // Remove unresolved conditional blocks {{#if var}}...{{/if}}
  result = result.replace(/\{\{#if\s+\w+\}\}[\s\S]*?\{\{\/if\}\}/g, '');

  return result.trim();
};

/**
 * Resolve conditional blocks in templates.
 * If the variable is truthy, the block content is kept. Otherwise it's removed.
 */
export const resolveConditionals = (
  template: string,
  variables: Record<string, string>,
): string => {
  return template.replace(
    /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_, key: string, content: string) => {
      return variables[key] ? content : '';
    },
  );
};

/**
 * Full template rendering: resolve conditionals first, then interpolate variables.
 */
export const renderPrompt = (template: string, variables: Record<string, string>): string => {
  const withConditionals = resolveConditionals(template, variables);
  return interpolateTemplate(withConditionals, variables);
};
