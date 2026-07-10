class TerminalManager {
  constructor() {
    this.socket = new WiFiDuckSocket(this.onConnected.bind(this));
  }

  onConnected() {
    // Nothing specific to do on connect for terminal
  }

  init() {
    UIHelper.E("send").onclick = () => {
      const input = UIHelper.E("input").value;

      UIHelper.E("output").innerHTML += "# " + input + "<br>";

      UIHelper.E("reconnect").onclick = () => this.socket.init();

      this.socket.send(input, (msg) => {
        UIHelper.log(msg);
        UIHelper.E("output").innerHTML += msg.replace(/\n/g, "<br>");
        UIHelper.E("output").scrollTop = UIHelper.E("output").scrollHeight;
      });
    };

    UIHelper.E("clear").onclick = () => {
      UIHelper.E("output").innerHTML = "";
    };

    this.socket.init();
  }
}

let app;
window.addEventListener("load", function() {
  app = new TerminalManager();
  app.init();
}, false);