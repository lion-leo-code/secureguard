# 🛡️ SecureGuard

### Remote PC Security, Activity Monitoring & Network Control System

**SecureGuard** is a Windows-based PC security and remote-control system designed to provide an additional layer of protection through **remote system locking, application/activity monitoring, blacklist enforcement, intrusion notifications, webcam-based security snapshots, network prioritization, connectivity diagnostics, and a remotely accessible control interface**.

The system combines a **Python/Flask backend running locally on the protected Windows machine** with a web-based control interface, allowing security-related actions to be triggered remotely.

At its core, SecureGuard acts as a bridge between a physical Windows computer and a remote security dashboard:

```text
┌─────────────────────────────────────────────────────────────┐
│                     SECUREGUARD SYSTEM                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Remote Web Dashboard                                      │
│          │                                                  │
│          │ HTTP / REST API                                  │
│          ▼                                                  │
│   ┌───────────────────────┐                                 │
│   │     Flask Backend     │                                 │
│   │       pc_brain.py     │                                 │
│   └───────────┬───────────┘                                 │
│               │                                             │
│       ┌───────┼────────┬──────────┬───────────┐             │
│       ▼       ▼        ▼          ▼           ▼             │
│    Monitor  Lock     Network   Activity    Diagnostics      │
│              │        Control     Logs          │            │
│              ▼                                             │
│       Windows Operating System                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

SecureGuard is intended primarily as an **educational cybersecurity and system-administration project** rather than a replacement for a professional endpoint-security product.

---

# 📌 Table of Contents

* [Project Overview](#-project-overview)
* [Core Features](#-core-features)
* [System Architecture](#-system-architecture)
* [Technology Stack](#-technology-stack)
* [Backend Architecture](#-backend-architecture)
* [Remote Communication](#-remote-communication)
* [Activity Monitoring](#-activity-monitoring)
* [Blacklist Security System](#-blacklist-security-system)
* [Remote Lock Mechanism](#-remote-lock-mechanism)
* [Lock Screen Architecture](#-lock-screen-architecture)
* [Intrusion Snapshot System](#-intrusion-snapshot-system)
* [Notification System](#-notification-system)
* [Network Priority Control](#-network-priority-control)
* [Ping Diagnostics](#-ping-diagnostics)
* [System Tray Integration](#-system-tray-integration)
* [Logging Architecture](#-logging-architecture)
* [Concurrency & Multithreading](#-concurrency--multithreading)
* [REST API](#-rest-api)
* [Data Flow](#-data-flow)
* [Security Model](#-security-model)
* [Algorithms & Logic](#-algorithms--logic)
* [Error Handling](#-error-handling)
* [Performance Considerations](#-performance-considerations)
* [Project Structure](#-project-structure)
* [Installation](#-installation)
* [Configuration](#-configuration)
* [Running SecureGuard](#-running-secureguard)
* [API Reference](#-api-reference)
* [Example Security Workflow](#-example-security-workflow)
* [Limitations](#-limitations)
* [Security Considerations](#-security-considerations)
* [Future Improvements](#-future-improvements)
* [Educational Value](#-educational-value)
* [Conclusion](#-conclusion)

---

# 🔎 Project Overview

Traditional PC security solutions generally operate directly on the machine and are controlled locally. SecureGuard explores a different approach:

> **What if a Windows PC could expose a controlled security interface that allows authorized remote actions?**

SecureGuard implements this concept using a Python backend that runs on the protected computer.

The backend exposes HTTP endpoints through Flask. A remote frontend can communicate with these endpoints to:

* retrieve system activity;
* enable or disable monitoring;
* enable or disable blacklist enforcement;
* remotely lock the computer;
* prioritize a Wi-Fi network;
* measure network latency;
* inspect security events.

The backend also maintains local functionality independently of the dashboard.

For example, the application continuously monitors the currently active Windows window using `pygetwindow`. If blacklist enforcement is enabled and a prohibited application/window is detected, SecureGuard can automatically trigger the lock mechanism.

The system therefore combines:

**Remote Control + Local Monitoring + Automated Response + Event Logging + Notification**

into one security-oriented application.

---

# ✨ Core Features

## 🔐 1. Remote PC Lock

SecureGuard provides a `/lock` endpoint that allows the system to be locked remotely.

When activated:

1. The global lock state changes.
2. A security snapshot can be captured.
3. A fullscreen lock interface is launched.
4. The event is logged.
5. The protected machine remains locked until the correct unlock code is entered.

---

## 👁️ 2. Activity Monitoring

SecureGuard continuously checks the currently active Windows window.

When monitoring mode is enabled, changes in the active window are logged.

For example:

```text
ACTIVITY
Active Window: Google Chrome
```

or:

```text
ACTIVITY
Active Window: Visual Studio Code
```

The monitoring system operates continuously in a background thread.

---

## 🚫 3. Automatic Blacklist Detection

SecureGuard contains a configurable blacklist.

The current implementation includes entries such as:

```python
BLACKLIST = [
    "chat.google.com",
    "chat - google chrome",
    "whatsapp"
]
```

When blacklist mode is enabled, the active window title is compared against these entries.

If a match is detected:

```text
Active Window
      ↓
