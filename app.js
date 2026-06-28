const statusPath = window.location.pathname.includes("/leaderboard/")
  ? "../data/server-status.json"
  : "data/server-status.json";

let latestSnapshot = null;
let activeBoard = "balance";

document.querySelectorAll("[data-copy]").forEach((button) => {
  const label = button.querySelector(".copy-label");
  const originalLabel = label ? label.textContent : "";

  button.addEventListener("click", async () => {
    const value = button.dataset.copy;
    try {
      await navigator.clipboard.writeText(value);
      if (label) {
        label.textContent = "Copied";
      }
    } catch {
      if (label) {
        label.textContent = value;
      }
    }

    window.setTimeout(() => {
      if (label) {
        label.textContent = originalLabel;
      }
    }, 1800);
  });
});

const setText = (selector, value) => {
  document.querySelectorAll(selector).forEach((element) => {
    element.textContent = value;
  });
};

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "--";
  }
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

const formatDuration = (seconds) => {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "--";
  }
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

const valueOrDash = (value) => {
  if (value === null || value === undefined || value === "") {
    return "--";
  }
  return value;
};

const renderRows = (selector, items, fallback, renderer) => {
  document.querySelectorAll(selector).forEach((element) => {
    element.textContent = "";
    if (!items.length) {
      const empty = document.createElement("span");
      empty.textContent = fallback;
      element.appendChild(empty);
      return;
    }
    items.forEach((item, index) => element.appendChild(renderer(item, index)));
  });
};

const playerRow = (player) => {
  const row = document.createElement("div");
  row.className = "player-row";
  row.innerHTML = `
    <div>
      <strong>${player.username || "Unknown"}</strong>
      <span>${valueOrDash(player.world)} ${player.afk ? "AFK" : "active"}</span>
    </div>
    <div class="player-rank">${valueOrDash(player.rank)}</div>
  `;
  return row;
};

const worldRow = (world) => {
  const row = document.createElement("div");
  row.className = "world-row";
  row.innerHTML = `
    <div>
      <strong>${world.name || "Unknown"}</strong>
      <span>${valueOrDash(world.environment)} - ${valueOrDash(world.weather)}</span>
    </div>
    <div>${world.players || 0} online</div>
  `;
  return row;
};

const integrationPill = ([name, enabled]) => {
  const pill = document.createElement("div");
  pill.className = `integration-pill ${enabled ? "is-on" : ""}`;
  pill.textContent = `${name}: ${enabled ? "online" : "off"}`;
  return pill;
};

const boardValue = (player, board) => {
  if (board === "balance") return Number(player.balance || 0);
  if (board === "playtime") return Number(player.playtimeSeconds || 0);
  if (board === "ping") return Number(player.ping || 0);
  if (board === "level") return Number(player.level || 0);
  return 0;
};

const formatBoardValue = (value, board) => {
  if (board === "balance") return `$${value.toLocaleString()}`;
  if (board === "playtime") return formatDuration(value);
  if (board === "ping") return `${value} ms`;
  if (board === "level") return `Lvl ${value}`;
  return value;
};

const leaderboardRow = (player, index) => {
  const value = boardValue(player, activeBoard);
  const row = document.createElement("div");
  row.className = "leaderboard-row";
  row.innerHTML = `
    <div class="leaderboard-place">#${index + 1}</div>
    <div>
      <strong>${player.username || "Unknown"}</strong>
      <span>${valueOrDash(player.rank)} - ${valueOrDash(player.world)}</span>
    </div>
    <div class="leaderboard-value">${formatBoardValue(value, activeBoard)}</div>
  `;
  return row;
};

const renderLeaderboard = () => {
  const players = Array.isArray(latestSnapshot?.players) ? latestSnapshot.players : [];
  const ranked = [...players]
    .sort((a, b) => boardValue(b, activeBoard) - boardValue(a, activeBoard))
    .slice(0, 25);
  setText("[data-board-label]", activeBoard.charAt(0).toUpperCase() + activeBoard.slice(1));
  renderRows("[data-leaderboard-list]", ranked, "No players in the current public snapshot.", leaderboardRow);
};

const renderStatus = (payload) => {
  latestSnapshot = payload;
  const server = payload.server || {};
  const system = payload.system || {};
  const online = Boolean(payload.ok && server.online);
  const players = Array.isArray(payload.players) ? payload.players : [];
  const worlds = Array.isArray(server.worlds) ? server.worlds : [];
  const ram = system.ram || {};
  const cpu = system.cpu || {};
  const statusCard = document.querySelector(".status-card");

  if (statusCard) {
    statusCard.classList.toggle("is-online", online);
    statusCard.classList.toggle("is-offline", !online);
  }

  setText("[data-status-online]", online ? "Online" : "Offline");
  setText("[data-status-players]", `${server.currentPlayers || 0}/${server.maxPlayers || 0}`);
  setText("[data-status-tps]", server.tps?.oneMinute ? Number(server.tps.oneMinute).toFixed(2) : "--");
  setText("[data-status-mspt]", server.mspt?.average ? `${Number(server.mspt.average).toFixed(1)} ms` : "--");
  setText("[data-status-ram]", `${formatBytes(ram.usedBytes)} / ${formatBytes(ram.maxBytes)}`);
  setText("[data-status-cpu]", Number.isFinite(cpu.processLoad) ? `${Number(cpu.processLoad).toFixed(1)}%` : "--");
  setText("[data-status-uptime]", formatDuration(server.uptimeSeconds));
  setText("[data-status-version]", server.minecraftVersion || "--");
  setText("[data-status-updated]", payload.snapshotTime ? `Last snapshot: ${new Date(payload.snapshotTime).toLocaleString()}` : "No live snapshot has been published yet.");

  renderRows("[data-status-player-list]", players, "No players online", playerRow);
  renderRows("[data-status-worlds]", worlds, "No world data", worldRow);
  renderRows("[data-status-integrations]", Object.entries(payload.integrations || {}), "No integration data", integrationPill);
  renderLeaderboard();
};

const loadStatus = async () => {
  try {
    const response = await fetch(statusPath, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    renderStatus(await response.json());
  } catch {
    renderStatus({ ok: false, server: { online: false, currentPlayers: 0, maxPlayers: 0, worlds: [] }, system: {}, players: [], integrations: {} });
  }
};

document.querySelector("[data-player-search]")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const query = new FormData(form).get("player").trim().toLowerCase();
  const result = document.querySelector("[data-player-result]");
  const players = Array.isArray(latestSnapshot?.players) ? latestSnapshot.players : [];
  const found = players.find((player) =>
    String(player.username || "").toLowerCase() === query ||
    String(player.uuid || "").toLowerCase() === query
  );

  if (!result) {
    return;
  }
  if (!query) {
    result.textContent = "Enter a username or UUID.";
    return;
  }
  if (!found) {
    result.textContent = "That player is not in the latest public snapshot.";
    return;
  }
  result.innerHTML = `
    <strong>${found.username}</strong><br>
    <span>Rank: ${valueOrDash(found.rank)} | World: ${valueOrDash(found.world)} | Ping: ${valueOrDash(found.ping)} ms</span>
  `;
});

document.querySelectorAll("[data-board]").forEach((button) => {
  button.addEventListener("click", () => {
    activeBoard = button.dataset.board;
    document.querySelectorAll("[data-board]").forEach((item) => {
      item.classList.toggle("is-active", item === button);
    });
    renderLeaderboard();
  });
});

loadStatus();
window.setInterval(loadStatus, 30000);
