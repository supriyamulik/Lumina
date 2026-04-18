/**
 * CLAUDE CLIENT
 * Wrapper for Claude API with Leo-specific prompt engineering
 */

const Anthropic = require('@anthropic-ai/sdk');
const { generateContextualPrompt, LEO_SYSTEM_PROMPT } = require('./leoPrompts');

const client = new Anthropic();

/**
 * Call Claude API with student context
 * @param {string} userInput - Student's input
 * @param {Object} studentProfile - Student info
 * @param {Object} behaviorState - Observed behavior
 * @returns {Promise<Object>} - Parsed Claude response
 */
async function callClaude(userInput, studentProfile, behaviorState) {
    try {
        console.log('[claudeClient] Calling Claude with input:', userInput.substring(0, 50));

        // Build contextual system prompt
        const systemPrompt = generateContextualPrompt(studentProfile, behaviorState);

        // Make API call
        const message = await client.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 500,
            system: systemPrompt,
            messages: [
                {
                    role: 'user',
                    content: userInput,
                },
            ],
        });

        // Extract response
        const responseText = message.content[0].text;
        console.log('[claudeClient] Raw response:', responseText);

        // Parse JSON response
        try {
            const parsed = JSON.parse(responseText);
            return {
                success: true,
                data: parsed,
                raw: responseText,
            };
        } catch (parseError) {
            console.error('[claudeClient] Failed to parse JSON:', parseError);
            // Try to extract JSON from response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    success: true,
                    data: parsed,
                    raw: responseText,
                };
            }

            return {
                success: false,
                error: 'Invalid JSON response from Claude',
                raw: responseText,
            };
        }
    } catch (error) {
        console.error('[claudeClient] Error calling Claude:', error);
        return {
            success: false,
            error: error.message,
        };
    }
}

/**
 * Generate a hint for a given activity
 */
async function generateHint(activityId, attemptContext, studentProfile) {
    const userInput = `Help with activity: ${activityId}\nContext: ${JSON.stringify(attemptContext)}`;
    return callClaude(userInput, studentProfile, { is_hesitating: true, recent_error_count: 1 });
}

/**
 * Simplify content for the student
 */
async function simplifyContent(contentText, studentProfile) {
    const userInput = `Simplify this content:\n${contentText}`;
    return callClaude(userInput, studentProfile, { confidence_level: 0.4 });
}

module.exports = {
    callClaude,
    generateHint,
    simplifyContent,
};
