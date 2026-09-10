from datetime import datetime

import requests
from flask import Blueprint, jsonify, request

api_bp = Blueprint("api", __name__)

CHENNAI_LOCATIONS = {
    "Tambaram": {"label": "Tambaram", "lat": 12.9249, "lng": 80.1000},
    "Koyambedu": {"label": "Koyambedu", "lat": 13.0694, "lng": 80.1948},
    "Airport": {"label": "Chennai Airport", "lat": 12.9941, "lng": 80.1709},
    "OMR Sholinganallur": {"label": "OMR Sholinganallur", "lat": 12.9010, "lng": 80.2279},
    "Central Station": {"label": "Chennai Central", "lat": 13.0827, "lng": 80.2707},
    "Adyar Signal": {"label": "Adyar Signal", "lat": 13.0067, "lng": 80.2570},
    "Velachery": {"label": "Velachery", "lat": 12.9756, "lng": 80.2207},
    "T. Nagar": {"label": "T. Nagar", "lat": 13.0418, "lng": 80.2341},
    "Guindy": {"label": "Guindy", "lat": 13.0067, "lng": 80.2206},
    "ECR Palavakkam": {"label": "ECR Palavakkam", "lat": 12.9333, "lng": 80.2500},
}


def api_success(data):
    return jsonify({"success": True, "data": data})


def api_error(message, status=400):
    return jsonify({"success": False, "error": message}), status


def risk_from_score(score):
    score = int(score)
    if score >= 85:
        return "CRITICAL"
    if score >= 60:
        return "HIGH"
    if score >= 35:
        return "MEDIUM"
    return "LOW"


def geocode_location(name):
    """
    Resolve a place name to {label, lat, lng}.
    Fast path: known Chennai landmarks (no network call).
    Fallback: free-text geocoding via OpenStreetMap Nominatim, scoped to Chennai.
    Returns None if the place can't be resolved.
    """
    if not name:
        return None

    # Fast path — exact match on our curated landmark list
    if name in CHENNAI_LOCATIONS:
        loc = CHENNAI_LOCATIONS[name]
        return {"label": loc["label"], "lat": loc["lat"], "lng": loc["lng"]}

    # Fallback — real geocoding for anything else the user types
    try:
        response = requests.get(
            "https://nominatim.openstreetmap.org/search",
            params={
                "q": f"{name}, Chennai, Tamil Nadu, India",
                "format": "json",
                "limit": 1,
            },
            headers={"User-Agent": "FloodShieldChennai/1.0"},
            timeout=5,
        )
        response.raise_for_status()
        results = response.json()
        if not results:
            return None

        result = results[0]
        return {
            "label": result.get("display_name", name).split(",")[0],
            "lat": float(result["lat"]),
            "lng": float(result["lon"]),
        }
    except Exception:
        return None


def get_alerts():
    return [
        {
            "id": 1,
            "title": "High Flood Risk",
            "location": "Velachery",
            "severity": "HIGH",
            "message": "Standing water is impacting the Velachery corridor and limiting road clearance.",
            "rainfall": 145,
            "water_level": 2.5,
            "time": "8 minutes ago",
            "status": "ACTIVE",
        },
        {
            "id": 2,
            "title": "Road Accessibility Warning",
            "location": "OMR Sholinganallur",
            "severity": "CRITICAL",
            "message": "Several road segments near OMR are experiencing drainage stress and waterlogging.",
            "rainfall": 156,
            "water_level": 2.8,
            "time": "12 minutes ago",
            "status": "ACTIVE",
        },
        {
            "id": 3,
            "title": "Flooded Junction",
            "location": "Tambaram",
            "severity": "HIGH",
            "message": "Low-lying junctions in Tambaram remain vulnerable during the current rainfall peak.",
            "rainfall": 126,
            "water_level": 2.1,
            "time": "19 minutes ago",
            "status": "ACTIVE",
        },
        {
            "id": 4,
            "title": "Rising Water Level",
            "location": "Guindy",
            "severity": "MEDIUM",
            "message": "Water levels are rising near Guindy and public movement should remain cautious.",
            "rainfall": 111,
            "water_level": 2.0,
            "time": "32 minutes ago",
            "status": "ACTIVE",
        },
        {
            "id": 5,
            "title": "Route Restored",
            "location": "Adyar",
            "severity": "LOW",
            "message": "Water levels in the Adyar corridor have reduced and routes are recovering.",
            "rainfall": 88,
            "water_level": 1.5,
            "time": "45 minutes ago",
            "status": "RESOLVED",
        },
    ]


