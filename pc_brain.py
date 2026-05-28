import pygetwindow as gw
import time, threading, requests, os, psutil, sys, subprocess, logging
import tkinter as tk
from tkinter import font
from datetime import datetime
from PIL import Image, ImageDraw
import pystray
from flask import Flask, jsonify, request
from flask_cors import CORS
from pyngrok import ngrok, conf  # pip install pyngrok
import subprocess
import socket
import re

# --- NGROK STATIC CONFIG ---
NGROK_AUTH_TOKEN = "cr_38nYq0OZnDLttCLs4eOArH1eQP8"  # Get from dashboard.ngrok.com
STATIC_DOMAIN = "phenomenologically-unbemoaned-kimberley.ngrok-free.dev" # Your static domain

# --- SILENCE TERMINAL ---
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR) 

# --- PATH CONFIGURATION ---
site_packages = r"C:\Users\aniak\AppData\Local\Packages\PythonSoftwareFoundation.Python.3.11_qbz5n2kfra8p0\LocalCache\local-packages\python311\site-packages"
if site_packages not in sys.path:
    sys.path.append(site_packages)

try:
    import cv2
    import numpy as np
except ImportError:
    cv2 = None

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True, allow_headers=["Content-Type", "ngrok-skip-browser-warning"])

# --- CONFIGURATION ---
UNLOCK_CODE = "0981" 
MONITOR_ON = False
SYSTEM_LOCKED = False      
BLACKLIST_ENABLED = False   
logs = [] 
NTFY_TOPIC = "secureguard_alerts" 
BLACKLIST = ["chat.google.com", "chat - google chrome", "whatsapp"]

# --- STEALTH NGROK STARTUP ---
def start_ngrok():
    global STATIC_DOMAIN
    try:
        # Kill existing processes without showing errors
        subprocess.run("taskkill /f /im ngrok.exe", shell=True, capture_output=True)
        
        conf.get_default().auth_token = NGROK_AUTH_TOKEN
        # Start the tunnel; creationflags=0x08000000 hides the console window on Windows
        ngrok.connect(5000, hostname=STATIC_DOMAIN)
    except:
        # Fallback manual launch if library fails
        cmd = f'ngrok http 5000 --url {STATIC_DOMAIN} --log=stdout > nul 2>&1'
        subprocess.Popen(cmd, shell=True, creationflags=0x08000000)

# --- NOTIFICATION & CAMERA ---

def send_ntfy_curl(message, title="🛡️ SECUREGUARD", priority="default", tags="shield"):
    """Sends notifications using stealth CURL."""
    p_val = "5" if priority == "urgent" else ("4" if priority == "high" else "3")
    cmd = ['curl', '-H', f'Title: {title}', '-H', f'Priority: {p_val}', '-H', f'Tags: {tags}', '-d', message, f'ntfy.sh/{NTFY_TOPIC}']
    subprocess.Popen(cmd, creationflags=0x08000000)
    
def capture_and_send_snapshot(custom_title="⚠️ INTRUDER DETECTED"):
    """Captures photo and sends using stealth CURL."""
    if cv2 is None: return
    try:
        cam = cv2.VideoCapture(0)
        time.sleep(0.5) 
        ret, frame = cam.read()
        if ret:
            img_path = "snapshot.jpg"
            cv2.imwrite(img_path, frame)
            cam.release()
            cmd = ['curl', '-H', f'Title: {custom_title}', '-H', 'Priority: 5', '-H', 'Tags: camera,lock', '-H', 'Filename: snapshot.jpg', '-T', img_path, f'ntfy.sh/{NTFY_TOPIC}']
            subprocess.Popen(cmd, creationflags=0x08000000)
    except: pass

def add_log(event_type, details):
    timestamp = datetime.now().strftime("%H:%M:%S")
    logs.insert(0, {"time": timestamp, "type": event_type, "msg": details})
    is_critical = any(x in (event_type + details).upper() for x in ["ONLINE", "DENIED", "INTRUDER", "VIOLATION"])
    
    if is_critical:
        send_ntfy_curl(f"{event_type}: {details}", priority="high", tags="warning")
    elif MONITOR_ON:
        send_ntfy_curl(f"{event_type}: {details}", priority="default", tags="eye")
    if len(logs) > 50: logs.pop()

