import os

OPENWEATHER_API_KEY = os.environ.get('OPENWEATHER_API_KEY', 'default_value_if_not_set')
DATABASE_URI = os.environ.get('DATABASE_URI', 'sqlite:///weather.db')
