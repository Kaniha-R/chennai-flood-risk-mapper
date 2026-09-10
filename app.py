from flask import Flask, render_template
from routes.api import api_bp

app = Flask(__name__)

# Register API blueprint
app.register_blueprint(api_bp, url_prefix="/api")


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/risk-map")
def risk_map():
    return render_template("risk-map.html")


@app.route("/safe-route")
def safe_route():
    return render_template("safe-route.html")


@app.route("/alerts")
def alerts():
    return render_template("alerts.html")


@app.route("/analytics")
def analytics():
    return render_template("analytics.html")


@app.route("/scenario")
def scenario():
    return render_template("scenario.html")


@app.route("/about")
def about():
    return render_template("about.html")


if __name__ == "__main__":
    app.run(debug=True)