# Weather App

A responsive weather app built with plain HTML, CSS, and JavaScript. It uses [Open-Meteo](https://open-meteo.com/), which is free and **needs no API key**. No frameworks, no libraries, no build step.

## Features

- Search any city worldwide
- "Use my location" button (browser geolocation)
- Current temperature, conditions, feels-like, humidity, and wind
- 5-day forecast with highs and lows
- °C / °F toggle
- Remembers your last place, unit, and light/dark theme
- Friendly messages for loading, unknown cities, and network errors
- Responsive, keyboard and screen-reader friendly

## How to Run

Open `index.html` in a browser. No setup needed. (The location button works best when the page is served over `http://localhost`, e.g. `python -m http.server`, since some browsers block location on `file://` pages.)


## Technologies Used

HTML5 (semantic markup, ARIA), CSS3 (Flexbox, variables, transitions), vanilla JavaScript (fetch, async/await, Geolocation API, localStorage)

## Future Improvements

- City suggestions while typing
- Hourly forecast chart
- Sunrise/sunset and UV index
- Saved favorite cities
- Background that changes with the weather
- Weather alerts
- Offline caching with a service worker
