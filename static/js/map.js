const RISK_COLORS = { LOW: '#42d392', MODERATE: '#f6c85f', HIGH: '#f28c52', CRITICAL: '#f06472' };
let riskMap;
let selectedZoneId = null;
let zoneData = [];
let userMarker;

function initializeMap() {
    if (riskMap || !document.getElementById('map') || typeof L === 'undefined') return;
    riskMap = L.map('map', { zoomControl: true }).setView([13.0827, 80.2707], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(riskMap);
}

function riskClass(score) {
    if (score >= 85) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 35) return 'moderate';
    return 'low';
}

function getRiskColor(riskLevel) {
    return RISK_COLORS[String(riskLevel || '').toUpperCase()] || '#6f8b9a';
}

function normalizeZone(zone) {
    const score = Number(zone.score ?? zone.riskScore ?? 0);
    const riskLevel = String(zone.risk || zone.riskLevel || (score >= 85 ? 'CRITICAL' : score >= 60 ? 'HIGH' : score >= 35 ? 'MEDIUM' : 'LOW')).toUpperCase();
    return {
        ...zone,
        id: zone.id || zone.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        score,
        riskLevel,
        riskClass: riskClass(score),
        rainfallFactor: Math.min(100, Math.max(10, Number(zone.rainfall || 0) / 2)),
        exposureFactor: Math.min(100, Math.max(10, score)),
        predictionConfidence: Math.min(98, Math.max(60, score)),
    };
}

function renderRiskZones(zones) {
    zoneData = zones.map(normalizeZone);
    if (!riskMap) return;

    zoneData.forEach((zone) => {
        const marker = L.circleMarker([zone.lat, zone.lng], {
            radius: 10,
            color: getRiskColor(zone.riskLevel),
            fillColor: getRiskColor(zone.riskLevel),
            fillOpacity: 0.8,
            weight: 2,
        }).addTo(riskMap);

        marker.bindPopup(`
            <strong>${zone.name}</strong><br>
            Risk: ${zone.riskLevel}<br>
            Score: ${zone.score}/100<br>
            Rainfall: ${zone.rainfall} mm/hr
        `);

        marker.on('click', () => selectZone(zone.id));
        marker._zoneId = zone.id;
    });

    if (zoneData.length) {
        const bounds = zoneData.map((zone) => [zone.lat, zone.lng]);
        riskMap.fitBounds(bounds, { padding: [20, 20] });
        if (!selectedZoneId) selectZone(zoneData[0].id, false);
    }
}

