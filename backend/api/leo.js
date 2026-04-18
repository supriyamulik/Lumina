/**
 * LEO CONTROLLER
 * Main backend handler for Leo adaptive assistant requests
 */

const { callClaude } = require('./utils/claudeClient');
const { generateContextualPrompt } = require('./utils/leoPrompts');

/**
 * Main Leo assist endpoint handler
 * POST /api/leo-assist
 *
 * Request body:
 * {
 *   user_input: string,
 *   content: object,
 *   student_profile: { id, name, learning_level, language },
 *   behavior_state: { is_idle, is_hesitating, confidence_level, ... },
 *   lesson_context: object
 * }
 */
async function handleLeoAssist(req, res) {
    try {
        console.log('[leoController] Processing Leo assist request');

        const {
            user_input = '',
            content = {},
            student_profile = {},
            behavior_state = {},
            lesson_context = {},
        } = req.body;

        // Validate input
        if (!user_input || user_input.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'user_input is required',
            });
        }

        // Build context for Claude
        const studentProfile = {
            id: student_profile.id || 'anonymous',
            name: student_profile.name || 'Student',
            learning_level: student_profile.learning_level || 'intermediate',
            language: student_profile.language || 'en',
        };

        const behaviorState = {
            is_idle: behavior_state.is_idle || false,
            is_hesitating: behavior_state.is_hesitating || false,
            time_since_last_action_ms: behavior_state.time_since_last_action_ms || 0,
            time_on_task_ms: behavior_state.time_on_task_ms || 0,
            recent_error_count: behavior_state.recent_error_count || 0,
            confidence_level: behavior_state.confidence_level || 0.5,
            engagement: behavior_state.engagement || 'exploring',
        };

        // Log for debugging
        console.log('[leoController] User:', studentProfile.name);
        console.log('[leoController] Input:', user_input.substring(0, 60));
        console.log('[leoController] Behavior:', behaviorState);

        // Call Claude API
        const claudeResult = await callClaude(user_input, studentProfile, behaviorState);

        if (!claudeResult.success) {
            console.error('[leoController] Claude error:', claudeResult.error);

            return res.status(200).json({
                success: false,
                action: 'error',
                response: 'I had a little trouble. Can you try that again?',
                ui_changes: { color_hint: 'warning' },
            });
        }

        const leoResponse = claudeResult.data;

        // Validate Leo response structure
        if (!leoResponse.response) {
            console.warn('[leoController] Leo response missing "response" field');
            leoResponse.response = 'Let me help you with that.';
        }

        if (!leoResponse.action) {
            leoResponse.action = 'respond';
        }

        // Log response for monitoring
        console.log('[leoController] Leo action:', leoResponse.action);
        console.log('[leoController] Leo response:', leoResponse.response.substring(0, 50));

        // Build final response
        const finalResponse = {
            success: true,
            action: leoResponse.action,
            response: leoResponse.response,
            ui_changes: leoResponse.ui_changes || {},
            next_action: leoResponse.next_action || 'await_input',
            confidence: leoResponse.confidence_in_response || 0.5,
            timestamp: new Date().toISOString(),
        };

        res.status(200).json(finalResponse);
    } catch (error) {
        console.error('[leoController] Unhandled error:', error);

        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message,
        });
    }
}

/**
 * Get hint for activity
 */
async function handleGetHint(req, res) {
    try {
        const { activity_id, attempt_context, student_profile, behavior_state } = req.body;

        const hintInput = `I need help with ${activity_id}. ${JSON.stringify(attempt_context)}`;

        const { callClaude } = require('./claudeClient');
        const result = await callClaude(
            hintInput,
            student_profile,
            { ...behavior_state, is_hesitating: true }
        );

        if (!result.success) {
            return res.status(200).json({
                success: false,
                action: 'error',
                response: 'I could not generate a hint. Try again?',
            });
        }

        res.status(200).json({
            success: true,
            ...result.data,
        });
    } catch (error) {
        console.error('[leoController] Hint error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * Parse user intent using Claude
 * POST /api/leo/parse-intent
 */
async function handleParseIntent(req, res) {
    try {
        const { user_input = '', context = {} } = req.body;

        if (!user_input || user_input.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'user_input is required',
            });
        }

        // Build intent parsing prompt
        const intentPrompt = buildIntentPrompt(user_input, context);

        // Call Claude to parse intent
        const { callClaude } = require('./claudeClient');
        const studentProfile = {
            name: context.student_name || 'Student',
            learning_level: 'intermediate',
            language: 'en',
        };

        const claudeResult = await callClaude(
            intentPrompt,
            studentProfile,
            {}
        );

        if (!claudeResult.success) {
            console.error('[leoController] Intent parse error:', claudeResult.error);

            // Return fallback intent
            return res.status(200).json({
                success: true,
                intent: 'unknown',
                confidence: 0.3,
                explanation: 'Could not parse intent',
            });
        }

        const intentData = claudeResult.data;

        res.status(200).json({
            success: true,
            intent: intentData.intent || 'unknown',
            target: intentData.target || null,
            confidence: intentData.confidence || 0.5,
            explanation: intentData.explanation || '',
        });
    } catch (error) {
        console.error('[leoController] Parse intent error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
}

/**
 * Build prompt for Claude to parse user intent
 */
function buildIntentPrompt(userInput, context) {
    const contextStr = context.currentLesson
        ? `Current lesson: ${context.currentLesson}`
        : 'No current lesson';

    return `Parse this voice command and extract the user's intent.

Voice input: "${userInput}"
Context: ${contextStr}

Available intent types:
- navigate_lesson: Go to a specific lesson (e.g., "Go to fractions")
- navigate_subject: Go to a subject (e.g., "Math" or "Science")
- navigate_chapter: Go to a chapter
- next_lesson: Go to the next lesson
- previous_lesson: Go to the previous lesson
- show_progress: Show student progress
- show_subjects: Show all subjects
- play_game: Play a game
- help: Ask for help/instructions
- repeat: Repeat the last message
- unknown: Cannot determine

Return ONLY valid JSON (no explanation):
{
  "intent": "INTENT_TYPE",
  "target": "specific_target_if_any",
  "confidence": 0.0-1.0,
  "explanation": "brief explanation"
}`;
}

module.exports = {
    handleLeoAssist,
    handleGetHint,
    handleParseIntent,
};
