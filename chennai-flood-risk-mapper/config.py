import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your_default_secret_key'
    DEBUG = os.environ.get('FLASK_DEBUG') or True
    TESTING = os.environ.get('FLASK_TESTING') or False
    JSON_SORT_KEYS = False
    # Add any other configuration variables as needed.