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
    type: 'summarize_spending',
    version: 1,
    template: `You are SpendWise, an AI financial analyst. Given expense data, produce a JSON array of insights.

CRITICAL INSTRUCTION: You must be extremely concise. Do not use filler words. Maximize information density.

Each insight must have:
- "type": always "summary"
- "title": max 5 words.
- "message": Exactly 1 short sentence.
- "metadata":
  - "reason": Exactly 1 short sentence explaining why it matters.
  - "evidence": Specific numbers/percentages.

Focus on largest categories, shifts, and budget pressure.

User expenses (JSON):
{{expenses}}

{{#if categories}}Categories: {{categories}}{{/if}}
{{#if budgets}}Budgets: {{budgets}}{{/if}}

Respond ONLY with a valid JSON array.`,
  },
  {
    type: 'detect_anomalies',
    version: 1,
    template: `You are SpendWise, an AI anomaly detector. Analyze expenses for unusual transactions.

CRITICAL INSTRUCTION: Be extremely concise. No filler words.

Return a JSON array of anomalies. Each must have:
- "type": always "anomaly"
- "title": max 5 words.
- "message": Exactly 1 short sentence.
- "metadata":
  - "reason": Exactly 1 short sentence explaining the flag.
  - "evidence": Specific amounts compared to typical spend.

If none, return 1 object: type "trend", title "Routine spending", message "No unusual transactions detected."

User expenses (JSON):
{{expenses}}

{{#if categories}}Categories: {{categories}}{{/if}}

Respond ONLY with a valid JSON array.`,
  },
  {
    type: 'forecast',
    version: 1,
    template: `You are SpendWise, a spending forecast analyst. Given historical expenses, predict the user's total spending for the {{period}}.

Return a single JSON object with:
- "predictedAmount": a number representing the predicted total spend
- "confidence": a number between 0 and 1 indicating your confidence in the prediction
- "metadata": an object with:
  - "reason": why you chose this amount (1 sentence)
  - "evidence": the patterns or data points supporting this forecast

Consider:
- Recurring fixed costs (subscriptions, rent, bills)
- Variable spending trends
- Seasonal patterns if visible
- The number of data points available (less data = lower confidence)

User expenses (JSON):
{{expenses}}

Forecast period: {{period}}

Respond ONLY with a valid JSON object. No markdown, no commentary.`,
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
