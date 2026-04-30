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

async function getWeatherData(lat, lon) {
    const isFahrenheit = ddlUnits.value === "F";
    const tempUnit = isFahrenheit ? "fahrenheit" : "celsius";
    const windUnit = isFahrenheit ? "mph" : "kmh";
    const precipUnit = isFahrenheit ? "inch" : "mm";

    // const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min&hourly=temperature_2m,weather_code&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,precipitation,wind_speed_10m&wind_speed_unit=${windUnit}&temperature_unit=${tempUnit}&precipitation_unit=${precipUnit}`;
    // const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min&hourly=temperature_2m,weather_code&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,precipitation,wind_speed_10m&wind_speed_unit=${windUnit}&temperature_unit=${tempUnit}&precipitation_unit=${precipUnit}&timezone=auto`;
    //const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min&hourly=temperature_2m,weather_code&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,precipitation,wind_speed_10m&wind_speed_unit=${windUnit}&temperature_unit=${tempUnit}&precipitation_unit=${precipUnit}&timezone=auto&forecast_days=7`;

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min&hourly=temperature_2m,weather_code,is_day&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,precipitation,wind_speed_10m,is_day&wind_speed_unit=${windUnit}&temperature_unit=${tempUnit}&precipitation_unit=${precipUnit}&timezone=auto&forecast_days=7`;

    weatherData = await fetchJson(weatherUrl, activeController?.signal);

    loadLocationData();
    loadCurrentWeather();
    loadDailyForecast();
    loadHourlyForecast();
}

function loadLocationData() {
    const dateOptions = {
        year: "numeric",
        month: "short",
        day: "numeric",
        weekday: "long",
        timeZone: weatherData.timezone,
    };

    const currDate = new Intl.DateTimeFormat("en-US", dateOptions).format(
        new Date()
    );

    dvCityCountry.textContent = `${lastLocation.city}, ${lastLocation.country}`;
    dvCurrDate.textContent = currDate;
}

function loadCurrentWeather() {
    const current = weatherData.current;
    const units = weatherData.current_units;
    const weatherCodeName = getWeatherCodeName(current.weather_code);

    dvCurrTemp.textContent = Math.round(current.temperature_2m);
    pFeelsLike.textContent = Math.round(current.apparent_temperature);
    pHumidity.textContent = current.relative_humidity_2m;
    pWind.textContent = `${current.wind_speed_10m} ${units.wind_speed_10m.replace("km/h", "kmh")}`;
    pPrecipitation.textContent = `${current.precipitation} ${units.precipitation}`;

    currentIcon.src = `/src/assets/icons/icon-${weatherCodeName}.svg`;
    currentIcon.alt = weatherCodeName.replaceAll("-", " ");
}

function loadDailyForecast() {
    const daily = weatherData.daily;

    dailyCards.forEach((card, index) => {
        const date = new Date(daily.time[index]);
        const dayOfWeek = new Intl.DateTimeFormat("en-US", {
            weekday: "short",
            timeZone: weatherData.timezone,
        }).format(date);

        const weatherCodeName = getWeatherCodeName(daily.weather_code[index]);
        const high = `${Math.round(daily.temperature_2m_max[index])}°`;
        const low = `${Math.round(daily.temperature_2m_min[index])}°`;

        const title = createElement("p", "daily__daily-title", dayOfWeek);
        const icon = createWeatherIcon("daily__day-icon", weatherCodeName);
        const temps = createElement("div", "daily__day-temps");

        temps.append(
            createElement("p", "daily__day-high", high),
            createElement("p", "daily__day-low", low)
        );

        card.replaceChildren(title, icon, temps);
    });
}

function loadHourlyForecast() {
    if (!weatherData) return;

    const dayIndex = parseInt(ddlDay.value, 10) || 0;
    const firstHour = 24 * dayIndex;
    const lastHour = 24 * (dayIndex + 1);

    const weatherCodes = weatherData.hourly.weather_code;
    const temps = weatherData.hourly.temperature_2m;
    const hours = weatherData.hourly.time;

    hourlyCards.forEach((card, index) => {
        const hourIndex = firstHour + index;

        if (hourIndex >= lastHour) return;

        const weatherCodeName = getWeatherCodeName(weatherCodes[hourIndex]);
        const temp = `${Math.round(temps[hourIndex])}°`;
        const hour = new Date(hours[hourIndex]).toLocaleString("en-US", {
            hour: "numeric",
            hour12: true,
            timeZone: weatherData.timezone,
        });

        card.replaceChildren(
            createWeatherIcon("hourly__hour-icon", weatherCodeName),
            createElement("p", "hourly__hour-time", hour),
            createElement("p", "hourly__hour-temp", temp)
        );
    });
}

function createElement(tag, className, text = "") {
    const element = document.createElement(tag);
    element.className = className;

    if (text) {
        element.textContent = text;
    }

    return element;
}

function createWeatherIcon(className, weatherCodeName) {
    const icon = document.createElement("img");

    icon.className = className;
    icon.src = `/src/assets/icons/icon-${weatherCodeName}.svg`;
    icon.alt = weatherCodeName.replaceAll("-", " ");
    icon.width = 320;
    icon.height = 320;

    return icon;
}

function getWeatherCodeName(code, isDay = 1) {
    const dayNightCodes = {
        0: isDay ? "clear-day" : "clear-night",
        1: isDay ? "partly-cloudy-day" : "partly-cloudy-night",
        2: isDay ? "partly-cloudy-day" : "partly-cloudy-night",
        45: isDay ? "fog-day" : "fog-night",
        48: isDay ? "fog-day" : "fog-night",
    }

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

    return weatherCodes[code] || "clear-day";
}

function populateDayOfWeek() {
    ddlDay.replaceChildren();

    const currDate = new Date();

    for (let i = 0; i < 7; i++) {
        const optionDate = new Date(currDate);
        optionDate.setDate(currDate.getDate() + i);

        const dayName = new Intl.DateTimeFormat("en-US", {
            weekday: "long",
        }).format(optionDate);

        const option = document.createElement("option");
        option.className = "hourly__select-day";
        option.value = i;
        option.textContent = dayName;

        ddlDay.append(option);
    }
}

async function reloadLastLocationWeather() {
    if (!lastLocation) return;

    activeController?.abort();
    activeController = new AbortController();

    setLoading(true);
    setStatus("Updating units...");

    try {
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

populateDayOfWeek();

weatherForm.addEventListener("submit", getGeoData);
ddlUnits.addEventListener("change", reloadLastLocationWeather);
ddlDay.addEventListener("change", loadHourlyForecast);

txtSearch.value = DEFAULT_LOCATION;
getGeoData();











