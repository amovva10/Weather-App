'use-strict';
//DOM Element
const closeBtnEl = document.querySelector('.close-btn');
const loaderEl = document.querySelector('.loader-container');
const mainContentEl = document.querySelector('.main-content');
const tomorrowEl = document.querySelector('.tomorrow');
const todayEl = document.querySelector('.today');

const inputEl = document.querySelector('.inputData');
const submitIconEl = document.querySelector('.submitBtn');
const weatherImage = document.querySelector('.weather-img img');
const temperatureEl = document.querySelector('.temperature .value');
const weatherTextEl = document.querySelector('.temperature .weathertext');
const dateEl = document.querySelector('.date-info .date');
const timeEl = document.querySelector('.date-info .time');
const dayStatusEl = document.querySelector('.date-info .daystatus');
const LocationEl = document.querySelector('.location');

const realFeelEl = document.querySelector('.weather-info-box .real-feel');
const humidityEl = document.querySelector('.weather-info-box .humidity');
let humidityUnitEl = document.querySelector('.weather-info-box .humidity-unit');
const windEl = document.querySelector('.weather-info-box .wind');
const windDirEl = document.querySelector('.weather-info-box .wind-direction');
const uvEL = document.querySelector('.weather-info-box .UV');
const uvStatusEl = document.querySelector('.weather-info-box .UV-text');
const pressureEl = document.querySelector('.weather-info-box .pressure');
let pressureUnitEl = document.querySelector('.weather-info-box .pressure-unit');
const pressureTendEL = document.querySelector('.weather-info-box .pressureTend');
const changeOfRainEl = document.querySelector('.weather-info-box .changeOfRain');
const changeOfRainSituationEl = document.querySelector('.weather-info-box .changeOfRainSituation');
const hiTemEl = document.querySelector('.weather-info-box .HiTem');
const lowTemEl = document.querySelector('.weather-info-box .LowTem');
const sunRiseEl = document.querySelector('.weather-info-box .sunRise');
const sunSetEl = document.querySelector('.weather-info-box .sunSet');
const moonRiseEl = document.querySelector('.weather-info-box .moonRise');
const moonSetEl = document.querySelector('.weather-info-box .moonSet');


//API INFO
const API_KEY = "z1zrS8DdGEG9inp49wDOtpnyf1xVltzi"; 


let defaultCity = "Dhaka";

//Alert Message
const alertMessage = function(message){
    closeBtnEl.closest('.alert').querySelector('.alert-body').textContent = message;
    closeBtnEl.closest('.alert').classList.remove('show');
    
    setTimeout(function(){
        closeBtnEl.closest('.alert').classList.add('show');
    },3000);
};

//Clear Display if Not fetch any data
const clearDisplay = function(message){
    loaderEl.style.display = 'none';
    closeBtnEl.closest('.alert').classList.add('show');
    mainContentEl.innerHTML = `<div class="error"><p>${message}</p></div>`;  
};


//Get Location from Search bar and display data
['submit','click'].forEach(function(evt){
    submitIconEl.addEventListener(evt,async function(e){
        e.preventDefault();

        //Acitve tab
        todayEl.classList.add('active');
        tomorrowEl.classList.remove('active');
        
        const inData = inputEl.value;

        if(inData == ''){
            alertMessage('Field Must Not be empty!');
        }else{
            //Show loader
            loaderEl.style.display = 'flex';

            defaultCity = inData;
            //Clear input filed
            inputEl.value = "";
            //Update Display Data
            let check = await displayTodayData(inData);
            if(check){
                loaderEl.style.display = 'none';
            }else{
                loaderEl.style.display = 'none';
                alertMessage('Location Not found');
            }
        }
    });
});

//Display tomorrow data when click
tomorrowEl.addEventListener('click',async function(){

    //Loader
    loaderEl.style.display = 'flex';

    //Acitve tab
    this.classList.add('active');
    todayEl.classList.remove('active');

    //Display Data
    let check = await displayTodayData(defaultCity,true);

    if(check){
        loaderEl.style.display = 'none';
    }else{
        loaderEl.style.display = 'none';
        alertMessage('Location Not found');
    }

    
});

//Display today data when click
todayEl.addEventListener('click',async function(){

    //Loader
    loaderEl.style.display = 'flex';

    //Active tab
    this.classList.add('active');
    tomorrowEl.classList.remove('active');

    //Display Data
    let check = await displayTodayData(defaultCity,false);

    if(check){
        loaderEl.style.display = 'none';
    }else{
        loaderEl.style.display = 'none';
        alertMessage('Location Not found');
    }
});


//Close Alert
closeBtnEl.addEventListener('click',function(e){
    e.target.closest('.alert').classList.add('show');
});