def get_risk_zones():
    return [
        {"id": "velachery-main-road", "name": "Velachery Main Road", "score": 92, "risk": "CRITICAL", "rainfall": 128, "lat": 12.9756, "lng": 80.2207, "affected_roads": 6},
        {"id": "omr-corridor", "name": "OMR Corridor", "score": 88, "risk": "HIGH", "rainfall": 118, "lat": 12.9010, "lng": 80.2279, "affected_roads": 5},
        {"id": "anna-salai", "name": "Anna Salai", "score": 76, "risk": "HIGH", "rainfall": 102, "lat": 13.0701, "lng": 80.2511, "affected_roads": 4},
        {"id": "tambaram-link-road", "name": "Tambaram Link Road", "score": 81, "risk": "HIGH", "rainfall": 110, "lat": 12.9249, "lng": 80.1000, "affected_roads": 4},
        {"id": "guindy-industrial", "name": "Guindy Industrial Road", "score": 68, "risk": "HIGH", "rainfall": 96, "lat": 13.0067, "lng": 80.2206, "affected_roads": 3},
        {"id": "adyar-corridor", "name": "Adyar Corridor", "score": 58, "risk": "MEDIUM", "rainfall": 78, "lat": 13.0067, "lng": 80.2570, "affected_roads": 2},
        {"id": "central-station", "name": "Central Station Road", "score": 49, "risk": "MEDIUM", "rainfall": 64, "lat": 13.0827, "lng": 80.2707, "affected_roads": 2},
        {"id": "koyambedu-market", "name": "Koyambedu Market Road", "score": 42, "risk": "MEDIUM", "rainfall": 57, "lat": 13.0694, "lng": 80.1948, "affected_roads": 2},
        {"id": "ecr-coast", "name": "ECR Coastal Stretch", "score": 36, "risk": "LOW", "rainfall": 46, "lat": 12.9333, "lng": 80.2500, "affected_roads": 1},
        {"id": "t-nagar", "name": "T. Nagar Commercial Area", "score": 31, "risk": "LOW", "rainfall": 39, "lat": 13.0418, "lng": 80.2341, "affected_roads": 1},
    ]


def get_dashboard_data():
    zones = get_risk_zones()
    scores = [zone["score"] for zone in zones]
    overall_risk = round(sum(scores) / len(scores)) if scores else 0
    risk_level = risk_from_score(overall_risk)
    active_alerts = [alert for alert in get_alerts() if alert.get("status") == "ACTIVE"]

    distribution = {
        "low": sum(1 for zone in zones if zone["score"] < 35),
        "medium": sum(1 for zone in zones if 35 <= zone["score"] < 60),
        "high": sum(1 for zone in zones if 60 <= zone["score"] < 85),
        "critical": sum(1 for zone in zones if zone["score"] >= 85),
    }

    return {
        "rainfall": 76,
        "forecast": 94,
        "risk_score": overall_risk,
        "overall_risk": overall_risk,
        "risk_level": risk_level,
        "affected_roads": sum(1 for zone in zones if zone["score"] >= 60),
        "last_updated": "Just now",
        "alerts": active_alerts[:4],
        "risk_distribution": {
            "low": {"roads": distribution["low"], "percentage": round((distribution["low"] / len(zones)) * 100) if zones else 0},
            "medium": {"roads": distribution["medium"], "percentage": round((distribution["medium"] / len(zones)) * 100) if zones else 0},
            "high": {"roads": distribution["high"], "percentage": round((distribution["high"] / len(zones)) * 100) if zones else 0},
            "critical": {"roads": distribution["critical"], "percentage": round((distribution["critical"] / len(zones)) * 100) if zones else 0},
        },
    }


def build_path(start, end, offset, bend):
    mid_lat = (start["lat"] + end["lat"]) / 2
    mid_lng = (start["lng"] + end["lng"]) / 2
    dx = end["lng"] - start["lng"]
    dy = end["lat"] - start["lat"]
    length = (dx ** 2 + dy ** 2) ** 0.5 or 1
    px = -dy / length
    py = dx / length

    bent_mid = {
        "lat": mid_lat + py * offset,
        "lng": mid_lng + px * offset,
    }
    q1 = {
        "lat": start["lat"] + (bent_mid["lat"] - start["lat"]) * 0.5 + py * (offset * bend),
        "lng": start["lng"] + (bent_mid["lng"] - start["lng"]) * 0.5 + px * (offset * bend),
    }
    q3 = {
        "lat": bent_mid["lat"] + (end["lat"] - bent_mid["lat"]) * 0.5 + py * (offset * bend),
        "lng": bent_mid["lng"] + (end["lng"] - bent_mid["lng"]) * 0.5 + px * (offset * bend),
    }
    return [start, q1, bent_mid, q3, end]


