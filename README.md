# Weather Now App
## A responsive weather dashboard built with HTML, CSS, and JavaScript. 
It allows users to search for a location, view current weather conditions, switch between Celsius and Fahrenheit, and browse daily and hourly forecasts.

## Features
- Search weather by city or region
- Current temperature, feels-like temperature, humidity, wind speed, and precipitation
- Celsius and Fahrenheit unit switching
- 7-day daily forecast
- 24-hour hourly forecast
- Day and night-aware weather icons
- Responsive dashboard layout
- Accessible form labels and skip link
- Lightweight client-side caching for repeated API requests

## Tech Stack
- HTML5
- CSS3
- JavaScript
- Open-Meteo Forecast API
- Nominatim geocoding API

## Getting Started
Clone the repository
Run the project with a local development server.

If you use VS Code, you can install the Live Server extension and open index.html with Live Server.

You can also use any simple static server from the project root. The app should be served from the root directory because the HTML references assets with /src/... paths.

## Usage
1. Open the app in your browser.
2. Search for a city or region.
3. View the current weather summary.
4. Use the unit dropdown to switch between °C and °F.
5. Use the hourly forecast dropdown to view hourly data for different days.

## APIs Used
This project uses Nominatim to convert a searched place into latitude and longitude coordinates.

It then uses Open-Meteo to fetch current weather, daily forecast data, hourly forecast data, unit-specific readings, and day/night information for more accurate weather icons.

