document.addEventListener("DOMContentLoaded", function () {

    if (typeof Chart === "undefined") {
        console.error("Chart.js is not loaded.");
        return;
    }

    // =========================================================
    // GLOBAL CHART DEFAULTS
    // =========================================================
    Chart.defaults.font.family = '"DM Sans", sans-serif';
    Chart.defaults.color = "#9fb0cc";
    Chart.defaults.plugins.legend.labels.color = "#9fb0cc";
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.padding = 18;
    Chart.defaults.plugins.tooltip.backgroundColor = "#0f1e35";
    Chart.defaults.plugins.tooltip.titleColor = "#eef3fb";
    Chart.defaults.plugins.tooltip.bodyColor = "#9fb0cc";
    Chart.defaults.plugins.tooltip.borderColor = "rgba(148, 178, 219, 0.20)";
    Chart.defaults.plugins.tooltip.borderWidth = 1;
    Chart.defaults.plugins.tooltip.padding = 12;

    const axisOptions = {
        ticks: { color: "#6d7fa0", font: { size: 11 } },
        grid: { color: "rgba(148, 178, 219, 0.08)", drawBorder: false },
        border: { display: false }
    };

    // =========================================================
    // FETCH REAL RAINFALL DATA (Open-Meteo)
    // =========================================================
    async function fetchRainData() {
        const url = "https://api.open-meteo.com/v1/forecast?latitude=13.0827&longitude=80.2707&hourly=precipitation&daily=precipitation_sum&timezone=Asia%2FKolkata&forecast_days=1&past_days=0";

        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch weather data");
        const data = await res.json();

        // Take last 8 hours of hourly precipitation
        const hourly = data.hourly;
        const times = hourly.time.slice(-8);
        const precip = hourly.precipitation.slice(-8);

        // Format labels like "6 AM", "8 AM"
        const labels = times.map(t => {
            const d = new Date(t);
            let h = d.getHours();
            const ampm = h >= 12 ? "PM" : "AM";
            h = h % 12 || 12;
            return `${h} ${ampm}`;
        });

        const todayTotal = data.daily?.precipitation_sum?.[0] ?? precip.reduce((a, b) => a + b, 0);

        return {
            labels,
            values: precip.map(v => Math.round(v * 10) / 10), // 1 decimal
            todayTotal: Math.round(todayTotal * 10) / 10
        };
    }

    // =========================================================
    // INIT ALL CHARTS WITH REAL + DERIVED DATA
    // =========================================================
    async function initCharts() {
        try {
            const rain = await fetchRainData();

            // ----- Update summary card: Rainfall -----
            const rainfallValueEl = document.querySelector(".analytics-stat-value");
            if (rainfallValueEl) {
                rainfallValueEl.textContent = `${rain.todayTotal} mm`;
            }

            // =====================================================
            // 1. RAINFALL TREND (REAL DATA)
            // =====================================================
            const rainfallCanvas = document.getElementById("rainfallTrendChart");
            if (rainfallCanvas) {
                new Chart(rainfallCanvas, {
                    type: "line",
                    data: {
                        labels: rain.labels,
                        datasets: [{
                            label: "Rainfall (mm)",
                            data: rain.values,
                            borderColor: "#34d3e8",
                            backgroundColor: "rgba(52, 211, 232, 0.10)",
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 4,
                            pointHoverRadius: 7,
                            pointBackgroundColor: "#34d3e8",
                            pointBorderColor: "#060b16",
                            pointBorderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: { intersect: false, mode: "index" },
                        plugins: { legend: { display: true } },
                        scales: {
                            x: axisOptions,
                            y: {
                                ...axisOptions,
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: "Rainfall (mm)",
                                    color: "#6d7fa0",
                                    font: { size: 11 }
                                }
                            }
                        }
                    }
                });
            }

            // =====================================================
            // 2. ROAD RISK DISTRIBUTION (derived from rain intensity)
            // =====================================================
            // Simple logic: more rain → higher risk share
            let low = 42, moderate = 27, high = 18, critical = 7;
            if (rain.todayTotal > 20) {
                low = 25; moderate = 30; high = 28; critical = 17;
            } else if (rain.todayTotal > 8) {
                low = 35; moderate = 30; high = 22; critical = 13;
            } else if (rain.todayTotal < 2) {
                low = 55; moderate = 25; high = 14; critical = 6;
            }

            const riskDistributionCanvas = document.getElementById("roadRiskDistributionChart");
            if (riskDistributionCanvas) {
                new Chart(riskDistributionCanvas, {
                    type: "doughnut",
                    data: {
                        labels: ["Low Risk", "Moderate Risk", "High Risk", "Critical Risk"],
                        datasets: [{
                            data: [low, moderate, high, critical],
                            backgroundColor: ["#3ddc9b", "#f2a93b", "#f2854b", "#f0554a"],
                            borderColor: "#0f1e35",
                            borderWidth: 3,
                            hoverOffset: 8
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: "65%",
                        plugins: {
                            legend: {
                                position: "bottom",
                                labels: { padding: 18, boxWidth: 10, boxHeight: 10 }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function (context) {
                                        const total = context.dataset.data.reduce((s, v) => s + v, 0);
                                        const pct = ((context.raw / total) * 100).toFixed(1);
                                        return `${context.label}: ${context.raw} roads (${pct}%)`;
                                    }
                                }
                            }
                        }
                    }
                });
            }

            // =====================================================
            // 3. HIGHEST RISK ROADS (static names + rain-adjusted scores)
            // =====================================================
            const baseScores = [94, 88, 82, 76, 71, 66];
            const adjusted = baseScores.map(s => {
                if (rain.todayTotal > 15) return Math.min(100, s + 6);
                if (rain.todayTotal < 3) return Math.max(40, s - 12);
                return s;
            });

            const highestRiskCanvas = document.getElementById("highestRiskRoadsChart");
            if (highestRiskCanvas) {
                new Chart(highestRiskCanvas, {
                    type: "bar",
                    data: {
                        labels: [
                            "Velachery Main Rd",
                            "Taramani Link Rd",
                            "Perungudi Rd",
                            "Madipakkam Rd",
                            "Saidapet Bridge",
                            "Adambakkam Rd"
                        ],
                        datasets: [{
                            label: "Risk Score",
                            data: adjusted,
                            backgroundColor: [
                                "#f0554a", "#f0554a",
                                "#f2854b", "#f2854b",
                                "#f2a93b", "#f2a93b"
                            ],
                            borderRadius: 7,
                            borderSkipped: false
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    label: ctx => `Risk Score: ${ctx.raw}/100`
                                }
                            }
                        },
                        scales: {
                            x: axisOptions,
                            y: {
                                ...axisOptions,
                                beginAtZero: true,
                                max: 100,
                                title: {
                                    display: true,
                                    text: "Risk Score",
                                    color: "#6d7fa0",
                                    font: { size: 11 }
                                }
                            }
                        }
                    }
                });
            }

            // =====================================================
            // 4. RISK FACTORS (static contribution – no free real API)
            // =====================================================
            const riskFactorsCanvas = document.getElementById("riskFactorsChart");
            if (riskFactorsCanvas) {
                new Chart(riskFactorsCanvas, {
                    type: "bar",
                    data: {
                        labels: [
                            "Water Level",
                            "Rainfall",
                            "Drainage",
                            "Road Elevation",
                            "Traffic",
                            "Historical Flooding"
                        ],
                        datasets: [{
                            label: "Contribution (%)",
                            data: [32, 24, 18, 11, 8, 7],
                            backgroundColor: "#34d3e8",
                            borderRadius: 7,
                            borderSkipped: false
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    label: ctx => `Contribution: ${ctx.raw}%`
                                }
                            }
                        },
                        scales: {
                            x: axisOptions,
                            y: {
                                ...axisOptions,
                                beginAtZero: true,
                                max: 40,
                                title: {
                                    display: true,
                                    text: "Contribution (%)",
                                    color: "#6d7fa0",
                                    font: { size: 11 }
                                }
                            }
                        }
                    }
                });
            }

            console.log("FloodShield Analytics – real rainfall data loaded:", rain);

        } catch (err) {
            console.error("Analytics data error:", err);
        }
    }

    initCharts();
});