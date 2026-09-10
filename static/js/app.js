window.DATA_MODE = window.DATA_MODE || "mock";

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
    console.log("Chennai Flood Access Risk Mapper initialized.");
    
    // Load initial data based on the data mode
    document.documentElement.dataset.dataMode = window.DATA_MODE;
});

// Load data based on the current data mode