Convert to lowercase
      ↓
Compare against blacklist
      ↓
Blacklist match?
   ┌───────┴───────┐
  NO              YES
   │                │
Continue        Security Event
                    │
                    ▼
              Remote Lock
```

This provides an automated enforcement mechanism.

---

# 📸 4. Intrusion Snapshot

When the computer is remotely locked, SecureGuard attempts to capture an image using the system camera.

The project uses:

* OpenCV (`cv2`)
* NumPy
* `VideoCapture()`

The camera workflow is:

```text
Security Event
      ↓
Open Camera
      ↓
Capture Frame
      ↓
Save snapshot.jpg
      ↓
Upload through curl
      ↓
Send security notification
```

This allows a security alert to include visual evidence from the machine.

---

# 📱 5. Remote Notifications

SecureGuard integrates with **ntfy** for notification delivery.

Notifications are generated through `curl`.

The system supports different notification priorities:

```text
default → priority 3
high    → priority 4
urgent  → priority 5
```

Critical events such as:

* ONLINE
* DENIED
* INTRUDER
* VIOLATION

automatically trigger higher-priority notifications.

---

# 🌐 6. Remote Web Connectivity

SecureGuard uses **ngrok** to expose the locally running Flask service through a public tunnel.

The local application runs on:

```text
localhost:5000
```

while ngrok provides external access to the Flask server.

This enables the remote dashboard to communicate with the PC without requiring the user to manually configure traditional port forwarding.

---

# 📶 7. Wi-Fi Network Prioritization

SecureGuard includes a `/set-priority` endpoint.

The backend receives an SSID and uses the Windows `netsh` utility to modify the saved Wi-Fi profile priority.

The command used is conceptually:

```text
netsh wlan set profileorder
```

This allows SecureGuard to request that a selected Wi-Fi profile receive priority `1`.

The application also determines the machine's local IP address using a UDP socket connection.

---

# 📡 8. Network Ping Diagnostics

SecureGuard provides a network latency test.

It executes:

```text
ping -n 1 8.8.8.8
```

The response is then parsed using a regular expression.

For example:

```text
Reply from ...
time=24ms
```

is converted into:

```json
{
    "status": "success",
    "ping": "24"
}
```

---

# 🖥️ 9. System Tray Integration

SecureGuard can operate in the background using a Windows system-tray icon.

The tray functionality is implemented using:

```python
pystray
```

A custom icon is generated using Pillow.

The icon uses the SecureGuard visual identity:

* dark blue background;
* gold border;
* `S` branding.

---

# 🧠 System Architecture

SecureGuard follows a **client-server architecture**.

```text
                         INTERNET
                             │
                             ▼
                 ┌─────────────────────┐
                 │   SecureGuard Web    │
                 │      Interface      │
                 └──────────┬──────────┘
                            │
                         HTTP/JSON
                            │
                            ▼
                 ┌─────────────────────┐
                 │      Flask API      │
                 │     pc_brain.py     │
                 └──────────┬──────────┘
                            │
          ┌─────────────────┼──────────────────┐
          │                 │                  │
          ▼                 ▼                  ▼
     Monitoring         Security          Networking
          │                 │                  │
          ▼                 ▼                  ▼
   Active Windows      Lock Screen       Wi-Fi / Ping
   Blacklist           Camera            IP Detection
   Event Logs          Notifications      netsh
