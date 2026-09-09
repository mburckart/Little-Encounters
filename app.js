(() => {
  const STORAGE_KEY = "friendRunIns.v2";

  const monthLabel = document.getElementById("monthLabel");
  const monthCount = document.getElementById("monthCount");
  const todayCount = document.getElementById("todayCount");
  const lifetimeCount = document.getElementById("lifetimeCount");
  const miniMessage = document.getElementById("miniMessage");
  const addBtn = document.getElementById("addBtn");
  const undoBtn = document.getElementById("undoBtn");
  const monthHistory = document.getElementById("monthHistory");
  const recentHistory = document.getElementById("recentHistory");
  const status = document.getElementById("status");
  const confetti = document.getElementById("confetti");

  function loadEntries() {
    try {
      const v2 = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (Array.isArray(v2)) return v2.filter(x => typeof x === "string");

      // Import data from the earlier version automatically if it exists.
      const old = JSON.parse(localStorage.getItem("friendRunIns.v1") || "[]");
      if (Array.isArray(old)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(old));
        return old.filter(x => typeof x === "string");
      }
      return [];
    } catch {
      return [];
    }
  }

  let entries = loadEntries();

  function saveEntries() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }

  function localDateKey(date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0")
    ].join("-");
  }

  function monthKey(date) {
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0")].join("-");
  }

  function safeDate(iso) {
    const d = new Date(iso);
    return Number.isFinite(d.getTime()) ? d : null;
  }

  function celebrate() {
    const symbols = ["✦", "♡", "✿", "⋆", "♡", "✧"];
    for (let i = 0; i < 11; i++) {
      const piece = document.createElement("span");
      piece.className = "confetti-piece";
      piece.textContent = symbols[i % symbols.length];
      piece.style.setProperty("--x", `${Math.round((Math.random() - .5) * 230)}px`);
      piece.style.setProperty("--y", `${Math.round(-45 - Math.random() * 145)}px`);
      piece.style.setProperty("--r", `${Math.round((Math.random() - .5) * 160)}deg`);
      confetti.appendChild(piece);
      setTimeout(() => piece.remove(), 760);
    }
  }

  function render() {
    const now = new Date();
    const thisMonth = monthKey(now);
    const today = localDateKey(now);
    const validDates = entries.map(safeDate).filter(Boolean);

    const currentMonthDates = validDates.filter(d => monthKey(d) === thisMonth);
    const todayDates = validDates.filter(d => localDateKey(d) === today);

    monthLabel.textContent = now.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric"
    });

    monthCount.textContent = currentMonthDates.length;
    todayCount.textContent = todayDates.length;
    lifetimeCount.textContent = validDates.length;

    if (todayDates.length === 0) {
      miniMessage.textContent = "waiting for a sighting...";
    } else if (todayDates.length === 1) {
      miniMessage.textContent = "you saw them today ♡";
    } else {
      miniMessage.textContent = `${todayDates.length} sightings today ✦`;
    }

    undoBtn.disabled = validDates.length === 0;

    const grouped = {};
    validDates.forEach(d => {
      const key = monthKey(d);
      grouped[key] = (grouped[key] || 0) + 1;
    });

    monthHistory.innerHTML = "";
    const sortedMonths = Object.keys(grouped).sort().reverse();

    if (!sortedMonths.length) {
      monthHistory.innerHTML = '<p class="empty">No sightings yet — your first one will appear here ✿</p>';
    } else {
      sortedMonths.forEach(key => {
        const [year, month] = key.split("-").map(Number);
        const label = new Date(year, month - 1, 1).toLocaleDateString(undefined, {
          month: "long",
          year: "numeric"
        });

        const card = document.createElement("div");
        card.className = "month-card";

        const name = document.createElement("span");
        name.className = "month-name";
        name.textContent = label;

        const total = document.createElement("span");
        total.className = "month-total";
        total.textContent = grouped[key];

        const word = document.createElement("span");
        word.className = "month-word";
        word.textContent = grouped[key] === 1 ? "little encounter" : "little encounters";

        card.append(name, total, word);
        monthHistory.appendChild(card);
      });
    }

    recentHistory.innerHTML = "";
    const recent = validDates.slice().reverse().slice(0, 8);

    if (!recent.length) {
      recentHistory.innerHTML = '<p class="empty">Nothing here yet ♡</p>';
    } else {
      recent.forEach(d => {
        const row = document.createElement("div");
        row.className = "recent-row";

        const left = document.createElement("span");
        left.textContent = d.toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric"
        });

        const right = document.createElement("span");
        right.textContent = d.toLocaleTimeString(undefined, {
          hour: "numeric",
          minute: "2-digit"
        });

        row.append(left, right);
        recentHistory.appendChild(row);
      });
    }
  }

  addBtn.addEventListener("click", () => {
    entries.push(new Date().toISOString());
    saveEntries();
    status.textContent = "saved ♡";
    celebrate();
    render();

    if (navigator.vibrate) navigator.vibrate(30);
  });

  undoBtn.addEventListener("click", () => {
    if (!entries.length) return;
    entries.pop();
    saveEntries();
    status.textContent = "last tap removed";
    render();
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js").catch(() => {});
    });
  }

  render();
})();