//Search City and get LocationKey
const getLocation = async function(cityName){
    const URL = `https://dataservice.accuweather.com/locations/v1/cities/search?apikey=${API_KEY}&q=${cityName}`;
    try {
        const response = await fetch(URL);
        const [data] = await response.json();

        if(data){
            
            return {Location:data.EnglishName,Country:data.Country.LocalizedName,Timezone:data.TimeZone.Name,Key:data.Key};
        }else{
            return false;
        }
    } catch (error) {
        clearDisplay(`---The allowed number of requests has been exceeded.--- <br> As Accuweather provide only 50 request per day for 1 API KEY and You have requested more than that. Try Tomorrow. <br> Good Luck!`);
    }
}


//Get city name by Coordinates
const getLocationByCoords = async function(Latitude,Longitude){
    const URL = `https://dataservice.accuweather.com/locations/v1/cities/geoposition/search?apikey=${API_KEY}&q=${Latitude},${Longitude}&language=en-us&details=true`;

    try{
        const response = await fetch(URL);
        if(!response.ok){
            return false;
        }
        const data = await response.json();

        return data.LocalizedName;
    }catch(error){
        clearDisplay(`---The allowed number of requests has been exceeded.--- <br> As Accuweather provide only 50 request per day for 1 API KEY and You have requested more than that. Try Tomorrow. <br> Good Luck!`);
    }
    
}

//Get Current Weather
const getCurrentWeather = async function(cityName){
    try {
        const {Location,Country,Timezone,Key} = await getLocation(cityName);
    
        if(!Key){
            return false;
        }

        const URL = `https://dataservice.accuweather.com/currentconditions/v1/${Key}?apikey=${API_KEY}&details=true`;    
        const response = await fetch(URL);
        const data = await response.json(); 
        const [currentWeather] = data;


        return {Location:Location,Country:Country,Timezone:Timezone,currentWeather:currentWeather};
    } catch (error) {
        clearDisplay(`---The allowed number of requests has been exceeded.--- <br> As Accuweather provide only 50 request per day for 1 API KEY and You have requested more than that. Try Tomorrow. <br> Good Luck!`);
    }
}

//Get 5 Day Forecast
const getFiveDayForecast = async function(cityName){
    try {
        const {Key} = await getLocation(cityName);
        if(!Key){
            return false;
        }

        const URL = `https://dataservice.accuweather.com/forecasts/v1/daily/5day/${Key}?apikey=${API_KEY}&details=true&metric=true`;    

        const response = await fetch(URL); 

        const data = await response.json();
    
        return data;
    } catch (error) {
        clearDisplay(`---The allowed number of requests has been exceeded.--- <br> As Accuweather provide only 50 request per day for 1 API KEY and You have requested more than that. Try Tomorrow. <br> Good Luck!`);
    }
}

//Get Formatted Time
const getFormatedTime = function(date = '',Timezone){
    let options = {
        hour: "numeric",
        minute: "numeric",
        timeZone: Timezone,
    };

    let localeTime = new Intl.DateTimeFormat('en-US',options).format(date);
    let hour = localeTime.split(':')[0].padStart(2,0);
    let minute = localeTime.split(':')[1].split(' ')[0].padStart(2,0);
    let amPM = localeTime.split(':')[1].split(' ')[1];

    return `${hour}:${minute} ${amPM}`;
}

//Get Formatted Date
const getFormatedDate = function(date = '',Timezone){
    let options = {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: Timezone,
    };

    let localDate = new Intl.DateTimeFormat('en-GB',options).format(date);
    return localDate;
}