```

The architecture can be divided into four major layers.

### Layer 1 — User Interface

The remote web interface provides controls and displays information.

### Layer 2 — API Layer

Flask receives HTTP requests and routes them to appropriate functions.

### Layer 3 — Security Engine

Python manages:

* monitoring;
* blacklist enforcement;
* locking;
* snapshots;
* logging.

### Layer 4 — Operating System

SecureGuard interacts with Windows through:

* subprocess commands;
* window APIs;
* camera access;
* network configuration;
* system tray integration.

---

# 🐍 Technology Stack

| Technology  | Purpose                            |
| ----------- | ---------------------------------- |
| Python      | Core backend and system automation |
| Flask       | REST API server                    |
| Flask-CORS  | Cross-origin communication         |
| pygetwindow | Active-window monitoring           |
| OpenCV      | Camera capture                     |
| NumPy       | Image-processing dependency        |
| Tkinter     | Lock-screen GUI                    |
| Pillow      | Icon/image generation              |
| pystray     | System tray integration            |
| requests    | HTTP functionality                 |
| psutil      | System/process utilities           |
| pyngrok     | ngrok integration                  |
| socket      | Network/IP detection               |
| subprocess  | Windows command execution          |
| threading   | Background tasks                   |
| re          | Ping response parsing              |
| ntfy        | Push notifications                 |
| ngrok       | Remote tunnel                      |

---

# ⚙️ Backend Architecture

The primary backend file is:

```text
pc_brain.py
```

The application initializes Flask:

```python
app = Flask(__name__)
```

Cross-origin communication is enabled through Flask-CORS.

The application maintains global state variables:

```python
MONITOR_ON
SYSTEM_LOCKED
BLACKLIST_ENABLED
logs
```

These variables act as the runtime state machine for the application.

---

# 🔄 Runtime State Model

SecureGuard essentially operates through several Boolean states:

```text
MONITOR_ON
     │
     ├── False → Monitoring inactive
     │
     └── True  → Active-window monitoring enabled


BLACKLIST_ENABLED
     │
     ├── False → Blacklist ignored
     │
     └── True  → Active windows checked


SYSTEM_LOCKED
     │
     ├── False → Normal operation
     │
     └── True  → Lock screen active
```

These states can change dynamically through API calls or security events.

---

# 👁️ Activity Monitoring

The monitoring engine is implemented in:

```python
monitor_apps()
```

The function operates continuously:

```python
while True:
    ...
    time.sleep(1)
```

Every iteration attempts to obtain the active window:

```python
active = gw.getActiveWindowTitle()
```

The system keeps track of the previous window:

```python
last_active
```

This prevents repeated logging of the same window.

Conceptually:

```text
Current Window
      │
      ▼
Compare with last_active
      │
      ├── Same → Ignore
      │
      └── Different
             │
             ▼
       Create ACTIVITY log
```

This is a simple form of **event-change detection**.

---

# 🚫 Blacklist Algorithm

The blacklist engine uses substring matching.

The active window title is converted to lowercase:

```python
active_lower = active.lower()
```

The system then checks:

```python
any(site in active_lower for site in BLACKLIST)
```

Therefore the algorithm has the following behavior:

```text
Window title
     ↓
lowercase()
     ↓
For every blacklist entry
     ↓
Is entry contained in title?
     ↓
YES → Violation
NO  → Continue
```

This approach is simple and fast.

However, it is a **heuristic detection mechanism**, not a complete application-identification system.

---

# 🛑 Violation Cooldown

SecureGuard includes:

```python
violation_cooldown = False
```

This prevents the same continuously active blacklisted window from repeatedly triggering security actions every second.

Without this mechanism:

```text
Second 1 → Lock
Second 2 → Lock
Second 3 → Lock
Second 4 → Lock
...
```

could result in repeated security events.

Instead:

```text
Blacklist detected
       ↓
violation_cooldown = True
       ↓
Prevent duplicate response
       ↓
Blacklist disappears
       ↓
Reset cooldown
```

This is effectively a simple **debouncing mechanism**.

---

# 🔒 Remote Lock Mechanism

The `/lock` API route controls the security lock.

The workflow is:

```text
POST /lock
     ↓
Check SYSTEM_LOCKED
     ↓
Set SYSTEM_LOCKED = True
     ↓
Start camera thread
     ↓
