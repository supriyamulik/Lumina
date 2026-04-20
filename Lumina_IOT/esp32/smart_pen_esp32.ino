/*
  SmartPen ESP32 Firmware v5
  - Fixed motion detection (lower thresholds)
  - Better high‑pass filter initialisation
  - Debug print for motion magnitude (optional)
*/

#include <Wire.h>
#include <EEPROM.h>

#define PIN_BUZZER  25
#define MPU_ADDR    0x68

// EEPROM addresses
#define EEPROM_SIZE 64
#define MAGIC_NUMBER 0xAA55
#define ADDR_MAGIC   0
#define ADDR_OFFSETS 4

struct Offsets {
  int16_t ax, ay, az;
  int16_t gx, gy, gz;
} calibOffsets;

bool offsetsValid = false;

// Motion detection thresholds – LOWERED for sensitivity
int16_t motionStartThreshold = 600;    // was 2500
int16_t motionEndThreshold  = 250;     // was motionStartThreshold/3
unsigned long idleTimeoutMs  = 400;    // was 600

int16_t ax, ay, az, gx, gy, gz;

bool isDrawing = false;
unsigned long lastSend = 0;
const uint16_t SEND_INTERVAL = 20;     // 20ms = 50Hz

unsigned long lastMovementTime = 0;
float hp_ax = 0, hp_ay = 0;            // high‑pass filter state

// Optional debug: print motion magnitude every second
bool debugMotion = true;               // set to false to disable

// ------------------------------------------------------------------
void beep(int freq, int dur) {
  tone(PIN_BUZZER, freq, dur);
  delay(dur + 20);
}

// ------------------------------------------------------------------
void mpuInit() {
  Wire.begin(21, 22);
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x6B);
  Wire.write(0x00);
  Wire.endTransmission();
  delay(200);

  // Accelerometer ±2g, Gyro ±250°/s
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x1C);
  Wire.write(0x00);
  Wire.endTransmission();

  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x1B);
  Wire.write(0x00);
  Wire.endTransmission();

  // DLPF
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x1A);
  Wire.write(0x05);
  Wire.endTransmission();

  delay(100);
}

// ------------------------------------------------------------------
void mpuRead() {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x3B);
  Wire.endTransmission(false);
  Wire.requestFrom(MPU_ADDR, 14, true);
  ax = (Wire.read() << 8) | Wire.read();
  ay = (Wire.read() << 8) | Wire.read();
  az = (Wire.read() << 8) | Wire.read();
  Wire.read(); Wire.read();
  gx = (Wire.read() << 8) | Wire.read();
  gy = (Wire.read() << 8) | Wire.read();
  gz = (Wire.read() << 8) | Wire.read();
}

// ------------------------------------------------------------------
void saveOffsetsToEEPROM() {
  EEPROM.begin(EEPROM_SIZE);
  uint16_t magic = MAGIC_NUMBER;
  EEPROM.put(ADDR_MAGIC, magic);
  EEPROM.put(ADDR_OFFSETS, calibOffsets);
  EEPROM.commit();
  EEPROM.end();
}

// ------------------------------------------------------------------
bool loadOffsetsFromEEPROM() {
  EEPROM.begin(EEPROM_SIZE);
  uint16_t magic;
  EEPROM.get(ADDR_MAGIC, magic);
  if (magic == MAGIC_NUMBER) {
    EEPROM.get(ADDR_OFFSETS, calibOffsets);
    EEPROM.end();
    return true;
  }
  EEPROM.end();
  return false;
}

