# LEO DEVELOPER QUICK REFERENCE

## **5-Minute Setup**

```bash
# 1. Add API key
echo "ANTHROPIC_API_KEY=sk-ant-your-key" >> backend/.env

# 2. Start backend
cd backend && npm run serve

# 3. Start frontend (new terminal)
cd frontend && npm run dev

# 4. Open browser
# http://localhost:5173

# 5. Click 🧪 Test button
```

---

## **File Location Map**

| What | Where |
|------|-------|
| Main Component | `frontend/src/components/GlobalAssistant.jsx` |
| API Client | `frontend/src/services/leoService.js` |
| Behavior Tracking | `frontend/src/services/behaviorTracker.js` |
| Voice Output | `frontend/src/services/ttsService.js` |
| UI Adaptation | `frontend/src/utils/uiAdaptation.js` |
| Claude Prompts | `frontend/src/utils/leoPrompts.js` |
| Backend Routes | `backend/functions/index.js` |
| Leo Controller | `backend/api/leo.js` |
| Claude Client | `backend/api/utils/claudeClient.js` |

---

## **Core APIs**

### **Frontend Service Calls**

```javascript
// Send to Leo
import leoService from './services/leoService';
const res = await leoService.sendToLeo({
  user_input: 'help',
  student_profile: { name: 'Alex' },
  lesson_context: { topic: 'math' }
});

// Track behavior
import { logLeoError, updateLeoInteraction } from './services/behaviorTracker';
logLeoError('failed_attempt', { context: 'division' });
updateLeoInteraction();

// Apply UI changes
import { applyUIChanges } from './utils/uiAdaptation';
applyUIChanges({ font_size: 'large' }, '.lesson-content');

// Text-to-speech
import ttsService from './services/ttsService';
ttsService.speak('Hello!', { rate: 0.95, pitch: 1.1 });
```

### **Backend Endpoints**

```bash
# Main endpoint
POST /api/leo-assist
Body: { user_input, student_profile, behavior_state, ... }

# Get hint
POST /api/leo/hint

# Simplify content
POST /api/leo/simplify

# Health check
GET /health
```

---

## **Claude Prompt Structure**

```
System Prompt:
┌─────────────────────────────────────────┐
│ You are Leo, an adaptive assistant...   │
│ • Behavior interpretation                │
│ • Response strategy                      │
│ • Tone & style rules                     │
│ • JSON output format (REQUIRED!)         │
└─────────────────────────────────────────┘
     ↓
Student Context Injected:
- Name, learning level, language
- Behavior analysis (idle/hesitating/confident)
     ↓
User Input + Response
```

---

## **Behavior Adaptation Logic**

```javascript
// What Leo sees
const behavior = {
  is_idle: true,           // No interaction for 8s
  is_hesitating: true,     // 3+ seconds thinking
  recent_error_count: 2,   // Same error twice
  confidence_level: 0.3,   // 0-1 scale
  time_on_task_ms: 45000   // 45 seconds
};

// What Leo does
if (behavior.is_idle) {
  response = "Re-engage warmly";
  action = "re_engage";
} else if (behavior.is_hesitating) {
  response = "Offer gentle hint";
  action = "hint";
} else if (behavior.recent_error_count >= 2) {
  response = "Simplify explanation";
  action = "simplify";
} else if (behavior.confidence_level < 0.4) {
  response = "Be encouraging";
  action = "support";
} else {
  response = "Encourage to continue";
  action = "encourage";
}
```

---

## **UI Adaptation Options**

```javascript
{
  // Font size
  font_size: "normal" | "large" | "extra_large",
  
  // Font family
  font_family: "default" | "open_dyslexic",
  
  // Line spacing
  spacing: "normal" | "wide",
  
  // Highlight key words
  highlight: ["word1", "word2"],
  
  // Color hint
  color_hint: "neutral" | "warning" | "success"
}
```

---

## **Response JSON Template**

```json
{
  "action": "hint|simplify|encourage|re_engage|support|correct|error_recover",
  "response": "What Leo says (max 50 words)",
  "ui_changes": {
    "font_size": "normal|large|extra_large",
    "font_family": "default|open_dyslexic",
    "highlight": ["word"],
    "spacing": "normal|wide",
    "color_hint": "neutral|warning|success"
  },
  "next_action": "await_input|display_hint|wait_3s",
  "confidence_in_response": 0.85
}
```

---

## **Common Tasks**

### **Add Leo to a Page**
```jsx
import GlobalAssistant from './components/GlobalAssistant';

<GlobalAssistant 
  studentProfile={{name: 'Alex'}}
  lessonContext={{topic: 'math'}}
/>
```

### **Log an Error**
```javascript
import { logLeoError } from './services/behaviorTracker';
logLeoError('type', { context: 'data' });
```

### **Trigger Leo Programmatically**
```javascript
import leoService from './services/leoService';
leoService.sendToLeo({ user_input: 'text', ... });
```

### **Change UI Dynamically**
```javascript
import { applyUIChanges } from './utils/uiAdaptation';
applyUIChanges(response.ui_changes, '.lesson-content');
```

---

## **Environment Variables**

### Backend (.env)
```
ANTHROPIC_API_KEY=sk-ant-...
PORT=5000
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_ENVIRONMENT=development
```

---

## **Debugging**

```javascript
// Enable console logs
localStorage.setItem('LEO_DEBUG', 'true');

// Check behavior state
import { getLeoAdaptiveState } from './services/behaviorTracker';
console.log(getLeoAdaptiveState());

// Check API response
// Network tab → check POST /api/leo-assist

// Test API directly
curl -X POST http://localhost:5000/api/leo-assist \
  -H "Content-Type: application/json" \
  -d '{"user_input":"hello","student_profile":{},"behavior_state":{}}'
```

---

## **Performance Tips**

```javascript
// Cache responses
const cache = new Map();
cache.set(userInput, response);

// Debounce behavior tracking
const debouncedLog = debounce(() => {
  logBehavior();
}, 2000);

// Use streaming for long responses
// (Future enhancement)

// Minimize re-renders
useMemo(() => calculateConfidence(), [errors])
```

---

## **Troubleshooting**

| Problem | Fix |
|---------|-----|
| No sound | Check browser volume, grant mic permission |
| 404 /api/leo-assist | Backend not running or wrong URL |
| API Key error | Check `.env`, ensure key is valid |
| Slow responses | Check Claude API quota, use cheaper model |
| CORS error | Check `FRONTEND_URL` in backend `.env` |
| Voices not loading | Clear browser cache, restart browser |

---

## **Production Checklist**

- [ ] API key in environment
- [ ] HTTPS enabled
- [ ] CORS configured correctly
- [ ] Error monitoring set up
- [ ] Rate limiting added
- [ ] Input validation enabled
- [ ] Fallbacks tested
- [ ] Mobile tested
- [ ] Accessibility verified
- [ ] Performance profiled

---

## **Resources**

- [Claude API Docs](https://docs.anthropic.com)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Lottie](https://airbnb.io/lottie/web.html)
- [Express.js](https://expressjs.com)

---

**🐯 Leo Ready to Deploy!**