Start lock-screen thread
     ↓
Log security event
     ↓
Return JSON response
```

The route returns:

```json
{
    "status": "LOCKED"
}
```

if successful.

---

# 🖥️ Lock Screen Architecture

The lock interface is implemented using Tkinter.

The application creates a fullscreen window:

```python
root.attributes(
    "-fullscreen",
    True,
    "-topmost",
    True
)
```

It also removes the standard window decoration:

```python
root.overrideredirect(True)
```

This creates a kiosk-style security interface.

The interface displays:

```text
🔒 SECUREGUARD PROTECTED 🔒
```

along with a numeric keypad.

---

# 🔢 Unlock Authentication

SecureGuard uses a numeric unlock code.

The current implementation stores the code in the Python source.

When the user submits the code:

```python
if display_var.get() == UNLOCK_CODE:
```

the system either:

```text
Correct Code
     ↓
ACCESS GRANTED
     ↓
SYSTEM_LOCKED = False
     ↓
Destroy Lock Window
```

or:

```text
Incorrect Code
     ↓
ACCESS DENIED
     ↓
Log failed attempt
     ↓
Display INVALID
```

This is a basic local authentication mechanism.

It should **not** be considered cryptographically secure authentication.

---

# 📷 Camera Capture Pipeline

SecureGuard uses OpenCV:

```python
cam = cv2.VideoCapture(0)
```

A frame is captured:

```python
ret, frame = cam.read()
```

The frame is then written to:

```text
snapshot.jpg
```

The image is subsequently uploaded using `curl`.

The capture operation is executed inside a background thread when the system is remotely locked.

This prevents the Flask request handler from having to perform the entire camera workflow synchronously.

---

# 📲 Notification Architecture

The notification engine is:

```python
send_ntfy_curl()
```

It constructs a command containing:

* title;
* priority;
* tags;
* message;
* ntfy topic.

Conceptually:

```text
Security Event
      ↓
add_log()
      ↓
Critical?
   ┌────┴────┐
  YES       NO
   │          │
High         Default
Priority     Priority
   │          │
   └────┬─────┘
        ▼
      ntfy.sh
        ↓
  Remote Notification
```

---

# 📝 Logging System

SecureGuard maintains an in-memory event log:

```python
logs = []
```

Each entry follows the structure:

```python
{
    "time": timestamp,
    "type": event_type,
    "msg": details
}
```

Example:

```json
{
    "time": "14:32:08",
    "type": "SECURITY",
    "msg": "Lock Engaged"
}
```

The application keeps only the most recent 50 entries:

```python
if len(logs) > 50:
    logs.pop()
```

This prevents unlimited memory growth during long-running sessions.

---

# 🌐 REST API

SecureGuard exposes several HTTP endpoints.

## GET `/`

Health-check endpoint.

Response:

```text
SECUREGUARD SYSTEM ONLINE
```

---

## GET `/activity`

Returns the current system state and event log.

Example structure:

```json
{
    "logs": [],
    "monitor": true,
    "isLocked": false,
    "blacklistEnabled": true
}
```

---

## POST `/toggle`

Toggles activity monitoring.

Response:

```json
{
    "monitor_status": true
}
```

---

## POST `/toggle-blacklist`

Enables or disables blacklist enforcement.

Response:

```json
{
    "status": "success",
    "blacklistEnabled": true
}
```

---

## POST `/lock`

Locks the protected system.

Response:

```json
{
    "status": "LOCKED"
}
```

If the system is already locked:

```json
{
    "status": "ALREADY_LOCKED"
}
```

---

## POST `/set-priority`

Changes Wi-Fi profile priority.

Expected request body:

```json
{
    "ssid": "MyWiFi"
}
```

---

## POST `/get-ping`

Performs a ping test against Google's DNS server.

Successful response:

```json
{
    "status": "success",
    "ping": "24"
}
```

---

# 🔌 CORS Architecture

SecureGuard enables CORS for its API.

This is important because the remote web interface may originate from a different domain than the Flask backend.

The configuration currently allows requests broadly:

```python
CORS(
    app,
    resources={r"/*": {"origins": "*"}}
)
```

This improves development convenience but should be **restricted in production**.

---

# 🌍 ngrok Architecture

SecureGuard uses `pyngrok` to establish a tunnel.

The startup process attempts to:

1. terminate an existing ngrok process;
2. configure the authentication token;
3. connect port `5000`;
4. expose the Flask application through the configured ngrok domain.

Conceptually:

```text
Windows PC
    │
    │ Flask :5000
    ▼
