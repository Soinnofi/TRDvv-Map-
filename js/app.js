// Главный файл приложения
import { generateMapData, evolveWorld } from './mapGenerator.js';
import { initGlobeScene, updateGlobe, animateGlobe } from './globe3d.js';
import { simulateWeather, simulateErosion } from './weatherSimulation.js';
import { getColorForMapType, createTextureFromData, resizeCanvas } from './utils.js';
import { simulateTectonics } from './plateTectonics.js';
import { CONFIG } from './config.js';

// Глобальные переменные
let canvas, ctx;
let mapData = {};
let currentSeed = "TRDvvDynamicMap";
let currentMapType = "height";
let currentPlanetStyle = "earth";
let isNightMode = false;
let isSimulationRunning = true;
let currentView = "2d";
let simulationTime = 0;
let simulationSpeed = 50;
let lastUpdateTime = 0;

// Элементы DOM
let loadingElement, timeDisplayElement;

// Инициализация приложения
async function initApp() {
    // Получаем элементы DOM
    canvas = document.getElementById('mapCanvas');
    ctx = canvas.getContext('2d');
    loadingElement = document.getElementById('loading');
    timeDisplayElement = document.getElementById('currentTime');
    
    // Настраиваем размеры canvas
    resizeCanvas(canvas);
    window.addEventListener('resize', () => resizeCanvas(canvas));
    
    // Инициализируем 3D сцену
    initGlobeScene('globeContainer');
    
    // Настраиваем обработчики событий
    setupEventListeners();
    
    // Генерируем начальный мир
    await generateWorld();
    
    // Запускаем анимацию
    requestAnimationFrame(animate);
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Кнопка генерации мира
    document.getElementById('generateBtn').addEventListener('click', () => generateWorld());
    
    // Кнопка паузы
    document.getElementById('pauseBtn').addEventListener('click', toggleSimulation);
    
    // Поле ввода seed
    document.getElementById('seedInput').addEventListener('change', function() {
        currentSeed = this.value;
        generateWorld();
    });
    
    // Выбор скорости симуляции
    document.getElementById('speedSelect').addEventListener('change', function() {
        simulationSpeed = parseInt(this.value);
    });
    
    // Переключение стилей планеты
    document.querySelectorAll('.planet-style-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.planet-style-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentPlanetStyle = this.dataset.style;
            generateWorld();
        });
    });
    
    // Переключение типов карты
    document.querySelectorAll('.map-type-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.map-type-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentMapType = this.dataset.type;
            updateDisplay();
        });
    });
    
    // Переключение видов
    document.getElementById('view2DBtn').addEventListener('click', () => switchView('2d'));
    document.getElementById('view3DBtn').addEventListener('click', () => switchView('3d'));
    
    // Переключение тумблеров
    document.getElementById('nightToggle').addEventListener('change', function() {
        isNightMode = this.checked;
        updateDisplay();
    });
    
    document.getElementById('erosionToggle').addEventListener('change', function() {
        CONFIG.EROSION_ENABLED = this.checked;
    });
    
    document.getElementById('tectonicsToggle').addEventListener('change', function() {
        CONFIG.TECTONICS_ENABLED = this.checked;
    });
    
    document.getElementById('climateToggle').addEventListener('change', function() {
        CONFIG.CLIMATE_ENABLED = this.checked;
    });
    
    // Детализация
    document.getElementById('detailLevel').addEventListener('input', function() {
        CONFIG.MAP_DETAIL = parseInt(this.value);
        generateWorld();
    });
}

// Генерация мира
async function generateWorld() {
    showLoading(true);
    
    // Получаем seed
    currentSeed = document.getElementById('seedInput').value || currentSeed;
    
    // Генерируем карту
    mapData = await generateMapData(currentSeed, CONFIG.MAP_DETAIL, currentPlanetStyle);
    
    // Сбрасываем время
    simulationTime = 0;
    timeDisplayElement.textContent = "0";
    
    // Обновляем отображение
    updateDisplay();
    updateGlobe(mapData, currentMapType, currentPlanetStyle, isNightMode);
    
    // Обновляем статистику
    updateStats();
    
    showLoading(false);
}

// Переключение симуляции
function toggleSimulation() {
    isSimulationRunning = !isSimulationRunning;
    const pauseBtn = document.getElementById('pauseBtn');
    const icon = pauseBtn.querySelector('i');
    
    if (isSimulationRunning) {
        pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Пауза';
    } else {
        pauseBtn.innerHTML = '<i class="fas fa-play"></i> Продолжить';
    }
}

// Переключение вида
function switchView(view) {
    currentView = view;
    
    // Обновляем кнопки
    document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
    if (view === '2d') {
        document.getElementById('view2DBtn').classList.add('active');
        document.getElementById('mapCanvas').classList.remove('hidden');
        document.getElementById('globeContainer').classList.add('hidden');
    } else {
        document.getElementById('view3DBtn').classList.add('active');
        document.getElementById('mapCanvas').classList.add('hidden');
        document.getElementById('globeContainer').classList.remove('hidden');
    }
    
    updateDisplay();
}

