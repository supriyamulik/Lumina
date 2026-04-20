"""
SmartPen Backend v3
ESP32 → USB Serial → Python → WebSocket → Browser
"""

import asyncio
import json
import serial
import serial.tools.list_ports
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import threading

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class ConnectionManager:
    def __init__(self):
        self.web_clients: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.web_clients.append(ws)

    def disconnect(self, ws: WebSocket):
        if ws in self.web_clients:
            self.web_clients.remove(ws)

    async def broadcast(self, data: dict):
        dead = []
        for client in self.web_clients:
            try:
                await client.send_text(json.dumps(data))
            except:
                dead.append(client)
        for d in dead:
            self.web_clients.remove(d)

manager = ConnectionManager()


class IMUIntegrator:
    def __init__(self):
        self.reset()

    def reset(self):
        self.px = self.py = 0.0
        self.yaw = 0.0
        self.pitch = 0.0
        self.last_t = None

    def update(self, ax, ay, az, gx, gy, gz, ts_ms):
        if self.last_t is None:
            self.last_t = ts_ms
            return None

        dt = (ts_ms - self.last_t) / 1000.0
        self.last_t = ts_ms

        if dt <= 0 or dt > 0.5:
            return self.px, self.py

        if abs(gz) < 250: gz = 0
        if abs(gx) < 250: gx = 0

        g_scale = 1.0 / 131.0

        self.yaw += gz * g_scale * dt
        self.pitch += gx * g_scale * dt

        pixels_per_degree = 25.0
        self.px = self.yaw * pixels_per_degree
        self.py = self.pitch * pixels_per_degree

        return round(self.px, 2), round(self.py, 2)


integrator = IMUIntegrator()

session = {"letter": "A", "is_drawing": False, "stroke_count": 0}

serial_port = None
loop_ref = None
esp32_connected = False


def find_esp32_port():
    ports = serial.tools.list_ports.comports()
    for p in ports:
        if any(x in p.description for x in ['CP210', 'CH340', 'USB Serial', 'UART']):
            return p.device
    return ports[0].device if ports else None


def serial_reader():
    global serial_port, esp32_connected, loop_ref

    port = find_esp32_port()
    if not port:
        return

    ser = serial.Serial(port, 115200, timeout=1)
    serial_port = ser
    esp32_connected = True

    while True:
        line = ser.readline().decode(errors='ignore').strip()
        if not line:
            continue

        try:
            data = json.loads(line)
        except:
            continue

        t = data.get("type")

        if t == "stroke_start":
            session["is_drawing"] = True
            integrator.reset()
            asyncio.run_coroutine_threadsafe(
                manager.broadcast({"type": "stroke_start"}), loop_ref
            )

        elif t == "stroke_end":
            session["is_drawing"] = False
            asyncio.run_coroutine_threadsafe(
                manager.broadcast({"type": "stroke_end"}), loop_ref
            )

        elif t == "imu" and session["is_drawing"]:
            res = integrator.update(
                data["ax"], data["ay"], data["az"],
                data["gx"], data["gy"], data["gz"],
                data["ts"]
            )
            if res:
                x, y = res
                asyncio.run_coroutine_threadsafe(
                    manager.broadcast({"type": "point", "x": x, "y": y}),
                    loop_ref
                )


@app.get("/")
async def home():
    return FileResponse("../frontend/index.html")


@app.websocket("/ws/web")
async def ws_endpoint(ws: WebSocket):
    await manager.connect(ws)
    try:
        while True:
            msg = json.loads(await ws.receive_text())

            if msg["type"] == "reset":
                await manager.broadcast({"type": "reset"})

            elif msg["type"] == "set_letter":
                session["letter"] = msg["letter"]

            elif msg["type"] == "score":
                await manager.broadcast(msg)

            elif msg["type"] == "recalibrate":
                if serial_port:
                    serial_port.write(b"RECALIBRATE\n")

    except WebSocketDisconnect:
        manager.disconnect(ws)


@app.on_event("startup")
async def startup():
    global loop_ref
    loop_ref = asyncio.get_event_loop()
    threading.Thread(target=serial_reader, daemon=True).start()


if __name__ == "__main__":
    uvicorn.run("main_serial:app", host="0.0.0.0", port=8000)