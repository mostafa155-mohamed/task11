const NASA_API_KEY = "DEMO_KEY";
const NASA_APOD_URL = "https://api.nasa.gov/planetary/apod";

const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebar-toggle");
let sidebarOverlay = null;

function createOverlay() {
  if (sidebarOverlay) return;
  sidebarOverlay = document.createElement("div");
  sidebarOverlay.className = "sidebar-overlay";
  sidebarOverlay.style.opacity = "0";
  document.body.appendChild(sidebarOverlay);
  sidebarOverlay.addEventListener("click", closeSidebar);
}

function openSidebar() {
  createOverlay();
  sidebar.classList.add("sidebar-open");
  setTimeout(() => (sidebarOverlay.style.opacity = "1"), 10);
  document.body.style.overflow = "hidden";
}

function closeSidebar() {
  sidebar.classList.remove("sidebar-open");
  if (sidebarOverlay) {
    sidebarOverlay.style.opacity = "0";
    setTimeout(() => {
      sidebarOverlay?.remove();
      sidebarOverlay = null;
    }, 300);
  }
  document.body.style.overflow = "";
}

sidebarToggle?.addEventListener("click", () => {
  sidebar.classList.contains("sidebar-open") ? closeSidebar() : openSidebar();
});

const navLinks = document.querySelectorAll(".nav-link");
const sections = document.querySelectorAll(".app-section");

function switchSection(targetId) {
  sections.forEach((sec) => {
    sec.classList.toggle("hidden", sec.dataset.section !== targetId);
  });
  navLinks.forEach((link) => {
    const isActive = link.dataset.section === targetId;
    link.classList.toggle("bg-blue-500/10", isActive);
    link.classList.toggle("text-blue-400", isActive);
    link.classList.toggle("font-medium", isActive);
    link.classList.toggle("text-slate-300", !isActive);
    link.classList.toggle("hover:bg-slate-800", !isActive);
  });
  if (window.innerWidth < 1024) closeSidebar();
}

navLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const target = link.dataset.section;
    switchSection(target);
    if (target === "launches" && !launchesLoaded) fetchLaunches();
  });
});

const apodImage = document.getElementById("apod-image");
const apodTitle = document.getElementById("apod-title");
const apodExplanation = document.getElementById("apod-explanation");
const apodCopyright = document.getElementById("apod-copyright");
const apodDateEl = document.getElementById("apod-date");
const apodDateDetail = document.getElementById("apod-date-detail");
const apodDateInfo = document.getElementById("apod-date-info");
const apodMediaType = document.getElementById("apod-media-type");
const apodLoading = document.getElementById("apod-loading");
const apodImageContainer = document.getElementById("apod-image-container");

function formatDateDisplay(dateStr) {
  const [y, m, d] = dateStr.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(m) - 1]} ${parseInt(d)}, ${y}`;
}

async function fetchAPOD(date = null) {
  apodLoading.classList.remove("hidden");
  apodImage.style.opacity = "0";
  let url = `${NASA_APOD_URL}?api_key=${NASA_API_KEY}`;
  if (date) url += `&date=${date}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderAPOD(data);
  } catch (err) {
    console.error("APOD fetch failed:", err);
    apodTitle.textContent = "Failed to load image";
    apodExplanation.textContent = "Could not connect to NASA API. Please try again later.";
    apodLoading.classList.add("hidden");
    apodImage.style.opacity = "1";
  }
}

