# LEO ADAPTIVE LEARNING ASSISTANT
## Complete Setup & Integration Guide

---

## **OVERVIEW**

Leo is a production-ready adaptive learning assistant that:
- ✅ Listens to student voice input
- ✅ Observes behavioral patterns (idle, hesitation, errors)
- ✅ Calls Claude API for intelligent responses
- ✅ Dynamically adapts UI (fonts, spacing, highlighting)
- ✅ Speaks responses back to students
- ✅ Provides real-time micro-interventions

---

## **ARCHITECTURE**

### **Frontend Flow**
```
User Input (Voice/Text)
    ↓
GlobalAssistant.jsx
    ↓
behaviorTracker.js (detects patterns)
    ↓
leoService.js (calls backend)
    ↓
Response received
    ↓
ttsService.js (speaks response)
    ↓
uiAdaptation.js (updates UI)
```

### **Backend Flow**
```
POST /api/leo-assist
    ↓
leoController.js (validates request)
    ↓
claudeClient.js (calls Claude API)
    ↓
leoPrompts.js (engineered system prompt)
    ↓
JSON response generated
    ↓
UI changes + voice guidance returned
```

---

## **PREREQUISITES**

### **Environment Variables**

Create a `.env` file in the backend root:

```bash
# Claude API
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000,http://localhost:5173

# Firebase (optional)
FIREBASE_PROJECT_ID=your-project
FIREBASE_PRIVATE_KEY=your-key
FIREBASE_CLIENT_EMAIL=your-email
```

Create a `.env` file in the frontend root:

```bash
REACT_APP_API_URL=http://localhost:5000
REACT_APP_ENVIRONMENT=development
```

---

## **INSTALLATION & SETUP**

### **1. Backend Setup**

```bash
cd backend

# Install dependencies
npm install @anthropic-ai/sdk express cors dotenv

# Start development server
npm run serve

# Or with nodemon for hot reload
npm install -g nodemon
nodemon functions/index.js
```

**Expected output:**
```
╔═══════════════════════════════════════╗
║     🐯 LEO BACKEND SERVICE READY 🐯    ║
║                                       ║
║  Port: 5000                           ║
║  Environment: development             ║
║  Claude Model: claude-3-5-sonnet      ║
╚═══════════════════════════════════════╝
```

### **2. Frontend Setup**

```bash
cd frontend

# Install dependencies
npm install

# Start dev server (Vite)
npm run dev

# Or build for production
npm run build
```

---

## **USAGE GUIDE**

### **1. Import GlobalAssistant in your React app**

```jsx
import GlobalAssistant from './components/GlobalAssistant';

export default function App() {
  const studentProfile = {
    name: 'Alex',
    learning_level: 'intermediate',
    language: 'en',
  };

  const lessonContext = {
    lesson_id: 'math-101',
    topic: 'Fractions',
    current_activity: 'fraction-division',
  };

  return (
    <div className="app">
      {/* Your lesson content */}
      <div className="lesson-content">
        {/* Content here */}
      </div>

      {/* Leo Assistant */}
      <GlobalAssistant
        studentProfile={studentProfile}
        lessonContext={lessonContext}
      />
    </div>
  );
}
```

### **2. User Interactions**

**Voice Input:**
- Click "🎤 Talk" button
- Grant microphone permission (browser will ask)
- Speak a command/question
- Leo processes and responds with voice + text

**Test Mode:**
- Click "🧪 Test" button
- Leo responds with "Hello! I'm Leo..."
- Perfect for debugging

**Manual Input (Advanced):**
```jsx
// Programmatically send input to Leo
import leoService from './services/leoService';

const response = await leoService.sendToLeo({
  user_input: 'I need help with this question',
  student_profile: { name: 'Alex', learning_level: 'intermediate' },
  lesson_context: { topic: 'Fractions' },
});

console.log(response.response); // Leo's text response
// Leo also speaks this automatically
```

---

## **FILE STRUCTURE REFERENCE**

### **Frontend**

```
frontend/src/
├── components/
│   └── GlobalAssistant.jsx                    # Main component
├── services/
│   ├── behaviorTracker.js                     # Behavior observation
│   ├── leoService.js                          # API client
│   ├── ttsService.js                          # Text-to-speech
│   └── sttService.js                          # Speech-to-text
├── utils/
│   ├── leoPrompts.js                          # Prompt templates
│   └── uiAdaptation.js                        # UI transformation
└── styles/
    └── GlobalAssistant.css                    # Styling
```