# --- UPDATED MONITORING LOGIC ---

def monitor_apps():
    global SYSTEM_LOCKED, BLACKLIST_ENABLED, MONITOR_ON
    violation_cooldown = False 
    last_active = "" # Track the last window to detect changes

    while True:
        try:
            active = gw.getActiveWindowTitle()
            
            # 1. MONITOR MODE NOTIFS: Notify on every window change if MONITOR_ON is true
            if MONITOR_ON and active and active != last_active:
                # This calls add_log, which sends the 'priority: default' ntfy message
                add_log("ACTIVITY", f"Active Window: {active}")
                last_active = active

            # 2. BLACKLIST LOGIC: Only run if enabled
            if BLACKLIST_ENABLED:
                if active:
                    active_lower = active.lower()
                    is_blacklisted = any(site in active_lower for site in BLACKLIST)

                    if not is_blacklisted:
                        violation_cooldown = False

                    if not SYSTEM_LOCKED and is_blacklisted:
                        if not violation_cooldown:
                            add_log("SECURITY", f"Blacklist Violation: {active}")
                            violation_cooldown = True 
                            remote_lock()
            else:
                violation_cooldown = False 

        except Exception:
            pass
        time.sleep(1)
        
# --- SYSTEM TRAY LOGO ---

def create_icon_image():
    img = Image.new('RGB', (64, 64), color=(0, 0, 82))
    d = ImageDraw.Draw(img)
    d.rectangle([4, 4, 60, 60], outline=(212, 175, 55), width=4)
    try: d.text((18, 5), "S", fill=(212, 175, 55), font_size=45)
    except: pass
    return img

def tray_thread():
    icon = pystray.Icon("secureguard", create_icon_image(), "secureguard")
    icon.run()

# --- LOCK SCREEN UI ---

def show_lock_screen():
    global SYSTEM_LOCKED
    root = tk.Tk()
    root.attributes("-fullscreen", True, "-topmost", True)
    root.overrideredirect(True)

    def keep_on_top():
        if root.winfo_exists():
            root.attributes("-topmost", True)
            root.lift()
            root.focus_force() 
            root.after(50, keep_on_top)
    
    root.configure(bg='#0a0e14')
    root.protocol("WM_DELETE_WINDOW", lambda: None)
    
    bg_color, accent_blue, text_color, accent_gold = '#0a0e14', '#1e3a8a', '#e2e8f0', '#D4AF37'
    main_font = font.Font(family='Segoe UI', size=42, weight='bold')
    digit_font = font.Font(family='Consolas', size=22, weight='bold')

    tk.Label(root, text="🔒 SECUREGUARD PROTECTED 🔒", fg=accent_gold, bg=bg_color, font=main_font).pack(pady=(120, 20))
    display_var = tk.StringVar(value="")
    tk.Label(root, textvariable=display_var, fg=text_color, bg="#111827", font=digit_font, width=12, pady=15, relief="flat", highlightthickness=1, highlightbackground=accent_gold).pack(pady=30)

    def check():
        global SYSTEM_LOCKED
        if display_var.get() == UNLOCK_CODE:
            add_log("ACCESS GRANTED", "System Unlocked")
            SYSTEM_LOCKED = False  
            root.destroy()
        else:
            add_log("ACCESS DENIED", f"Failed Attempt: {display_var.get()}")
            display_var.set("INVALID")
            root.after(800, lambda: display_var.set(""))

    pad = tk.Frame(root, bg=bg_color)
    pad.pack()
    buttons = [('1',0,0), ('2',0,1), ('3',0,2), ('4',1,0), ('5',1,1), ('6',1,2), ('7',2,0), ('8',2,1), ('9',2,2), ('CLR',3,0), ('0',3,1), ('GO',3,2)]
    for (text, r, c) in buttons:
        fg = '#EF4444' if text == 'CLR' else ('#10B981' if text == 'GO' else '#F8FAFC')
        tk.Button(pad, text=text, font=digit_font, width=6, height=1, fg=fg, bg=accent_blue, relief="flat", 
                  command=check if text=='GO' else (lambda x=text: display_var.set("") if x=='CLR' else display_var.set(display_var.get()+x))).grid(row=r, column=c, padx=12, pady=12)
    
    keep_on_top()
    root.mainloop()

