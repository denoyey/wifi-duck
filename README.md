# WiFi Duck Web Interface

A modern, responsive web interface for the WiFi Duck project, designed to allow easy management and execution of Ducky Script payloads directly from your browser.

## Previews

### Desktop View
![Desktop Preview](web/assets/img/preview/desktop-1.png)

### Mobile View
![Mobile Preview](web/assets/img/preview/mobile-1.png)

## Core Features

This interface provides a complete set of tools to interact with your WiFi Duck hardware. 

| Feature | Description |
|---|---|
| **Script Editor** | A built-in code editor that allows you to create, edit, and save Ducky Scripts directly on the device storage. |
| **Live Terminal** | A hacker-styled interactive terminal to execute commands in real-time, view output logs, and monitor device status. |
| **Responsive UI** | The interface is fully responsive, ensuring a clean and usable layout on both large desktop screens and small mobile devices. |
| **Theme Toggle** | A built-in toggle to switch between Light and Dark mode depending on your viewing preference. |
| **Live Status** | Real-time connection indicators and memory storage monitoring directly on the dashboard. |
| **Custom Modals** | Fast and non-blocking custom dialog popups for alerts, confirmations, and prompts. |
| **Settings Management** | Easily change your WiFi SSID, password, and channel directly from the browser without flashing the device. |

## Quick Start Guide

### 1. Connecting to the Device
Power on your WiFi Duck. It will host its own WiFi network. Connect your computer or phone to this network. By default, the network is usually named `wifiduck` with the password `wifiduck`.

### 2. Accessing the Interface
Open your preferred web browser and navigate to `http://192.168.4.1`. You will be greeted by the home dashboard where you can see your current scripts and device memory.

### 3. Managing Scripts
- **Create**: Type a new filename in the input box and click Create.
- **Edit**: Click on any existing script to load its contents into the text editor.
- **Run**: Press the Run button to immediately execute the payload on the target machine.
- **Delete**: Use the Delete button to remove scripts you no longer need.

### 4. Terminal Access
Navigate to the Terminal page from the top navigation bar to access the live command line. This allows you to interact with the device beyond simple script execution, enabling you to format storage, check system variables, or run raw ducky commands line-by-line.

## Ducky Script Reference

Below is a quick reference for common commands you can use in the editor.

| Command | Usage Example | Explanation |
|---|---|---|
| `STRING` | `STRING Hello World` | Types the specified text exactly as written. |
| `ENTER` | `ENTER` | Simulates pressing the Enter/Return key. |
| `DELAY` | `DELAY 1000` | Pauses execution for a set time in milliseconds (e.g., 1000 = 1 second). |
| `GUI` / `WINDOWS` | `GUI r` | Presses the Windows key along with another key (e.g., to open the Run dialog). |
| `ALT` / `CTRL` / `SHIFT` | `CTRL c` | Used to trigger keyboard shortcuts. |

## Security Note

This interface includes self-healing protective measures to prevent accidental or malicious tampering of the footer copyright via browser developer tools. Make sure you leave these scripts intact to ensure the application runs smoothly.

## Credits

Developed and redesigned by [denoyey](https://github.com/denoyey).