//Display Current Weather
const displayTodayData = async function(city, tomorrow= false){
    
    defaultCity = city;
    
    //Get Current Weather
    try {
        let {Location,Country,Timezone,currentWeather} = await getCurrentWeather(city);

        let fiveDayForecast = await getFiveDayForecast(city);
        
        let todayForecast = '';
        let tomorrowForecast = '';
        
        if(!currentWeather && !fiveDayForecast){
            return false;
        }

        fiveDayForecast.DailyForecasts.forEach(function(element,index){
            if(getFormatedDate(new Date(element.Date),Timezone) === getFormatedDate(new Date(currentWeather.LocalObservationDateTime),Timezone)){
                todayForecast = element;
                tomorrowForecast = fiveDayForecast.DailyForecasts[index+1];
            }
        });

        pressureUnitEl.textContent = 'mbbar';
        humidityUnitEl.textContent = '%';

        if(tomorrow){
            // IF tomorrow is set then currentWeather and todayData will changed
            pressureUnitEl.textContent = ' ';
            humidityUnitEl.textContent = ' ';
            currentWeather = {
                LocalObservationDateTime: tomorrowForecast.Date,
                IsDayTime:true,
                WeatherIcon: tomorrowForecast.Day.Icon,
                Temperature:{
                    Metric:{
                        Value: tomorrowForecast.Temperature.Maximum.Value
                    }
                },
                WeatherText: tomorrowForecast.Day.IconPhrase,
                Wind: {
                    Speed:{
                        Metric:{
                            Value: tomorrowForecast.Day.Wind.Speed.Value
                        }
                    },
                    Direction:{
                        English: tomorrowForecast.Day.Wind.Direction.English
                    }
                },
                RelativeHumidity: 'No Info.',
                RealFeelTemperature:{
                    Metric:{
                        Value: tomorrowForecast.RealFeelTemperature.Maximum.Value
                    }
                },
                UVIndex: 'No Info.',
                UVIndexText: '&nbsp;',
                Pressure: {
                    Metric:{
                        Value: 'No Info.'
                    }
                },
                PressureTendency:{
                    LocalizedText: '&nbsp;'
                },


            }
            todayForecast = {
                Sun: tomorrowForecast.Sun,
                Moon: tomorrowForecast.Moon,
                Day:{
                    RainProbability: tomorrowForecast.Day.RainProbability
                },
                Temperature:tomorrowForecast.Temperature,
            }
        }
        
        //Get Date Time info
        let date = new Date(currentWeather.LocalObservationDateTime);
        const dateInfo = getFormatedDate(date,Timezone);

        const timeInfo = `${new Intl.DateTimeFormat("en-GB", {weekday:"long",timeZone:Timezone}).format(date).split(' ').join('')}, ${getFormatedTime(date,Timezone)}`;

        //Get Moon,Sun Rise and Set Time
        const sunRiseInfo = getFormatedTime(new Date(todayForecast.Sun.Rise),Timezone);
        const sunSetInfo = getFormatedTime(new Date(todayForecast.Sun.Set),Timezone);
        const moonRiseInfo = getFormatedTime(new Date(todayForecast.Moon.Rise),Timezone);
        const moonSetInfo = getFormatedTime(new Date(todayForecast.Moon.Set),Timezone);

        //Day Status
        const dayStatus = currentWeather.IsDayTime ? 'Day' : 'Night'; 
        
        
        //Update in DOM
        weatherImage.src = `https://www.accuweather.com/images/weathericons/${currentWeather.WeatherIcon}.svg`;
        temperatureEl.textContent = Math.round(currentWeather.Temperature.Metric.Value);
        weatherTextEl.textContent = currentWeather.WeatherText;
        dateEl.textContent = dateInfo;
        timeEl.textContent = timeInfo;
        dayStatusEl.textContent = dayStatus;
        LocationEl.textContent = `${Location}, ${Country}`;

        windEl.textContent = Math.ceil(currentWeather.Wind.Speed.Metric.Value);
        windDirEl.textContent = currentWeather.Wind.Direction.English;
        humidityEl.textContent = (typeof currentWeather.RelativeHumidity === 'string') ? currentWeather.RelativeHumidity : Math.round(currentWeather.RelativeHumidity);
        realFeelEl.textContent = Math.round(currentWeather.RealFeelTemperature.Metric.Value);
        uvEL.textContent = currentWeather.UVIndex;
        uvStatusEl.innerHTML = currentWeather.UVIndexText;
        pressureEl.textContent = (typeof currentWeather.Pressure.Metric.Value === 'string') ? currentWeather.Pressure.Metric.Value : Math.round(currentWeather.Pressure.Metric.Value);
        pressureTendEL.innerHTML = currentWeather.PressureTendency.LocalizedText;
        if(dayStatus == 'Day'){
            changeOfRainEl.textContent = todayForecast.Day.RainProbability;
        }else{
            changeOfRainEl.textContent = todayForecast.Night.RainProbability;
        }
        changeOfRainSituationEl.textContent = dayStatus;
        hiTemEl.textContent = Math.round(todayForecast.Temperature.Maximum.Value);
        lowTemEl.textContent = Math.round(todayForecast.Temperature.Minimum.Value);
        sunRiseEl.textContent = sunRiseInfo;
        sunSetEl.textContent = sunSetInfo;
        moonRiseEl.textContent = moonRiseInfo;
        moonSetEl.textContent = moonSetInfo;
        
        if(todayForecast){
            return true;
        }else{
            return false;
        }
    } catch (error) {
        clearDisplay(`---The allowed number of requests has been exceeded.--- <br> As Accuweather provide only 50 request per day for 1 API KEY and You have requested more than that. Try Tomorrow. <br> Good Luck!`);
    }
}



//Access location and load data
navigator.geolocation.getCurrentPosition(async function(position){
    const {latitude,longitude} = position.coords;

    let check = displayTodayData(await getLocationByCoords(latitude,longitude));

    if(check){
        loaderEl.style.display = 'none';
        alertMessage('Current Location Loaded');
    }else{
        loaderEl.style.display = 'none';
        alertMessage('Location Not found');
    }

},async function(err){
    let check = await displayTodayData(defaultCity);
    if(check){
        loaderEl.style.display = 'none';
        alertMessage('Default Location Loaded');
    }else{
        alertMessage('Location Not found');
    }
},
{
    enableHighAccuracy: true,
    maximumAge: 10000,
    timeout: 5000
});