function renderAPOD(data) {
  apodTitle.textContent = data.title || "Unknown";
  apodExplanation.textContent = data.explanation || "";
  apodCopyright.innerHTML = data.copyright
    ? `&copy; ${data.copyright.trim()}`
    : "&copy; NASA / Public Domain";
  const dateDisplay = formatDateDisplay(data.date);
  apodDateEl.textContent = `Astronomy Picture of the Day - ${dateDisplay}`;
  apodDateDetail.innerHTML = `<i class="far fa-calendar mr-2"></i>${data.date}`;
  apodDateInfo.textContent = data.date;
  apodMediaType.textContent = data.media_type === "video" ? "Video" : "Image";
  if (data.media_type === "video") {
    apodImage.style.display = "none";
    let iframe = apodImageContainer.querySelector("iframe");
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.className = "w-full h-full";
      iframe.setAttribute("frameborder", "0");
      iframe.setAttribute("allowfullscreen", "true");
      apodImageContainer.appendChild(iframe);
    }
    iframe.src = data.url;
  } else {
    apodImage.style.display = "block";
    const iframe = apodImageContainer.querySelector("iframe");
    if (iframe) iframe.src = "";
    apodImage.src = data.hdurl || data.url;
    apodImage.alt = data.title;
    apodImage.onload = () => {
      apodLoading.classList.add("hidden");
      apodImage.style.opacity = "1";
      apodImage.style.transition = "opacity 0.5s ease";
    };
    apodImage.onerror = () => {
      apodLoading.classList.add("hidden");
      apodImage.style.opacity = "1";
    };
  }
  apodLoading.classList.add("hidden");
}

const apodDateInput = document.getElementById("apod-date-input");
const loadDateBtn = document.getElementById("load-date-btn");
const todayApodBtn = document.getElementById("today-apod-btn");
const dateInputWrapper = apodDateInput?.closest("label");
const dateDisplaySpan = dateInputWrapper?.querySelector("span");

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

if (apodDateInput) {
  const today = getTodayStr();
  apodDateInput.max = today;
  function syncDateDisplay(val) {
    if (dateDisplaySpan && val) {
      dateDisplaySpan.textContent = formatDateDisplay(val);
    }
  }
  apodDateInput.addEventListener("change", () => {
    syncDateDisplay(apodDateInput.value);
  });
  apodDateInput.value = today;
  syncDateDisplay(today);
}

loadDateBtn?.addEventListener("click", () => {
  const val = apodDateInput.value;
  if (val) fetchAPOD(val);
});

todayApodBtn?.addEventListener("click", () => {
  const today = getTodayStr();
  apodDateInput.value = today;
  if (dateDisplaySpan) dateDisplaySpan.textContent = formatDateDisplay(today);
  fetchAPOD();
});

const viewFullBtn = apodImageContainer?.querySelector("button");
viewFullBtn?.addEventListener("click", () => {
  if (apodImage.src && apodImage.src !== window.location.href) {
    window.open(apodImage.src, "_blank");
  }
});

let launchesLoaded = false;
const launchesGrid = document.getElementById("launches-grid");
const featuredLaunch = document.getElementById("featured-launch");
const launchesCountEl = document.getElementById("launches-count");
const launchesCountMobileEl = document.getElementById("launches-count-mobile");

const STATUS_COLORS = {
  Go:   { bg: "bg-green-500/20",  text: "text-green-400",  badge: "bg-green-500/90" },
  TBC:  { bg: "bg-yellow-500/20", text: "text-yellow-400", badge: "bg-yellow-500/90" },
  TBD:  { bg: "bg-blue-500/20",   text: "text-blue-400",   badge: "bg-blue-500/90" },
  Hold: { bg: "bg-red-500/20",    text: "text-red-400",    badge: "bg-red-500/90" },
};

function getStatusStyle(abbrev) {
  return STATUS_COLORS[abbrev] || STATUS_COLORS.TBD;
}

function formatLaunchDate(net) {
  if (!net) return "TBD";
  const d = new Date(net);
  if (isNaN(d)) return net;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatLaunchTime(net) {
  if (!net) return "TBD";
  const d = new Date(net);
  if (isNaN(d)) return "TBD";
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) + " UTC";
}

function daysUntil(net) {
  if (!net) return null;
  const diff = Math.ceil((new Date(net) - new Date()) / (1000 * 60 * 60 * 24));
  return diff;
}

