/* =========================================================
   Weather App — vanilla JavaScript, powered by Open-Meteo
   Open-Meteo is free and needs NO API key.
   Flow: city name -> coordinates (geocoding) -> weather -> render
   ========================================================= */

const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';

const PLACE_KEY = 'weather-place';
const UNIT_KEY = 'weather-unit';
const THEME_KEY = 'weather-theme';

// Weather codes from Open-Meteo -> [description, emoji]
const WEATHER_CODES = {
  0: ['Clear sky', '☀️'], 1: ['Mostly clear', '🌤️'], 2: ['Partly cloudy', '⛅'], 3: ['Overcast', '☁️'],
  45: ['Fog', '🌫️'], 48: ['Freezing fog', '🌫️'],
  51: ['Light drizzle', '🌦️'], 53: ['Drizzle', '🌦️'], 55: ['Heavy drizzle', '🌧️'],
  61: ['Light rain', '🌦️'], 63: ['Rain', '🌧️'], 65: ['Heavy rain', '🌧️'],
  66: ['Freezing rain', '🌧️'], 67: ['Freezing rain', '🌧️'],
  71: ['Light snow', '🌨️'], 73: ['Snow', '❄️'], 75: ['Heavy snow', '❄️'], 77: ['Snow grains', '❄️'],
  80: ['Rain showers', '🌦️'], 81: ['Rain showers', '🌧️'], 82: ['Violent showers', '⛈️'],
  85: ['Snow showers', '🌨️'], 86: ['Snow showers', '🌨️'],
  95: ['Thunderstorm', '⛈️'], 96: ['Thunderstorm with hail', '⛈️'], 99: ['Thunderstorm with hail', '⛈️']
};

// ---------- State ----------
let unit = localStorage.getItem(UNIT_KEY) || 'celsius';   // 'celsius' | 'fahrenheit'
let place = loadPlace();                                   // { name, latitude, longitude } or null

// ---------- DOM references ----------
const form = document.getElementById('search-form');
const cityInput = document.getElementById('city');
const locateBtn = document.getElementById('locate');
const statusEl = document.getElementById('status');
const currentEl = document.getElementById('current');
const forecastEl = document.getElementById('forecast');
const unitBtn = document.getElementById('unit-toggle');
const themeBtn = document.getElementById('theme-toggle');

/* ---------- Storage ---------- */

function savePlace() {
  localStorage.setItem(PLACE_KEY, JSON.stringify(place));
}
function loadPlace() {
  try { return JSON.parse(localStorage.getItem(PLACE_KEY)); } catch { return null; }
}

/* ---------- API ---------- */

// Fetch JSON and turn network problems into a friendly error
async function getJson(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error();
    return await response.json();
  } catch {
    throw new Error('Could not reach the weather service. Check your connection and try again.');
  }
}

// Turn a city name into { name, latitude, longitude }
async function findCity(query) {
  const data = await getJson(`${GEO_URL}?name=${encodeURIComponent(query)}&count=1&language=en`);
  if (!data.results || data.results.length === 0) {
    throw new Error(`Could not find "${query}". Check the spelling or try a nearby city.`);
  }
  const c = data.results[0];
  return {
    name: [c.name, c.admin1, c.country].filter(Boolean).join(', '),
    latitude: c.latitude,
    longitude: c.longitude
  };
}

// Get current conditions + 5-day forecast for a place, in the chosen unit
function getWeather({ latitude, longitude }) {
  const fahrenheit = unit === 'fahrenheit';
  const params = new URLSearchParams({
    latitude, longitude,
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min',
    forecast_days: 5,
    timezone: 'auto',
    temperature_unit: unit,
    wind_speed_unit: fahrenheit ? 'mph' : 'kmh'
  });
  return getJson(`${WEATHER_URL}?${params}`);
}

/* ---------- Loading ---------- */

// Show weather for the current `place`
async function loadWeather() {
  setStatus('Loading weather…');
  try {
    const data = await getWeather(place);
    renderCurrent(data);
    renderForecast(data.daily);
    setStatus('');
  } catch (err) {
    setStatus(err.message, true);
  }
}

// Look up a city by name, then show its weather
async function searchCity(query) {
  const clean = query.trim();
  if (!clean) {
    setStatus('Please type a city name to search.', true);
    return;
  }
  setStatus('Searching…');
  try {
    place = await findCity(clean);
    savePlace();
    await loadWeather();
  } catch (err) {
    setStatus(err.message, true);
  }
}

