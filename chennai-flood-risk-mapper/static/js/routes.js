document.addEventListener("DOMContentLoaded", () => {
    console.log("✓ Dynamic Navigation Module Initialized");

    const form = document.getElementById("route-finder-form");
    const container = document.getElementById("routes-container");
    const findBtn = document.getElementById("find-route-btn");

    if (!form || !container || !findBtn) {
        console.error("Required DOM elements missing.");
        return;
    }

    let mapInstance = null;

    // Real Flood Hotspots in Chennai
    const FLOOD_HOTSPOTS = [
        { name: "Velachery", lat: 12.9759, lon: 80.2209, r: 2.8 },
        { name: "Madipakkam", lat: 12.9622, lon: 80.1987, r: 2.2 },
        { name: "Perungudi", lat: 12.9650, lon: 80.2420, r: 2.0 },
        { name: "Taramani", lat: 12.9785, lon: 80.2415, r: 1.8 },
        { name: "Saidapet", lat: 13.0230, lon: 80.2230, r: 1.6 },
        { name: "Pallikaranai", lat: 12.9400, lon: 80.2100, r: 3.5 },
        { name: "Manali", lat: 13.1660, lon: 80.2630, r: 2.5 },
        { name: "Adyar", lat: 13.0060, lon: 80.2550, r: 1.5 }
    ];

    // 1. Dynamic Geocoding using Nominatim API
    async function geocode(place) {
        const clean = place.trim();
        const queries = [
            `${clean}, Chennai, Tamil Nadu, India`,
            `${clean}, Chennai`,
            clean
        ];

        for (const q of queries) {
            try {
                await new Promise(r => setTimeout(r, 400)); // Respect API rate limits

                const url = `https://nominatim.openstreetmap.org/search?` + new URLSearchParams({
                    q: q,
                    format: "json",
                    limit: 1,
                    countrycodes: "in"
                });

                const res = await fetch(url, {
                    headers: {
                        "Accept-Language": "en",
                        "User-Agent": "FloodShieldChennai/1.0"
                    }
                });

                if (!res.ok) continue;

                const data = await res.json();
                if (data && data.length > 0) {
                    return {
                        lat: parseFloat(data[0].lat),
                        lon: parseFloat(data[0].lon),
                        display: data[0].display_name
                    };
                }
            } catch (e) {
                console.warn("Geocoding lookup failed for query:", q);
            }
        }
        throw new Error(`Location "${place}" could not be located on the map. Please try a specific neighborhood or landmark name.`);
    }

    // 2. Fetch Live Weather Data
    async function getRainRisk() {
        try {
            const res = await fetch(
                "https://api.open-meteo.com/v1/forecast?latitude=13.08&longitude=80.27&current=precipitation,rain&daily=precipitation_sum&timezone=Asia%2FKolkata&forecast_days=1"
            );
            const data = await res.json();
            const precip = data.current?.precipitation || 0;
            const today = data.daily?.precipitation_sum?.[0] || 0;

            if (precip > 8 || today > 30) return { score: 0.95, label: "Heavy Rainfall" };
            if (precip > 2 || today > 12) return { score: 0.65, label: "Moderate Rain" };
            if (precip > 0.3 || today > 4) return { score: 0.35, label: "Light Rain" };
            return { score: 0.15, label: "Clear / Dry" };
        } catch {
            return { score: 0.3, label: "Weather Data Unavailable" };
        }
    }

    // 3. Fetch Real OSRM Route Data
    async function getRoute(from, to) {
        const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=full&geometries=geojson&steps=true&alternatives=true`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Could not calculate real driving route.");
        const data = await res.json();
        if (!data.routes || data.routes.length === 0) throw new Error("No navigable driving route found between these points.");
        return data;
    }

    // Haversine Distance Calculation
    function haversine(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    // 4. Calculate Risk Score based on Real Coordinates & Weather
    function scoreRoute(route, rain) {
        const coords = route.geometry.coordinates;
        let hit = 0;
        coords.forEach(([lon, lat]) => {
            for (const z of FLOOD_HOTSPOTS) {
                if (haversine(lat, lon, z.lat, z.lon) <= z.r) {
                    hit++;
                    break;
                }
            }
        });

        const floodRatio = hit / coords.length;
        const riskScore = (floodRatio * 0.65) + (rain.score * 0.35);

        let level = "LOW";
        if (riskScore > 0.58) level = "HIGH";
        else if (riskScore > 0.32) level = "MODERATE";

        return { riskScore, level, floodRatio, rainLabel: rain.label };
    }

    // 5. Turn-by-Turn Guidance Steps
    function getTurns(steps) {
        return steps.slice(0, 10).map((step, i) => {
            const m = step.maneuver;
            let instr = "Continue";
            if (m.type === "depart") instr = "Head out";
            else if (m.type === "arrive") instr = "Arrive at destination";
            else if (m.type === "turn") {
                if ((m.modifier || "").includes("left")) instr = "Turn LEFT";
                else if ((m.modifier || "").includes("right")) instr = "Turn RIGHT";
            }
            const road = step.name || "road";
            const km = (step.distance / 1000).toFixed(1);
            return `${i + 1}. ${instr} onto ${road} (${km} km)`;
        });
    }

    // 6. Speech Output Function
    function speak(text) {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "en-IN";
        u.rate = 0.95;
        window.speechSynthesis.speak(u);
    }

    // 7. Form Submission Handler
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const originVal = document.getElementById("input-origin").value.trim();
        const destVal = document.getElementById("input-destination").value.trim();

        if (!originVal || !destVal) {
            alert("Please enter both start location and destination.");
            return;
        }

        findBtn.disabled = true;
        findBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Calculating Route...`;

        container.innerHTML = `
            <div class="glass-card text-center py-5">
                <div class="spinner-border text-cyan mb-3"></div>
                <h4>Geocoding Real Locations...</h4>
                <p class="text-secondary small">Calculating real coordinates, road paths, and live rainfall data.</p>
            </div>`;

        try {
            // Geocode dynamically entered locations
            const [from, to, rain] = await Promise.all([
                geocode(originVal),
                geocode(destVal),
                getRainRisk()
            ]);

            // Fetch Real-time OSRM Route
            const routeData = await getRoute(from, to);
            const routes = routeData.routes;

            let best = null;
            let bestScore = Infinity;

            routes.forEach(r => {
                const s = scoreRoute(r, rain);
                if (s.riskScore < bestScore) {
                    bestScore = s.riskScore;
                    best = { route: r, scored: s };
                }
            });

            const main = best.route;
            const scored = best.scored;
            const turns = getTurns(main.legs[0].steps);
            const dist = (main.distance / 1000).toFixed(1);
            const mins = Math.round(main.duration / 60);

            const riskClass = scored.level === "HIGH" ? "danger" :
                              scored.level === "MODERATE" ? "warning" : "success";

            // Render Results & Map Container
            container.innerHTML = `
                <div class="glass-card mb-4">
                    <div class="d-flex justify-content-between align-items-start flex-wrap gap-3">
                        <div>
                            <h3 class="mb-1">Calculated Safe Route</h3>
                            <p class="text-secondary mb-0 small">
                                <strong>Start:</strong> ${from.display.split(",")[0]} (${from.lat.toFixed(4)}, ${from.lon.toFixed(4)})<br>
                                <strong>End:</strong> ${to.display.split(",")[0]} (${to.lat.toFixed(4)}, ${to.lon.toFixed(4)})
                            </p>
                        </div>
                        <span class="badge bg-${riskClass} fs-6 px-3 py-2">${scored.level} RISK</span>
                    </div>

                    <div class="row g-3 mt-3 text-center">
                        <div class="col-6 col-md-3">
                            <div class="p-3 rounded bg-dark bg-opacity-25">
                                <small class="text-secondary d-block">DISTANCE</small>
                                <div class="fs-4 fw-bold text-cyan">${dist} km</div>
                            </div>
                        </div>
                        <div class="col-6 col-md-3">
                            <div class="p-3 rounded bg-dark bg-opacity-25">
                                <small class="text-secondary d-block">ESTIMATED TIME</small>
                                <div class="fs-4 fw-bold text-cyan">${mins} min</div>
                            </div>
                        </div>
                        <div class="col-6 col-md-3">
                            <div class="p-3 rounded bg-dark bg-opacity-25">
                                <small class="text-secondary d-block">FLOOD EXPOSURE</small>
                                <div class="fs-4 fw-bold text-${riskClass}">${(scored.floodRatio * 100).toFixed(0)}%</div>
                            </div>
                        </div>
                        <div class="col-6 col-md-3">
                            <div class="p-3 rounded bg-dark bg-opacity-25">
                                <small class="text-secondary d-block">WEATHER</small>
                                <div class="fs-6 fw-bold mt-2">${scored.rainLabel}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="glass-card mb-4 p-0 overflow-hidden">
                    <div id="route-map" style="height:400px; width:100%;"></div>
                </div>

                <div class="glass-card mb-4">
                    <h4 class="mb-3"><i class="bi bi-sign-turn-right text-cyan me-2"></i>Turn-by-Turn Directions</h4>
                    <ol class="ps-3 mb-0">${turns.map(t => `<li class="mb-2">${t}</li>`).join("")}</ol>
                </div>

                <div class="d-flex gap-2 flex-wrap mb-4">
                    <button id="speak-route-btn" class="btn btn-cyan">
                        <i class="bi bi-volume-up me-1"></i> Speak Guidance
                    </button>
                </div>
            `;

            // Initialize Leaflet Map
            if (mapInstance) mapInstance.remove();
            mapInstance = L.map("route-map").setView([from.lat, from.lon], 12);

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: "© OpenStreetMap contributors"
            }).addTo(mapInstance);

            const latlngs = main.geometry.coordinates.map(c => [c[1], c[0]]);
            const color = scored.level === "HIGH" ? "#ef4444" :
                          scored.level === "MODERATE" ? "#f59e0b" : "#22c55e";

            const polyline = L.polyline(latlngs, { color, weight: 6, opacity: 0.9 }).addTo(mapInstance);

            L.marker([from.lat, from.lon]).addTo(mapInstance).bindPopup("Start: " + originVal);
            L.marker([to.lat, to.lon]).addTo(mapInstance).bindPopup("Destination: " + destVal);

            mapInstance.fitBounds(polyline.getBounds(), { padding: [40, 40] });

            // Voice Guidance Button Event
            document.getElementById("speak-route-btn").onclick = () => {
                speak(`Safe route from ${originVal} to ${destVal}. Distance is ${dist} kilometers, estimated time ${mins} minutes. Risk level is ${scored.level}.`);
            };

            // Speak Summary Automatically
            setTimeout(() => {
                speak(`Route found from ${originVal} to ${destVal}. Risk level is ${scored.level}. Distance ${dist} kilometers.`);
            }, 600);

        } catch (err) {
            console.error(err);
            container.innerHTML = `
                <div class="alert alert-danger glass-card">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    <strong>Error:</strong> ${err.message || "Failed to compute route. Please try entering a different location name."}
                </div>`;
        } finally {
            findBtn.disabled = false;
            findBtn.innerHTML = `<i class="bi bi-cpu me-1"></i> Find My Safest Route`;
        }
    });
});