async function fetchLaunches() {
  launchesGrid.innerHTML = `
    <div class="col-span-full flex flex-col items-center justify-center py-16 text-slate-400">
      <i class="fas fa-spinner fa-spin text-3xl text-blue-400 mb-4"></i>
      <p>Loading upcoming launches...</p>
    </div>`;
  try {
    const res = await fetch("https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=10&mode=detailed");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderLaunches(data.results || []);
    launchesLoaded = true;
  } catch (err) {
    console.error("Launches fetch failed:", err);
    launchesGrid.innerHTML = `
      <div class="col-span-full flex flex-col items-center justify-center py-16 text-slate-400">
        <i class="fas fa-exclamation-triangle text-3xl text-yellow-400 mb-4"></i>
        <p class="text-lg font-semibold mb-2">Could not load launches</p>
        <p class="text-sm">The SpaceDevs API may be rate-limited. Try again in a moment.</p>
        <button onclick="fetchLaunches()" class="mt-4 px-4 py-2 bg-blue-500 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors">
          <i class="fas fa-redo mr-2"></i>Retry
        </button>
      </div>`;
  }
}

function renderFeaturedLaunch(launch) {
  const abbrev = launch.status?.abbrev || "TBD";
  const style = getStatusStyle(abbrev);
  const days = daysUntil(launch.net);
  const daysText = days !== null ? (days <= 0 ? "Today!" : `${days} Day${days !== 1 ? "s" : ""} Until Launch`) : "Date TBD";
  const daysNum = days !== null ? (days <= 0 ? "Now" : days) : "?";
  const imgUrl = launch.image || launch.rocket?.configuration?.image_url || "";
  featuredLaunch.innerHTML = `
    <div class="relative bg-slate-800/30 border border-slate-700 rounded-3xl overflow-hidden group hover:border-blue-500/50 transition-all">
      <div class="absolute inset-0 bg-linear-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div class="relative grid grid-cols-1 lg:grid-cols-2 gap-6 p-8">
        <div class="flex flex-col justify-between">
          <div>
            <div class="flex items-center gap-3 mb-4">
              <span class="px-4 py-1.5 bg-blue-500/20 text-blue-400 rounded-full text-sm font-semibold flex items-center gap-2"><i class="fas fa-star"></i> Featured Launch</span>
              <span class="px-4 py-1.5 ${style.bg} ${style.text} rounded-full text-sm font-semibold">${abbrev}</span>
            </div>
            <h3 class="text-3xl font-bold mb-3 leading-tight">${launch.name || "Unknown Mission"}</h3>
            <div class="flex flex-col xl:flex-row xl:items-center gap-4 mb-6 text-slate-400">
              <div class="flex items-center gap-2"><i class="fas fa-building"></i><span>${launch.launch_service_provider?.name || "Unknown"}</span></div>
              <div class="flex items-center gap-2"><i class="fas fa-rocket"></i><span>${launch.rocket?.configuration?.name || "Unknown"}</span></div>
            </div>
            <div class="inline-flex items-center gap-3 px-6 py-3 bg-linear-to-r from-blue-500/20 to-purple-500/20 rounded-xl mb-6">
              <i class="fas fa-clock text-2xl text-blue-400"></i>
              <div><p class="text-2xl font-bold text-blue-400">${daysNum}</p><p class="text-xs text-slate-400">${daysText}</p></div>
            </div>
            <div class="grid xl:grid-cols-2 gap-4 mb-6">
              <div class="bg-slate-900/50 rounded-xl p-4"><p class="text-xs text-slate-400 mb-1 flex items-center gap-2"><i class="fas fa-calendar"></i>Launch Date</p><p class="font-semibold">${formatLaunchDate(launch.net)}</p></div>
              <div class="bg-slate-900/50 rounded-xl p-4"><p class="text-xs text-slate-400 mb-1 flex items-center gap-2"><i class="fas fa-clock"></i>Launch Time</p><p class="font-semibold">${formatLaunchTime(launch.net)}</p></div>
              <div class="bg-slate-900/50 rounded-xl p-4"><p class="text-xs text-slate-400 mb-1 flex items-center gap-2"><i class="fas fa-map-marker-alt"></i>Location</p><p class="font-semibold text-sm">${launch.pad?.location?.name || launch.pad?.name || "Unknown"}</p></div>
              <div class="bg-slate-900/50 rounded-xl p-4"><p class="text-xs text-slate-400 mb-1 flex items-center gap-2"><i class="fas fa-globe"></i>Country</p><p class="font-semibold">${launch.pad?.location?.country_code || "N/A"}</p></div>
            </div>
            <p class="text-slate-300 leading-relaxed mb-6">${launch.mission?.description || launch.rocket?.configuration?.description || "No description available."}</p>
          </div>
          <div class="flex flex-col md:flex-row gap-3">
            <a href="${launch.url || "#"}" target="_blank" rel="noopener noreferrer" class="flex-1 self-start md:self-center px-6 py-3 bg-blue-500 rounded-xl hover:bg-blue-600 transition-colors font-semibold flex items-center justify-center gap-2"><i class="fas fa-info-circle"></i> View Full Details</a>
            <div class="icons self-end md:self-center">
              <button class="px-4 py-3 bg-slate-700 rounded-xl hover:bg-slate-600 transition-colors"><i class="far fa-heart"></i></button>
              <button class="px-4 py-3 bg-slate-700 rounded-xl hover:bg-slate-600 transition-colors"><i class="fas fa-bell"></i></button>
            </div>
          </div>
        </div>
        <div class="relative">
          <div class="relative h-full min-h-[400px] rounded-2xl overflow-hidden bg-slate-900/50">
            ${imgUrl ? `<img src="${imgUrl}" alt="${launch.name}" class="w-full h-full object-cover" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` : ""}
            <div class="flex items-center justify-center h-full min-h-[400px] bg-slate-800" ${imgUrl ? 'style="display:none"' : ""}><i class="fas fa-rocket text-9xl text-slate-700/50"></i></div>
            <div class="absolute inset-0 bg-linear-to-t from-slate-900 via-transparent to-transparent"></div>
          </div>
        </div>
      </div>
    </div>`;
}

