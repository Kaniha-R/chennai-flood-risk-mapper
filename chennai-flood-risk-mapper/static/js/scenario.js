document.addEventListener("DOMContentLoaded", () => {
    console.log("Scenario JS loaded successfully");

    const currentRainfallEl = document.getElementById("current-rainfall");
    const rainfallInput = document.getElementById("rainfall-scenario");
    const durationInput = document.getElementById("duration");
    const simulateBtn = document.getElementById("simulate-risk");
    const currentRiskEl = document.getElementById("current-risk-value");
    const scenarioRiskEl = document.getElementById("scenario-risk-value");
    const riskIncreaseEl = document.getElementById("risk-increase-value");

    if (!rainfallInput || !durationInput || !simulateBtn || !currentRiskEl || !scenarioRiskEl || !riskIncreaseEl) {
        console.error("Scenario page elements are missing.");
        return;
    }

    // =========================================================
    // 1. Get LIVE current rainfall from Open-Meteo
    // =========================================================
    async function getCurrentRainfall() {
        try {
            const url = "https://api.open-meteo.com/v1/forecast?latitude=13.0827&longitude=80.2707&current=precipitation,rain&hourly=precipitation&timezone=Asia%2FKolkata";
            const res = await fetch(url);
            if (!res.ok) throw new Error("Weather API failed");
            const data = await res.json();

            // Use current precipitation (mm in last hour-ish)
            const current = data.current?.precipitation ?? data.current?.rain ?? 0;
            return Math.round(current * 10) / 10; // 1 decimal
        } catch (err) {
            console.warn("Could not fetch live rainfall, using fallback", err);
            return 2.5; // safe fallback
        }
    }

    // =========================================================
    // 2. Simple but realistic risk model
    // =========================================================
    function calculateRisk(rainfallMmHr, durationHrs) {
        // Total expected water = intensity × duration
        const totalWater = rainfallMmHr * durationHrs;

        // Base risk score (0-100)
        let score = 0;

        if (totalWater < 20) score = 15 + totalWater * 0.8;
        else if (totalWater < 50) score = 35 + (totalWater - 20) * 0.9;
        else if (totalWater < 100) score = 62 + (totalWater - 50) * 0.5;
        else score = 85 + Math.min(15, (totalWater - 100) * 0.15);

        // Intensity boost (heavy short bursts are more dangerous)
        if (rainfallMmHr > 40) score += 8;
        if (rainfallMmHr > 70) score += 7;

        score = Math.min(100, Math.round(score));

        let level = "LOW";
        if (score >= 75) level = "CRITICAL";
        else if (score >= 55) level = "HIGH";
        else if (score >= 35) level = "MEDIUM";

        return { risk_score: score, risk_level: level };
    }

    // =========================================================
    // 3. Update UI
    // =========================================================
    function getRiskClass(level) {
        if (level === "CRITICAL") return "risk-critical";
        if (level === "HIGH") return "risk-high";
        if (level === "MEDIUM") return "risk-moderate";
        return "risk-low";
    }

    function updateUI(currentResult, scenarioResult) {
        // Current risk
        currentRiskEl.textContent = currentResult.risk_level;
        currentRiskEl.className = `value ${getRiskClass(currentResult.risk_level)}`;

        // Scenario risk
        scenarioRiskEl.textContent = scenarioResult.risk_level;
        scenarioRiskEl.className = `value ${getRiskClass(scenarioResult.risk_level)}`;

        // Increase
        const delta = Math.max(0, scenarioResult.risk_score - currentResult.risk_score);
        riskIncreaseEl.textContent = `+${delta}%`;
        riskIncreaseEl.style.color = delta >= 30 ? "#f0554a" : delta >= 15 ? "#f2854b" : "#3ddc9b";
    }

    // =========================================================
    // 4. Main simulation
    // =========================================================
    async function simulateScenario() {
        const rainfall = Number(rainfallInput.value);
        const duration = Number(durationInput.value);

        if (!Number.isFinite(rainfall) || rainfall < 0 || rainfall > 300) {
            alert("Please enter a valid rainfall value between 0 and 300 mm/hr.");
            rainfallInput.focus();
            return;
        }

        if (!Number.isFinite(duration) || duration <= 0 || duration > 48) {
            alert("Please enter a valid duration between 1 and 48 hours.");
            durationInput.focus();
            return;
        }

        simulateBtn.disabled = true;
        simulateBtn.innerHTML = '<i class="bi bi-arrow-repeat"></i> Running scenario...';

        try {
            // Live current rainfall
            const liveRain = await getCurrentRainfall();
            if (currentRainfallEl) {
                currentRainfallEl.textContent = `${liveRain} mm/hr`;
            }

            // Current risk (based on live rain, assume 1 hour for "current")
            const currentResult = calculateRisk(liveRain, 1);

            // Scenario risk
            const scenarioResult = calculateRisk(rainfall, duration);

            updateUI(currentResult, scenarioResult);

        } catch (error) {
            console.error("Scenario simulation failed", error);
            alert("Unable to simulate scenario right now. Please try again.");
        } finally {
            simulateBtn.disabled = false;
            simulateBtn.innerHTML = '<i class="bi bi-play-fill"></i> Simulate Risk';
        }
    }

    // Event listeners
    simulateBtn.addEventListener("click", simulateScenario);

    rainfallInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") simulateScenario();
    });
    durationInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") simulateScenario();
    });

    // Run once on page load
    simulateScenario();
});