### **Backend**

```
backend/
├── functions/
│   └── index.js                               # Express app & routes
├── api/
│   ├── leo.js                                 # Main controller
│   └── utils/
│       ├── claudeClient.js                    # Claude API wrapper
│       └── leoPrompts.js                      # Prompt engineering
```

---

## **API ENDPOINTS**

### **POST /api/leo-assist** (Main endpoint)

**Request:**
```json
{
  "user_input": "I don't understand fractions",
  "content": { "topic": "fractions" },
  "student_profile": {
    "name": "Alex",
    "learning_level": "beginner",
    "language": "en"
  },
  "behavior_state": {
    "is_idle": false,
    "is_hesitating": true,
    "recent_error_count": 2,
    "confidence_level": 0.3,
    "time_on_task_ms": 45000
  },
  "lesson_context": { "lesson_id": "math-101" }
}
```

**Response:**
```json
{
  "success": true,
  "action": "simplify",
  "response": "Let's break fractions into simpler parts. A fraction is just a piece of a whole.",
  "ui_changes": {
    "font_size": "large",
    "font_family": "open_dyslexic",
    "highlight": ["fraction", "piece"],
    "spacing": "wide",
    "color_hint": "success"
  },
  "next_action": "await_input",
  "confidence": 0.85
}
```

### **POST /api/leo/hint**

Get a hint for a specific activity.

### **POST /api/leo/simplify**

Request content simplification.

---

## **KEY FEATURES EXPLAINED**

### **1. Behavior Tracking**

Automatically detects:

- **Idle:** No interaction for 8+ seconds
- **Hesitation:** 3+ seconds thinking time
- **Repeated Errors:** Same error twice in 10 seconds
- **Confidence:** Calculated from error/success ratio

```javascript
import { getLeoAdaptiveState } from './services/behaviorTracker';

const state = getLeoAdaptiveState();
// {
//   is_idle: false,
//   is_hesitating: true,
//   time_since_last_action_ms: 3500,
//   time_on_task_ms: 120000,
//   recent_error_count: 1,
//   confidence_level: 0.6,
//   engagement: "exploring"
// }
```

### **2. Claude Prompt Engineering**

Leo's system prompt automatically adapts based on behavior:

```
IF is_idle → Re-engage warmly
IF is_hesitating → Offer gentle hint
IF recent_errors >= 2 → Simplify explanation
IF confidence < 0.4 → Be encouraging
IF progressing well → Challenge slightly
```

### **3. UI Adaptation**

Leo can request dynamic UI changes:

```javascript
{
  "font_size": "large|extra_large",
  "font_family": "default|open_dyslexic",
  "spacing": "normal|wide",
  "highlight": ["key", "concepts"],
  "color_hint": "neutral|warning|success"
}
```

These are automatically applied by `uiAdaptation.js`.

### **4. Voice Integration**

- **Speech Recognition:** Web Speech API
- **Text-to-Speech:** Web Speech API (browser native)
- **Fallback:** If voices not loading, service retries

---

## **TESTING & DEBUGGING**

### **Test Case 1: Basic Functionality**

```bash
# 1. Start backend
cd backend && npm run serve

# 2. Start frontend
cd frontend && npm run dev

# 3. Click "🧪 Test" button in browser
# Expected: Leo says "Hello! I'm Leo..." and speaks it
```

### **Test Case 2: Voice Input**

```
1. Click "🎤 Talk"
2. Grant microphone permission
3. Say: "hello"
4. Expected: Leo responds with greeting text + voice
```

### **Test Case 3: Error Recovery**

```
1. Stop backend server
2. Click "🎤 Talk" and say something
3. Expected: Error response + fallback message
4. Start backend again
5. Should work normally
```

### **Enable Debug Logging**

```javascript
// In any service file
localStorage.setItem('LEO_DEBUG', 'true');

// This will log:
// [Leo] User input: ...
// [Leo] API response: ...
// [Leo] Behavior state: ...
```

---

## **PERFORMANCE TUNING**

### **Claude API Optimization**