SecureGuard Backend
    │
    │ ngrok tunnel
    ▼
Internet
    │
    ▼
Remote Dashboard
```

This allows remote API access without directly exposing port 5000 through traditional router port forwarding.

---

# 📡 Network Priority System

The `/set-priority` route receives an SSID.

The backend determines the local IP by creating a UDP socket:

```python
s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
s.connect(("8.8.8.8", 80))
local_ip = s.getsockname()[0]
```

The connection is used to determine the appropriate local interface address.

It then invokes Windows networking functionality through:

```text
netsh wlan set profileorder
```

This demonstrates integration between Python and native Windows command-line networking tools.

---

# 📶 Ping Algorithm

SecureGuard executes:

```text
ping -n 1 8.8.8.8
```

The output is searched using:

```python
re.search(r"time[<](\d+)ms", result.stdout)
```

or the corresponding time-match pattern in the implementation.

The extracted latency is returned to the frontend.

This gives the dashboard a lightweight connectivity diagnostic.

---

# 🧵 Concurrency & Multithreading

SecureGuard relies heavily on Python threads.

Several operations run independently of the Flask request-processing flow.

Examples include:

```python
threading.Thread(
    target=show_lock_screen
).start()
```

and:

```python
threading.Thread(
    target=capture_and_send_snapshot,
    daemon=True
).start()
```

The application also starts background threads for:

* ngrok;
* system tray;
* active-window monitoring.

This allows multiple subsystems to operate concurrently.

---

# 🧩 Thread Architecture

```text
Main Thread
    │
    ├── Flask Server
    │
    ├── ngrok Thread
    │
    ├── Tray Thread
    │
    ├── Monitoring Thread
    │
    └── Lock/Snapshot Threads
```

This design is important because a monitoring loop should not block Flask from handling incoming API requests.

---

# 🧮 Algorithms & Complexity

## Active Window Monitoring

Each monitoring cycle checks the current active window and compares it against the blacklist.

If there are `B` blacklist entries:

```text
Time Complexity ≈ O(B)
```

Since the blacklist is relatively small, the operation is lightweight.

---

## Event Logging

Adding a log to the beginning of the list is:

```python
logs.insert(0, ...)
```

For a Python list, insertion at index `0` is:

```text
O(n)
```

However, the maximum log size is only 50, making the practical cost very small.

---

## Blacklist Search

For each blacklist item:

```python
site in active_lower
```

The approximate complexity depends on the length of the window title and blacklist.

For a small blacklist, the operation remains effectively lightweight.

---

## Ping Parsing

The regular-expression search operates over the command output, which is very small.

Practical complexity is approximately:

```text
O(n)
```

where `n` is the output length.

---

## Camera Capture

Camera capture complexity is primarily determined by the image resolution and OpenCV processing.

The system captures only a single frame, rather than continuously recording video.

---

# 🛡️ Security Model

SecureGuard uses several defensive mechanisms:

### 1. Remote Lock

Allows an authorized controller to lock the system.

### 2. Automatic Blacklist Enforcement

Can automatically react to prohibited applications/windows.

### 3. Failed Unlock Logging

Failed unlock attempts are recorded as security events.

### 4. Intrusion Snapshot

Attempts to capture visual evidence during lock events.

### 5. Security Notifications

Critical events can trigger remote notifications.

### 6. Activity Logging

The system maintains a recent event history.

Together these form a simple event-driven security architecture:

```text
DETECT
  ↓
CLASSIFY
  ↓
LOG
  ↓
ALERT
  ↓