function renderLaunchCard(launch) {
  const abbrev = launch.status?.abbrev || "TBD";
  const style = getStatusStyle(abbrev);
  const imgUrl = launch.image || launch.rocket?.configuration?.image_url || "";
  return `
    <div class="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all group cursor-pointer">
      <div class="relative h-48 bg-slate-900/50 flex items-center justify-center overflow-hidden">
        ${imgUrl ? `<img src="${imgUrl}" alt="${launch.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` : ""}
        <div class="flex items-center justify-center w-full h-full" ${imgUrl ? 'style="display:none"' : ""}><i class="fas fa-rocket text-5xl text-slate-700"></i></div>
        <div class="absolute top-3 right-3"><span class="px-3 py-1 ${style.badge} text-white backdrop-blur-sm rounded-full text-xs font-semibold">${abbrev}</span></div>
      </div>
      <div class="p-5">
        <div class="mb-3">
          <h4 class="font-bold text-lg mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">${launch.name || "Unknown"}</h4>
          <p class="text-sm text-slate-400 flex items-center gap-2"><i class="fas fa-building text-xs"></i>${launch.launch_service_provider?.name || "Unknown"}</p>
        </div>
        <div class="space-y-2 mb-4">
          <div class="flex items-center gap-2 text-sm"><i class="fas fa-calendar text-slate-500 w-4"></i><span class="text-slate-300">${formatLaunchDate(launch.net)}</span></div>
          <div class="flex items-center gap-2 text-sm"><i class="fas fa-clock text-slate-500 w-4"></i><span class="text-slate-300">${formatLaunchTime(launch.net)}</span></div>
          <div class="flex items-center gap-2 text-sm"><i class="fas fa-rocket text-slate-500 w-4"></i><span class="text-slate-300">${launch.rocket?.configuration?.name || "Unknown"}</span></div>
          <div class="flex items-center gap-2 text-sm"><i class="fas fa-map-marker-alt text-slate-500 w-4"></i><span class="text-slate-300 line-clamp-1">${launch.pad?.location?.name || launch.pad?.name || "Unknown"}</span></div>
        </div>
        <div class="flex items-center gap-2 pt-4 border-t border-slate-700">
          <a href="${launch.url || "#"}" target="_blank" rel="noopener noreferrer" class="flex-1 px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors text-sm font-semibold text-center">Details</a>
          <button class="px-3 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors favourite-btn"><i class="far fa-heart"></i></button>
        </div>
      </div>
    </div>`;
}

function renderLaunches(launches) {
  if (!launches.length) {
    launchesGrid.innerHTML = `<div class="col-span-full text-center py-12 text-slate-400">No upcoming launches found.</div>`;
    return;
  }
  const count = launches.length;
  if (launchesCountEl) launchesCountEl.textContent = `${count} Launches`;
  if (launchesCountMobileEl) launchesCountMobileEl.textContent = count;
  renderFeaturedLaunch(launches[0]);
  const rest = launches.slice(1);
  launchesGrid.innerHTML = rest.length
    ? rest.map(renderLaunchCard).join("")
    : `<div class="col-span-full text-center py-12 text-slate-400">No additional launches found.</div>`;
}

const PLANETS = {
  mercury: {
    name: "Mercury", image: "./assets/images/mercury.png", color: "#eab308",
    description: "Mercury is the smallest planet in the Solar System and the closest to the Sun. Its orbit around the Sun takes 87.97 Earth days, making it the fastest planet in the Solar System.",
    distance: "57.9M km", radius: "2,439 km", mass: "3.30 × 10²³ kg", density: "5.43 g/cm³",
    orbitalPeriod: "88 days", rotation: "58.6 days", moons: "0", gravity: "3.7 m/s²",
    discoveredBy: "Known since antiquity", discoveryDate: "Ancient", bodyType: "Planet", volume: "6.08 × 10¹⁰ km³",
    perihelion: "46.0M km", aphelion: "69.8M km", eccentricity: "0.2056", inclination: "7.00°",
    axialTilt: "0.034°", avgTemp: "167°C", escapeVelocity: "4.25 km/s",
    facts: ["Smallest planet in the Solar System","No atmosphere to retain heat","Surface temperatures swing 600°C","Named after the Roman messenger god"],
  },
  venus: {
    name: "Venus", image: "./assets/images/venus.png", color: "#f97316",
    description: "Venus is the second planet from the Sun and is Earth's closest planetary neighbor. It's the hottest planet in our solar system, even though Mercury is closer to the Sun.",
    distance: "108.2M km", radius: "6,051 km", mass: "4.87 × 10²⁴ kg", density: "5.24 g/cm³",
    orbitalPeriod: "225 days", rotation: "243 days", moons: "0", gravity: "8.87 m/s²",
    discoveredBy: "Known since antiquity", discoveryDate: "Ancient", bodyType: "Planet", volume: "9.28 × 10¹¹ km³",
    perihelion: "107.5M km", aphelion: "108.9M km", eccentricity: "0.0067", inclination: "3.39°",
    axialTilt: "177.36°", avgTemp: "462°C", escapeVelocity: "10.36 km/s",
    facts: ["Hottest planet despite not being closest","Rotates backwards (retrograde)","A day on Venus is longer than its year","Covered in thick sulfuric acid clouds"],
  },
  earth: {
    name: "Earth", image: "./assets/images/earth.png", color: "#3b82f6",
    description: "Earth is the third planet from the Sun and the only astronomical object known to harbor life. About 29% of Earth's surface is land, the remaining 71% is covered with water.",
    distance: "149.6M km", radius: "6,371 km", mass: "5.97 × 10²⁴ kg", density: "5.51 g/cm³",
    orbitalPeriod: "365.25 days", rotation: "24 hours", moons: "1", gravity: "9.8 m/s²",
    discoveredBy: "Known since antiquity", discoveryDate: "Ancient", bodyType: "Planet", volume: "1.08 × 10¹² km³",
    perihelion: "147.1M km", aphelion: "152.1M km", eccentricity: "0.0167", inclination: "0.00°",
    axialTilt: "23.44°", avgTemp: "15°C", escapeVelocity: "11.2 km/s",
    facts: ["Only known planet with liquid water","Atmosphere contains 78% nitrogen","Magnetic field protects from solar wind","Formed 4.54 billion years ago"],
  },
  mars: {
    name: "Mars", image: "./assets/images/mars.png", color: "#ef4444",
    description: "Mars is the fourth planet from the Sun and the second-smallest planet in the Solar System. Mars is often called the Red Planet due to the reddish iron oxide prevalent on its surface.",
    distance: "227.9M km", radius: "3,389 km", mass: "6.39 × 10²³ kg", density: "3.93 g/cm³",
    orbitalPeriod: "687 days", rotation: "24.6 hours", moons: "2", gravity: "3.72 m/s²",
    discoveredBy: "Known since antiquity", discoveryDate: "Ancient", bodyType: "Planet", volume: "1.63 × 10¹¹ km³",
    perihelion: "206.7M km", aphelion: "249.2M km", eccentricity: "0.0934", inclination: "1.85°",
    axialTilt: "25.19°", avgTemp: "-65°C", escapeVelocity: "5.03 km/s",
    facts: ["Home to Olympus Mons, largest volcano","Has two small moons: Phobos & Deimos","Evidence of ancient liquid water","Target for future human missions"],
  },
  jupiter: {
    name: "Jupiter", image: "./assets/images/jupiter.png", color: "#fb923c",
    description: "Jupiter is the fifth planet from the Sun and the largest in the Solar System. It is a gas giant with a mass more than two and a half times that of all other planets combined.",
    distance: "778.5M km", radius: "69,911 km", mass: "1.90 × 10²⁷ kg", density: "1.33 g/cm³",
    orbitalPeriod: "11.9 years", rotation: "9.9 hours", moons: "95", gravity: "24.79 m/s²",
    discoveredBy: "Known since antiquity", discoveryDate: "Ancient", bodyType: "Gas Giant", volume: "1.43 × 10¹⁵ km³",
    perihelion: "740.6M km", aphelion: "816.4M km", eccentricity: "0.0489", inclination: "1.30°",
    axialTilt: "3.13°", avgTemp: "-110°C", escapeVelocity: "59.5 km/s",
    facts: ["Largest planet in the Solar System","Great Red Spot is a 300-year storm","Has 95 known moons","Acts as a cosmic vacuum cleaner"],
  },
  saturn: {
    name: "Saturn", image: "./assets/images/saturn.png", color: "#facc15",
    description: "Saturn is the sixth planet from the Sun and the second-largest in the Solar System, after Jupiter. It is a gas giant with an average radius of about nine and a half times that of Earth.",
    distance: "1.43B km", radius: "58,232 km", mass: "5.68 × 10²⁶ kg", density: "0.69 g/cm³",
    orbitalPeriod: "29.5 years", rotation: "10.7 hours", moons: "146", gravity: "10.44 m/s²",
    discoveredBy: "Known since antiquity", discoveryDate: "Ancient", bodyType: "Gas Giant", volume: "8.27 × 10¹⁴ km³",
    perihelion: "1.35B km", aphelion: "1.51B km", eccentricity: "0.0565", inclination: "2.49°",
    axialTilt: "26.73°", avgTemp: "-140°C", escapeVelocity: "35.5 km/s",
    facts: ["Least dense planet — floats on water","Its rings are made of ice & rock","Has 146 confirmed moons","Titan has a thick atmosphere"],
  },
  uranus: {
    name: "Uranus", image: "./assets/images/uranus.png", color: "#06b6d4",
    description: "Uranus is the seventh planet from the Sun. It has the third-largest planetary radius and fourth-largest planetary mass in the Solar System. Uranus is an ice giant.",
    distance: "2.87B km", radius: "25,362 km", mass: "8.68 × 10²⁵ kg", density: "1.27 g/cm³",
    orbitalPeriod: "84 years", rotation: "17.2 hours", moons: "28", gravity: "8.87 m/s²",
    discoveredBy: "William Herschel", discoveryDate: "March 13, 1781", bodyType: "Ice Giant", volume: "6.83 × 10¹³ km³",
    perihelion: "2.74B km", aphelion: "3.01B km", eccentricity: "0.0457", inclination: "0.77°",
    axialTilt: "97.77°", avgTemp: "-195°C", escapeVelocity: "21.3 km/s",
    facts: ["Rotates on its side (98° tilt)","First planet discovered with a telescope","Coldest planetary atmosphere","Has 13 known rings"],
  },
  neptune: {
    name: "Neptune", image: "./assets/images/neptune.png", color: "#2563eb",
    description: "Neptune is the eighth and farthest known planet from the Sun. It is the fourth-largest planet by diameter and the third-most-massive. Neptune is an ice giant.",
    distance: "4.50B km", radius: "24,622 km", mass: "1.02 × 10²⁶ kg", density: "1.64 g/cm³",
    orbitalPeriod: "164.8 years", rotation: "16.1 hours", moons: "16", gravity: "11.15 m/s²",
    discoveredBy: "Urbain Le Verrier / John Adams", discoveryDate: "September 23, 1846", bodyType: "Ice Giant", volume: "6.25 × 10¹³ km³",
    perihelion: "4.46B km", aphelion: "4.54B km", eccentricity: "0.0113", inclination: "1.77°",
    axialTilt: "28.32°", avgTemp: "-200°C", escapeVelocity: "23.5 km/s",
    facts: ["Strongest winds in the Solar System","Takes 165 years to orbit the Sun","Discovered through mathematics","Has the Great Dark Spot storm"],
  },
};

function renderPlanetDetail(planetId) {
  const p = PLANETS[planetId];
  if (!p) return;
  document.querySelectorAll(".planet-card").forEach((card) => {
    const isActive = card.dataset.planetId === planetId;
    card.style.borderColor = isActive ? p.color + "cc" : "#334155";
    card.style.backgroundColor = isActive ? p.color + "22" : "";
  });
  document.getElementById("planet-detail-image").src = p.image;
  document.getElementById("planet-detail-image").alt = p.name;
  document.getElementById("planet-detail-name").textContent = p.name;
  document.getElementById("planet-detail-description").textContent = p.description;
  document.getElementById("planet-distance").textContent = p.distance;
  document.getElementById("planet-radius").textContent = p.radius;
  document.getElementById("planet-mass").textContent = p.mass;
  document.getElementById("planet-density").textContent = p.density;
  document.getElementById("planet-orbital-period").textContent = p.orbitalPeriod;
  document.getElementById("planet-rotation").textContent = p.rotation;
  document.getElementById("planet-moons").textContent = p.moons;
  document.getElementById("planet-gravity").textContent = p.gravity;
  document.getElementById("planet-discoverer").textContent = p.discoveredBy;
  document.getElementById("planet-discovery-date").textContent = p.discoveryDate;
  document.getElementById("planet-body-type").textContent = p.bodyType;
  document.getElementById("planet-volume").textContent = p.volume;
  document.getElementById("planet-facts").innerHTML = p.facts
    .map((f) => `<li class="flex items-start"><i class="fas fa-check text-green-400 mt-1 mr-2"></i><span class="text-slate-300">${f}</span></li>`)
    .join("");
  document.getElementById("planet-perihelion").textContent = p.perihelion;
  document.getElementById("planet-aphelion").textContent = p.aphelion;
  document.getElementById("planet-eccentricity").textContent = p.eccentricity;
  document.getElementById("planet-inclination").textContent = p.inclination;
  document.getElementById("planet-axial-tilt").textContent = p.axialTilt;
  document.getElementById("planet-temp").textContent = p.avgTemp;
  document.getElementById("planet-escape").textContent = p.escapeVelocity;
  if (window.innerWidth < 1280) {
    document.querySelector("#planets .xl\\:col-span-2")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

document.querySelectorAll(".planet-card").forEach((card) => {
  card.addEventListener("click", () => renderPlanetDetail(card.dataset.planetId));
});

document.addEventListener("click", (e) => {
  const btn = e.target.closest(".favourite-btn, button:has(.fa-heart)");
  if (!btn) return;
  const icon = btn.querySelector(".fa-heart, .fas.fa-heart, .far.fa-heart");
  if (!icon) return;
  if (icon.classList.contains("fas")) {
    icon.classList.replace("fas", "far");
    icon.style.color = "";
  } else {
    icon.classList.replace("far", "fas");
    icon.style.color = "#f472b6";
  }
});

document.addEventListener("DOMContentLoaded", () => {
  switchSection("today-in-space");
  fetchAPOD();
  renderPlanetDetail("earth");
  window.addEventListener("resize", () => {
    if (window.innerWidth >= 1024) closeSidebar();
  });
});