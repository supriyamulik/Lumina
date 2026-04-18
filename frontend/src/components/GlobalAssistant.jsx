import React, { useEffect, useRef, useState } from 'react';
import Lottie from 'lottie-react';
import { useNavigate } from 'react-router-dom';
import ttsService from '../services/ttsService';
import leoService from '../services/leoService';
import { updateLeoInteraction, logLeoError, detectHesitation, initLeoTracking } from '../services/behaviorTracker';
import { applyUIChanges, injectAdaptationStyles } from '../utils/uiAdaptation';
import { parseUserIntent } from '../services/intentParser';
import { executeAction, formatActionResult } from '../services/actionHandler';
import './GlobalAssistant.css';

/**
 * LEO - Adaptive Learning Assistant Component
 * 
 * Features:
 * - Real-time voice input (Web Speech API)
 * - Adaptive responses via Claude API
 * - Behavior tracking (idle, hesitation, errors)
 * - Dynamic UI adaptation (fonts, spacing, highlighting)
 * - Lottie tiger animation
 * - Accessible and responsive
 */
export default function GlobalAssistant({ studentProfile = {}, lessonContext = {} }) {
    const navigate = useNavigate();
    const [tigerAnimation, setTigerAnimation] = useState(null);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [leoResponse, setLeoResponse] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [messages, setMessages] = useState([]);
    const recognitionRef = useRef(null);
    const lottieRef = useRef(null);
    const speakingTimeoutRef = useRef(null);

    // Initialize
    useEffect(() => {
        if (isInitialized) return;

        // Load tiger animation
        const loadAnimation = async () => {
            try {
                const response = await fetch('/assets/leo-tiger.json');
                const animationData = await response.json();
                setTigerAnimation(animationData);
            } catch (error) {
                console.error('[Leo] Failed to load tiger animation:', error);
            }
        };

        // Initialize adaptation styles
        injectAdaptationStyles();

        // Initialize behavior tracking
        initLeoTracking();

        loadAnimation();
        setIsInitialized(true);

        // Cleanup on unmount
        return () => {
            if (speakingTimeoutRef.current) {
                clearTimeout(speakingTimeoutRef.current);
            }
        };
    }, [isInitialized]);

    // Set up speech recognition
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn('[Leo] Speech Recognition API not available');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
            if (lottieRef.current) {
                lottieRef.current.play?.();
            }
        };

        recognition.onresult = (event) => {
            let final = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    final += transcript + ' ';
                }
            }
            if (final.trim()) {
                handleUserInput(final.toLowerCase().trim());
            }
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.onerror = (event) => {
            console.error('[Leo] Speech error:', event.error);
            setIsListening(false);
            logLeoError('speech_recognition_error', { error: event.error });
        };

        recognitionRef.current = recognition;

        return () => {
            recognition.abort();
        };
    }, []);

    /**
     * Handle user input with INTENT PARSING + ACTION EXECUTION
     * 1. Parse intent from voice input
     * 2. Execute action (navigate, show info, etc)
     * 3. Get Leo response
     * 4. Speak response back
     */
    const handleUserInput = async (userInput) => {
        updateLeoInteraction();
        detectHesitation();

        console.log('[Leo] User input:', userInput);
        setMessages((prev) => [...prev, { role: 'user', text: userInput }]);
        setIsThinking(true);

        try {
            // STEP 1: Parse intent from user input
            console.log('[Leo] Parsing intent...');
            const intent = await parseUserIntent(userInput, {
                currentLesson: lessonContext.lesson_id,
            });

            console.log('[Leo] Parsed intent:', intent);

            // STEP 2: Execute the action (navigate, etc)
            console.log('[Leo] Executing action...');
            let leoResponse = ''; // Initialize before use
            const actionResult = executeAction(intent, {
                navigate,
                currentLessonId: lessonContext.lesson_id,
                studentProgress: studentProfile.progress,
                lastLeoMessage: leoResponse || '',
            });

            const formatted = formatActionResult(actionResult);

            // STEP 3: Get adaptive response from Claude
            leoResponse = formatted.message;

            // If it's a complex intent, also get Claude's thoughts
            if (intent.intent !== 'unknown' && intent.confidence > 0.5) {
                const claudeResult = await leoService.sendToLeo({
                    user_input: userInput,
                    content: lessonContext,
                    student_profile: {
                        name: studentProfile.name || 'Student',
                        learning_level: studentProfile.learning_level || 'intermediate',
                        ...studentProfile,
                    },
                });

                if (claudeResult.success) {
                    leoResponse = claudeResult.response;
                }
            }

            // STEP 4: Display response
            setLeoResponse(leoResponse);
            setMessages((prev) => [...prev, { role: 'leo', text: leoResponse }]);

            // Apply UI adaptations
            if (formatted.metadata?.action === 'navigate') {
                applyUIChanges(
                    { color_hint: 'success', font_size: 'normal' },
                    '.lesson-content'
                );
            }

            // STEP 5: Speak response
            setIsSpeaking(true);
            ttsService.speak(leoResponse, {
                rate: 0.95,
                pitch: 1.1,
                onEnd: () => setIsSpeaking(false),
            });

            if (speakingTimeoutRef.current) {
                clearTimeout(speakingTimeoutRef.current);
            }
            speakingTimeoutRef.current = setTimeout(() => {
                setIsSpeaking(false);
            }, 15000);
        } catch (error) {
            console.error('[Leo] Error:', error);
            logLeoError('handler_error', { error: error.message });
            const errorMsg = 'I encountered an error. Can you try again?';
            setLeoResponse(errorMsg);
            ttsService.speak(errorMsg);
        } finally {
            setIsThinking(false);
        }
    };

    // Toggle voice listening
    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else if (!isSpeaking && !isThinking) {
            recognitionRef.current?.start();
        }
    };

    // Test function
    const testVoice = () => {
        console.log('[Leo] Test mode');
        handleUserInput('hello');
    };

    // Stop speaking
    const stopSpeaking = () => {
        ttsService.stop();
        setIsSpeaking(false);
    };

    return (
        <div
            className="leo-assistant-container"
            aria-label="Leo Adaptive Learning Assistant"
            role="status"
            aria-live="polite"
        >
            {/* Tiger Character */}
            <div className={`leo-character ${isListening ? 'listening' : ''} ${isSpeaking || isThinking ? 'speaking' : ''}`}>
                {tigerAnimation ? (
                    <Lottie
                        lottieRef={lottieRef}
                        animationData={tigerAnimation}
                        loop={true}
                        autoplay={false}
                        style={{ width: '140px', height: '140px' }}
                        aria-hidden="true"
                    />
                ) : (
                    <div className="leo-placeholder">🐯</div>
                )}

                {/* Status Indicators */}
                <div className="leo-status">
                    {isListening && <div className="listening-pulse" aria-label="Listening">🎙️</div>}
                    {(isSpeaking || isThinking) && <div className="speaking-pulse" aria-label="Speaking">🔊</div>}
                    {isThinking && <div className="thinking-pulse" aria-label="Thinking">💭</div>}
                </div>
            </div>

            {/* Control Buttons */}
            <div className="leo-controls">
                <button
                    className={`leo-listen-btn ${isListening ? 'active' : ''}`}
                    onClick={toggleListening}
                    disabled={isSpeaking || isThinking}
                    aria-label={isListening ? 'Stop listening' : 'Start listening'}
                    title="Talk to Leo"
                >
                    {isListening ? '⏹️ Stop' : '🎤 Talk'}
                </button>

                {isSpeaking && (
                    <button
                        className="leo-listen-btn"
                        onClick={stopSpeaking}
                        title="Stop Leo"
                        style={{ background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%)', fontSize: '12px' }}
                    >
                        ⏸️ Pause
                    </button>
                )}

                <button
                    className="leo-listen-btn"
                    onClick={testVoice}
                    disabled={isSpeaking || isThinking}
                    title="Test voice"
                    style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', fontSize: '12px' }}
                >
                    🧪 Test
                </button>
            </div>

            {/* Response Display */}
            {leoResponse && (
                <div
                    className="leo-response-bubble"
                    role="status"
                    aria-live="assertive"
                >
                    <div className="leo-response-label">Leo says:</div>
                    <div className="leo-response-text">{leoResponse}</div>
                </div>
            )}

            {/* Thinking Indicator */}
            {isThinking && (
                <div className="leo-thinking">
                    <span>⏳</span> Leo is thinking...
                </div>
            )}

            {/* Hidden status message for screen readers */}
            <div className="leo-sr-only" aria-live="assertive">
                {isListening ? 'Leo is listening' : ''}
                {isThinking ? 'Leo is processing your input' : ''}
                {isSpeaking ? 'Leo is speaking' : ''}
            </div>
        </div>
    );
}