// Use the browser's location feature
function useMyLocation() {
  if (!navigator.geolocation) {
    setStatus('Your browser does not support location. Search for a city instead.', true);
    return;
  }
  setStatus('Finding your location…');
  navigator.geolocation.getCurrentPosition(
    pos => {
      place = { name: 'Your location', latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      savePlace();
      loadWeather();
    },
    () => setStatus('Location access was blocked. Allow it in your browser, or search for a city.', true)
  );
}

/* ---------- Rendering ---------- */

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle('error', isError);
}

// Look up the description/emoji for a code (with a fallback)
function describe(code) {
  return WEATHER_CODES[code] || ['Unknown', '🌡️'];
}

// Helper: make an element with a class and text
function el(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  return node;
}

// Big "right now" section
function renderCurrent(data) {
  const c = data.current;
  const u = data.current_units;
  const [text, icon] = describe(c.weather_code);
  const symbol = unit === 'celsius' ? '°C' : '°F';

  currentEl.innerHTML = '';
  currentEl.append(el('div', 'place', place.name), el('div', 'condition', text));

  const now = document.createElement('div');
  now.className = 'now';
  now.append(el('span', 'now-icon', icon), el('span', 'now-temp', `${Math.round(c.temperature_2m)}${symbol}`));
  currentEl.appendChild(now);

  const details = document.createElement('div');
  details.className = 'details';
  [
    ['Feels like', `${Math.round(c.apparent_temperature)}${symbol}`],
    ['Humidity', `${c.relative_humidity_2m}${u.relative_humidity_2m}`],
    ['Wind', `${Math.round(c.wind_speed_10m)} ${u.wind_speed_10m}`]
  ].forEach(([label, value]) => {
    const box = document.createElement('div');
    box.className = 'detail';
    box.append(el('div', 'detail-value', value), el('div', 'detail-label', label));
    details.appendChild(box);
  });
  currentEl.appendChild(details);
  currentEl.hidden = false;
}

// Row of daily forecast cards
function renderForecast(daily) {
  forecastEl.innerHTML = '';
  daily.time.forEach((date, i) => {
    // Add "T00:00" so the date is read in local time, not UTC
    const dayName = i === 0 ? 'Today' : new Date(`${date}T00:00`).toLocaleDateString(undefined, { weekday: 'short' });
    const [text, icon] = describe(daily.weather_code[i]);

    const card = document.createElement('div');
    card.className = 'day';
    const iconEl = el('div', 'day-icon', icon);
    iconEl.setAttribute('role', 'img');
    iconEl.setAttribute('aria-label', text);
    card.append(
      el('div', 'day-name', dayName),
      iconEl,
      el('div', 'day-high', `${Math.round(daily.temperature_2m_max[i])}°`),
      el('div', 'day-low', `${Math.round(daily.temperature_2m_min[i])}°`)
    );
    forecastEl.appendChild(card);
  });
  forecastEl.hidden = false;
}

/* ---------- Unit + theme ---------- */

function applyUnit() {
  unitBtn.textContent = unit === 'celsius' ? '°C' : '°F';
  unitBtn.setAttribute('aria-label', `Switch to ${unit === 'celsius' ? 'Fahrenheit' : 'Celsius'}`);
  localStorage.setItem(UNIT_KEY, unit);
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
  themeBtn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
  localStorage.setItem(THEME_KEY, theme);
}

/* ---------- Event listeners ---------- */

form.addEventListener('submit', e => {
  e.preventDefault();
  searchCity(cityInput.value);
});

locateBtn.addEventListener('click', useMyLocation);

unitBtn.addEventListener('click', () => {
  unit = unit === 'celsius' ? 'fahrenheit' : 'celsius';
  applyUnit();
  if (place) loadWeather();      // re-fetch so every number is in the new unit
});

themeBtn.addEventListener('click', () => {
  applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
});

/* ---------- Start the app ---------- */

applyTheme(localStorage.getItem(THEME_KEY) ||
  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
applyUnit();

if (place) {
  loadWeather();                 // show the last place right away
} else {
  setStatus('Search for a city or tap 📍 to see the weather.');
}