# --- NEW: NETWORK PRIORITY ROUTE ---
@app.route('/set-priority', methods=['POST', 'OPTIONS'])
def set_priority():
    if request.method == 'OPTIONS': 
        return '', 204
        
    data = request.json
    ssid = data.get('ssid')
    
    if not ssid:
        return jsonify({"status": "error", "message": "No SSID provided"}), 400

    try:
        # Commands to find IP and set Priority
        # 1. Get Local IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()

        # 2. Set Wi-Fi Profile Priority to 1
        # We use 'interface="Wi-Fi"' which is standard for Windows
        cmd = f'netsh wlan set profileorder name="{ssid}" interface="Wi-Fi" priority=1'
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        
        if result.returncode == 0:
            add_log("NETWORK", f"Priority 1 set for: {ssid}")
            return jsonify({
                "status": "success", 
                "message": f"PC ({local_ip}) is now Priority 1 on {ssid}"
            }), 200
        else:
            error_msg = result.stderr or "Check if SSID exists in saved networks."
            add_log("NETWORK ERROR", error_msg)
            return jsonify({"status": "error", "message": error_msg}), 500
            
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    
# --- API ROUTES ---
@app.route('/activity', methods=['GET'])
def get_activity():
    return jsonify({
        "logs": logs, 
        "monitor": MONITOR_ON,
        "isLocked": SYSTEM_LOCKED,
        "blacklistEnabled": BLACKLIST_ENABLED
    })

@app.route('/toggle-blacklist', methods=['POST', 'OPTIONS'])
def toggle_blacklist():
    global BLACKLIST_ENABLED
    if request.method == 'OPTIONS': return '', 204
    
    # Flip the state explicitly
    BLACKLIST_ENABLED = not BLACKLIST_ENABLED
    
    # Log the change so you see it in the phone's log list
    status_text = "ENABLED" if BLACKLIST_ENABLED else "DISABLED"
    add_log("SYSTEM", f"Auto-Blacklist: {status_text}")
    
    return jsonify({
        "status": "success",
        "blacklistEnabled": BLACKLIST_ENABLED
    }), 200

@app.route('/toggle', methods=['POST'])
def toggle_monitor():
    global MONITOR_ON
    MONITOR_ON = not MONITOR_ON
    add_log("SYSTEM", f"Monitor Mode: {'ON' if MONITOR_ON else 'OFF'}")
    return jsonify({"monitor_status": MONITOR_ON})

@app.route('/lock', methods=['POST'])
def remote_lock():
    global SYSTEM_LOCKED
    if SYSTEM_LOCKED: return jsonify({"status": "ALREADY_LOCKED"})
    SYSTEM_LOCKED = True
    threading.Thread(target=capture_and_send_snapshot, args=("🛡️ SECURITY ALERT: System Locked",), daemon=True).start()
    threading.Thread(target=show_lock_screen).start()
    add_log("SECURITY", "Lock Engaged")
    return jsonify({"status": "LOCKED"})

@app.route('/', methods=['GET'])
def health_check():
    return "SECUREGUARD SYSTEM ONLINE", 200

@app.route('/get-ping', methods=['POST', 'OPTIONS'])
def get_ping():
    if request.method == 'OPTIONS': 
        return '', 204
    
    try:
        # Pings Google DNS (-n 1 for Windows, 1 packet)
        cmd = "ping -n 1 8.8.8.8"
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        
        # Use regex to find "time=XXms" in the output
        time_match = re.search(r"time[=<](\d+)ms", result.stdout)
        
        if time_match:
            ping_ms = time_match.group(1)
            return jsonify({"status": "success", "ping": f"{ping_ms}"}), 200
        else:
            return jsonify({"status": "error", "message": "Ping timed out"}), 500
            
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    start_ngrok()
    threading.Thread(target=start_ngrok, daemon=True).start()
    add_log("SYSTEM", "SECUREGUARD ONLINE")
    threading.Thread(target=tray_thread, daemon=True).start() # Added Tray Thread
    threading.Thread(target=monitor_apps, daemon=True).start()
    app.run(host='0.0.0.0', port=5000, threaded=True, debug=False)