// ------------------------------------------------------------------
void calibrateSensors() {
  Serial.println("{\"type\":\"status\",\"msg\":\"calibrating\"}");
  beep(1000, 100); delay(100);
  beep(1000, 100); delay(800);

  // Wait for stillness
  const int STILL_SAMPLES = 50;
  const int16_t MAX_VARIANCE = 300;
  bool still = false;
  long sum_ax, sum_ay, sum_az;
  long sum_gx, sum_gy, sum_gz;

  while (!still) {
    sum_ax = sum_ay = sum_az = 0;
    sum_gx = sum_gy = sum_gz = 0;
    for (int i = 0; i < STILL_SAMPLES; i++) {
      mpuRead();
      sum_ax += ax; sum_ay += ay; sum_az += az;
      sum_gx += gx; sum_gy += gy; sum_gz += gz;
      delay(5);
    }
    long mean_ax = sum_ax / STILL_SAMPLES;
    long mean_ay = sum_ay / STILL_SAMPLES;
    long mean_az = sum_az / STILL_SAMPLES;

    long var_ax = 0, var_ay = 0, var_az = 0;
    for (int i = 0; i < STILL_SAMPLES; i++) {
      mpuRead();
      var_ax += (ax - mean_ax) * (ax - mean_ax);
      var_ay += (ay - mean_ay) * (ay - mean_ay);
      var_az += (az - mean_az) * (az - mean_az);
      delay(5);
    }
    var_ax /= STILL_SAMPLES;
    var_ay /= STILL_SAMPLES;
    var_az /= STILL_SAMPLES;

    if (var_ax < MAX_VARIANCE && var_ay < MAX_VARIANCE && var_az < MAX_VARIANCE) {
      still = true;
    } else {
      delay(200);
    }
  }

  // Sample for real offsets
  const int SAMPLES = 200;
  sum_ax = sum_ay = sum_az = 0;
  sum_gx = sum_gy = sum_gz = 0;
  for (int i = 0; i < SAMPLES; i++) {
    mpuRead();
    sum_ax += ax; sum_ay += ay; sum_az += az;
    sum_gx += gx; sum_gy += gy; sum_gz += gz;
    delay(5);
  }

  calibOffsets.ax = sum_ax / SAMPLES;
  calibOffsets.ay = sum_ay / SAMPLES;
  calibOffsets.az = sum_az / SAMPLES;
  calibOffsets.gx = sum_gx / SAMPLES;
  calibOffsets.gy = sum_gy / SAMPLES;
  calibOffsets.gz = sum_gz / SAMPLES;
  calibOffsets.az -= 16384;   // remove gravity

  saveOffsetsToEEPROM();

  // Initialise high‑pass filter state to first raw values after calibration
  mpuRead();
  int16_t raw_ax = ax - calibOffsets.ax;
  int16_t raw_ay = ay - calibOffsets.ay;
  hp_ax = raw_ax;
  hp_ay = raw_ay;

  beep(1200, 100); delay(80); beep(1500, 100);
  Serial.println("{\"type\":\"status\",\"msg\":\"ready\"}");
  lastMovementTime = millis();
}

// ------------------------------------------------------------------
void calibrateMotionThresholds() {
  Serial.println("{\"type\":\"status\",\"msg\":\"motion_calib_start\"}");
  beep(1500, 100); delay(200); beep(1500, 100);
  delay(500);

  const int TAPS_REQUIRED = 5;
  int16_t peaks[TAPS_REQUIRED];
  int tapCount = 0;
  bool waitingForTap = true;

  while (tapCount < TAPS_REQUIRED) {
    mpuRead();
    int16_t raw_ax = ax - calibOffsets.ax;
    int16_t raw_ay = ay - calibOffsets.ay;
    float alpha = 0.9;
    hp_ax = alpha * hp_ax + (1.0 - alpha) * raw_ax;
    hp_ay = alpha * hp_ay + (1.0 - alpha) * raw_ay;
    int16_t motion = abs(raw_ax - hp_ax) + abs(raw_ay - hp_ay);

    if (waitingForTap && motion > 3000) {
      waitingForTap = false;
      unsigned long start = millis();
      int16_t peak = 0;
      while (millis() - start < 100) {
        mpuRead();
        raw_ax = ax - calibOffsets.ax;
        raw_ay = ay - calibOffsets.ay;
        hp_ax = alpha * hp_ax + (1.0 - alpha) * raw_ax;
        hp_ay = alpha * hp_ay + (1.0 - alpha) * raw_ay;
        int16_t val = abs(raw_ax - hp_ax) + abs(raw_ay - hp_ay);
        if (val > peak) peak = val;
        delay(5);
      }
      peaks[tapCount++] = peak;
      beep(2000, 50);
      delay(300);
      waitingForTap = true;
    }
    delay(10);
  }

  long sum = 0;
  for (int i = 0; i < TAPS_REQUIRED; i++) sum += peaks[i];
  motionStartThreshold = (sum / TAPS_REQUIRED) * 0.8;
  if (motionStartThreshold < 500) motionStartThreshold = 500;
  if (motionStartThreshold > 4000) motionStartThreshold = 4000;

  motionEndThreshold = motionStartThreshold / 3;
  if (motionEndThreshold < 150) motionEndThreshold = 150;

  beep(1200, 100); delay(100); beep(1800, 150);
  Serial.print("{\"type\":\"motion_calib_done\",\"start_thresh\":");
  Serial.print(motionStartThreshold);
  Serial.print(",\"end_thresh\":");
  Serial.print(motionEndThreshold);
  Serial.println("}");
}

