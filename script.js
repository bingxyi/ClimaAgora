const apiKey = "dde23291486636c3e7603ac66a60845e"; // API Key da OpenWeather

// Elementos DOM
const cityInput = document.getElementById('cityInput');
const cityName = document.getElementById('cityName');
const currentDate = document.getElementById('currentDate');
const weatherIcon = document.getElementById('weatherIcon');
const temperature = document.getElementById('temperature');
const feelsLike = document.getElementById('feelsLike');
const description = document.getElementById('description');
const humidity = document.getElementById('humidity');
const wind = document.getElementById('wind');
const precipitation = document.getElementById('precipitation');
const uvIndex = document.getElementById('uvIndex');
const sunrise = document.getElementById('sunrise');
const sunset = document.getElementById('sunset');
const weatherResult = document.getElementById('weatherResult');
const forecast = document.getElementById('forecast');
const forecastCards = document.getElementById('forecastCards');
const locationBtn = document.getElementById('locationBtn');
const toggleThemeBtn = document.getElementById('toggleTheme');

// Botão de tema escuro
toggleThemeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');

    const isDark = document.body.classList.contains('dark-theme');
    toggleThemeBtn.innerHTML = isDark 
        ? '<i class="fas fa-sun"></i> Tema Claro' 
        : '<i class="fas fa-moon"></i> Tema Escuro';
});

