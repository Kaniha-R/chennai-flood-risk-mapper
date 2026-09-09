async function fetchJson(endpoint, options = {}) {
    const response = await fetch(endpoint, {
        headers: { "Content-Type": "application/json" },
        ...options,
    });

    if (!response.ok) {
        throw new Error(`Request failed for ${endpoint}`);
    }

    const payload = await response.json();
    if (!payload || payload.success === false) {
        throw new Error(payload && payload.error ? payload.error : "API error");
    }

    return payload.data;
}

async function getDashboardData() {
    return fetchJson("/api/dashboard");
}

async function getWeather() {
    return fetchJson("/api/dashboard");
}

async function getRiskMap() {
    return fetchJson("/api/risk-map");
}

async function getRiskMapData() {
    return fetchJson("/api/risk-map");
}

async function getRoadRiskById(roadId) {
    const roads = await getRiskMapData();
    return roads.find((road) => String(road.id) === String(roadId)) || null;
}

async function getRiskSummary() {
    const roads = await getRiskMapData();
    const total = roads.length;
    const critical = roads.filter((road) => Number(road.score) >= 85).length;
    const high = roads.filter((road) => Number(road.score) >= 60 && Number(road.score) < 85).length;
    const safe = roads.filter((road) => Number(road.score) < 60).length;
    return {
        total,
        critical,
        high,
        safe,
        distribution: {
            low: roads.filter((road) => Number(road.score) < 35).length,
            moderate: roads.filter((road) => Number(road.score) >= 35 && Number(road.score) < 60).length,
            high: roads.filter((road) => Number(road.score) >= 60 && Number(road.score) < 85).length,
            critical,
        },
    };
}

async function getRoadRisk() {
    return getRiskMapData();
}

async function getSafeRoutes(origin, destination) {
    return fetchJson("/api/routes", {
        method: "POST",
        body: JSON.stringify({ origin, destination }),
    });
}

async function getAlerts() {
    return fetchJson("/api/alerts");
}

async function getAnalytics() {
    return fetchJson("/api/analytics");
}

async function getSystemStatus() {
    return fetchJson("/api/system-status");
}

async function runScenario(scenarioData) {
    return fetchJson("/api/scenario", {
        method: "POST",
        body: JSON.stringify(scenarioData),
    });
}