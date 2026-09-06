import { isMusicPlaying } from "./audio.js?v=24";

const TITLE_OPERATOR_NOTES = [
  "OPERATOR NOTE #002\nR-SW-01 refuses to enter Sector C.",
  "OPERATOR NOTE #011\nPressure wins quickly.\nControl wins patiently.\nChaos wins unexpectedly.",
  "OPERATOR NOTE #018\nThe triangle was not invented.\nIt was discovered.",
  "OPERATOR NOTE #023\nSubject asked:\n\"Why does the loop restart?\"",
  "OPERATOR NOTE #031\nA previous unit tried to win every room\nin one mode. The lab kept the dent\nin the wall as a training aid.",
  "OPERATOR NOTE #038\nPrototype survived seventeen previous operators.",
  "OPERATOR NOTE #041\nMaintenance found a second warning label,\nsame handwriting, on a shelf nobody uses.",
  "OPERATOR NOTE #052\nChaos is not randomness.\nIt is the failure of the current prediction.",
  "OPERATOR NOTE #061\nControl becomes fragile\nwhen it forgets the world can improvise.",
  "OPERATOR NOTE #073\nPressure is useful.\nCommitment without awareness is not.",
  "OPERATOR NOTE #087\nThe lab likes straight lines.\nThe bot prefers exits.",
  "OPERATOR NOTE #094\nWhen the floor hums in threes,\ncount the fourth beat before moving.",
  "OPERATOR NOTE #108\nR-SW-01 drew a smile on the warning label.\nMaintenance called it morale.",
  "OPERATOR NOTE #119\nA perfect plan is still only one mode.\nSwitch before it becomes a trap.",
  "OPERATOR NOTE #126\nCapsules are not candy.\nR-SW-01 filed a disagreement.",
  "OPERATOR NOTE #137\nThe room does not hate you.\nIt is simply convinced too early.",
  "OPERATOR NOTE #144\nPressure opens the door.\nControl checks the hinge.\nChaos notices there is no wall.",
  "OPERATOR NOTE #155\nIf the loop feels personal,\nthank the robot and keep moving.",
  "OPERATOR NOTE #162\nR-SW-01 wins with what researchers call\nresting switch face.",
];