```javascript
// Use faster model for simple queries
const model = response.length < 100 
  ? 'claude-3-haiku-20240307'  // Faster, cheaper
  : 'claude-3-5-sonnet-20241022';  // More powerful
```

### **Caching Responses**

```javascript
// Cache frequently asked questions
const responseCache = new Map();

const cacheKey = `${userId}_${userInput}`;
if (responseCache.has(cacheKey)) {
  return responseCache.get(cacheKey);
}
```

### **Batch Operations**

```javascript
// Send multiple requests at once
Promise.all([
  leoService.getHint(activityId),
  leoService.simplifyContent(text),
  getOtherData(),
]);
```

---

## **TROUBLESHOOTING**

| Issue | Solution |
|-------|----------|
| No sound output | Check browser volume, check system volume, test with muted speakers |
| Microphone not working | Grant permission in browser settings, test in incognito mode |
| Leo responds slowly | Check API key limit, upgrade Claude plan, use streaming |
| Voices not available | Clear browser cache, restart browser, try different browser |
| API key error | Verify `ANTHROPIC_API_KEY` in `.env`, check for typos |
| CORS errors | Check `FRONTEND_URL` in backend `.env`, ensure it matches frontend origin |
| Component not rendering | Check browser console for errors, verify Lottie animation loading |

---

## **PRODUCTION DEPLOYMENT**

### **Environment Setup**

```bash
# Backend
NODE_ENV=production
ANTHROPIC_API_KEY=sk-prod-key-here
PORT=8000

# Frontend (build)
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_ENVIRONMENT=production
```

### **Build & Deploy**

```bash
# Build frontend
cd frontend
npm run build
# Output: dist/ folder

# Deploy backend (e.g., Firebase Functions, AWS Lambda, Heroku)
cd backend
firebase deploy --only functions

# Or package for Docker
docker build -t leo-backend .
docker run -p 8000:8000 leo-backend
```

---

## **NEXT STEPS & ENHANCEMENTS**

### **Phase 2 Features**
- [ ] Multi-language support (Claude translates)
- [ ] Persistent conversation history
- [ ] Analytics dashboard (student progress)
- [ ] Teacher configuration panel
- [ ] A/B testing of different prompt strategies
- [ ] WebRTC for better voice quality

### **Phase 3 Features**
- [ ] Computer vision (analyze student's workspace)
- [ ] Integration with LMS (Canvas, Moodle)
- [ ] Mobile app (React Native)
- [ ] Offline support (service workers)
- [ ] Custom avatar training

---

## **CODE EXAMPLES**

### **Example 1: Log errors for Leo**

```javascript
import { logLeoError } from './services/behaviorTracker';

try {
  // Do something
} catch (error) {
  logLeoError('division_error', {
    operation: 'divide',
    numerator: 5,
    denominator: 0,
  });
  // Leo will adjust response based on this
}
```

### **Example 2: Request hints from Leo**

```javascript
import leoService from './services/leoService';

const hint = await leoService.getHint('activity-123', {
  current_attempt: 'incorrect answer',
  topic: 'quadratic equations',
});

console.log(hint.response); // Leo's hint
```

### **Example 3: Adapt UI based on Leo response**

```javascript
import { applyUIChanges } from './utils/uiAdaptation';

// After getting Leo response
const { ui_changes } = claudeResponse;

applyUIChanges(ui_changes, '.lesson-content');
// Changes font, spacing, highlighting as recommended
```

---

## **SUPPORT & RESOURCES**

- **Claude API Docs:** https://docs.anthropic.com
- **Web Speech API:** https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
- **Lottie Documentation:** https://airbnb.io/lottie/web.html
- **React Hooks Guide:** https://react.dev/reference/react/hooks

---

## **SUMMARY**

Leo is now ready to power adaptive learning experiences at Luminaaa! The system is:

✅ **Production-ready** - Handles errors, validates input, provides fallbacks
✅ **Scalable** - Modular architecture supports future enhancements
✅ **Accessible** - ARIA labels, screen reader support, voice interface
✅ **Intelligent** - Claude adapts responses based on real behavior patterns
✅ **User-friendly** - Warm, encouraging tone; visual & audio feedback

Deploy with confidence! 🐯

---

**Last Updated:** April 2026
**Version:** 1.0.0
