/**
 * Studio Spark embeddable chat widget. Drop this on a studio's own
 * website:
 *
 *   <script src="https://studio-spark-taupe.vercel.app/widget.js"
 *           data-studio-config-id="YOUR_STUDIO_CONFIG_ID"></script>
 *
 * Self-contained vanilla JS (no dependencies, scoped class names) so it
 * can run on any third-party site without colliding with their styles.
 * Talks to /api/chat-widget on whatever origin this script was loaded
 * from — see app/api/chat-widget/route.ts.
 */
(function () {
  var scriptTag = document.currentScript;
  var studioConfigId = scriptTag.getAttribute("data-studio-config-id");
  if (!studioConfigId) {
    console.error("[Studio Spark widget] missing data-studio-config-id on the script tag");
    return;
  }

  var apiBase = new URL(scriptTag.src).origin;
  var storageKey = "ss_widget_" + studioConfigId;
  var state = loadState();

  function loadState() {
    try {
      var raw = localStorage.getItem(storageKey);
      if (raw) return JSON.parse(raw);
    } catch {}
    return { visitorId: null, conversationId: null };
  }

  function saveState() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {}
  }

  if (!state.visitorId) {
    state.visitorId = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random());
    saveState();
  }

  var css = "" +
    ".ssw-bubble{position:fixed;bottom:20px;right:20px;width:56px;height:56px;border-radius:50%;background:#f0653c;color:#fff;border:none;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.2);font-size:24px;z-index:999999;display:flex;align-items:center;justify-content:center;}" +
    ".ssw-panel{position:fixed;bottom:88px;right:20px;width:340px;max-width:calc(100vw - 40px);height:460px;max-height:calc(100vh - 120px);background:#fff;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,.25);display:none;flex-direction:column;overflow:hidden;z-index:999999;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;}" +
    ".ssw-panel.ssw-open{display:flex;}" +
    ".ssw-header{background:#14181f;color:#fff;padding:14px 16px;font-size:14px;font-weight:600;display:flex;justify-content:space-between;align-items:center;}" +
    ".ssw-close{background:none;border:none;color:#fff;font-size:18px;cursor:pointer;line-height:1;opacity:.8;}" +
    ".ssw-messages{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px;background:#fbfaf8;}" +
    ".ssw-msg{max-width:80%;padding:8px 11px;border-radius:10px;font-size:13.5px;line-height:1.4;}" +
    ".ssw-msg-lead{align-self:flex-end;background:#f0653c;color:#fff;}" +
    ".ssw-msg-ai{align-self:flex-start;background:#eceae6;color:#1d222b;}" +
    ".ssw-tag{display:inline-block;margin-top:5px;font-size:10.5px;font-weight:600;padding:2px 7px;border-radius:999px;}" +
    ".ssw-tag-booked{background:#d6efe9;color:#0d6b58;}" +
    ".ssw-tag-escalated{background:#fde1d6;color:#b8431c;}" +
    ".ssw-inputrow{display:flex;gap:6px;padding:10px;border-top:1px solid #eee;}" +
    ".ssw-input{flex:1;border:1px solid #ddd;border-radius:7px;padding:8px 10px;font-size:13.5px;outline:none;}" +
    ".ssw-send{background:#f0653c;color:#fff;border:none;border-radius:7px;padding:0 14px;cursor:pointer;font-size:13.5px;font-weight:600;}" +
    ".ssw-send:disabled{opacity:.5;cursor:default;}" +
    ".ssw-hint{font-size:11.5px;color:#999;padding:0 12px 8px;}";
  var styleEl = document.createElement("style");
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  var bubble = document.createElement("button");
  bubble.className = "ssw-bubble";
  bubble.setAttribute("aria-label", "Open chat");
  bubble.textContent = "💬";

  var panel = document.createElement("div");
  panel.className = "ssw-panel";
  panel.innerHTML =
    '<div class="ssw-header"><span>Chat with us</span><button class="ssw-close" aria-label="Close chat">✕</button></div>' +
    '<div class="ssw-messages"></div>' +
    '<div class="ssw-hint">Replies are from our AI assistant.</div>' +
    '<div class="ssw-inputrow"><input class="ssw-input" type="text" placeholder="Type a message…" /><button class="ssw-send">Send</button></div>';

  document.body.appendChild(bubble);
  document.body.appendChild(panel);

  var messagesEl = panel.querySelector(".ssw-messages");
  var inputEl = panel.querySelector(".ssw-input");
  var sendBtn = panel.querySelector(".ssw-send");
  var closeBtn = panel.querySelector(".ssw-close");
  var greeted = false;

  bubble.addEventListener("click", function () {
    panel.classList.toggle("ssw-open");
    if (panel.classList.contains("ssw-open") && !greeted) {
      greeted = true;
      addMessage("ai", "Hi! Ask me about classes, pricing, or book an intro spot.");
    }
  });
  closeBtn.addEventListener("click", function () {
    panel.classList.remove("ssw-open");
  });

  function addMessage(from, text, tag) {
    var row = document.createElement("div");
    row.className = "ssw-msg " + (from === "lead" ? "ssw-msg-lead" : "ssw-msg-ai");
    row.textContent = text;
    if (tag) {
      var badge = document.createElement("div");
      badge.className = "ssw-tag " + (tag === "booked" ? "ssw-tag-booked" : "ssw-tag-escalated");
      badge.textContent = tag === "booked" ? "Class booked" : "A team member will follow up";
      row.appendChild(document.createElement("br"));
      row.appendChild(badge);
    }
    messagesEl.appendChild(row);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function send() {
    var text = inputEl.value.trim();
    if (!text || sendBtn.disabled) return;
    inputEl.value = "";
    addMessage("lead", text);
    sendBtn.disabled = true;

    fetch(apiBase + "/api/chat-widget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studioConfigId: studioConfigId,
        conversationId: state.conversationId,
        visitorId: state.visitorId,
        message: text,
      }),
    })
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        sendBtn.disabled = false;
        if (data.conversationId) {
          state.conversationId = data.conversationId;
          saveState();
        }
        if (data.error) {
          addMessage("ai", "Sorry, something went wrong. Please try again in a moment.");
          return;
        }
        if (data.handedOff && !data.reply) {
          return;
        }
        addMessage("ai", data.reply, data.booked ? "booked" : data.handedOff ? "escalated" : null);
      })
      .catch(function () {
        sendBtn.disabled = false;
        addMessage("ai", "Sorry, something went wrong. Please try again in a moment.");
      });
  }

  sendBtn.addEventListener("click", send);
  inputEl.addEventListener("keydown", function (e) {
    if (e.key === "Enter") send();
  });
})();
