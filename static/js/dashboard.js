document.addEventListener("DOMContentLoaded", () => {
    loadDashboard();
    document.getElementById("retry-dashboard")?.addEventListener("click", loadDashboard);
});

// =========================================================
// LOAD — now pulls from the Flask backend (api.js), which is
// wired to live Open-Meteo rainfall + the same road-zone model
// used by the risk map. No more duplicate client-side fetch.
// =========================================================
async function loadDashboard() {
    const errorBanner = document.getElementById("dashboard-error");
    errorBanner?.classList.add("d-none");
    document.querySelectorAll("[data-loading]").forEach((el) => el.classList.add("is-loading"));

    try {
        const [dashboardData, systemStatus] = await Promise.all([
            getDashboardData(),
            getSystemStatus()
        ]);
        renderDashboard(dashboardData, systemStatus);
    } catch (error) {
        console.error(error);
        errorBanner?.classList.remove("d-none");
        setText("rainfall", "--");
        setText("forecast", "--");
        setText("city-risk", "ERROR");
        setText("city-risk-score", "Unavailable");
        setText("at-risk-roads", "--");
        setText("last-updated", "Unavailable");
        setText("prediction-status", "OFFLINE");
    } finally {
        document.querySelectorAll("[data-loading]").forEach((el) => el.classList.remove("is-loading"));
    }
}

// =========================================================
// RENDER + RADAR UPDATE
// =========================================================
function renderDashboard(data, systemStatus) {
    const overallRisk = Number(data.overall_risk ?? data.risk_score ?? 0);
    const riskLevel = String(data.risk_level || "LOW").toUpperCase();

    // Main metrics
    setText("rainfall", `${data.rainfall ?? "--"} mm/hr`);
    setText("forecast", `${data.forecast ?? "--"} mm`);
    setText("city-risk", riskLevel);
    setText("city-risk-score", `${overallRisk} / 100`);
    setText("at-risk-roads", data.affected_roads ?? "--");
    setText("last-updated", data.last_updated || "Just now");
    setText("data-mode", data.data_source === "open-meteo" ? "LIVE" : "DEMO");
    setText("prediction-status", systemStatus?.risk_engine || "ONLINE");

    // ========== RADAR UPDATE (new radar) ==========
    const rainfallValueEl = document.getElementById("rainfall-value");
    if (rainfallValueEl) {
        rainfallValueEl.textContent = data.rainfall ?? "--";
    }

    // Risk bar
    const riskBar = document.getElementById("city-risk-bar");
    if (riskBar) riskBar.style.width = `${Math.min(100, Math.max(0, overallRisk))}%`;

    // Confidence ring
    const confidenceRing = document.getElementById("confidence-ring");
    if (confidenceRing) {
        confidenceRing.style.setProperty("--confidence", `${Math.min(360, Math.max(0, overallRisk * 3.6))}deg`);
    }

    if (document.getElementById("ai-confidence")) {
        setText("ai-confidence", `${Math.min(99, Math.max(70, overallRisk + 9))}%`);
    }

    // AI panel title
    const aiTitle = document.querySelector(".ai-panel h3");
    if (aiTitle) {
        aiTitle.textContent = riskLevel === "LOW"
            ? "Low flood-access risk currently"
            : `${riskLevel} flood-access risk detected`;
    }

    renderRiskDistribution(data.risk_distribution || {});
    renderAlerts(data.alerts || []);
    renderServices([
        `System: ${systemStatus?.system || "ONLINE"}`,
        `API: ${systemStatus?.api || "ONLINE"}`,
        `Risk engine: ${systemStatus?.risk_engine || "ONLINE"}`,
        `Database: ${systemStatus?.database || "LIVE"}`
    ]);
}

function renderRiskDistribution(distribution) {
    const mapping = {
        low: { label: "LOW", key: "low" },
        medium: { label: "MEDIUM", key: "medium" },
        high: { label: "HIGH", key: "high" },
        critical: { label: "CRITICAL", key: "critical" }
    };

    Object.entries(mapping).forEach(([key, meta]) => {
        const item = distribution[key] || { roads: 0, percentage: 0 };
        setText(`${meta.key}-roads`, `${item.roads ?? 0} roads`);
        setText(`${meta.key}-percentage`, `${item.percentage ?? 0}%`);
        setText(`${meta.key}-label`, meta.label);
    });
}

function renderAlerts(alerts) {
    const container = document.getElementById("alerts-list");
    if (!container) return;

    if (!alerts.length) {
        container.innerHTML = '<div class="table-loading">No active alerts right now.</div>';
        return;
    }

    container.innerHTML = alerts.map((alert) => {
        const severity = (alert.severity || "MEDIUM").toUpperCase();
        const levelClass = severity.toLowerCase().replace(/\s+/g, "-");
        return `
            <article class="alert-card alert-${levelClass}">
                <div class="alert-icon"><i class="bi bi-bell-fill"></i></div>
                <div>
                    <span class="eyebrow">${severity}</span>
                    <h3>${alert.title}</h3>
                    <p>${alert.location} · ${alert.time}</p>
                    <small>${alert.message}</small>
                </div>
            </article>`;
    }).join("");
}

function renderServices(services) {
    const container = document.getElementById("service-list");
    if (!container) return;
    container.innerHTML = services.map((service) =>
        `<li><span class="status-dot"></span><span>${service}</span><strong>Operational</strong></li>`
    ).join("");
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}