def generate_routes(origin_name, destination_name):
    origin = geocode_location(origin_name)
    destination = geocode_location(destination_name)

    if not origin or not destination:
        raise ValueError("Invalid origin or destination.")

    templates = [
        {"id": "safe", "name": "Safest Route", "risk": "LOW", "risk_score": 22, "duration": 48, "distance": 21.4, "reason": "Avoids known waterlogging corridors and keeps movement on higher-drainage roads.", "offset": 0.025, "bend": 1.10},
        {"id": "alternative", "name": "Alternative Route", "risk": "MEDIUM", "risk_score": 41, "duration": 43, "distance": 19.8, "reason": "A balanced detour with moderate risk and better drainage than the fastest corridor.", "offset": -0.012, "bend": 0.55},
        {"id": "fastest", "name": "Fastest Route", "risk": "HIGH", "risk_score": 68, "duration": 39, "distance": 18.9, "reason": "Shortest route but crosses more flood-prone low-lying segments and storm-water pockets.", "offset": 0.005, "bend": 0.20},
    ]

    routes = []
    for route in templates:
        path = build_path(origin, destination, route["offset"], route["bend"])
        routes.append({
            "id": route["id"],
            "name": route["name"],
            "distance": route["distance"],
            "duration": route["duration"],
            "risk": route["risk"],
            "risk_score": route["risk_score"],
            "reason": route["reason"],
            "origin": {"label": origin["label"], "lat": origin["lat"], "lng": origin["lng"]},
            "destination": {"label": destination["label"], "lat": destination["lat"], "lng": destination["lng"]},
            "path": [{"lat": point["lat"], "lng": point["lng"]} for point in path],
        })

    return {
        "origin": {"name": origin_name, "label": origin["label"], "lat": origin["lat"], "lng": origin["lng"]},
        "destination": {"name": destination_name, "label": destination["label"], "lat": destination["lat"], "lng": destination["lng"]},
        "routes": routes,
    }


def simulate_scenario(rainfall):
    rainfall_value = float(rainfall)
    if rainfall_value < 0 or rainfall_value > 300:
        raise ValueError("Rainfall must be between 0 and 300 mm/hr.")

    risk_score = min(100, int(28 + rainfall_value * 0.42))
    return {
        "rainfall": int(rainfall_value),
        "risk_score": risk_score,
        "risk_level": risk_from_score(risk_score),
        "water_level": round(0.7 + rainfall_value / 70, 1),
        "affected_roads": min(60, int(10 + rainfall_value / 4)),
        "critical_zones": min(16, int(2 + rainfall_value / 18)),
        "population_affected": int(17000 + rainfall_value * 210),
        "safe_routes": max(1, 6 - int(rainfall_value / 45)),
    }


@api_bp.route("/dashboard", methods=["GET"])
def dashboard():
    try:
        return api_success(get_dashboard_data())
    except Exception as exc:  # pragma: no cover
        return api_error(f"Unable to load dashboard data: {exc}", 500)


@api_bp.route("/risk-map", methods=["GET"])
def risk_map():
    try:
        return api_success(get_risk_zones())
    except Exception as exc:  # pragma: no cover
        return api_error(f"Unable to load risk map data: {exc}", 500)


@api_bp.route("/alerts", methods=["GET"])
def alerts():
    try:
        return api_success(get_alerts())
    except Exception as exc:  # pragma: no cover
        return api_error(f"Unable to load alerts: {exc}", 500)


@api_bp.route("/analytics", methods=["GET"])
def analytics():
    try:
        response = {
            "risk_trend": [46, 52, 58, 63, 68, 74, 79, 86],
            "rainfall_trend": [32, 42, 58, 74, 94, 88, 76, 98],
            "water_level_trend": [1.1, 1.3, 1.7, 1.9, 2.2, 2.5, 2.6, 2.9],
            "risk_distribution": {"LOW": 42, "MEDIUM": 27, "HIGH": 18, "CRITICAL": 7},
            "affected_roads": 23,
            "historical_values": {
                "average_rainfall": 72,
                "peak_water_level": 3.1,
                "average_risk_score": 58,
            },
            "top_risk_roads": [
                {"name": "Velachery Main Road", "score": 94},
                {"name": "OMR Corridor", "score": 90},
                {"name": "Anna Salai", "score": 88},
                {"name": "Tambaram Link Road", "score": 82},
            ],
        }
        return api_success(response)
    except Exception as exc:  # pragma: no cover
        return api_error(f"Unable to load analytics: {exc}", 500)


@api_bp.route("/routes", methods=["POST"])
def routes():
    payload = request.get_json(silent=True) or {}
    origin = payload.get("origin")
    destination = payload.get("destination")

    if not origin or not destination:
        return api_error("Origin and destination are required.", 400)

    if origin == destination:
        return api_error("Origin and destination must be different.", 400)

    try:
        route_data = generate_routes(origin, destination)
        return api_success(route_data)
    except ValueError as exc:
        return api_error(str(exc), 400)
    except Exception as exc:  # pragma: no cover
        return api_error("Unable to calculate routes at this time.", 500)


@api_bp.route("/scenario", methods=["POST"])
def scenario():
    payload = request.get_json(silent=True) or {}
    rainfall = payload.get("rainfall")

    if rainfall is None:
        return api_error("Rainfall value is required.", 400)

    try:
        result = simulate_scenario(rainfall)
        return api_success(result)
    except ValueError as exc:
        return api_error(str(exc), 400)
    except Exception as exc:  # pragma: no cover
        return api_error("Unable to run scenario simulation.", 500)


@api_bp.route("/system-status", methods=["GET"])
def system_status():
    return api_success({
        "system": "ONLINE",
        "api": "ONLINE",
        "database": "DEMO",
        "risk_engine": "ONLINE",
        "last_update": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    })