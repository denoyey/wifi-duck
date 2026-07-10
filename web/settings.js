class SettingsManager {
  constructor() {
    this.socket = new WiFiDuckSocket(this.onConnected.bind(this));
  }

  loadSettings() {
    this.socket.send("settings", (msg) => {
      const lines = msg.split(/\n/);
      
      if (lines.length >= 4) {
        const ssid = lines[0].split("=")[1];
        const password = lines[1].split("=")[1];
        const channel = lines[2].split("=")[1];
        const autorun = lines[3].split("=")[1];

        const ssidEl = UIHelper.E("ssid");
        if (ssidEl) ssidEl.innerHTML = ssid;

        const pwdEl = UIHelper.E("password");
        if (pwdEl) pwdEl.innerHTML = password;

        const chanEl = UIHelper.E("channel");
        if (chanEl) chanEl.innerHTML = channel;

        const autoEl = UIHelper.E("autorun");
        if (autoEl) autoEl.innerHTML = autorun;
      }
    });
  }

  onConnected() {
    this.loadSettings();
  }

  init() {
    UIHelper.E("edit_ssid").onclick = async () => {
      const current = UIHelper.E("ssid").innerHTML;
      const newssid = await Modal.prompt("SSID (1-32 chars)", current);

      if (newssid !== null) {
        if (newssid.length >= 1 && newssid.length <= 32) {
          this.socket.send('set ssid "' + newssid + '"', () => {
            this.loadSettings();
          });
        } else {
          await Modal.alert("ERROR: Invalid length");
        }
      }
    };

    UIHelper.E("edit_password").onclick = async () => {
      const current = UIHelper.E("password").innerHTML;
      const newpassword = await Modal.prompt("Password (8-64 chars)", current);

      if (newpassword !== null) {
        if (newpassword.length >= 8 && newpassword.length <= 64) {
          this.socket.send('set password "' + newpassword + '"', () => {
            this.loadSettings();
          });
        } else {
          await Modal.alert("ERROR: Invalid length");
        }
      }
    };

    UIHelper.E("edit_channel").onclick = async () => {
      const current = UIHelper.E("channel").innerHTML;
      const newchannel = await Modal.prompt("Channel (1-14)", current);

      if (newchannel !== null) {
        const parsed = parseInt(newchannel);
        if (parsed >= 1 && parsed <= 13) {
          this.socket.send("set channel " + newchannel, () => {
            this.loadSettings();
          });
        } else {
          await Modal.alert("ERROR: Invalid channel number");
        }
      }
    };

    UIHelper.E("disable_autorun").onclick = () => {
      this.socket.send('set autorun ""', () => {
        this.loadSettings();
      });
    };

    UIHelper.E("reset").onclick = async () => {
      if (await Modal.confirm("Reset all settings to default?")) {
        this.socket.send("reset", () => {
          this.loadSettings();
        });
      }
    };

    this.socket.init();
  }
}

let app;
window.addEventListener("load", function() {
  app = new SettingsManager();
  app.init();
}, false);