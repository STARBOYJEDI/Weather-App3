// import "../src/style.css"

const ddlUnits = document.querySelector("#ddlUnits");
const ddlDay = document.querySelector("#ddlDay");
const txtSearch = document.querySelector("#txtSearch");
const btnSearch = document.querySelector("#btnSearch");
const dvCityCountry = document.querySelector("#dvCityCountry");
const dvCurrDate = document.querySelector("#dvCurrDate");
const dvCurrTemp = document.querySelector("#dvCurrTemp");
const pFeelsLike = document.querySelector("#pFeelsLike");
const pHumidity = document.querySelector("#pHumidity");
const pWind = document.querySelector("#pWind");
const pPrecipitation = document.querySelector("#pPrecipitation");

let cityName, countryName, weatherData;

async function getGeoData() {
    if (!txtSearch) {
        console.error('Search input element not found.');
        return;
    }

    let search = txtSearch.value.trim();

    if (!search) {
        console.error('Search input is empty');
        return;
    }

    const url = `https://nominatim.openstreetmap.org/search?q=${search}&format=jsonv2&addressdetails=1`;

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (!result.length) {
            throw new Error('No location found.');
        }

        let lat = parseFloat(result[0].lat);
        let lon = parseFloat(result[0].lon);

        loadLocationData(result);
        getWeatherData(lat, lon);

    } catch (error) {
        console.error('Error:', error.message);
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

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min&hourly=temperature_2m,weather_code&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,precipitation,wind_speed_10m&wind_speed_unit=${windUnit}&temperature_unit=${tempUnit}&precipitation_unit=${precipUnit}`;

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

function addDailyElement(tag, className, content, weatherCodeName, parentElement, position) {
    const newElement = document.createElement(tag);
    newElement.setAttribute("class", className);
    if (content !== "") {
        const newContent = document.createTextNode(content);
        newElement.appendChild(newContent);
    }
    if (tag === "img") {
        newElement.setAttribute("src", `/src/assets/icons/icon-${weatherCodeName}.svg`);
        newElement.setAttribute("alt", weatherCodeName);
        newElement.setAttribute("width", "320");
        newElement.setAttribute("height", "320");
    }
    parentElement.insertAdjacentElement(position, newElement);
}

function loadHourlyForecast() {
    console.log("loadHourlyForecast()");
    let dayIndex = parseInt(ddlDay.value, 10);

    console.log(`Day ${dayIndex + 1}`);
    let firstHour = 24 * dayIndex;
    let lastHour = 24 * (dayIndex + 1) - 1;
    let weatherCodes = weatherData.hourly.weather_code;
    let temps = weatherData.hourly.temperature_2m;
    let hours = weatherData.hourly.time;
    let id = 1;

    for (let h = firstHour; h <= lastHour; h++) {
        // console.log(`hour = ${h}`);
        let weatherCodeName = getWeatherCodeName(weatherCodes[h]);
        let temp = Math.round(temps[h]) + "Â°";
        let hour = new Date(hours[h]).toLocaleString("en-US", { hour: "numeric", hour12: true });
        let dvForecastHour = document.querySelector(`#dvForecastHour${id}`);

        while (dvForecastHour.firstChild) {
            dvForecastHour.removeChild(dvForecastHour.firstChild);
        }

        // console.log(hour, weatherCodeName, temp);

        // console.log(`#dvForecastHour${id}`);
        addDailyElement("img", "hourly__hour-icon", "", weatherCodeName, dvForecastHour, "afterbegin");
        addDailyElement("p", "hourly__hour-time", hour, "", dvForecastHour, "beforeend");
        addDailyElement("p", "hourly__hour-temp", temp, "", dvForecastHour, "beforeend");

        id++;
    }
}

function getHours() {
    for (let h = 0; h <= 23; h++) {
        console.log(h);
    }
}

function getWeatherCodeName(code) {
    const weatherCodes = {
        0: "clear-day",
        1: "partly-cloudy-day",
        2: "partly-cloudy-day",
        3: "overcast",
        45: "fog",
        48: "fog",
        51: "drizzle",
        53: "drizzle",
        55: "drizzle",
        56: "drizzle",
        57: "drizzle",
        61: "rain",
        63: "rain",
        65: "rain",
        66: "rain",
        67: "rain",
        80: "rain",
        81: "rain",
        82: "rain",
        71: "snow",
        73: "snow",
        75: "snow",
        77: "snow",
        85: "snow",
        86: "snow",
        95: "storm",
        96: "storm",
        99: "storm",
    };

    return weatherCodes[code];
}

function populateDayOfWeek() {
    const ddlDay = document.getElementById("ddlDay"); // ✅ query it here

    if (!ddlDay) {
        console.error("populateDayOfWeek: #ddlDay element not found");
        return;
    }

    let currDate = new Date();

    for (let i = 0; i < 7; i++) {
        const currDay = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(currDate);
        const newOption = document.createElement("option");

        newOption.className = "hourly__select-day";
        newOption.value = i;
        newOption.textContent = currDay; 

        ddlDay.insertAdjacentElement("beforeend", newOption);

        currDate.setDate(currDate.getDate() + 1);
    }

    console.log(ddlDay);
}

populateDayOfWeek();
getGeoData();

btnSearch.addEventListener("click", getGeoData);
ddlUnits.addEventListener("change", getGeoData);
ddlDay.addEventListener("change", loadHourlyForecast);












