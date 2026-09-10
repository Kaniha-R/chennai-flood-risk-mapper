# Chennai Flood Access Risk Mapper

## Overview
The Chennai Flood Access Risk Mapper is a web application designed to predict flood risks and provide users with safer route options during heavy rainfall. The application utilizes AI-powered intelligence to analyze various factors affecting road accessibility and presents this information through an interactive dashboard and risk map.

## Features
- **Risk Map**: Visual representation of flood risks across Chennai using Leaflet.js.
- **Safe Route Finder**: Interface for users to find safer routes during floods.
- **Emergency Alerts**: Displays critical alerts related to flood risks.
- **Analytics Dashboard**: Provides insights and trends related to rainfall and road risks using Chart.js.
- **Scenario Simulation**: Allows users to simulate different rainfall scenarios and view predicted risks.
- **Responsive Design**: Optimized for various devices and screen sizes.

## Technology Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript, Bootstrap 5, Leaflet.js, Chart.js
- **Backend**: Python Flask
- **Data Handling**: Mock data for development, with plans for live API integration.

## Project Structure
```
chennai-flood-risk-mapper
├── app.py
├── templates
│   ├── index.html
│   ├── risk-map.html
│   ├── safe-route.html
│   ├── alerts.html
│   ├── analytics.html
│   ├── scenario.html
│   └── about.html
├── static
│   ├── css
│   │   ├── style.css
│   │   ├── dashboard.css
│   │   ├── map.css
│   │   └── responsive.css
│   └── js
│       ├── app.js
│       ├── api.js
│       ├── mock-data.js
│       ├── map.js
│       ├── dashboard.js
│       ├── route.js
│       ├── alerts.js
│       ├── analytics.js
│       └── scenario.js
├── routes
│   ├── __init__.py
│   └── api.py
├── config.py
├── requirements.txt
└── README.md
```

## Setup Instructions
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd chennai-flood-risk-mapper
   ```
3. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```
4. Run the Flask application:
   ```
   python app.py
   ```
5. Open your web browser and go to `http://127.0.0.1:5000` to access the application.

## Usage
- Use the dashboard to view real-time data and access different features of the application.
- Navigate through the risk map to identify flood-prone areas.
- Utilize the safe route finder to plan your journey during adverse weather conditions.
- Stay updated with emergency alerts and analytics data.

## Future Development
- Integration of live API data for real-time updates.
- Enhanced AI capabilities for better risk prediction.
- Additional features based on user feedback and requirements.

## License
This project is licensed under the MIT License.