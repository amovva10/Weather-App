from flask import Flask, render_template, request, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
import requests
from datetime import datetime
import os  # Import the os module to access environment variables

db = SQLAlchemy()

app = Flask(__name__, static_url_path='/static')
app.config["DEBUG"] = True

# Use environment variables for configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URI', 'sqlite:///weather.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'thisisasecret')

db.init_app(app)

class City(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)

def get_weather_data(city):
    # Use environment variable for OpenWeatherMap API key
    weather_api_key = os.environ.get('OPENWEATHER_API_KEY', 'default_value_if_not_set')
    url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&units=imperial&appid={weather_api_key}"
    try:
        r = requests.get(url).json()
        if r.get('cod') == 200:
            return r
        else:
            # The API returned an error, handle it
            return {'error': 'City not found'}
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
        return {'error': 'Failed to fetch data'}

@app.route('/')
def index_get():
    current_city = get_current_city()
    cities = City.query.all()
    current_city_data = get_weather_data(current_city)

    if 'main' in current_city_data:
        temperature = current_city_data['main'].get('temp', 'N/A')
    else:
        temperature = 'N/A'

    temperature = f"{temperature}"

    if 'weather' in current_city_data and len(current_city_data['weather']) > 0:
        description = current_city_data['weather'][0].get('description', 'N/A')
    else:
        description = 'N/A'

    if 'weather' in current_city_data and len(current_city_data['weather']) > 0:
        icon = current_city_data['weather'][0].get('icon', 'N/A')
    else:
        icon = 'N/A'

    weather_current = {
        'city': current_city,
        'temperature': temperature,
        'description': description,
        'icon': icon,
    }

    weather_data = []
    for city in cities:
        r = get_weather_data(city.name)
        if 'main' in r:
            temperature = r['main'].get('temp', 'N/A')
        else:
            temperature = 'N/A'
        temperature = f"{temperature}"

        if 'weather' in r and len(r['weather']) > 0:
            description = r['weather'][0].get('description', 'N/A')
            icon = r['weather'][0].get('icon', 'N/A')
        else:
            description = 'N/A'
            icon = 'N/A'

        weather = {
            'city': city.name,
            'temperature': temperature,
            'description': description,
            'icon': icon,
        }
        weather_data.append(weather)

    return render_template('weather.html', weather_data=weather_data, weather_current=weather_current)

@app.route('/', methods=["POST"])
def index_post():
    err_msg = ""
    new_city = request.form.get('city')
    if new_city:
        existing_city = City.query.filter_by(name=new_city).first()
        if not existing_city:
            new_city_data = get_weather_data(new_city)
            if 'error' in new_city_data:
                err_msg = "City does not exist in the world"
            elif new_city_data.get('cod') == 200:
                new_city_obj = City(name=new_city)
                db.session.add(new_city_obj)
                db.session.commit()
            else:
                err_msg = "Failed to add the city"
        else:
            err_msg = "City already exists in the database"

    if err_msg:
        flash(err_msg, 'error')
    else:
        flash('City added successfully!', 'success')
    return redirect(url_for("index_get"))

@app.route('/delete/<name>')
def delete_city(name):
    city = City.query.filter_by(name=name).first()
    if city:
        db.session.delete(city)
        db.session.commit()
        flash(f'Successfully deleted {city.name}!', 'success')
    return redirect(url_for('index_get'))

def get_current_city():
    try:
        response = requests.get("http://ip-api.com/json")
        if response.status_code == 200:
            data = response.json().get("city", "Unknown")
            return data.capitalize()
        else:
            return "Unknown"
    except Exception as e:
        print(f"Error getting current city: {e}")
        return "Unknown"

def format_datetime(input_datetime):
    try:
        input_format = "%Y-%m-%d %H:%M:%S"
        output_format = "%Y-%m-%d %I:%M %p"
        input_dt = datetime.strptime(input_datetime, input_format)
        formatted_datetime = input_dt.strftime(output_format)
        return formatted_datetime
    except ValueError:
        return "Invalid input datetime format"

def get_7day_weather_forecast(city):
    base_url = "https://api.openweathermap.org/data/2.5/forecast"
    params = {
        'q': city,
        'appid': os.environ.get('OPENWEATHER_API_KEY', 'default_value_if_not_set'),
        'units': 'imperial',
        'cnt': 7
    }
    try:
        response = requests.get(base_url, params=params)
        data = response.json()
        if response.status_code == 200:
            weather_forecast_update = []
            daily_forecast = data.get('list', [])[1:]
            for day_data in daily_forecast:
                temperature = f"{day_data['main'].get('temp', 'N/A')}°F"
                if 'weather' in day_data and len(day_data['weather']) > 0:
                    description = day_data['weather'][0].get('description', 'N/A')
                    icon = day_data['weather'][0].get('icon', 'N/A')
                else:
                    description = 'N/A'
                    icon = 'N/A'
                weather_forecast_json = {
                    "date": format_datetime(day_data['dt_txt']),
                    "temperature": temperature,
                    "description": description,
                    "icon": icon
                }
                weather_forecast_update.append(weather_forecast_json)
            return weather_forecast_update
    except Exception as e:
        print(f"Error: {e}")
        return None

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(port=8000)