RESPOND
```

---

# 🚨 Event Classification

SecureGuard determines whether an event is critical using keyword matching.

The implementation checks whether event information contains terms such as:

```text
ONLINE
DENIED
INTRUDER
VIOLATION
```

Critical events receive higher-priority notifications.

This is a simple **rule-based event classification system**.

It is deterministic rather than machine-learning based.

---

# 🧯 Error Handling

The system contains multiple defensive `try/except` blocks.

For example, monitoring errors are prevented from terminating the monitoring loop.

Camera failures are also handled without crashing the application.

API operations return appropriate HTTP error codes in several situations.

Examples include:

```text
400 → Invalid request
500 → Server/operation failure
200 → Successful operation
204 → OPTIONS/CORS response
```

This improves the robustness of the application during normal runtime.

---

# ⚡ Performance Considerations

SecureGuard is designed to run continuously in the background.

Several choices help keep resource consumption relatively low:

### 1. One-second monitoring interval

```python
time.sleep(1)
```

reduces unnecessary polling.

### 2. Limited event history

Only 50 events are retained.

### 3. Single-frame camera capture

The system does not continuously stream video.

### 4. Background threads

Long-running operations do not have to block API handling.

### 5. Event-based activity logging

Only window changes generate activity logs rather than logging the same window every second.

---

# 📁 Project Structure

A simplified project structure is:

```text
SecureGuard/
│
├── pc_brain.py
│
├── snapshot.jpg
│
└── frontend/
    └── SecureGuard Web Interface
```

The Python backend is the central control layer.

The web frontend acts as the remote control/dashboard layer.

---

# 🛠️ Installation

## Requirements

SecureGuard is designed primarily for **Windows** because several features depend on Windows-specific functionality.

Install Python 3.11 or a compatible Python 3.x version.

Install the required packages:

```bash
pip install flask flask-cors pygetwindow pillow pystray pyngrok opencv-python numpy requests psutil
```

You may also need:

```text
curl
ngrok
```

available through the system environment.

---

# ⚙️ Configuration

Important configuration values are located near the beginning of `pc_brain.py`.

Examples include:

```python
MONITOR_ON = False
SYSTEM_LOCKED = False
BLACKLIST_ENABLED = False
```

The blacklist can be customized:

```python
BLACKLIST = [
    "chat.google.com",
    "chat - google chrome",
    "whatsapp"
]
```

The notification topic can also be configured:

```python
NTFY_TOPIC = "secureguard_alerts"
```

---

# 🔐 IMPORTANT: Secret Management

The current source code contains an ngrok authentication credential directly in the Python file.

**Do not commit this credential to GitHub.**

Instead, use an environment variable:

```python
NGROK_AUTH_TOKEN = os.getenv("NGROK_AUTH_TOKEN")
```

Then configure the token in the operating system environment.

Similarly, the unlock code should ideally not be hardcoded in source code.

A production implementation should use:

* environment variables;
* encrypted configuration;
* OS credential storage;
* hashed authentication secrets;
* secure secret-management systems.

If the exposed ngrok token is still valid, it should be **revoked and replaced immediately**.

---

# ▶️ Running SecureGuard

After configuration:

```bash
python pc_brain.py
```

The application initializes:

```text
SecureGuard
    ↓
ngrok
    ↓
Flask API
    ↓
System Tray
    ↓
Activity Monitor
    ↓
Ready
```

The Flask backend listens on:

```text
0.0.0.0:5000
```

The application is configured to run without Flask debug mode:

```python
debug=False
```

---

# 🔄 Complete Security Workflow

Consider the following scenario.

A user enables blacklist monitoring.

```text
User
 ↓
Enable Blacklist
 ↓
BLACKLIST_ENABLED = True
 ↓
Monitoring thread starts checking windows
```

The user opens a prohibited application.

```text
Active Window
      ↓
Window title obtained
      ↓
Convert to lowercase
      ↓
Compare against blacklist
      ↓
MATCH
      ↓
Blacklist Violation
```

SecureGuard then:

```text
Create SECURITY log
        ↓
Send notification
        ↓
Trigger remote_lock()
        ↓
SYSTEM_LOCKED = True
        ↓
Capture camera snapshot
        ↓
