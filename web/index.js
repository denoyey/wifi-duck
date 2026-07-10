class ScriptManager {
  constructor() {
    this.socket = new WiFiDuckSocket(this.onConnected.bind(this));
    
    this.fileList = "";
    this.statusInterval = undefined;
    this.unsavedChanged = false;
    this.fileOpened = false;
  }

  getNewFilename() {
    return UIHelper.E("newFile").value;
  }

  getEditorFilename() {
    return UIHelper.E("editorFile").value;
  }

  setEditorFilename(filename) {
    UIHelper.E("editorFile").value = filename;
  }

  getEditorContent() {
    let content = UIHelper.E("editor").value;
    if (!content.endsWith("\n")) {
      content = content + "\n";
    }
    return content;
  }

  checkStatus() {
    if (this.socket.currentStatus.includes("running") || this.socket.currentStatus.includes("saving")) {
      this.socket.updateStatus();
    } else {
      this.stopStatusInterval();
    }
  }

  startStatusInterval() {
    if (this.statusInterval) return;
    this.socket.updateStatus();
    this.statusInterval = setInterval(this.checkStatus.bind(this), 500);
  }

  stopStatusInterval() {
    if (!this.statusInterval) return;
    clearInterval(this.statusInterval);
    this.statusInterval = undefined;
  }

  append(str) {
    UIHelper.E("editor").value += str;
  }

  updateFileList() {
    this.socket.send("mem", (msg) => {
      const lines = msg.split(/\n/);
      
      if(lines.length === 1) {
        console.error("Malformed response:");
        console.error(msg);
        return;
      }

      const byte = lines[0].split(" ")[0];
      const used = lines[1].split(" ")[0];
      const free = lines[2].split(" ")[0];

      const percent = Math.floor(byte / 100);
      const freepercent = Math.floor(free / percent);

      const memEl = UIHelper.E("freeMemory");
      if (memEl) memEl.innerHTML = used + " byte used (" + freepercent + "% free)";

      this.fileList = "";

      this.socket.send("ls", (csv) => {
        this.fileList += csv;
        const lsLines = this.fileList.split(/\n/);
        
        const folders = {};
        const rootFiles = [];
        let firstFile = null;

        for (let i = 0; i < lsLines.length; i++) {
          const data = lsLines[i].split(" ");
          const fileName = data[0];
          const fileSize = data[1];

          if (fileName.length > 0) {
            if (!firstFile) firstFile = fileName;
            
            let folderName = "";
            let displayName = fileName;
            let cleanPath = fileName.startsWith("/") ? fileName.substring(1) : fileName;
            let parts = cleanPath.split("/");
            if (parts.length > 1) {
              folderName = parts[0];
              displayName = parts.slice(1).join("/");
            }
            
            if (folderName === "") {
                rootFiles.push({ fileName, displayName, fileSize });
            } else {
                if (!folders[folderName]) folders[folderName] = [];
                folders[folderName].push({ fileName, displayName, fileSize });
            }
          }
        }
        
        if (firstFile && !this.fileOpened) {
          this.readFile(firstFile);
        }

        let tableHTML = "<thead>\n<tr>\n<th>File</th>\n<th>Byte</th>\n<th>Actions</th>\n</tr>\n</thead>\n<tbody>\n";

        for (const [folder, files] of Object.entries(folders)) {
          const folderId = "folder-" + folder.replace(/[^a-zA-Z0-9]/g, "-");
          tableHTML += `<tr class="folder-header" onclick="app.toggleFolder('${folderId}', this)">`;
          tableHTML += `<td colspan="3"><span class="folder-icon">▼</span> <strong>${folder}</strong></td>`;
          tableHTML += `</tr>\n`;
          
          for (let i = 0; i < files.length; i++) {
            const f = files[i];
            tableHTML += `<tr class="folder-file-row ${folderId}">\n`;
            tableHTML += `<td class="indented">${f.displayName}</td>\n`;
            tableHTML += `<td>${f.fileSize}</td>\n`;
            tableHTML += `<td>\n`;
            tableHTML += `<button class="primary" onclick="app.readFile('${f.fileName}')">edit</button>\n`;
            tableHTML += `<button class="warn" onclick="app.runFile('${f.fileName}')">run</button>\n`;
            tableHTML += `</td>\n`;
            tableHTML += `</tr>\n`;
          }
        }

        for (let i = 0; i < rootFiles.length; i++) {
            const f = rootFiles[i];
            tableHTML += `<tr>\n`;
            tableHTML += `<td>${f.displayName}</td>\n`;
            tableHTML += `<td>${f.fileSize}</td>\n`;
            tableHTML += `<td>\n`;
            tableHTML += `<button class="primary" onclick="app.readFile('${f.fileName}')">edit</button>\n`;
            tableHTML += `<button class="warn" onclick="app.runFile('${f.fileName}')">run</button>\n`;
            tableHTML += `</td>\n`;
            tableHTML += `</tr>\n`;
        }

        tableHTML += "</tbody>\n";

        const scriptTable = UIHelper.E("scriptTable");
        if (scriptTable) scriptTable.innerHTML = tableHTML;
      });
    });
  }

  toggleFolder(folderClass, headerRow) {
    const rows = document.querySelectorAll("." + folderClass);
    let isHidden = false;
    rows.forEach(row => {
      if (row.style.display === "none") {
        row.style.display = "table-row";
        isHidden = false;
      } else {
        row.style.display = "none";
        isHidden = true;
      }
    });
    const icon = headerRow.querySelector(".folder-icon");
    if (icon) {
      icon.innerHTML = isHidden ? "▶" : "▼";
    }
  }

  async formatSpiffs() {
    if (await Modal.confirm("Format SPIFFS? This will delete all scripts!")) {
      this.socket.send("format", this.socket.logWs.bind(this.socket));
      await Modal.alert("Formatting will take a minute.\nYou have to reconnect afterwards.");
    }
  }

  runFile(fileName) {
    this.socket.send('run "' + UIHelper.fixFileName(fileName) + '"', this.socket.logWs.bind(this.socket));
    this.startStatusInterval();
  }

  stopFile(fileName) {
    this.socket.send('stop "' + UIHelper.fixFileName(fileName) + '"', this.socket.logWs.bind(this.socket), true);
  }

  stopAll() {
    this.socket.send("stop", this.socket.logWs.bind(this.socket), true);
  }

  readStream() {
    this.socket.send("read", (content) => {
      if (content !== "> END") {
        UIHelper.E("editor").value += content;
        this.readStream();
        this.socket.status("reading...");
      } else {
        this.socket.send("close", this.socket.logWs.bind(this.socket));
        this.socket.updateStatus();
      }
    });
  }

  readFile(fileName) {
    this.stopFile(fileName);
    fileName = UIHelper.fixFileName(fileName);
    this.setEditorFilename(fileName);
    UIHelper.E("editor").value = "";
    this.socket.send('stream "' + fileName + '"', this.socket.logWs.bind(this.socket));
    this.readStream();
    this.fileOpened = true;
  }

  createFile(fileName) {
    this.stopFile(fileName);
    fileName = UIHelper.fixFileName(fileName);

    if (this.fileList.includes(fileName + " ")) {
      this.readFile(fileName);
    } else {
      this.setEditorFilename(fileName);
      UIHelper.E("editor").value = "";
      this.socket.send('create "' + fileName + '"', this.socket.logWs.bind(this.socket));
      this.updateFileList();
    }
  }

  removeFile(fileName) {
    this.stopFile(fileName);
    this.socket.send('remove "' + UIHelper.fixFileName(fileName) + '"', this.socket.logWs.bind(this.socket));
    this.updateFileList();
    this.unsavedChanged = true;
  }

  autorunFile(fileName) {
    this.socket.send('set autorun "' + UIHelper.fixFileName(fileName) + '"', this.socket.logWs.bind(this.socket));
  }

  writeFile(fileName, content) {
    this.stopFile(fileName);
    fileName = UIHelper.fixFileName(fileName);

    this.socket.send('remove "/temporary_script"', this.socket.logWs.bind(this.socket));
    this.socket.send('create "/temporary_script"', this.socket.logWs.bind(this.socket));
    this.socket.send('stream "/temporary_script"', this.socket.logWs.bind(this.socket));

    const wsSendLog = (msg) => {
      this.socket.status("saving...");
      this.socket.logWs(msg);
    };

    const pktsize = 1024;
    for (let i = 0; i < Math.ceil(content.length / pktsize); i++) {
      let begin = i * pktsize;
      let end = begin + pktsize;
      if (end > content.length) end = content.length;
      this.socket.sendRaw(content.substring(begin, end), wsSendLog);
    }

    this.socket.send("close", this.socket.logWs.bind(this.socket));
    this.socket.send('remove "' + fileName + '"', this.socket.logWs.bind(this.socket));
    this.socket.send('rename "/temporary_script" "' + fileName + '"', this.socket.logWs.bind(this.socket));
    this.socket.updateStatus();
  }

  saveFile() {
    this.writeFile(this.getEditorFilename(), this.getEditorContent());
    this.unsavedChanged = false;
    UIHelper.E("editorinfo").innerHTML = "saved";
    this.updateFileList();
  }

  onConnected() {
    this.updateFileList();
  }

  init() {
    UIHelper.E("reconnect").onclick = () => this.socket.init();
    UIHelper.E("scriptsReload").onclick = () => this.updateFileList();
    UIHelper.E("format").onclick = () => this.formatSpiffs();
    UIHelper.E("stop").onclick = () => this.stopAll();

    UIHelper.E("editorReload").onclick = () => this.readFile(this.getEditorFilename());
    UIHelper.E("editorSave").onclick = () => this.saveFile();

    UIHelper.E("editorDelete").onclick = async () => {
      if (await Modal.confirm("Delete " + this.getEditorFilename() + "?")) {
        this.removeFile(this.getEditorFilename());
      }
    };

    UIHelper.E("editorDownload").onclick = () => {
      UIHelper.downloadTxt(this.getEditorFilename(), this.getEditorContent());
    };

    UIHelper.E("editorStop").onclick = () => this.stopFile(this.getEditorFilename());

    UIHelper.E("editorRun").onclick = () => {
      if (this.unsavedChanged) {
        this.saveFile();
      }
      this.runFile(this.getEditorFilename());
    };

    UIHelper.E("editor").onkeyup = () => {
      this.unsavedChanged = true;
      UIHelper.E("editorinfo").innerHTML = "unsaved changes";
    };

    UIHelper.E("editorAutorun").onclick = async () => {
      if (await Modal.confirm("Run this script automatically on startup?\nYou can disable it in the settings."))
        this.autorunFile(this.getEditorFilename());
    };

    const codes = document.querySelectorAll("code");
    codes.forEach((codeEl) => {
      codeEl.addEventListener("click", () => {
        this.append(codeEl.innerHTML + " \n");
      });
    });

    this.socket.init();
  }
}

let app;
window.addEventListener("load", function() {
  app = new ScriptManager();
  app.init();
}, false);