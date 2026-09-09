const MOCK_DATA = {
    dashboard: {
        rainfall: 42,
        forecast: 68,
        cityRisk: { level: "HIGH", score: 72 },
        atRiskRoads: 37,
        aiConfidence: 91,
        riskDistribution: {
            low: { roads: 124, percentage: 48 },
            medium: { roads: 83, percentage: 32 },
            high: { roads: 37, percentage: 14 },
            critical: { roads: 12, percentage: 6 }
        },
        roads: [
            { name: "Anna Salai", level: "HIGH", score: 86, rainfall: "54 mm/hr", access: "Restricted", status: "Monitor" },
            { name: "OMR", level: "HIGH", score: 81, rainfall: "49 mm/hr", access: "At Risk", status: "Warning" },
            { name: "Velachery Main Road", level: "CRITICAL", score: 94, rainfall: "61 mm/hr", access: "Unsafe", status: "Avoid" }
        ],
        alerts: [
            { level: "HIGH RAINFALL", title: "Heavy rainfall detected", area: "Southern Chennai", time: "12 min ago", action: "Monitor low-lying roads and avoid unnecessary travel.", icon: "bi-cloud-rain" },
            { level: "ROAD ACCESS RISK", title: "Accessibility declining", area: "Velachery corridor", time: "26 min ago", action: "Use a safer alternate route where possible.", icon: "bi-signpost-split" },
            { level: "DRAINAGE STRESS", title: "Drainage capacity is strained", area: "Adyar basin", time: "41 min ago", action: "Expect slower road conditions during the next rainfall peak.", icon: "bi-exclamation-triangle" }
        ],
        services: ["Weather API", "GIS Data", "Road Network", "AI Prediction", "Routing Engine"]
    },
    weather: { rainfall: 42, forecast: 68, status: "Operational" },
    roads: [
        { id: "anna-salai", name: "Anna Salai", riskScore: 92, riskLevel: "CRITICAL", rainfallFactor: 82, elevationFactor: 71, drainageFactor: 76, exposureFactor: 88, accessibility: "VERY LOW", predictionConfidence: 89, rainfall: "54 mm/hr", elevation: "Low", drainage: "Stressed", explanation: "High rainfall combined with low elevation and drainage stress increases the predicted probability of road accessibility disruption.", geoJson: { type: "LineString", coordinates: [[80.230, 13.060], [80.245, 13.075], [80.260, 13.088], [80.278, 13.102]] } },
        { id: "omr", name: "OMR", riskScore: 87, riskLevel: "HIGH", rainfallFactor: 78, elevationFactor: 64, drainageFactor: 70, exposureFactor: 81, accessibility: "LOW", predictionConfidence: 86, rainfall: "49 mm/hr", elevation: "Low", drainage: "Strained", explanation: "Intense rainfall and limited drainage capacity are increasing the likelihood of access disruption along this corridor.", geoJson: { type: "LineString", coordinates: [[80.245, 12.970], [80.258, 12.992], [80.275, 13.015], [80.290, 13.040]] } },
        { id: "velachery-main-road", name: "Velachery Main Road", riskScore: 74, riskLevel: "HIGH", rainfallFactor: 69, elevationFactor: 73, drainageFactor: 79, exposureFactor: 68, accessibility: "LOW", predictionConfidence: 82, rainfall: "46 mm/hr", elevation: "Very low", drainage: "Stressed", explanation: "Low elevation and drainage stress make this road more sensitive to sustained rainfall.", geoJson: { type: "LineString", coordinates: [[80.190, 12.970], [80.205, 12.985], [80.220, 13.000], [80.238, 13.016]] } },
        { id: "gst-road", name: "GST Road", riskScore: 69, riskLevel: "HIGH", rainfallFactor: 61, elevationFactor: 58, drainageFactor: 63, exposureFactor: 66, accessibility: "MODERATE", predictionConfidence: 78, rainfall: "42 mm/hr", elevation: "Moderate", drainage: "Moderate", explanation: "Current rainfall is combining with moderate drainage stress to reduce the road's accessibility margin.", geoJson: { type: "LineString", coordinates: [[80.115, 12.950], [80.145, 12.975], [80.175, 13.005], [80.205, 13.035]] } },
        { id: "mount-road", name: "Mount Road", riskScore: 63, riskLevel: "HIGH", rainfallFactor: 65, elevationFactor: 60, drainageFactor: 70, exposureFactor: 62, accessibility: "MODERATE", predictionConfidence: 75, rainfall: "40 mm/hr", elevation: "Moderate", drainage: "Strained", explanation: "Rainfall and drainage conditions indicate a moderate reduction in expected accessibility.", geoJson: { type: "LineString", coordinates: [[80.250, 13.045], [80.255, 13.065], [80.260, 13.085], [80.265, 13.105]] } },
        { id: "adyar-link", name: "Adyar Link Road", riskScore: 48, riskLevel: "MODERATE", rainfallFactor: 48, elevationFactor: 42, drainageFactor: 51, exposureFactor: 45, accessibility: "GOOD", predictionConfidence: 72, rainfall: "36 mm/hr", elevation: "Moderate", drainage: "Moderate", explanation: "The road remains broadly accessible, though continued rain could increase local drainage pressure.", geoJson: { type: "LineString", coordinates: [[80.230, 13.015], [80.245, 13.025], [80.260, 13.035]] } },
        { id: "ecr-road", name: "ECR Road", riskScore: 24, riskLevel: "LOW", rainfallFactor: 25, elevationFactor: 31, drainageFactor: 22, exposureFactor: 29, accessibility: "GOOD", predictionConfidence: 68, rainfall: "28 mm/hr", elevation: "Good", drainage: "Available", explanation: "Current environmental signals indicate a lower probability of flood-related access loss on this segment.", geoJson: { type: "LineString", coordinates: [[80.270, 12.900], [80.285, 12.925], [80.300, 12.950]] } }
    ],
    risk: { overallRiskScore: 72, riskLevel: "HIGH" },
    routes: [
        { type: "Safe Route", risk: "LOW", distance: "8.4 km", eta: "27 min" },
        { type: "Balanced Route", risk: "MODERATE", distance: "7.8 km", eta: "24 min" },
        { type: "Fastest Route", risk: "HIGH", distance: "6.9 km", eta: "20 min" }
    ],
    alerts: [],
    analytics: { rainfallTrend: [10, 20, 30, 40, 50, 60, 70, 80], roadRiskDistribution: { low: 124, moderate: 83, high: 37, critical: 12 }, highestRiskRoads: [] }
};