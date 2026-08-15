/* =====================================================================
   WIIMERICA — menu behaviour
   No dependencies, no network calls. Reads everything from channels.js.
   ===================================================================== */
(function () {
  "use strict";

  var CFG = window.WIIMERICA || {};
  var PER_PAGE = 12;

  var $ = function (id) { return document.getElementById(id); };
  var body = document.body;

  /* ---------------------------------------------------------------
     Media paths: filenames contain spaces and unicode, so encode each
     path segment rather than trusting the browser to guess.
  --------------------------------------------------------------- */
  function join(dir, file) {
    return (dir || "").split("/").filter(Boolean).map(encodeURIComponent).join("/") +
           "/" + encodeURIComponent(file);
  }

  /* full-size original — used once a channel is opened */
  function media(file) {
    if (!file) return "";
    return join(CFG.mediaDir, file);
  }

  /* 720px JPEG copy — used for the 12 tiles on the menu */
  function thumb(file) {
    if (!file) return "";
    if (!CFG.thumbDir) return media(file);
    return join(CFG.thumbDir, file.replace(/\.[^.]+$/, "") + ".jpg");
  }

  /* ---------------------------------------------------------------
     Audio
  --------------------------------------------------------------- */
  var bgm = $("bgm");
  var muted = false;

  var sfx = {
    startup: $("sfxStartup"),
    hover:   $("sfxHover"),
    channel: $("sfxChannel"),
    scroll:  $("sfxScroll")
  };

  Object.keys(sfx).forEach(function (k) {
    if (sfx[k]) sfx[k].volume = k === "startup" ? 0.55 : 0.35;
  });

  function play(name) {
    var el = sfx[name];
    if (!el || muted) return;
    try {
      el.currentTime = 0;
      var p = el.play();
      if (p && p.catch) p.catch(function () {});
    } catch (e) { /* autoplay policy — ignore */ }
  }

  function startMusic() {
    if (!bgm || muted) return;
    bgm.volume = 0.28;
    var p = bgm.play();
    if (p && p.catch) p.catch(function () {});
  }

  /* Warm the track up while the visitor is still reading the boot screen,
     so the music is ready the instant they press A. */
  var primed = false;
  function primeMusic() {
    if (primed || !bgm) return;
    primed = true;
    bgm.preload = "auto";
    try { bgm.load(); } catch (e) { /* noop */ }
  }

  /* Let channels.js pick the soundtrack */
  if (bgm && CFG.music) bgm.src = media(CFG.music);

  /* ---------------------------------------------------------------
     Clock — Wii style, updates on the minute
  --------------------------------------------------------------- */
  var DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  function tickClock() {
    var now = new Date();
    var h = now.getHours();
    var m = now.getMinutes();
    var ampm = h >= 12 ? "PM" : "AM";
    var h12 = h % 12 || 12;

    $("clock").textContent = h12 + ":" + (m < 10 ? "0" + m : m) + " " + ampm;
    $("date").textContent =
      DAYS[now.getDay()] + " " + (now.getMonth() + 1) + "/" + now.getDate();
  }

  tickClock();
  setInterval(tickClock, 10000);

  /* ---------------------------------------------------------------
     Build the channel grid
  --------------------------------------------------------------- */
  var list = (CFG.channels || []).slice();

  /* pad the last page out with empty slots so the grid stays 4x3 */
  var remainder = list.length % PER_PAGE;
  if (remainder !== 0) {
    for (var i = remainder; i < PER_PAGE; i++) list.push({ type: "blank" });
  }

  var pageCount = Math.max(1, Math.ceil(list.length / PER_PAGE));
  var page = 0;

  var grid = $("channels");
  var dots = $("pageDots");

  for (var d = 0; d < pageCount; d++) dots.appendChild(document.createElement("span"));

  function buildTile(ch, index) {
    var el = document.createElement("button");
    el.type = "button";
    el.className = "channel";
    el.style.setProperty("--d", (index * 45) + "ms");

    if (ch.type === "blank") {
      el.classList.add("is-blank");
      el.disabled = true;
      el.setAttribute("aria-hidden", "true");
      el.tabIndex = -1;
      return el;
    }

    el.setAttribute("aria-label", ch.title || "Channel");

    if (ch.type === "buy") el.classList.add("is-buy");
    if (!ch.poster) el.classList.add("no-poster");

    if (ch.poster) {
      var img = document.createElement("img");
      img.className = "channel-media";
      img.src = thumb(ch.poster);
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      /* if a thumbnail was never generated, fall back to the original */
      img.addEventListener("error", function once() {
        img.removeEventListener("error", once);
        img.src = media(ch.poster);
      });
      el.appendChild(img);
    }

    /* video preview on hover — metadata only until the user hovers */
    if (ch.video) {
      var vid = document.createElement("video");
      vid.className = "channel-media vid";
      vid.src = media(ch.video);
      vid.muted = true;
      vid.loop = true;
      vid.playsInline = true;
      vid.setAttribute("playsinline", "");
      /* With no poster art the tile would sit blank until hovered, so pull
         metadata in and let the first frame stand in as the poster. Tiles
         that do have art stay at preload="none" and cost nothing. */
      vid.preload = ch.poster ? "none" : "metadata";
      el.appendChild(vid);

      el.addEventListener("mouseenter", function () {
        if (vid.preload === "none") vid.preload = "metadata";
        var p = vid.play();
        if (p && p.catch) p.catch(function () {});
      });
      el.addEventListener("mouseleave", function () {
        vid.pause();
      });
    }

    if (ch.type === "buy") {
      var flash = document.createElement("span");
      flash.className = "buy-flash";
      flash.textContent = "PRESS START";
      el.appendChild(flash);
    }

    var label = document.createElement("span");
    label.className = "channel-label";
    label.textContent = ch.title || "";
    el.appendChild(label);

    el.addEventListener("mouseenter", function () { play("channel"); });
    el.addEventListener("click", function () { openChannel(ch); });

    return el;
  }

  function renderPage(next, silent) {
    page = Math.max(0, Math.min(pageCount - 1, next));

    grid.innerHTML = "";
    var start = page * PER_PAGE;
    list.slice(start, start + PER_PAGE).forEach(function (ch, i) {
      grid.appendChild(buildTile(ch, i));
    });

    Array.prototype.forEach.call(dots.children, function (dot, i) {
      dot.classList.toggle("on", i === page);
    });

    $("pagePrev").disabled = page === 0;
    $("pageNext").disabled = page === pageCount - 1;

    if (!silent) play("scroll");
  }

  function turnPage(delta) {
    var target = page + delta;
    if (target < 0 || target > pageCount - 1) return;
    grid.classList.add("turning");
    setTimeout(function () {
      renderPage(target);
      grid.classList.remove("turning");
    }, 200);
  }

  $("pagePrev").addEventListener("click", function () { turnPage(-1); });
  $("pageNext").addEventListener("click", function () { turnPage(1); });

  /* ---------------------------------------------------------------
     Channel view
  --------------------------------------------------------------- */
  var stage = $("channelStage");
  var btnStart = $("btnStart");
  var current = null;

  function clearStage() {
    /* a channel can hold both a video and an audio track — tear down every
       one of them, or the soundtrack keeps playing after you leave */
    Array.prototype.forEach.call(stage.querySelectorAll("video, audio"), function (m) {
      m.pause();
      m.removeAttribute("src");
      m.load();
    });
    stage.innerHTML = "";
  }

  function ca() {
    return (CFG.contractAddress || "").trim();
  }

  function buildBuyPanel() {
    var wrap = document.createElement("div");
    wrap.className = "buy-panel";

    var pfp = document.createElement("img");
    pfp.src = thumb("PFP.png");
    pfp.alt = "Wiimerica";
    wrap.appendChild(pfp);

    var h = document.createElement("h2");
    h.textContent = "$WIIMERICA";
    wrap.appendChild(h);

    var sub = document.createElement("p");
    sub.className = "buy-sub";
    sub.textContent = "Everybody gets a channel.";
    wrap.appendChild(sub);

    var box = document.createElement("div");
    box.className = "buy-ca";
    var code = document.createElement("code");
    code.textContent = ca() || "CONTRACT ADDRESS — COMING SOON";
    box.appendChild(code);

    if (ca()) {
      var copy = document.createElement("button");
      copy.className = "wii-btn";
      copy.type = "button";
      copy.textContent = "Copy";
      copy.addEventListener("click", function () { copyCA(copy); });
      box.appendChild(copy);
    }
    wrap.appendChild(box);

    var links = document.createElement("div");
    links.className = "buy-links";
    var L = CFG.links || {};
    [
      ["Buy",   L.buy],
      ["Chart", L.chart],
      ["X",     L.twitter]
    ].forEach(function (pair) {
      if (!pair[1]) return;
      var a = document.createElement("a");
      a.className = "wii-btn";
      a.href = pair[1];
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = pair[0];
      links.appendChild(a);
    });
    wrap.appendChild(links);

    return wrap;
  }

  /* The audio player that sits over the stage. `raised` lifts it clear of the
     caption strip when there is no video controls bar underneath it. */
  function buildStageAudio(ch, raised) {
    var a = document.createElement("audio");
    a.className = "stage-audio" + (raised ? " raised" : "");
    a.src = media(ch.audio);
    a.controls = true;
    a.autoplay = true;
    return a;
  }

  function openChannel(ch) {
    current = ch;
    clearStage();
    play("startup");

    $("channelTitle").textContent = ch.title || "";

    if (ch.type === "buy") {
      stage.appendChild(buildBuyPanel());
      btnStart.hidden = !(CFG.links && CFG.links.buy);
      btnStart.textContent = "Buy";
    } else if (ch.video) {
      var v = document.createElement("video");
      v.src = media(ch.video);
      v.autoplay = true;
      v.playsInline = true;
      v.setAttribute("playsinline", "");

      if (ch.audio) {
        /* A separate soundtrack means the clip is only the backdrop: mute it,
           loop it under the audio, and let the audio be the thing that plays
           through. Used for the promo, whose full cut is an audio export. */
        v.muted = true;
        v.loop = true;
        v.controls = false;
        stage.appendChild(v);
        stage.appendChild(buildStageAudio(ch, false));
      } else {
        v.controls = true;
        v.loop = true;
        stage.appendChild(v);
      }

      btnStart.hidden = false;
      btnStart.textContent = "Replay";
    } else if (ch.audio) {
      var img = document.createElement("img");
      img.src = media(ch.poster || "PFP.png");
      img.alt = "";
      stage.appendChild(img);
      stage.appendChild(buildStageAudio(ch, true));
      btnStart.hidden = false;
      btnStart.textContent = "Replay";
    } else if (ch.poster) {
      var pic = document.createElement("img");
      pic.src = media(ch.poster);
      pic.alt = "";
      stage.appendChild(pic);
      btnStart.hidden = true;
    } else {
      btnStart.hidden = true;
    }

    /* the buy panel already carries its own tagline — a second overlay
       caption would land on top of the Buy / Chart buttons */
    if (ch.body && ch.type !== "buy") {
      var note = document.createElement("div");
      note.className = "stage-note";
      note.textContent = ch.body;
      stage.appendChild(note);
    }

    if (bgm) bgm.pause();
    setState("channel");
    $("channelView").setAttribute("aria-hidden", "false");
  }

  function closeChannel() {
    clearStage();
    current = null;
    $("channelView").setAttribute("aria-hidden", "true");
    setState("menu");
    startMusic();
    play("scroll");
  }

  $("btnBackToMenu").addEventListener("click", closeChannel);

  btnStart.addEventListener("click", function () {
    if (!current) return;
    if (current.type === "buy") {
      var url = CFG.links && CFG.links.buy;
      if (url) window.open(url, "_blank", "noopener");
      return;
    }
    /* restart every track this channel owns, so a promo with a separate
       soundtrack replays in sync rather than just rewinding the picture */
    Array.prototype.forEach.call(stage.querySelectorAll("video, audio"), function (m) {
      m.currentTime = 0;
      var p = m.play();
      if (p && p.catch) p.catch(function () {});
    });
  });

  /* ---------------------------------------------------------------
     Wii Mail
  --------------------------------------------------------------- */
  var mailList = $("mailList");
  var mailCount = (CFG.mail || []).length;

  if (mailCount) $("mailBadge").textContent = String(mailCount);
  else $("mailBadge").hidden = true;

  (CFG.mail || []).forEach(function (m) {
    var item = document.createElement("div");
    item.className = "mail-item";
    item.innerHTML =
      '<div class="m-from"></div><div class="m-subject"></div><div class="m-body"></div>';
    item.querySelector(".m-from").textContent = m.from || "Wiimerica";
    item.querySelector(".m-subject").textContent = m.subject || "";
    item.querySelector(".m-body").textContent = m.body || "";
    mailList.appendChild(item);
  });

  var L = CFG.links || {};
  [["Follow on X", L.twitter], ["Chart", L.chart]]
    .forEach(function (pair) {
      if (!pair[1]) return;
      var a = document.createElement("a");
      a.className = "mail-link";
      a.href = pair[1];
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = pair[0] + " →";
      var row = document.createElement("div");
      row.className = "mail-item";
      row.appendChild(a);
      mailList.appendChild(row);
    });

  $("mailBtn").addEventListener("click", function () {
    play("channel");
    $("mailBadge").hidden = true;
    $("mailView").setAttribute("aria-hidden", "false");
    setState("mail");
  });

  $("btnMailClose").addEventListener("click", function () {
    play("scroll");
    $("mailView").setAttribute("aria-hidden", "true");
    setState("menu");
  });

  $("discBtn").addEventListener("click", function () {
    /* the disc slot jumps to the Buy channel, like inserting the game */
    var buy = list.filter(function (c) { return c.type === "buy"; })[0];
    if (buy) openChannel(buy);
  });

  ["pagePrev", "pageNext", "discBtn", "mailBtn", "btnStart", "btnBackToMenu"]
    .forEach(function (id) {
      var el = $(id);
      if (el) el.addEventListener("mouseenter", function () { play("hover"); });
    });

  /* ---------------------------------------------------------------
     Contract address bar
  --------------------------------------------------------------- */
  function copyCA(btn) {
    var text = ca();
    if (!text) return;

    var done = function () {
      var old = btn.textContent;
      btn.textContent = "Copied";
      btn.classList.add("done");
      setTimeout(function () {
        btn.textContent = old;
        btn.classList.remove("done");
      }, 1400);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text, done); });
    } else {
      fallbackCopy(text, done);
    }
  }

  function fallbackCopy(text, done) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); done(); } catch (e) { /* noop */ }
    document.body.removeChild(ta);
  }

  /* A 44-character address does not fit the top bar on a phone. A plain CSS
     ellipsis would clip the tail, which is the half people check, so shorten
     from the middle instead and keep both ends visible. Copy always uses the
     full address regardless of what is displayed. */
  function renderCA() {
    var full = ca();
    var el = $("caValue");
    el.title = full;
    var narrow = window.matchMedia("(max-width: 820px)").matches;
    el.textContent = (narrow && full.length > 20)
      ? full.slice(0, 6) + "…" + full.slice(-6)
      : full;
  }

  if (ca()) {
    $("caBar").hidden = false;
    renderCA();
    window.addEventListener("resize", renderCA);
    $("caCopy").addEventListener("click", function () { copyCA($("caCopy")); });
    /* the bar is fixed to the top of the screen, so the menu and the channel
       stage both need to be pushed down clear of it */
    document.documentElement.classList.add("has-ca");
  }

  /* ---------------------------------------------------------------
     Mute
  --------------------------------------------------------------- */
  $("muteBtn").addEventListener("click", function () {
    muted = !muted;
    $("muteIcon").innerHTML = muted ? "&#128263;" : "&#128266;";
    if (muted) {
      if (bgm) bgm.pause();
    } else if (body.classList.contains("state-menu")) {
      startMusic();
    }
  });

  /* ---------------------------------------------------------------
     State machine
  --------------------------------------------------------------- */
  function setState(name) {
    body.className = "state-" + name;
    $("menu").setAttribute("aria-hidden", name === "boot" ? "true" : "false");
  }

  /* ---------------------------------------------------------------
     Boot
  --------------------------------------------------------------- */
  var booted = false;

  function boot() {
    if (booted) return;
    booted = true;

    $("bootFlash").classList.add("fire");
    play("startup");

    setTimeout(function () {
      setState("menu");
      renderPage(0, true);
      startMusic();
    }, 260);
  }

  $("bootPress").addEventListener("click", boot);
  $("bootPress").addEventListener("mouseenter", function () {
    play("hover");
    primeMusic();
  });
  /* touch devices never fire mouseenter — prime as soon as they reach for it */
  $("bootPress").addEventListener("touchstart", primeMusic, { passive: true });

  document.addEventListener("keydown", function (e) {
    if (body.classList.contains("state-boot")) {
      if (e.key === "Enter" || e.key === " " || e.key.toLowerCase() === "a") {
        e.preventDefault();
        boot();
      }
      return;
    }

    if (e.key === "Escape") {
      if (body.classList.contains("state-channel")) closeChannel();
      else if (body.classList.contains("state-mail")) $("btnMailClose").click();
      return;
    }

    if (body.classList.contains("state-menu")) {
      if (e.key === "ArrowRight") turnPage(1);
      if (e.key === "ArrowLeft") turnPage(-1);
    }
  });

  /* render the first page behind the boot screen so it is warm */
  renderPage(0, true);
})();
