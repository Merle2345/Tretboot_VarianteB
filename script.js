// ===============================
// DOM ELEMENTE
// ===============================

const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");

const temperature = document.getElementById("temperature");
const description = document.getElementById("description");
const feelsLike = document.getElementById("feelsLike");
const windSpeed = document.getElementById("windSpeed");
const humidity = document.getElementById("humidity");
const uvIndex = document.getElementById("uvIndex");
const rainChance = document.getElementById("rainChance");

const forecastContainer =
document.getElementById("forecastContainer");

const heroTemp =
document.getElementById("heroTemp");

// ===============================
// WETTERCODES IN TEXT UMWANDELN
// ===============================

function getWeatherDescription(code) {

    const weatherCodes = {

        0: "☀️ Klarer Himmel",
        1: "🌤 Überwiegend klar",
        2: "⛅ Teilweise bewölkt",
        3: "☁️ Bewölkt",

        45: "🌫 Nebel",
        48: "🌫 Reifnebel",

        51: "🌦 Leichter Nieselregen",
        53: "🌦 Nieselregen",
        55: "🌧 Starker Nieselregen",

        61: "🌧 Leichter Regen",
        63: "🌧 Regen",
        65: "🌧 Starker Regen",

        66: "🌧 Gefrierender Regen",
        67: "🌧 Starker gefrierender Regen",

        71: "❄️ Leichter Schneefall",
        73: "❄️ Schneefall",
        75: "❄️ Starker Schneefall",

        80: "🌦 Regenschauer",
        81: "🌧 Kräftige Regenschauer",
        82: "🌧 Starke Regenschauer",

        95: "⛈ Gewitter",
        96: "⛈ Gewitter mit Hagel",
        99: "⛈ Starkes Gewitter"

    };

    return weatherCodes[code] || "🌤 Wetterdaten verfügbar";
}

// ===============================
// WETTERAMPEL
// ===============================

function getBoatRating(temp, wind, rain) {

    if (temp >= 22 && wind < 20 && rain < 30) {
        return "✅ Perfekt zum Trettbootfahren";
    }

    if (temp >= 18 && wind < 35 && rain < 60) {
        return "⚠️ Bedingt geeignet";
    }

    return "❌ Heute eher nicht empfohlen";
}

// ===============================
// KOORDINATEN EINER STADT LADEN
// ===============================

async function getCoordinates(city) {

    const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=de&format=json`
    );

    const data = await response.json();

    if (
        !data.results ||
        data.results.length === 0
    ) {
        throw new Error("Ort nicht gefunden");
    }

    return {
        latitude: data.results[0].latitude,
        longitude: data.results[0].longitude
    };

}

// ===============================
// WETTERDATEN LADEN
// ===============================

async function loadWeather(latitude, longitude) {

    try {

        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max&forecast_days=7&timezone=auto`
        );

        const data = await response.json();

        updateCurrentWeather(data);
        updateForecast(data);

    } catch (error) {

        console.error(error);

        alert(
            "Fehler beim Laden der Wetterdaten."
        );
    }

}

// ===============================
// AKTUELLE WERTE EINSETZEN
// ===============================

function updateCurrentWeather(data) {

    const current = data.current;

    const temp =
        Math.round(current.temperature_2m);

    const feel =
        Math.round(current.apparent_temperature);

    const wind =
        Math.round(current.wind_speed_10m);

    const humidityValue =
        current.relative_humidity_2m;

    const weatherText =
        getWeatherDescription(
            current.weather_code
        );

    const uv =
        data.daily.uv_index_max[0];

    const rain =
        data.daily
            .precipitation_probability_max[0];

    temperature.textContent =
        temp + "°C";

    if(heroTemp){
        heroTemp.textContent =
            temp + "°C";
    }

    description.textContent =
        weatherText;

    feelsLike.textContent =
        feel + "°C";

    windSpeed.textContent =
        wind + " km/h";

    humidity.textContent =
        humidityValue + "%";

    uvIndex.textContent =
        uv;

    rainChance.textContent =
        rain + "%";

    const rating =
        getBoatRating(
            temp,
            wind,
            rain
        );

    description.innerHTML =
        weatherText +
        "<br><br>" +
        rating;
}

// ===============================
// 7-TAGE-VORHERSAGE
// ===============================

function updateForecast(data) {

    forecastContainer.innerHTML = "";

    for(let i = 0; i < 7; i++) {

        const date =
            new Date(
                data.daily.time[i]
            );

        const weekday =
            date.toLocaleDateString(
                "de-DE",
                {
                    weekday: "short"
                }
            );

        const maxTemp =
            Math.round(
                data.daily.temperature_2m_max[i]
            );

        const minTemp =
            Math.round(
                data.daily.temperature_2m_min[i]
            );

        const rain =
            data.daily
                .precipitation_probability_max[i];

        const card =
            document.createElement("div");

        card.classList.add("forecast-day");

        card.innerHTML = `
            <h4>${weekday}</h4>

            <h2>${maxTemp}°C</h2>

            <p>
                Min: ${minTemp}°C
            </p>

            <small>
                🌧 ${rain}%
            </small>
        `;

        forecastContainer.appendChild(card);

    }
}

// ===============================
// STADT SUCHEN
// ===============================

async function searchCity() {

    const city =
        cityInput.value.trim();

    if(!city){
        return;
    }

    try {

        const coords =
            await getCoordinates(city);

        await loadWeather(
            coords.latitude,
            coords.longitude
        );

    } catch(error) {

        console.error(error);

        alert(
            "Ort konnte nicht gefunden werden."
        );

    }

}

// ===============================
// STANDORT VERWENDEN
// ===============================

function loadUserLocation() {

    if(!navigator.geolocation){

        loadHamburg();

        return;
    }

    navigator.geolocation.getCurrentPosition(

        async position => {

            await loadWeather(
                position.coords.latitude,
                position.coords.longitude
            );

        },

        () => {

            loadHamburg();

        }

    );
}

// ===============================
// FALLBACK STADT
// ===============================

async function loadHamburg() {

    try {

        const coords =
            await getCoordinates(
                "Hamburg"
            );

        await loadWeather(
            coords.latitude,
            coords.longitude
        );

    } catch(error) {

        console.error(error);

    }
}

// ===============================
// EVENTS
// ===============================

searchBtn.addEventListener(
    "click",
    searchCity
);

cityInput.addEventListener(
    "keydown",
    event => {

        if(event.key === "Enter"){

            searchCity();

        }

    }
);

// ===============================
// AUTO REFRESH (5 MIN)
// ===============================

setInterval(() => {

    loadUserLocation();

}, 300000);

// ===============================
// SEITENSTART
// ===============================

loadUserLocation();