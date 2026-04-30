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
const currentIcon = document.querySelector(".current__icon");
const weatherForm = document.querySelector("#weatherForm");
const searchStatus = document.querySelector("#searchStatus");

const dailyCards = Array.from({ length: 7 }, (_, i) => 
    document.querySelector(`#dvForecastDay${i + 1}`)
);

const hourlyCards = Array.from({ length: 24 }, (_, i) =>
    document.querySelector(`#dvForecastHour${i + 1}`)
);

const CACHE_DURATION = 10 * 60 * 1000;
const DEFAULT_LOCATION = "Johannesburg";

let weatherData = null;
let lastLocation = null;
let activeController = null;
const responseCache = new Map();

function setStatus(message = "") {
    if (searchStatus) searchStatus.textContent = message;
}

function setLoading(isLoading) {
    btnSearch.disabled = isLoading;
    txtSearch.disabled = isLoading;
    ddlUnits.disabled = isLoading;

    btnSearch.textContent = isLoading ? "Loading..." : "Search";
}

function getCachedResponse(url) {
    const cached = responseCache.get(url);

    if (!cached) return null;

    const isFresh = Date.now() - cached.createdAt < CACHE_DURATION;
    return isFresh ? cached.data : null;
}

async function fetchJson(url, signal) {
    const cached = getCachedResponse(url);

    if (cached) {
        return cached;
    }

    const response = await fetch(url, { signal });

    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}.`);
    }

    const data = await response.json();

    responseCache.set(url, {
        data,
        createdAt: Date.now(),
    });

    return data;
}

function getLocationName(locationData) {
    const address = locationData.address;

    const city =
        address.city ||
        address.town ||
        address.village ||
        address.hamlet ||
        address.county ||
        locationData.display_name.split(",")[0];
    
    const country = address.country_code
        ? address.country_code.toUpperCase()
        : "";

    return {
        city,
        country,
    };
}

async function getGeoData(event) {
    event?.preventDefault();

    const search = txtSearch.value.trim();

    if (!search) {
        setStatus("Enter a city or place to check the weather.");
        return;
    }

    activeController?.abort();
    activeController = new AbortController();

    setLoading(true);
    setStatus("Searching...");

    // const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&format=jsonv2&addressdetails=1`;

    const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&format=jsonv2&addressdetails=1`;

    try {
        const result = await fetchJson(geoUrl, activeController.signal);

        if (!result.length) {
            throw new Error("No matching location found.");
        }

        const location = result[0];
        const { city, country } = getLocationName(location);

        lastLocation = {
            lat: parseFloat(location.lat),
            lon: parseFloat(location.lon),
            city,
            country,
        };

        await getWeatherData(lastLocation.lat, lastLocation.lon);

        setStatus("");
    } catch (error) {
        if (error.name !== "AbortError") {
            setStatus(error.message);
        }
    } finally {
        setLoading(false);
    }
}

// function loadLocationData(locationData) {
//     let location = locationData[0].address;
//     cityName = location.city;
//     countryName = location.country_code.toUpperCase();

//     let dateOptions = {
//         year: "numeric",
//         month: "short",
//         day: "numeric",
//         weekday: "long",
//     };

//     let currDate = new Intl.DateTimeFormat("en-US", dateOptions).format(new Date());

//     dvCityCountry.textContent = `${cityName}, ${countryName}`;
//     dvCurrDate.textContent = currDate;
// }

async function getWeatherData(lat, lon) {
    const isFahrenheit = ddlUnits.value === "F";
    const tempUnit = isFahrenheit ? "fahrenheit" : "celsius";
    const windUnit = isFahrenheit ? "mph" : "kmh";
    const precipUnit = isFahrenheit ? "inch" : "mm";

    if (ddlUnits.value === "F") {
        tempUnit = "fahrenheit";
        windUnit = "mph";
        precipUnit = "inch";
    }

    // const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min&hourly=temperature_2m,weather_code&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,precipitation,wind_speed_10m&wind_speed_unit=${windUnit}&temperature_unit=${tempUnit}&precipitation_unit=${precipUnit}`;
    // const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min&hourly=temperature_2m,weather_code&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,precipitation,wind_speed_10m&wind_speed_unit=${windUnit}&temperature_unit=${tempUnit}&precipitation_unit=${precipUnit}&timezone=auto`;
    const weatherUrl
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
    const weatherCodeName = getWeatherCodeName(weatherData.current.weather_code);

    dvCurrTemp.textContent = Math.round(weatherData.current.temperature_2m);
    pFeelsLike.textContent = Math.round(weatherData.current.apparent_temperature);
    pHumidity.textContent = weatherData.current.relative_humidity_2m;
    pWind.textContent = `${weatherData.current.wind_speed_10m} ${weatherData.current_units.wind_speed_10m.replace("km/h", "kmh")}`;
    pPrecipitation.textContent = `${weatherData.current.precipitation} ${weatherData.current_units.precipitation}`;

    currentIcon.src = `/src/assets/icons/icon-${weatherCodeName}.svg`;
}

function loadDailyForecast() {
    let daily = weatherData.daily;

    for (let i = 0; i < 7; i++) {
        let date = new Date(daily.time[i]);
        let dayOfWeek = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
        let dvForecastDay = document.querySelector(`#dvForecastDay${i + 1}`);
        let weatherCodeName = getWeatherCodeName(daily.weather_code[i]);
        let dailyHigh = Math.round(daily.temperature_2m_max[i]) + "°";
        let dailyLow = Math.round(daily.temperature_2m_min[i]) + "°";

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
        let temp = Math.round(temps[h]) + "°";
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
        3: "cloudy",
        45: "fog-day",
        48: "fog-day",
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
        95: "thunderstorms",
        96: "thunderstorms",
        99: "thunderstorms",
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
weatherForm.addEventListener("submit", getGeoData);











