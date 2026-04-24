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
}









