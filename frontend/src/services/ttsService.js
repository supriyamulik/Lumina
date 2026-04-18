/**
 * src/services/ttsService.js
 * Web Speech API TTS wrapper for Luminaa
 */

const ttsService = {
  /**
   * Speak text with specific options for rate, pitch, and events
   */
  speak: (text, { rate = 1, pitch = 1.1, onWord, onEnd } = {}) => {
    // 1. Cancel any active speech
    window.speechSynthesis.cancel();

    // 2. Prepare the utterance
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = rate;
    utter.pitch = pitch;
    utter.lang = 'en-IN';

    // 3. Select a suitable voice (prioritize female English voices for companionship)
    const selectVoiceAndSpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      
      // Handle the "Empty Voices" bug (Bug 8)
      if (voices.length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          // Unbind once triggered to avoid loops
          window.speechSynthesis.onvoiceschanged = null;
          ttsService.speak(text, { rate, pitch, onWord, onEnd });
        };
        return;
      }

      const voice = 
        voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('female')) || 
        voices.find(v => v.lang.startsWith('en')) || 
        voices[0];

      if (voice) utter.voice = voice;

      // 4. Attach event listeners
      if (onWord) {
        utter.addEventListener('boundary', (event) => {
          if (event.name === 'word') {
            onWord(event);
          }
        });
      }
      if (onEnd) {
        utter.addEventListener('end', onEnd);
      }

      // 5. Trigger the speech
      window.speechSynthesis.speak(utter);
    };

    selectVoiceAndSpeak();
  },

  /**
   * Immediately stop all speech synthesis
   */
  stop: () => {
    window.speechSynthesis.cancel();
  },

  /**
   * Check if the synthesis system is currently active
   */
  isSpeaking: () => {
    return window.speechSynthesis.speaking;
  },
};

export default ttsService;