export function createTitleAtmosphere({
  reducedMotionQuery,
  getVisualQuality,
  getMusicOptions,
  getScreen,
  rand,
  clamp,
}) {
  let titleStartupSeen = false;
  const atmosphere = {
    active: false,
    reduced: false,
    state: "idle",
    timers: [],
    listeners: [],
    frame: 0,
    noteIndex: -1,
    noteHovered: false,
    noteToken: 0,
    lastInteractionAt: 0,
    cursorNearSince: 0,
    nearReactionAfter: 0,
    musicPulseAt: 0,
    elements: {},
  };

  function init(screenLayer) {
    destroy();

    const root = screenLayer.querySelector(".menu-card");
    if (!root) return;

    const elements = {
      root,
      monitor: root.querySelector("[data-title-monitor]"),
      mascot: root.querySelector("[data-mascot]"),
      note: root.querySelector("[data-operator-note]"),
      noteCopy: root.querySelector("[data-note-copy]"),
      triad: root.querySelector("[data-triad-panel]"),
      logo: root.querySelector("[data-title-logo]"),
      startup: root.querySelector("[data-title-startup]"),
      startupLines: root.querySelector("[data-startup-lines]"),
      ripple: root.querySelector("[data-scan-ripple]"),
    };

    atmosphere.active = true;
    atmosphere.reduced = isReduced();
    atmosphere.state = "idle";
    atmosphere.timers = [];
    atmosphere.listeners = [];
    atmosphere.elements = elements;
    atmosphere.noteHovered = false;
    atmosphere.lastInteractionAt = performance.now();
    atmosphere.cursorNearSince = 0;
    atmosphere.nearReactionAfter = rand(2000, 4000);
    atmosphere.noteToken += 1;

    root.classList.add("title-atmosphere-live");
    root.classList.toggle("title-reduced-motion", atmosphere.reduced);
    root.dataset.mascotState = "idle";

    const initialNote = Math.floor(rand(0, TITLE_OPERATOR_NOTES.length));
    atmosphere.noteIndex = initialNote;
    setOperatorNote(TITLE_OPERATOR_NOTES[initialNote], false);

    runStartupSequence();
    startMusicObserver();
    setupInteractionHandlers();
    scheduleOperatorNoteRotation();
    scheduleBlink(atmosphere.reduced ? [7000, 12000] : [2500, 6000]);

    if (!atmosphere.reduced) {
      scheduleGlance();
      scheduleRareAction();
      scheduleTriadSequence();
      scheduleIdleScene();
    }
  }

  function destroy() {
    if (!atmosphere.active) return;
    atmosphere.active = false;
    cancelAnimationFrame(atmosphere.frame);
    atmosphere.frame = 0;
    for (const timer of atmosphere.timers) window.clearTimeout(timer);
    for (const remove of atmosphere.listeners) remove();
    atmosphere.timers = [];
    atmosphere.listeners = [];
    atmosphere.elements = {};
    atmosphere.state = "idle";
  }

  function isReduced() {
    return reducedMotionQuery.matches || getVisualQuality().reduced;
  }

  function addTimer(callback, delay) {
    const timer = window.setTimeout(() => {
      atmosphere.timers = atmosphere.timers.filter((item) => item !== timer);
      if (atmosphere.active) callback();
    }, delay);
    atmosphere.timers.push(timer);
    return timer;
  }

  function addListener(target, type, handler, options) {
    if (!target) return;
    target.addEventListener(type, handler, options);
    atmosphere.listeners.push(() => target.removeEventListener(type, handler, options));
  }

  function registerActivity() {
    atmosphere.lastInteractionAt = performance.now();
    if (atmosphere.state === "sleeping" || atmosphere.state === "dozing") {
      clearMascotAction();
      runMascotAction("startled", 620, { force: true });
    }
  }

  function setMascotLook(x = 0, y = 0) {
    const root = atmosphere.elements.root;
    if (!root) return;
    root.style.setProperty("--mascot-eye-x", `${(clamp(x, -1, 1) * 3).toFixed(1)}px`);
    root.style.setProperty("--mascot-eye-y", `${(clamp(y, -1, 1) * 2).toFixed(1)}px`);
    root.style.setProperty("--mascot-head-tilt", `${(clamp(x, -1, 1) * 3.2).toFixed(2)}deg`);
    root.style.setProperty("--mascot-antenna-tilt", `${(clamp(x, -1, 1) * 8).toFixed(2)}deg`);
  }

  function setupInteractionHandlers() {
    const { root, monitor, mascot, note, triad, ripple } = atmosphere.elements;
    if (!root) return;

    addListener(root, "pointermove", registerActivity, { passive: true });
    addListener(root, "pointerdown", registerActivity, { passive: true });
    addListener(root, "focusin", registerActivity);

    if (note) {
      addListener(note, "pointerenter", () => { atmosphere.noteHovered = true; });
      addListener(note, "pointerleave", () => { atmosphere.noteHovered = false; });
      addListener(note, "focusin", () => { atmosphere.noteHovered = true; });
      addListener(note, "focusout", () => { atmosphere.noteHovered = false; });
    }

    if (!atmosphere.reduced && monitor && mascot) {
      addListener(monitor, "pointermove", (event) => {
        const mascotRect = mascot.getBoundingClientRect();
        const centerX = mascotRect.left + mascotRect.width * 0.5;
        const centerY = mascotRect.top + mascotRect.height * 0.38;
        const x = clamp((event.clientX - centerX) / Math.max(90, mascotRect.width * 2.4), -1, 1);
        const y = clamp((event.clientY - centerY) / Math.max(80, mascotRect.height * 1.7), -1, 1);
        setMascotLook(x, y);

        const now = performance.now();
        const near = Math.abs(event.clientX - centerX) < mascotRect.width * 1.35 &&
          Math.abs(event.clientY - centerY) < mascotRect.height * 1.35;
        if (near) {
          if (!atmosphere.cursorNearSince) atmosphere.cursorNearSince = now;
          if (now - atmosphere.cursorNearSince > atmosphere.nearReactionAfter) {
            runMascotAction(Math.random() > 0.45 ? "waving" : "look-player", 1150);
            atmosphere.cursorNearSince = now + rand(5000, 9000);
            atmosphere.nearReactionAfter = rand(2200, 4200);
          }
        } else {
          atmosphere.cursorNearSince = 0;
        }
      }, { passive: true });

      addListener(monitor, "pointerleave", () => {
        atmosphere.cursorNearSince = 0;
        setMascotLook(0, 0);
      }, { passive: true });

      addListener(monitor, "pointerdown", (event) => {
        const mascotRect = mascot.getBoundingClientRect();
        const nearMascot = event.clientX >= mascotRect.left - 18 &&
          event.clientX <= mascotRect.right + 18 &&
          event.clientY >= mascotRect.top - 18 &&
          event.clientY <= mascotRect.bottom + 18;
        triggerScanRipple(event, monitor, ripple);
        if (nearMascot) runMascotAction("startled", 680, { force: true });
      }, { passive: true });
    }

    if (!atmosphere.reduced && triad) {
      addListener(triad, "pointermove", (event) => {
        const rect = triad.getBoundingClientRect();
        const x = clamp(((event.clientX - rect.left) / rect.width - 0.5) * 2, -1, 1);
        const y = clamp(((event.clientY - rect.top) / rect.height - 0.5) * 2, -1, 1);
        triad.style.setProperty("--triad-lean-x", `${(x * 2).toFixed(2)}deg`);
        triad.style.setProperty("--triad-lean-y", `${(y * -2).toFixed(2)}deg`);
      }, { passive: true });
      addListener(triad, "pointerleave", () => {
        triad.style.setProperty("--triad-lean-x", "0deg");
        triad.style.setProperty("--triad-lean-y", "0deg");
      }, { passive: true });
      addListener(triad, "click", () => {
        triad.classList.remove("triad-click-spin");
        void triad.offsetWidth;
        triad.classList.add("triad-click-spin");
        addTimer(() => triad.classList.remove("triad-click-spin"), 850);
        runMascotAction("inspecting", 1050);
      });
    }

    addListener(root, "pointerover", (event) => {
      const button = event.target.closest("[data-action]");
      if (button) reactToMenuAction(button.dataset.action);
    }, { passive: true });
    addListener(root, "focusin", (event) => {
      const button = event.target.closest("[data-action]");
      if (button) reactToMenuAction(button.dataset.action);
    });
  }

  function triggerScanRipple(event, monitor, ripple) {
    if (!ripple || atmosphere.reduced) return;
    const rect = monitor.getBoundingClientRect();
    ripple.style.setProperty("--ripple-x", `${(((event.clientX - rect.left) / rect.width) * 100).toFixed(1)}%`);
    ripple.style.setProperty("--ripple-y", `${(((event.clientY - rect.top) / rect.height) * 100).toFixed(1)}%`);
    ripple.classList.remove("scan-ripple-live");
    void ripple.offsetWidth;
    ripple.classList.add("scan-ripple-live");
    addTimer(() => ripple.classList.remove("scan-ripple-live"), 520);
  }

  function reactToMenuAction(action) {
    if (atmosphere.reduced) return;
    const reactions = {
      start: "thumbs",
      survival: "brace",
      levels: "look-menu",
      editor: "inspecting",
      how: "pointing",
      options: "adjusting",
      credits: "saluting",
    };
    runMascotAction(reactions[action] || "look-menu", 900);
  }

  function runMascotAction(action, duration = 1200, options = {}) {
    const root = atmosphere.elements.root;
    const force = Boolean(options.force);
    if (!atmosphere.active || !root) return false;
    if (atmosphere.reduced) return false;
    if (!force && atmosphere.state !== "idle") return false;
    clearMascotAction();
    atmosphere.state = action === "dozing" ? "sleeping" : action;
    root.dataset.mascotState = action;
    if (action === "look-player") setMascotLook(0, -0.28);
    if (action === "look-menu") setMascotLook(-0.7, 0.08);
    if (action === "inspecting" || action === "pointing") setMascotLook(0.68, -0.06);
    addTimer(() => clearMascotAction(), duration);
    return true;
  }

  function clearMascotAction() {
    const root = atmosphere.elements.root;
    if (!root) return;
    atmosphere.state = "idle";
    root.dataset.mascotState = "idle";
    setMascotLook(0, 0);
  }

  function scheduleBlink(range) {
    if (!atmosphere.active) return;
    const [minDelay, maxDelay] = range;
    addTimer(() => {
      triggerBlink(Math.random() < 0.18 && !atmosphere.reduced);
      scheduleBlink(range);
    }, rand(minDelay, maxDelay));
  }

  function triggerBlink(doubleBlink = false) {
    const root = atmosphere.elements.root;
    if (!root || atmosphere.state === "sleeping") return;
    root.classList.remove("mascot-blink", "mascot-double-blink");
    void root.offsetWidth;
    root.classList.add(doubleBlink ? "mascot-double-blink" : "mascot-blink");
    addTimer(() => root.classList.remove("mascot-blink", "mascot-double-blink"), doubleBlink ? 460 : 190);
  }

  function scheduleGlance() {
    addTimer(() => {
      if (atmosphere.state === "idle") {
        setMascotLook(rand(-0.7, 0.7), rand(-0.35, 0.28));
        addTimer(() => {
          if (atmosphere.state === "idle") setMascotLook(0, 0);
        }, rand(650, 1250));
      }
      scheduleGlance();
    }, rand(4000, 10000));
  }

  function scheduleRareAction() {
    addTimer(() => {
      const actions = ["waving", "saluting", "inspecting", "adjusting", "stretching", "startled", "look-menu", "look-player"];
      runMascotAction(actions[Math.floor(rand(0, actions.length))], rand(800, 1600));
      scheduleRareAction();
    }, rand(18000, 40000));
  }

  function scheduleIdleScene() {
    addTimer(() => {
      const idleFor = performance.now() - atmosphere.lastInteractionAt;
      if (atmosphere.state === "idle" && idleFor > rand(25000, 40000)) {
        if (idleFor > rand(140000, 220000)) runMascotAction("dozing", rand(4200, 6200));
        else if (idleFor > rand(90000, 140000)) runMascotAction("slouching", rand(2100, 3200));
        else if (idleFor > rand(55000, 90000)) runMascotAction("scanning", rand(1800, 2700));
        else runMascotAction("inspecting", rand(1500, 2300));
      }
      scheduleIdleScene();
    }, rand(12000, 22000));
  }

  function scheduleTriadSequence() {
    addTimer(() => {
      runTriadDestabilize();
      scheduleTriadSequence();
    }, rand(25000, 60000));
  }

  function runTriadDestabilize() {
    const { root, triad } = atmosphere.elements;
    if (!root || !triad || atmosphere.state !== "idle" || atmosphere.reduced) return;
    triad.classList.add("triad-destabilize");
    runMascotAction("inspecting", 1600);
    addTimer(() => runMascotAction("relieved", 1350, { force: true }), 1650);
    addTimer(() => triad.classList.remove("triad-destabilize"), 3100);
  }

  function scheduleLogoGlitch() {
    addTimer(() => {
      triggerLogoGlitch();
      scheduleLogoGlitch();
    }, atmosphere.reduced ? rand(32000, 52000) : rand(18000, 35000));
  }

  function triggerLogoGlitch() {
    const logo = atmosphere.elements.logo;
    if (!logo) return;
    const letters = Array.from(logo.querySelectorAll("[data-title-letter]"));
    const letter = letters[Math.floor(rand(0, letters.length))];
    logo.classList.remove("title-logo-scan", "title-logo-sync");
    for (const item of letters) item.classList.remove("letter-flicker");
    if (!atmosphere.reduced && Math.random() < 0.34) {
      logo.classList.add("title-logo-sync");
    } else if (letter && !atmosphere.reduced && Math.random() < 0.5) {
      letter.classList.add("letter-flicker");
    } else {
      logo.classList.add("title-logo-scan");
    }
    addTimer(() => {
      logo.classList.remove("title-logo-scan", "title-logo-sync");
      for (const item of letters) item.classList.remove("letter-flicker");
    }, 520);
  }

  function scheduleOperatorNoteRotation() {
    addTimer(() => {
      if (atmosphere.noteHovered) {
        scheduleOperatorNoteRotation();
        return;
      }
      atmosphere.noteIndex = (atmosphere.noteIndex + 1) % TITLE_OPERATOR_NOTES.length;
      setOperatorNote(TITLE_OPERATOR_NOTES[atmosphere.noteIndex], !atmosphere.reduced);
      scheduleOperatorNoteRotation();
    }, rand(20000, 45000));
  }

  function setOperatorNote(note, typed = true) {
    const noteCopy = atmosphere.elements.noteCopy;
    const notePanel = atmosphere.elements.note;
    if (!noteCopy) return;
    atmosphere.noteToken += 1;
    const token = atmosphere.noteToken;
    if (notePanel) notePanel.classList.add("note-refreshing");
    if (!typed) {
      noteCopy.textContent = note;
      addTimer(() => {
        if (notePanel) notePanel.classList.remove("note-refreshing");
      }, 180);
      return;
    }
    noteCopy.textContent = "";
    typeOperatorNote(note, 0, token);
  }

  function typeOperatorNote(note, index, token) {
    const noteCopy = atmosphere.elements.noteCopy;
    const notePanel = atmosphere.elements.note;
    if (!atmosphere.active || !noteCopy || token !== atmosphere.noteToken) return;
    noteCopy.textContent = note.slice(0, index);
    if (index >= note.length) {
      addTimer(() => {
        if (notePanel) notePanel.classList.remove("note-refreshing");
      }, 180);
      return;
    }
    const char = note[index];
    addTimer(() => typeOperatorNote(note, index + 1, token), char === "\n" ? rand(80, 135) : rand(12, 28));
  }

  function runStartupSequence() {
    const { root, startup, startupLines } = atmosphere.elements;
    if (!root) return;
    if (!startup || !startupLines || titleStartupSeen) {
      root.classList.add("title-ready");
      if (startup) {
        startup.setAttribute("hidden", "");
      }
      return;
    }

    const lines = [
      "INITIALIZING...",
      "LAB LINK ESTABLISHED",
      "FLOW 00",
      "PRESSURE / CHAOS / CONTROL",
      "R-SW-01 ONLINE",
      "SYSTEM READY",
    ];
    let done = false;
    let lineIndex = 0;
    startupLines.textContent = "";
    root.classList.add("title-starting");

    const finish = () => {
      if (done) return;
      done = true;
      titleStartupSeen = true;
      root.classList.remove("title-starting");
      root.classList.add("title-ready");
      startup.setAttribute("hidden", "");
    };

    const skip = (event) => {
      if (done) return;
      if (event.type === "keydown" && !["Enter", "Space", "Escape"].includes(event.code)) return;
      event.preventDefault();
      finish();
    };

    addListener(startup, "pointerdown", skip);
    addListener(window, "keydown", skip);

    const addLine = () => {
      if (done || !atmosphere.active) return;
      const line = document.createElement("span");
      line.textContent = lines[lineIndex];
      startupLines.appendChild(line);
      lineIndex += 1;
      if (lineIndex < lines.length) addTimer(addLine, atmosphere.reduced ? 120 : rand(170, 310));
      else addTimer(finish, atmosphere.reduced ? 180 : 520);
    };

    addTimer(addLine, 120);
  }

  function startMusicObserver() {
    const tick = (now) => {
      if (!atmosphere.active) return;
      const root = atmosphere.elements.root;
      if (root && now - atmosphere.musicPulseAt > 420) {
        atmosphere.musicPulseAt = now;
        const options = getMusicOptions();
        const reactive = getScreen() === "menu" &&
          isMusicPlaying() &&
          !options.muted &&
          Number(options.music) > 0;
        root.classList.toggle("title-music-active", reactive && !atmosphere.reduced);
      }
      atmosphere.frame = requestAnimationFrame(tick);
    };
    atmosphere.frame = requestAnimationFrame(tick);
  }

  return { init, destroy };
}