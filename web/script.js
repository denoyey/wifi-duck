// ===== Helper Functions (UIHelper) ===== //
class UIHelper {
  static renderNavbar() {
    const navHTML = `
      <nav>
        <div class="nav-container">
          <a href="index.html" class="nav-brand">WiFi Duck</a>
          <button class="hamburger" id="hamburgerBtn" aria-label="Menu">
            <svg viewBox="0 0 24 24" width="24" height="24"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          </button>
          <div class="menu-overlay" id="menuOverlay"></div>
          <ul class="menu" id="navMenu">
            <li class="mobile-close"><button id="closeMenuBtn" aria-label="Close Menu">&times;</button></li>
            <li><a href="index.html">Home</a></li>
            <li><a href="settings.html">Settings</a></li>
            <li><a href="terminal.html">Terminal</a></li>
            <li><a href="credits.html">About</a></li>
            <li><button id="themeToggle" class="theme-toggle" aria-label="Toggle Theme"></button></li>
          </ul>
        </div>
      </nav>
      <div id="status"></div>
    `;
    
    const existingNav = document.querySelector('nav');
    const existingStatus = document.getElementById('status');
    
    if (existingNav) existingNav.remove();
    if (existingStatus) existingStatus.remove();

    document.body.insertAdjacentHTML('afterbegin', navHTML);

    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    const navMenu = document.getElementById('navMenu');
    const menuOverlay = document.getElementById('menuOverlay');

    const toggleMenu = () => {
      navMenu.classList.toggle('open');
      menuOverlay.classList.toggle('open');
    };

    if (hamburgerBtn) hamburgerBtn.onclick = toggleMenu;
    if (closeMenuBtn) closeMenuBtn.onclick = toggleMenu;
    if (menuOverlay) menuOverlay.onclick = toggleMenu;

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const activeLink = document.querySelector(`#navMenu a[href="${currentPage}"]`);
    if (activeLink) {
      activeLink.classList.add('active');
    }
  }

  static renderFooter() {
    const year = new Date().getFullYear();
    
    // Layer 1: Bitwise XOR Obfuscation (no Base64)
    const _dec = function(arr) {
      let r = '';
      for (let i = 0; i < arr.length; i++) {
        r += String.fromCharCode(arr[i] ^ 42);
      }
      return r;
    };
    
    // "denoyey"
    const _a = _dec([78, 79, 68, 69, 83, 79, 83]);
    // "https://github.com/denoyey"
    const _l = _dec([66, 94, 94, 90, 89, 16, 5, 5, 77, 67, 94, 66, 95, 72, 4, 73, 69, 71, 5, 78, 79, 68, 69, 83, 79, 83]);
    
    const footerHTML = `
      <footer>
        <div class="footer-content">
          <div class="footer-bottom">
            <div class="footer-copy">
              <strong>WiFiDuck</strong> <span id="version" class="version-badge"></span> &copy; ${year} <a target="_blank" class="author-link" id="_cr_px"></a>
            </div>
          </div>
        </div>
      </footer>
    `;
    
    const existingFooter = document.querySelector('footer');
    if (existingFooter) existingFooter.remove();
    document.body.insertAdjacentHTML('beforeend', footerHTML);
    
    const _s = function() {
      const cr = document.getElementById('_cr_px');
      if (cr) {
        if (cr.textContent !== _a) cr.textContent = _a;
        if (cr.getAttribute('href') !== _l) cr.setAttribute('href', _l);
        cr.style.display = 'inline';
        cr.style.visibility = 'visible';
        cr.style.opacity = '1';
        cr.style.position = 'static';
      }
    };
    _s();
    _s.toString = function() { return 'function () { [native code] }'; };

    const _restore = function() {
      const cr = document.getElementById('_cr_px');
      if (!cr) {
        const fc = document.querySelector('.footer-copy');
        if (fc) {
          fc.insertAdjacentHTML('beforeend', ' <a target="_blank" class="author-link" id="_cr_px"></a>');
          _s();
        }
      } else {
        _s();
      }
    };

    try {
      const observer = new MutationObserver(function(mutations) {
        let tampered = false;
        mutations.forEach(function(mutation) {
          if (mutation.target.id === '_cr_px' || 
             (mutation.removedNodes && Array.from(mutation.removedNodes).some(n => n.id === '_cr_px'))) {
            tampered = true;
          }
        });
        if (tampered) _restore();
      });
      observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true });
    } catch(e) {}

    setInterval(function() {
      const el = document.getElementById('_cr_px');
      if (!el || el.textContent !== _a || el.getAttribute('href') !== _l || !document.body.contains(el)) {
        _restore();
      }
    }, 500);
  }

  static log(msg) {
    console.log(msg);
  }

  static E(id) {
    return document.getElementById(id);
  }

  static downloadTxt(fileName, fileContent) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(fileContent));
    element.setAttribute('download', fileName);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  static fixFileName(fileName) {
    if (fileName.length > 0) {
      if (fileName[0] !== '/') {
        fileName = '/' + fileName;
      }
      fileName = fileName.replace(/ /g, '\-');
    }
    return fileName;
  }
}