Display fullscreen lock screen
```

The user must then enter the correct unlock code.

---

# 🧠 Design Philosophy

SecureGuard is based around a simple principle:

> **A security system should not only detect suspicious activity; it should also provide an immediate response mechanism.**

Therefore, SecureGuard follows:

```text
MONITOR → DETECT → LOG → ALERT → RESPOND
```

rather than simply collecting information.

This makes the project particularly useful for demonstrating concepts in:

* cybersecurity;
* system administration;
* network programming;
* REST APIs;
* operating-system interaction;
* automation;
* event-driven programming;
* multithreading.

---

# ⚠️ Current Limitations

SecureGuard is an educational/project-level security system and has several limitations.

## 1. Hardcoded Authentication

The unlock code is currently stored directly in source code.

This is not suitable for production authentication.

---

## 2. Broad CORS

The backend currently permits broad cross-origin requests.

Production deployments should restrict allowed origins.

---

## 3. Public Tunnel Exposure

ngrok makes the local API remotely accessible.

Without proper authentication and access control, exposing system-control endpoints to the internet creates significant risk.

---

## 4. No User Authentication Layer

The API endpoints do not currently implement a proper token/session-based authentication system.

An attacker who gains access to the API could potentially invoke sensitive endpoints.

---

## 5. In-Memory Logs

Logs disappear when the application exits.

There is no persistent database or structured security log file.

---

## 6. Simple Blacklist Matching

Blacklist detection relies on window-title substring matching.

It does not perform robust executable identification, process verification, or domain-level network filtering.

---

## 7. Windows Dependency

Several components depend specifically on Windows:

```text
pygetwindow
netsh
Windows GUI behavior
Windows command-line tools
```

Therefore the system is not currently cross-platform.

---

## 8. Camera Dependency

The intrusion snapshot system requires:

* a functional camera;
* OpenCV;
* operating-system camera permissions.

If no camera is available, the snapshot feature cannot operate.

---

# 🚀 Future Improvements

## 🔐 1. Proper Authentication

Implement:

* API keys;
* JWT authentication;
* session authentication;
* device pairing;
* two-factor authentication.

Example:

```text
Request
   ↓
Authentication
   ↓
Authorization
   ↓
Endpoint
```

---

## 🔒 2. HTTPS

All remote communication should use HTTPS.

The ideal architecture would be:

```text
HTTPS
 ↓
Authentication
 ↓
API
 ↓
Security Engine
```

rather than exposing an unauthenticated HTTP API.

---

## 🗄️ 3. Persistent Database

Replace the in-memory:

```python
logs = []
```

with a database such as:

```text
SQLite
PostgreSQL
```

This would enable:

* historical activity;
* searchable events;
* timestamps;
* security reports;
* audit trails.

---

## 🧠 4. Process-Based Detection

Instead of relying only on window titles, SecureGuard could inspect actual processes.

For example:

```text
Window Title
     +
Process Name
     +
Process ID
     +
Executable Path
```

could provide significantly stronger identification.

---

## 🌐 5. Domain/Network Filtering

The blacklist could be expanded into a proper policy engine supporting:

```text
Applications
Websites
Processes
Ports
IP addresses
Domains
```

---

## 🔑 6. Secure Credential Storage

Credentials should be stored using:

```text
Environment variables
        or
OS credential manager
        or
Encrypted configuration
```

rather than source-code constants.

---

## 📊 7. Security Dashboard

A more advanced dashboard could display:

```text
┌──────────────────────────────────┐
│ SECUREGUARD SECURITY CENTER      │
├──────────────────────────────────┤
│ STATUS       ● PROTECTED         │
│ MONITOR      ● ACTIVE            │
│ BLACKLIST    ● ENABLED           │
│                                  │
│ LAST EVENT                       │
│ 14:32:08  BLACKLIST VIOLATION   │
│                                  │
│ NETWORK                          │
│ Ping: 24ms                       │
│                                  │
│ SECURITY EVENTS                  │
│  ├─ ACCESS DENIED                │
│  ├─ WINDOW CHANGE                │
│  └─ SYSTEM LOCKED                │
└──────────────────────────────────┘
```

---

# 🧪 Testing Strategy

A more complete testing architecture could include:

### Unit Tests

Test:

* blacklist matching;
* event classification;
* ping parsing;
* state transitions.

### Integration Tests

Test:

```text
Frontend
   ↓
Flask API
   ↓