// Formatar data
function formatDate(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('pt-BR', { 
        weekday: 'long', 
        day: '2-digit', 
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatTime(timestamp, timezoneOffset) {
    const localTimestamp = (timestamp + timezoneOffset); // segundos
    const utcDate = new Date(localTimestamp * 1000); // converte para ms
    return utcDate.toUTCString().match(/\d{2}:\d{2}/)[0]; // extrai HH:MM
}

// Atualizar informações de localização
function updateLocationInfo(data) {
    cityName.textContent = `${data.name}, ${data.sys.country}`;
    currentDate.textContent = formatDate(data.dt);
}

// Atualizar informações principais do clima
function updateMainWeather(data) {
    const temp = Math.round(data.main.temp);
    const feels = Math.round(data.main.feels_like);
    
    weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    weatherIcon.alt = data.weather[0].description;
    
    temperature.textContent = `${temp}°C`;
    feelsLike.querySelector('.value').textContent = `${feels}°C`;
    
    const desc = data.weather[0].description;
    description.textContent = `${desc.charAt(0).toUpperCase() + desc.slice(1)}`;
}

// Atualizar informações detalhadas do clima
function updateWeatherDetails(data) {
    humidity.textContent = `${data.main.humidity}%`;
    wind.textContent = `${data.wind.speed} km/h`;
    
    // Precipitação (pode não estar disponível em todas as respostas)
    const rain = data.rain ? data.rain['1h'] || 0 : 0;
    precipitation.textContent = `${rain} mm`;

    // Nascer e pôr do sol
    sunrise.textContent = formatTime(data.sys.sunrise, data.timezone);
    sunset.textContent = formatTime(data.sys.sunset, data.timezone);
}

function updateUVIndex(uvi) {
    uvIndex.textContent = uvi;
    
    const uvCard = document.querySelector('.uv-card');
    const icon = uvCard.querySelector('i');
    
    uvCard.classList.remove('low', 'moderate', 'high', 'extreme');
    
    if (uvi <= 2) {
        uvCard.classList.add('low');
        icon.style.color = getComputedStyle(document.documentElement).getPropertyValue('--success-color');
    } else if (uvi <= 5) {
        uvCard.classList.add('moderate');
        icon.style.color = getComputedStyle(document.documentElement).getPropertyValue('--warning-color');
    } else if (uvi <= 7) {
        uvCard.classList.add('high');
        icon.style.color = getComputedStyle(document.documentElement).getPropertyValue('--danger-color');
    } else {
        uvCard.classList.add('extreme');
        icon.style.color = '#9C003C';
    }
}

// Buscar índice UV separadamente (requer coordenadas)
async function fetchUVIndex(lat, lon) {
    try {
        const uvUrl = `https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${apiKey}`;
        const response = await fetch(uvUrl);
        const uvData = await response.json();
        updateUVIndex(uvData.value.toFixed(1));
    } catch (error) {
        console.error("Erro ao buscar índice UV:", error);
        uvIndex.textContent = "N/D";
    }
}

// Mostrar previsão para os próximos dias
function displayForecast(data) {
    forecastCards.innerHTML = '';
    
    // Filtra para pegar 1 previsão por dia (12:00)
    const dailyData = data.list.filter(item => item.dt_txt.includes('12:00:00'));
    
    dailyData.forEach(day => {
        const card = document.createElement('div');
        card.className = 'forecast-card';
        
        const date = new Date(day.dt_txt).toLocaleDateString('pt-BR', { 
            weekday: 'short', 
            day: '2-digit', 
            month: '2-digit' 
        });
        
        const temp = Math.round(day.main.temp);
        const icon = day.weather[0].icon;
        
        card.innerHTML = `
            <p>${date}</p>
            <img src="https://openweathermap.org/img/wn/${icon}.png" alt="${day.weather[0].description}">
            <p>${temp}°C</p>
        `;
        
        forecastCards.appendChild(card);
    });
    
    forecast.classList.remove('hidden');
}

// Buscar clima por cidade
async function getWeather() {
    const city = cityInput.value.trim();
    if (!city) {
        alert('Por favor, digite uma cidade!');
        return;
    }

    try {
        // Mostrar loading
        weatherResult.classList.add('hidden');
        forecast.classList.add('hidden');
        
        // Clima atual
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&lang=pt_br&units=metric`;
        const weatherResponse = await fetch(weatherUrl);
        
        if (!weatherResponse.ok) {
            throw new Error('Cidade não encontrada. Verifique o nome e tente novamente.');
        }
        
        const weatherData = await weatherResponse.json();
        
        // Atualizar todas as seções
        updateLocationInfo(weatherData);
        updateMainWeather(weatherData);
        updateWeatherDetails(weatherData);
        
        // Buscar índice UV (requer coordenadas)
        await fetchUVIndex(weatherData.coord.lat, weatherData.coord.lon);
        
        // Previsão
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&lang=pt_br&units=metric`;
        const forecastResponse = await fetch(forecastUrl);
        const forecastData = await forecastResponse.json();
        
        displayForecast(forecastData);
        
        weatherResult.classList.remove('hidden');
        
    } catch (error) {
        alert(error.message);
        weatherResult.classList.add('hidden');
        forecast.classList.add('hidden');
    }
}

// Buscar clima por localização
async function getWeatherByLocation() {
    if (!navigator.geolocation) {
        alert('Geolocalização não é suportada pelo seu navegador.');
        return;
    }

    try {
        // Mostrar loading
        weatherResult.classList.add('hidden');
        forecast.classList.add('hidden');
        
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        // Clima atual
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&lang=pt_br&units=metric`;
        const weatherResponse = await fetch(weatherUrl);
        
        if (!weatherResponse.ok) {
            throw new Error('Não foi possível obter dados para sua localização.');
        }
        
        const weatherData = await weatherResponse.json();
        
        // Atualizar todas as seções
        updateLocationInfo(weatherData);
        updateMainWeather(weatherData);
        updateWeatherDetails(weatherData);
        
        // Buscar índice UV
        await fetchUVIndex(lat, lon);
        
        // Previsão
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&lang=pt_br&units=metric`;
        const forecastResponse = await fetch(forecastUrl);
        const forecastData = await forecastResponse.json();
        
        displayForecast(forecastData);
        
        weatherResult.classList.remove('hidden');
        
    } catch (error) {
        if (error.code === error.PERMISSION_DENIED) {
            alert('Permissão de localização negada. Por favor, habilite a localização para usar este recurso.');
        } else {
            alert(error.message);
        }
        weatherResult.classList.add('hidden');
        forecast.classList.add('hidden');
    }
}

// Event Listeners
locationBtn.addEventListener('click', getWeatherByLocation);

// Permitir buscar pressionando Enter
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        getWeather();
    }
});