// ===== Web Socket Manager ===== //
class WiFiDuckSocket {
  constructor(onConnectedCallback = null) {
    this.ws = null;
    this.wsCallback = this.logWs.bind(this);
    this.wsMsgQueue = [];
    this.cts = false;
    this.currentStatus = "";
    this.wsQueueInterval = null;
    this.onConnectedCallback = onConnectedCallback;
  }

  logWs(msg) {
    UIHelper.log("[WS] " + msg);
  }

  status(mode) {
    this.currentStatus = mode;
    const statusEl = UIHelper.E("status");
    if (!statusEl) return;

    if (mode === "connected") {
      statusEl.style.backgroundColor = "#3c5";
    } else if (mode === "disconnected") {
      statusEl.style.backgroundColor = "#d33";
    } else if (mode.includes("problem") || mode.includes("error")) {
      statusEl.style.backgroundColor = "#ffc107";
    } else /*if (mode === "connecting...")*/ {
      statusEl.style.backgroundColor = "#0ae";
    }
    statusEl.innerHTML = mode;
  }

  setVersion(str) {
    const versionEl = UIHelper.E("version");
    if (versionEl) {
      versionEl.innerHTML = str;
    }
  }

  msgQueueUpdate() {
    if (this.cts && this.wsMsgQueue.length > 0) {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const item = this.wsMsgQueue.shift();
        this.ws.send(item.message);
        this.wsCallback = item.callback;
        console.debug("# " + item.message);
        this.cts = false;
      }
    }
  }

  send(message, callback = this.logWs.bind(this), force = false) {
    if (!message.endsWith('\n')) message += '\n';
    this.sendRaw(message, callback, force);
  }

  sendRaw(message, callback = this.logWs.bind(this), force = false) {
    const obj = {
      message: message,
      callback: callback
    };

    if (force) {
      this.wsMsgQueue.unshift(obj);
    } else {
      this.wsMsgQueue.push(obj);
    }
  }

  updateStatus() {
    this.send("status", this.status.bind(this));
  }

  init() {
    this.status("connecting...");
    
    // Hardcoded IP as in original project
    this.ws = new WebSocket("ws://192.168.4.1/ws");

    this.ws.onopen = (event) => {
      this.logWs("connected");
      this.status("connected");

      this.send("close", this.logWs.bind(this), true);
      this.send("version", this.setVersion.bind(this));

      if (this.onConnectedCallback) {
        this.onConnectedCallback();
      }
    };

    this.ws.onclose = (event) => {
      this.logWs("disconnected");
      this.status("disconnected");
    };

    this.ws.onmessage = (event) => {
      const msg = event.data;
      this.logWs(msg);

      if (this.wsCallback && msg.length > 0) {
        this.wsCallback(msg);
      }
      this.cts = true;
    };

    this.ws.onerror = (event) => {
      this.logWs("error");
      this.status("error");
      
      if (this.ws.readyState === WebSocket.CLOSED) {
        UIHelper.E("status").innerHTML = "Error: Pastikan terhubung ke Wi-Fi WiFiDuck (192.168.4.1)";
      }
    };

    this.cts = true;

    if (this.wsQueueInterval) clearInterval(this.wsQueueInterval);
    this.wsQueueInterval = setInterval(this.msgQueueUpdate.bind(this), 1);
  }
}