Security Engine
```

### Security Tests

Test:

* unauthorized API requests;
* invalid unlock attempts;
* malformed JSON;
* CORS behavior;
* API abuse;
* replay attempts.

### Failure Tests

Test:

* camera unavailable;
* internet unavailable;
* ngrok unavailable;
* malformed SSID;
* missing dependencies;
* invalid network commands.

---

# 📐 Complexity Summary

| Component           |        Approximate Complexity |
| ------------------- | ----------------------------: |
| Blacklist scan      |                          O(B) |
| Activity comparison |                          O(1) |
| Log insertion       |                  O(n), n ≤ 50 |
| Log retrieval       |                          O(n) |
| Ping parsing        |                          O(n) |
| Camera capture      |               Image-dependent |
| API request         | O(1) excluding system command |
| Network command     |                  OS-dependent |

Because the blacklist and log sizes are small, the primary performance considerations are external operations such as:

* camera access;
* subprocess execution;
* network communication;
* operating-system calls.

---

# 🧱 Architecture Summary

SecureGuard can ultimately be understood as five major subsystems:

```text
                 SECUREGUARD
                      │
       ┌──────────────┼──────────────┐
       │              │              │
       ▼              ▼              ▼
   MONITORING      SECURITY       NETWORKING
       │              │              │
       │              ├── Lock       ├── Ping
       │              ├── Camera     ├── Wi-Fi
       │              └── Alerts     └── IP
       │
       ▼
   ACTIVE WINDOWS
       │
       ▼
    BLACKLIST
       │
       ▼
    DETECTION
       │
       ▼
     RESPONSE
```

This architecture gives the project a clear separation between **observation**, **decision-making**, and **response**.

---

# 🎓 Educational Value

SecureGuard demonstrates a wide range of practical computer-science concepts.

### Python Programming

* functions;
* global state;
* exception handling;
* modules;
* subprocess execution.

### Networking

* HTTP;
* REST APIs;
* CORS;
* sockets;
* network latency;
* tunneling.

### Cybersecurity

* monitoring;
* access control;
* event detection;
* security alerts;
* automated response.

### Operating Systems

* active-window detection;
* Windows commands;
* system tray;
* GUI control;
* camera access.

### Concurrent Programming

* background threads;
* asynchronous-style operations;
* continuous monitoring.

### Web Development

* frontend/backend communication;
* JSON;
* API endpoints;
* remote dashboards.

---

# 🔮 Project Roadmap

A possible development roadmap is:

```text
Phase 1
✓ Local monitoring
✓ Remote lock
✓ Activity logging
✓ Blacklist detection

Phase 2
✓ Remote notifications
✓ Camera snapshot
✓ Network diagnostics
✓ Wi-Fi prioritization

Phase 3
→ Authentication
→ HTTPS
→ Persistent logging
→ Process-level monitoring

Phase 4
→ User/device management
→ Advanced security policies
→ Analytics
→ Security reports

Phase 5
→ Enterprise-style endpoint management
→ Distributed device monitoring
→ Advanced threat detection
```

---

# ⚠️ Disclaimer

SecureGuard is an educational cybersecurity and system-administration project.

It should only be deployed on computers and networks that you own or are explicitly authorized to manage.

The remote-locking, monitoring, camera-capture, network-control, and notification functionality can have significant privacy and security implications.

Do not use the software to monitor or control another person's computer without their knowledge and authorization.

Before deploying the project publicly:

* secure all API endpoints;
* implement authentication;
* use HTTPS;
* remove hardcoded credentials;
* restrict CORS;
* rotate exposed tokens;
* validate all input;
* implement authorization;
* protect sensitive logs.

---

# 👨‍💻 Conclusion

SecureGuard is a practical exploration of how **Python, networking, operating-system APIs, web technologies, and cybersecurity concepts** can be combined to build a remote PC security platform.

Rather than functioning as a simple monitoring script, the project establishes a complete event-driven security pipeline:

```text
OBSERVE
   ↓
DETECT
   ↓
CLASSIFY
   ↓
LOG
   ↓
NOTIFY
   ↓
RESPOND
```

Its Flask backend provides the communication layer, while Python handles the operating-system interaction and security logic.

The project demonstrates how a relatively lightweight Python application can integrate:

* remote APIs;
* Windows automation;
* real-time activity monitoring;
* blacklist enforcement;
* GUI-based access control;
* camera capture;
* push notifications;
* network diagnostics;
* Wi-Fi configuration;
* system-tray operation;
* multithreading.

The most significant next step for SecureGuard would be moving from a **prototype security controller** toward a properly authenticated, encrypted, persistent, and auditable endpoint-security architecture.

That evolution would transform SecureGuard from an educational demonstration into a much more robust foundation for a real-world security-management platform.
