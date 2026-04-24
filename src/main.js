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









