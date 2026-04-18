import React, { useEffect, useRef, useState } from 'react';
import Lottie from 'lottie-react';
import ttsService from '../services/ttsService';
import './GlobalAssistant.css';

/**
 * Leo - AI Voice Agent
 * 
 * A voice-first learning assistant powered by:
 * - Lottie animation (cute tiger mascot)
 * - Web Speech API for voice input
 * - Text-to-Speech for voice output
 * - Real-time command processing
 */
export default function GlobalAssistant() {
    try {
        const [tigerAnimation, setTigerAnimation] = useState(null);
        const [isListening, setIsListening] = useState(false);
        const [isSpeaking, setIsSpeaking] = useState(false);
        const [isInitialized, setIsInitialized] = useState(false);
        const [leoResponse, setLeoResponse] = useState('');
        const recognitionRef = useRef(null);
        const lottieRef = useRef(null);

        // Initialize Leo and load animation
        useEffect(() => {
            if (!isInitialized) {
                const loadAnimation = async () => {
                    try {
                        const response = await fetch('/assets/leo-tiger.json');
                        const animationData = await response.json();
                        setTigerAnimation(animationData);
                    } catch (error) {
                        console.error('Failed to load tiger animation:', error);
                    }
                };

                loadAnimation();
                setIsInitialized(true);
            }
        }, [isInitialized]);

        // Set up speech recognition
        useEffect(() => {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                console.warn('Speech Recognition not supported');
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
                if (final) {
                    processVoiceCommand(final.toLowerCase().trim());
                }
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
            };

            recognitionRef.current = recognition;

            return () => {
                recognition.abort();
            };
        }, []);

        // Process voice commands
        const processVoiceCommand = async (command) => {
            console.log('Processing command:', command);
            setIsSpeaking(true);

            let response = '';

            if (
                command.includes('hello') ||
                command.includes('hi') ||
                command.includes('hey')
            ) {
                response = "Hello! I'm Leo, your learning assistant. How can I help you today?";
            } else if (
                command.includes('what can you do') ||
                command.includes('help') ||
                command.includes('help me')
            ) {
                response = "I can help you with your lessons, answer questions, provide hints, and guide you through learning activities. Just tell me what you need!";
            } else if (
                command.includes('quit') ||
                command.includes('exit') ||
                command.includes('goodbye')
            ) {
                response = "Goodbye! Keep learning and have a great day!";
            } else if (
                command.includes('who are you') ||
                command.includes('tell me about yourself')
            ) {
                response = "I'm Leo, your friendly tiger learning assistant. I'm here to help you learn and have fun while doing it!";
            } else if (
                command.includes('thank you') ||
                command.includes('thanks')
            ) {
                response = "You're welcome! I'm always happy to help.";
            } else {
                response = `You said: ${command}. I'm learning to understand more commands. Can you ask me something specific like help or what can I do?`;
            }

            console.log('Leo response:', response);
            setLeoResponse(response);

            try {
                ttsService.speak(response, {
                    rate: 0.95,
                    pitch: 1.1,
                });

                // Reset speaking state after 10 seconds (max speech length)
                setTimeout(() => {
                    setIsSpeaking(false);
                }, 10000);
            } catch (error) {
                console.error('Error speaking:', error);
                setIsSpeaking(false);
            }
        };

        // Toggle voice listening
        const toggleListening = () => {
            if (isListening) {
                recognitionRef.current?.stop();
                setIsListening(false);
            } else if (!isSpeaking) {
                recognitionRef.current?.start();
            }
        };

        // Test function to directly test voice
        const testVoice = () => {
            console.log('Testing voice...');
            processVoiceCommand('hello');
        };

        return (
            <div
                className="leo-assistant-container"
                aria-label="Leo Voice Assistant"
                role="status"
                aria-live="polite"
            >
                {/* Leo Tiger Character Display */}
                <div className={`leo-character ${isListening ? 'listening' : ''} ${isSpeaking ? 'speaking' : ''}`}>
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

                    {/* Status Indicator */}
                    <div className="leo-status">
                        {isListening && <div className="listening-pulse" aria-label="Listening">🎙️</div>}
                        {isSpeaking && <div className="speaking-pulse" aria-label="Speaking">🔊</div>}
                    </div>
                </div>

                {/* Control Buttons */}
                <div className="leo-controls">
                    <button
                        className={`leo-listen-btn ${isListening ? 'active' : ''}`}
                        onClick={toggleListening}
                        disabled={isSpeaking}
                        aria-label={isListening ? 'Stop listening' : 'Start listening'}
                        title={isListening ? 'Stop listening' : 'Click to talk to Leo'}
                    >
                        {isListening ? '⏹️ Stop' : '🎤 Talk'}
                    </button>
                    <button
                        className="leo-listen-btn"
                        onClick={testVoice}
                        disabled={isSpeaking}
                        title="Test Leo's voice"
                        style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', fontSize: '12px' }}
                    >
                        🧪 Test
                    </button>
                </div>

                {/* Leo Response Text Display */}
                {leoResponse && (
                    <div
                        style={{
                            marginTop: '20px',
                            padding: '12px 16px',
                            background: 'rgba(79, 172, 254, 0.1)',
                            border: '2px solid rgba(79, 172, 254, 0.3)',
                            borderRadius: '8px',
                            color: '#4fac fe',
                            fontSize: '14px',
                            fontWeight: '500',
                            textAlign: 'center',
                            maxWidth: '200px',
                            margin: '20px auto 0',
                        }}
                    >
                        <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '6px' }}>Leo says:</div>
                        <div>{leoResponse}</div>
                    </div>
                )}

                {/* Init Message - Hidden but Accessible */}
                <div className="leo-init-message" aria-label="Leo initialized">
                    Leo ready to assist
                </div>
            </div>
        );
    } catch (error) {
        console.error('Error rendering Leo Assistant:', error);
        return null;
    }
}