// ===== Theme Manager ===== //
class ThemeManager {
  constructor() {
    this.theme = localStorage.getItem('theme') || 'dark';
    this.applyTheme();
    
    window.addEventListener('DOMContentLoaded', () => {
      UIHelper.renderNavbar();
      UIHelper.renderFooter();
      this.initToggleButton();
    });
  }

  applyTheme() {
    document.documentElement.setAttribute('data-theme', this.theme);
    this.updateIcon();
  }

  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', this.theme);
    this.applyTheme();
  }

  updateIcon() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;

    if (this.theme === 'dark') {
      // Sun icon for switching to light
      btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18.75a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75zM6.166 17.834a.75.75 0 001.06 1.06l1.591-1.59a.75.75 0 10-1.06-1.061l-1.591 1.59zM4.5 12a.75.75 0 01-.75-.75H1.5a.75.75 0 010 1.5h2.25a.75.75 0 01.75-.75zM5.106 6.166a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591z"></path></svg><span class="theme-text">Light Mode</span>`;
      btn.title = "Switch to Light Mode";
    } else {
      // Moon icon for switching to dark
      btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"></path></svg><span class="theme-text">Dark Mode</span>`;
      btn.title = "Switch to Dark Mode";
    }
  }

  initToggleButton() {
    const btn = document.getElementById('themeToggle');
    if (btn) {
      btn.onclick = () => this.toggleTheme();
      this.updateIcon();
    }
  }
}

// ===== Custom Modal System ===== //
class Modal {
  static init() {
    if (document.getElementById('customModalOverlay')) return;

    const modalHTML = `
      <div id="customModalOverlay" class="modal-overlay">
        <div id="customModalBox" class="modal-box">
          <p id="customModalMessage"></p>
          <input type="text" id="customModalInput" class="smooth" />
          <div class="modal-buttons">
            <button id="customModalCancel" class="white">Cancel</button>
            <button id="customModalOk" class="primary">OK</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    Modal.overlay = document.getElementById('customModalOverlay');
    Modal.box = document.getElementById('customModalBox');
    Modal.msgEl = document.getElementById('customModalMessage');
    Modal.inputEl = document.getElementById('customModalInput');
    Modal.btnOk = document.getElementById('customModalOk');
    Modal.btnCancel = document.getElementById('customModalCancel');
  }

  static show(type, message, defaultVal = '') {
    return new Promise((resolve) => {
      if (!Modal.overlay) Modal.init();

      Modal.msgEl.innerHTML = message.replace(/\n/g, '<br>');
      Modal.inputEl.value = defaultVal;
      
      if (type === 'prompt') {
        Modal.inputEl.style.display = 'block';
        Modal.btnCancel.style.display = 'block';
      } else if (type === 'confirm') {
        Modal.inputEl.style.display = 'none';
        Modal.btnCancel.style.display = 'block';
      } else { // alert
        Modal.inputEl.style.display = 'none';
        Modal.btnCancel.style.display = 'none';
      }

      Modal.overlay.classList.add('modal-show');
      if (type === 'prompt') Modal.inputEl.focus();

      const cleanup = () => {
        Modal.overlay.classList.remove('modal-show');
        Modal.btnOk.onclick = null;
        Modal.btnCancel.onclick = null;
      };

      Modal.btnOk.onclick = () => {
        cleanup();
        if (type === 'prompt') resolve(Modal.inputEl.value);
        else resolve(true);
      };

      Modal.btnCancel.onclick = () => {
        cleanup();
        if (type === 'prompt') resolve(null);
        else resolve(false);
      };
    });
  }

  static alert(message) {
    return Modal.show('alert', message);
  }

  static confirm(message) {
    return Modal.show('confirm', message);
  }

  static prompt(message, defaultVal = '') {
    return Modal.show('prompt', message, defaultVal);
  }
}

const themeManager = new ThemeManager();

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.reload').forEach(btn => {
    btn.addEventListener('click', function() {
      this.classList.remove('spin-anim');
      void this.offsetWidth;
      this.classList.add('spin-anim');
    });
  });

  const accordions = document.querySelectorAll('details.doc-accordion');
  accordions.forEach(acc => {
    acc.addEventListener('toggle', function() {
      if (this.open) {
        accordions.forEach(otherAcc => {
          if (otherAcc !== this && otherAcc.open) {
            otherAcc.open = false;
          }
        });
      }
    });
  });

  Modal.init();
});