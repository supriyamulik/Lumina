# ✏️ SmartPen — Dyslexia Helper
Motion-tracking pen for children using ESP32 + MPU6050

---

## 📁 Project Structure
```
smartpen/
├── backend/
│   ├── main.py          ← FastAPI WebSocket server
│   └── requirements.txt
├── frontend/
│   └── index.html       ← Full web app (single file)
└── esp32/
    └── smartpen.ino     ← Arduino firmware
```

---

## 🚀 Quick Start

### 1. Backend (Python)
```bash
cd backend
pip install -r requirements.txt
python main.py
# → Server runs on http://0.0.0.0:8000
```

### 2. Frontend
Open browser at: **http://localhost:8000**
Or open `frontend/index.html` directly in browser
(change WS_URL in the script to point to your server IP)

### 3. ESP32
1. Open `esp32/smartpen.ino` in Arduino IDE
2. Install libraries:
   - `Links2004/arduinoWebSockets`  
   - `bblanchon/ArduinoJson`
3. Edit these lines:
   ```cpp
   #define WIFI_SSID      "your_wifi"
   #define WIFI_PASSWORD  "your_password"
   #define SERVER_HOST    "192.168.1.XXX"  ← your PC's IP
   ```
4. Upload to ESP32

---

## 🔌 Hardware Wiring

| Component  | ESP32 Pin |
|------------|-----------|
| MPU6050 SDA | GPIO 21 |
| MPU6050 SCL | GPIO 22 |
| MPU6050 VCC | 3.3V    |
| MPU6050 GND | GND     |
| Button (+)  | GPIO 15 |
| Button (-)  | GND     |
| LED (+)     | GPIO 2  |
| Buzzer (+)  | GPIO 4  |

---

## 📡 WebSocket Protocol

### ESP32 → Backend (`/ws/esp32`)
```json
{"type":"imu", "ax":512,"ay":-100,"az":16384, "gx":50,"gy":-20,"gz":5, "ts":12345}
{"type":"button", "action":"press"}
{"type":"button", "action":"release"}
{"type":"reset"}
```

### Backend → Browser (`/ws/web`)
```json
{"type":"esp32_status", "connected": true}
{"type":"stroke_start"}
{"type":"point", "x": 12.5, "y": -8.3}
{"type":"stroke_end"}
{"type":"reset"}
{"type":"letter_changed", "letter": "B"}
```

### Browser → Backend
```json
{"type":"set_letter", "letter": "A"}
{"type":"reset"}
{"type":"score", "accuracy": 87, "letter": "A"}
```

---

## 🧪 Testing Without Hardware
Click **▶ Simulate** in the web app to inject fake letter tracing without an ESP32.

Or call: `GET http://localhost:8000/simulate/A`

---

## 📈 Accuracy Algorithm
Each traced point is compared to the nearest guide dot.
- Distance < ~10px = near perfect
- Distance > 80px = 0%
- Score = average closeness across all traced points

---

## 🛠️ Next Steps
- [ ] Replace dead-reckoning with Kalman filter for better position tracking
- [ ] Add stroke-order checking (are strokes drawn in correct sequence?)
- [ ] Sound feedback from buzzer based on accuracy score
- [ ] Save session data to SQLite for progress tracking
- [ ] Multi-child profiles