// Обновление отображения
function updateDisplay() {
    if (currentView === '2d') {
        render2DMap();
    } else {
        updateGlobe(mapData, currentMapType, currentPlanetStyle, isNightMode);
    }
    updateLegend();
}

// Рендер 2D карты
function render2DMap() {
    const width = canvas.width;
    const height = canvas.height;
    const size = mapData.height.length;
    const cellWidth = width / size;
    const cellHeight = height / size;
    
    // Очищаем canvas
    ctx.clearRect(0, 0, width, height);
    
    // Фон для ночного режима
    if (isNightMode) {
        ctx.fillStyle = '#0a1929';
        ctx.fillRect(0, 0, width, height);
    }
    
    // Рендерим карту
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const value = mapData[currentMapType][y][x];
            const color = getColorForMapType(currentMapType, value, mapData, x, y, currentPlanetStyle, isNightMode);
            
            ctx.fillStyle = color;
            ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth + 1, cellHeight + 1);
            
            // Для карты ветра рисуем стрелки
            if (currentMapType === 'wind' && mapData.windX && mapData.windY) {
                drawWindArrow(x * cellWidth + cellWidth/2, y * cellHeight + cellHeight/2, 
                            mapData.windX[y][x], mapData.windY[y][x], cellWidth * 0.8);
            }
        }
    }
}

// Рисование стрелки ветра
function drawWindArrow(x, y, dx, dy, length) {
    const strength = Math.sqrt(dx*dx + dy*dy);
    if (strength < 0.1) return;
    
    const arrowLength = length * strength;
    const angle = Math.atan2(dy, dx);
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    
    // Линия
    ctx.strokeStyle = isNightMode ? '#aaa' : '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(arrowLength, 0);
    ctx.stroke();
    
    // Наконечник
    ctx.fillStyle = isNightMode ? '#aaa' : '#000';
    ctx.beginPath();
    ctx.moveTo(arrowLength, 0);
    ctx.lineTo(arrowLength - 5, -5);
    ctx.lineTo(arrowLength - 5, 5);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
}

// Обновление легенды
function updateLegend() {
    const legendContent = document.getElementById('legendContent');
    // Легенда будет обновляться в утилитах
}

// Обновление статистики
function updateStats() {
    if (!mapData.height) return;
    
    const size = mapData.height.length;
    const midY = Math.floor(size / 2);
    const midX = Math.floor(size / 2);
    
    document.getElementById('statHeight').textContent = 
        Math.round((mapData.height[midY][midX] - 0.5) * 10000);
    
    document.getElementById('statTemp').textContent = 
        Math.round((mapData.temperature[midY][midX] - 0.5) * 60);
    
    document.getElementById('statMoisture').textContent = 
        Math.round(mapData.moisture[midY][midX] * 100);
    
    document.getElementById('statClouds').textContent = 
        Math.round((mapData.clouds?.[midY]?.[midX] || 0) * 100);
    
    if (mapData.windX && mapData.windY) {
        const windSpeed = Math.sqrt(
            Math.pow(mapData.windX[midY][midX], 2) + 
            Math.pow(mapData.windY[midY][midX], 2)
        );
        document.getElementById('statWind').textContent = 
            Math.round(windSpeed * 20);
    }
}

// Показать/скрыть загрузку
function showLoading(show) {
    if (show) {
        loadingElement.classList.remove('hidden');
    } else {
        loadingElement.classList.add('hidden');
    }
}

// Основной цикл анимации
function animate(currentTime) {
    requestAnimationFrame(animate);
    
    // Обновление 3D глобуса
    if (currentView === '3d') {
        animateGlobe();
    }
    
    // Симуляция мира
    if (isSimulationRunning) {
        const deltaTime = currentTime - lastUpdateTime;
        
        if (deltaTime > simulationSpeed) {
            simulateWorld();
            lastUpdateTime = currentTime;
        }
    }
}

// Симуляция мира
function simulateWorld() {
    // Увеличиваем время
    simulationTime += 1000; // 1000 лет за шаг
    timeDisplayElement.textContent = Math.floor(simulationTime / 1000);
    
    // Применяем процессы
    if (CONFIG.TECTONICS_ENABLED) {
        mapData = simulateTectonics(mapData);
    }
    
    if (CONFIG.CLIMATE_ENABLED) {
        mapData = simulateWeather(mapData, simulationTime);
    }
    
    if (CONFIG.EROSION_ENABLED) {
        mapData = simulateErosion(mapData);
    }
    
    // Обновляем отображение
    updateDisplay();
    
    // Обновляем статистику каждые 10 шагов
    if (simulationTime % 10000 === 0) {
        updateStats();
    }
}

// Экспортируем функции для отладки
window.app = {
    generateWorld,
    toggleSimulation,
    switchView,
    getMapData: () => mapData
};

// Запускаем приложение при загрузке
document.addEventListener('DOMContentLoaded', initApp);
