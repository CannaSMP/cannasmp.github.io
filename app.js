const copyButtons = document.querySelectorAll("[data-copy]");

copyButtons.forEach((button) => {
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

const navLinks = [...document.querySelectorAll(".nav-links a")];
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      navLinks.forEach((link) => {
        link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
      });
    });
  },
  { rootMargin: "-45% 0px -45% 0px" }
);

sections.forEach((section) => observer.observe(section));

const statusRoot = document.querySelector("[data-live-status]");

const setText = (selector, value) => {
  const element = document.querySelector(selector);
  if (element) {
    element.textContent = value;
  }
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

const renderPills = (selector, items, fallback) => {
  const element = document.querySelector(selector);
  if (!element) {
    return;
  }
  element.textContent = "";
  const values = items.length ? items : [fallback];
  values.forEach((value) => {
    const pill = document.createElement("span");
    pill.textContent = value;
    element.appendChild(pill);
  });
};

const renderStatus = (payload) => {
  const server = payload.server || {};
  const system = payload.system || {};
  const online = Boolean(payload.ok && server.online);
  const players = Array.isArray(payload.players) ? payload.players : [];
  const worlds = Array.isArray(server.worlds) ? server.worlds : [];
  const ram = system.ram || {};
  const cpu = system.cpu || {};

  if (statusRoot) {
    statusRoot.querySelector(".status-card")?.classList.toggle("is-online", online);
    statusRoot.querySelector(".status-card")?.classList.toggle("is-offline", !online);
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

  renderPills("[data-status-player-list]", players.map((player) => player.username || "Unknown"), "No players online");
  renderPills("[data-status-worlds]", worlds.map((world) => `${world.name}: ${world.weather || "CLEAR"}`), "No world data");
};

const loadStatus = async () => {
  try {
    const response = await fetch("data/server-status.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    renderStatus(await response.json());
  } catch {
    renderStatus({ ok: false, server: { online: false, currentPlayers: 0, maxPlayers: 0, worlds: [] }, system: {}, players: [] });
  }
};

if (statusRoot) {
  loadStatus();
  window.setInterval(loadStatus, 30000);
}
