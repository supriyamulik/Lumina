/**
 * RESPONSE PARSER
 * Validates and sanitizes Claude responses
 */

/**
 * Validate Leo response structure
 */
function validateLeoResponse(response) {
    const errors = [];

    // Check required fields
    if (!response.action) {
        errors.push('Missing "action" field');
    }

    if (!response.response) {
        errors.push('Missing "response" field');
    }

    // Validate action type
    const validActions = [
        'hint',
        'simplify',
        'encourage',
        're_engage',
        'support',
        'correct',
        'error_recover',
        'respond',
    ];

    if (response.action && !validActions.includes(response.action)) {
        errors.push(`Invalid action: ${response.action}`);
    }

    // Validate response length
    if (response.response && response.response.length > 500) {
        errors.push('Response too long (max 500 chars)');
    }

    // Validate UI changes if present
    if (response.ui_changes) {
        const validFontSizes = ['normal', 'large', 'extra_large'];
        const validFonts = ['default', 'open_dyslexic'];
        const validSpacings = ['normal', 'wide'];
        const validColors = ['neutral', 'warning', 'success', 'error'];

        if (
            response.ui_changes.font_size &&
            !validFontSizes.includes(response.ui_changes.font_size)
        ) {
            errors.push(`Invalid font_size: ${response.ui_changes.font_size}`);
        }

        if (
            response.ui_changes.font_family &&
            !validFonts.includes(response.ui_changes.font_family)
        ) {
            errors.push(`Invalid font_family: ${response.ui_changes.font_family}`);
        }

        if (
            response.ui_changes.spacing &&
            !validSpacings.includes(response.ui_changes.spacing)
        ) {
            errors.push(`Invalid spacing: ${response.ui_changes.spacing}`);
        }

        if (
            response.ui_changes.color_hint &&
            !validColors.includes(response.ui_changes.color_hint)
        ) {
            errors.push(`Invalid color_hint: ${response.ui_changes.color_hint}`);
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * Sanitize response text
 */
function sanitizeResponse(text) {
    return text
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/[^\w\s?.!,\-']/g, '') // Remove special chars
        .substring(0, 500) // Cap length
        .trim();
}

/**
 * Fix common Claude response issues
 */
function fixCommonIssues(response) {
    // If action is missing, infer from response
    if (!response.action) {
        if (response.response.includes('hint')) {
            response.action = 'hint';
        } else if (response.response.includes('break')) {
            response.action = 'encourage';
        } else {
            response.action = 'respond';
        }
    }

    // Ensure response is under 500 chars
    if (response.response && response.response.length > 500) {
        response.response = response.response.substring(0, 497) + '...';
    }

    // Set confidence if missing
    if (!response.confidence_in_response) {
        response.confidence_in_response = 0.7;
    }

    return response;
}

/**
 * Create fallback response
 */
function createFallbackResponse(error) {
    return {
        action: 'error_recover',
        response: 'I had a little trouble. Can you try that again?',
        ui_changes: {},
        next_action: 'await_input',
        confidence_in_response: 0.3,
        error: error.message,
    };
}

module.exports = {
    validateLeoResponse,
    sanitizeResponse,
    fixCommonIssues,
    createFallbackResponse,
};