function selectZone(zoneId, focus = true) {
    const zone = zoneData.find((item) => item.id === zoneId);
    if (!zone) return;
    selectedZoneId = zone.id;
    updateZoneDetails(zone);
    if (focus && window.innerWidth < 901) document.getElementById('intelligence-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function updateZoneDetails(zone) {
    const cls = zone.riskClass;
    setText('road-name', zone.name);
    setText('risk-score', zone.score);
    setText('risk-level', `${zone.riskLevel} RISK`);
    setText('rainfall-factor', `${Math.min(100, zone.rainfall || 0)}%`);
    setText('elevation-factor', `${Math.min(100, Math.max(10, 100 - zone.score))}%`);
    setText('drainage-factor', `${Math.min(100, Math.max(10, zone.score * 0.8))}%`);
    setText('exposure-factor', `${Math.min(100, Math.max(10, zone.affected_roads * 12))}%`);
    setWidth('rainfall-progress', zone.rainfallFactor || zone.score);
    setWidth('elevation-progress', Math.min(100, 100 - zone.score));
    setWidth('drainage-progress', Math.min(100, zone.score * 0.8));
    setWidth('exposure-progress', Math.min(100, zone.affected_roads * 12));
    setText('accessibility', zone.riskLevel === 'LOW' ? 'GOOD' : zone.riskLevel === 'MEDIUM' ? 'MODERATE' : 'LOW');
    setText('confidence', `${Math.min(98, zone.predictionConfidence)}%`);
    setWidth('confidence-progress', zone.predictionConfidence);
    setText('ai-explanation', `${zone.name} is currently experiencing ${zone.rainfall} mm/hr rainfall with a ${zone.riskLevel.toLowerCase()} flood risk profile.`);
    setText('detail-road-name', zone.name);
    setText('detail-risk-score', `${zone.score} / 100`);
    setText('detail-risk-level', zone.riskLevel);
    setText('detail-rainfall', `${zone.rainfall} mm/hr`);
    setText('detail-elevation', `${Math.min(100, 100 - zone.score)}%`);
    setText('detail-drainage', `${Math.min(100, zone.score * 0.8)}%`);
    setText('detail-accessibility', zone.riskLevel === 'LOW' ? 'GOOD' : zone.riskLevel === 'MEDIUM' ? 'MODERATE' : 'LOW');
    setText('detail-confidence', `${Math.min(98, zone.predictionConfidence)}%`);

    const badge = document.getElementById('risk-level');
    if (badge) badge.className = `risk-badge ${cls}`;
    ['accessibility', 'detail-risk-level'].forEach((id) => document.getElementById(id)?.classList.add(cls));
}

function renderSummary(summary) {
    setText('total-roads', summary.total.toLocaleString());
    setText('critical-roads', summary.critical.toLocaleString());
    setText('high-roads', summary.high.toLocaleString());
    setText('safe-roads', summary.safe.toLocaleString());
    setText('distribution-low', summary.distribution.low.toLocaleString());
    setText('distribution-moderate', summary.distribution.moderate.toLocaleString());
    setText('distribution-high', summary.distribution.high.toLocaleString());
    setText('distribution-critical', summary.distribution.critical.toLocaleString());
}

function renderRoadTable(roads) {
    const body = document.getElementById('risk-road-table');
    if (!body) return;
    body.innerHTML = [...roads].sort((a, b) => b.score - a.score).slice(0, 5).map((road, index) => {
        const cls = road.riskClass || riskClass(road.score);
        return `<tr><td>${index + 1}</td><td><strong>${road.name}</strong></td><td><strong>${road.score}</strong> <span class="table-muted">/ 100</span></td><td><span class="risk-table-pill ${cls}">${road.riskLevel}</span></td><td>${road.riskLevel === 'LOW' ? 'GOOD' : road.riskLevel === 'MEDIUM' ? 'MODERATE' : 'LOW'}</td><td><button class="view-road" type="button" data-road-id="${road.id}">View</button></td></tr>`;
    }).join('');

    body.querySelectorAll('[data-road-id]').forEach((button) => button.addEventListener('click', () => selectZone(button.dataset.roadId)));
}

async function loadRiskMap() {
    const loading = document.getElementById('map-loading');
    const error = document.getElementById('map-error');
    loading?.classList.remove('d-none');
    error?.classList.add('d-none');
    try {
        initializeMap();
        const roads = await getRiskMapData();
        const summary = await getRiskSummary();
        renderRiskZones(roads);
        renderSummary(summary);
        renderRoadTable(roads.map(normalizeZone));
        setText('last-updated', 'Just now');
        setText('data-mode', 'LIVE');
        setText('system-status', '● OPERATIONAL');
    } catch (errorValue) {
        error?.classList.remove('d-none');
        console.error('Risk map loading failed', errorValue);
    } finally {
        loading?.classList.add('d-none');
    }
}

function refreshRiskMap() { return loadRiskMap(); }

function locateUser() {
    if (!navigator.geolocation) { window.alert('Location unavailable'); return; }
    navigator.geolocation.getCurrentPosition((position) => {
        const point = [position.coords.latitude, position.coords.longitude];
        riskMap?.setView(point, 14);
        if (userMarker) userMarker.setLatLng(point);
        else userMarker = L.marker(point).addTo(riskMap).bindPopup('Your location').openPopup();
    }, () => window.alert('Location unavailable'));
}

function setText(id, value) { const element = document.getElementById(id); if (element) element.textContent = value; }
function setWidth(id, value) { const element = document.getElementById(id); if (element) element.style.width = `${Math.max(0, Math.min(100, Number(value) || 0))}%`; }

window.refreshRiskMap = refreshRiskMap;
window.selectZone = selectZone;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('refresh-map')?.addEventListener('click', refreshRiskMap);
    document.getElementById('retry-map')?.addEventListener('click', refreshRiskMap);
    document.getElementById('locate-user')?.addEventListener('click', locateUser);
    document.getElementById('fullscreen-map')?.addEventListener('click', () => { const panel = document.querySelector('.map-panel'); if (document.fullscreenElement) document.exitFullscreen(); else panel?.requestFullscreen?.(); });
    document.querySelectorAll('.layer-button').forEach((button) => button.addEventListener('click', () => { document.querySelectorAll('.layer-button').forEach((item) => item.classList.remove('active')); button.classList.add('active'); }));
    loadRiskMap();
});
