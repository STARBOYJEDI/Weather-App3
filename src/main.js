import "./style.css"

async function getGeoData() {
    let search = txtSearch.value;

    const url = `https://nominatim.openstreetmap.org/search?q=${search}&format=jsonv2&addressdetails=1`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const result = await response.json();
        //console.log(result);

        let lat = result[0].lat;
        let lon = result[0].lon;

        loadLocationData(result);
        getWeatherData(lat, lon);
    } catch (error) {
        console.error(error.message);
    }
}

function loadLocationData(locationData) {
    let location = locationData[0].address;
    cityName = location.city;
    countryName = location.country_code.toUpperCase();

    let dateOptions = {
        year: "numeric",
        month: "short",
        day: "numeric",
        weekday: "long",
    };

    let currDate = new Intl.DateTimeFormat("en-US", dateOptions).format(new Date());

    dvCityCountry.textContent = `${cityName}, ${countryName}`;
    dvCurrDate.textContent = currDate;
}

async function getWeatherData(lat, lon) {
    let tempUnit = "celsius";
    let windUnit = "kmh";
    let precipUnit = "mm";

    if (ddlUnits.value === "F") {
        tempUnit = "fahrenheit";
        windUnit = "mph";
        precipUnit = "inch";
    }

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min&hourly=temperature_2m,weather_code&current=weather_code,temperature_unit=${tempUnit},relative_humidity_2m,apparent_temperature,precipitation_unit=${precipUnit},wind_speed_unit=${windUnite}&past_days=0&forecast_days=7`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        weatherData = await response.json();
        console.log(weatherData);

        loadCurrentWeather(weatherData);
        loadDailyForecast(weatherData);
        loadHourlyForecast(weatherData);
    } catch (error) {
        console.error(error.message);
    }
}

function loadCurrentWeather() {
    dvCurrTemp.textContent = Math.round(weatherData.current.temperature_2m);
    pFeelsLike.textContent = Math.round(weatherData.current.apparent_temperature);
    pHumidity.textContent = weatherData.current.relative_humidity_2m;
    pWind.textContent = `${weatherData.current.wind_speed_10m} ${weatherData.current_units.wind_speed_10m.replace("km/h", "kmh")}`;
    pPrecipitation.textContent = `${weatherData.current.precipitation} ${weatherData.current_units.precipitation.replace("mm", "mm")}`;
}

function loadDailyForecast() {
    let daily = weatherData.daily;

    for (let i = 0; i < 7; i++) {
        let date = new Date(daily.time[i]);
        let dayOfWeek = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
        let dvForecastDay = document.querySelector(`#dvForecastDay${i + 1}`);
        let weatherCodeName = getWeatherCodeName(daily.weather_code[i]);
        let dailyHigh = Math.round(daily.temperature_2m_max[i]) + "Â°";
        let dailyLow = Math.round(daily.temperature_2m_min[i]) + "Â°";

        while (dvForecastDay.firstChild) {
            dvForecastDay.removeChild(dvForecastDay.firstChild);
        }

        addDailyElement("p", "daily__daily-title", dayOfWeek, "", dvForecastDay, "afterbegin");
        addDailyElement("img", "daily__day-icon", "", weatherCodeName, dvForecastDay, "beforeend");
        addDailyElement("div", "daily__day-temps", "", "", dvForecastDay, "beforeend");

        let dvDailyTemps = document.querySelector(`#dvForecastDay${i + 1} .daily__day-temps`);
        addDailyElement("p", "daily__day-high", dailyHigh, "", dvDailyTemps, "afterbegin");
        addDailyElement("p", "daily__day-low", dailyLow, "", dvDailyTemps, "beforeend");
    }
}