// ------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(1000);
  pinMode(PIN_BUZZER, OUTPUT);
  mpuInit();

  if (loadOffsetsFromEEPROM()) {
    offsetsValid = true;
    Serial.println("{\"type\":\"status\",\"msg\":\"offsets_loaded\"}");
  } else {
    calibrateSensors();
  }

  // Initialise high‑pass filter state
  mpuRead();
  int16_t raw_ax = ax - calibOffsets.ax;
  int16_t raw_ay = ay - calibOffsets.ay;
  hp_ax = raw_ax;
  hp_ay = raw_ay;

  lastMovementTime = millis();
  Serial.println("{\"type\":\"status\",\"msg\":\"ready\"}");
}

// ------------------------------------------------------------------
void loop() {
  mpuRead();

  int16_t raw_ax = ax - calibOffsets.ax;
  int16_t raw_ay = ay - calibOffsets.ay;
  int16_t raw_az = az - calibOffsets.az;
  int16_t raw_gx = gx - calibOffsets.gx;
  int16_t raw_gy = gy - calibOffsets.gy;
  int16_t raw_gz = gz - calibOffsets.gz;

  // High‑pass filter (simple IIR)
  float alpha = 0.92;
  hp_ax = alpha * hp_ax + (1.0 - alpha) * raw_ax;
  hp_ay = alpha * hp_ay + (1.0 - alpha) * raw_ay;
  int16_t motion_magnitude = abs(raw_ax - hp_ax) + abs(raw_ay - hp_ay);

  // Optional debug output (once per second)
  if (debugMotion) {
    static unsigned long lastDebug = 0;
    if (millis() - lastDebug > 1000) {
      lastDebug = millis();
      Serial.print("{\"type\":\"debug\",\"motion\":");
      Serial.print(motion_magnitude);
      Serial.print(",\"start_thresh\":");
      Serial.print(motionStartThreshold);
      Serial.println("}");
    }
  }

  // Stroke detection
  bool isMovingNow = (motion_magnitude > motionStartThreshold);
  bool isMovingLight = (motion_magnitude > motionEndThreshold);

  if (isMovingNow) {
    lastMovementTime = millis();
    if (!isDrawing) {
      isDrawing = true;
      beep(1100, 40);
      Serial.println("{\"type\":\"stroke_start\"}");
    }
  } else if (isDrawing && !isMovingLight && (millis() - lastMovementTime > idleTimeoutMs)) {
    isDrawing = false;
    beep(900, 40);
    Serial.println("{\"type\":\"stroke_end\"}");
  }

  // Handle serial commands
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd == "RECALIBRATE") {
      calibrateSensors();
    }
    else if (cmd == "CALIB_MOTION") {
      calibrateMotionThresholds();
    }
    else if (cmd == "BEEP_OK") {
      beep(1200, 80); delay(100); beep(1500, 80);
    }
    else if (cmd == "BEEP_FAIL") {
      beep(400, 300);
    }
  }

  // Send IMU data during drawing
  if (isDrawing && (millis() - lastSend >= SEND_INTERVAL)) {
    lastSend = millis();

    char buf[128];
    snprintf(buf, sizeof(buf),
      "{\"type\":\"imu\",\"ax\":%d,\"ay\":%d,\"az\":%d,\"gx\":%d,\"gy\":%d,\"gz\":%d,\"ts\":%lu}",
      raw_ax, raw_ay, raw_az, raw_gx, raw_gy, raw_gz, millis()
    );
    Serial.println(buf);
  }
}