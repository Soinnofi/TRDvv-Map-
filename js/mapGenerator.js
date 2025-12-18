import { CONFIG } from './config.js';

// Генерация данных карты
export function generateMapData(seed, detailLevel, planetStyle) {
    const size = CONFIG.MAP_SIZE + detailLevel * 32;
    const simplex = new SimplexNoise(seed);
    
    const data = {
        height: [],
        temperature: [],
        moisture: [],
        windX: [],
        windY: [],
        clouds: [],
        precipitation: [],
        biome: [],
        plates: [],
        time: 0
    };
    
    const style = CONFIG.PLANET_STYLES[planetStyle];
    
    // Генерация высот
    for (let y = 0; y < size; y++) {
        data.height[y] = [];
        data.temperature[y] = [];
        data.moisture[y] = [];
        data.windX[y] = [];
        data.windY[y] = [];
        data.clouds[y] = [];
        data.precipitation[y] = [];
        data.biome[y] = [];
        data.plates[y] = [];
        
        for (let x = 0; x < size; x++) {
            const nx = x / size - 0.5;
            const ny = y / size - 0.5;
            
            // Фрактальный шум для высот
            let height = 0;
            let amplitude = 1;
            let frequency = 1;
            
            for (let i = 0; i < 6; i++) {
                height += simplex.noise2D(nx * frequency * 5, ny * frequency * 5) * amplitude;
                amplitude *= 0.5;
                frequency *= 2;
            }
            
            // Континенты
            const continent = Math.sqrt(nx*nx + ny*ny) * 2;
            height -= Math.max(0, continent - 0.5) * 0.5;
            height *= style.heightScale;
            
            data.height[y][x] = height;
            
            // Температура (зависит от широты)
            let temp = (1 - Math.abs(ny * 2)) * 0.7 + 0.15;
            temp -= Math.abs(height) * 0.3;
            temp += simplex.noise2D(nx * 3, ny * 3) * 0.2;
            data.temperature[y][x] = temp;
            
            // Влажность
            let moisture = simplex.noise2D(nx * 4 + 100, ny * 4 + 100) * 0.5 + 0.5;
            if (height > style.oceanLevel) moisture *= Math.max(0, 1 - (height - style.oceanLevel) * 2);
            data.moisture[y][x] = moisture;
            
            // Ветер
            const windAngle = simplex.noise2D(nx * 2, ny * 2) * Math.PI * 2;
            const windStrength = 0.3 + simplex.noise2D(nx * 3 + 200, ny * 3 + 200) * 0.4;
            data.windX[y][x] = Math.cos(windAngle) * windStrength;
            data.windY[y][x] = Math.sin(windAngle) * windStrength;
            
            // Облака
            let clouds = moisture * 0.6 + simplex.noise2D(nx * 5, ny * 5) * 0.4;
            if (height > style.oceanLevel + 0.2) clouds *= 0.5;
            data.clouds[y][x] = Math.max(0, Math.min(1, clouds));
            
            // Осадки
            let precip = clouds * moisture * 0.8;
            if (temp < 0.3) precip *= 0.3;
            data.precipitation[y][x] = precip;
            
            // Биом
            const biome = calculateBiome(height, temp, moisture, style.oceanLevel);
            data.biome[y][x] = biome;
            
            // Тектонические плиты
            const plate = Math.floor(simplex.noise2D(nx * 0.5, ny * 0.5) * CONFIG.NUM_PLATES) + CONFIG.NUM_PLATES;
            data.plates[y][x] = plate % CONFIG.NUM_PLATES;
        }
    }
    
    normalizeData(data);
    return data;
}

// Эволюция мира
export function evolveWorld(data, timeDelta) {
    if (!data.plates) {
        data.plates = Array(data.height.length).fill().map(() => 
            Array(data.height[0].length).fill(0)
        );
    }
    
    data.time += timeDelta;
    return data;
}

// Расчет биома
function calculateBiome(height, temperature, moisture, oceanLevel) {
    if (height < oceanLevel) return 0; // Океан
    
    if (temperature < 0.3) {
        if (moisture > 0.6) return 1; // Тундра
        return 2; // Ледник
    } else if (temperature < 0.5) {
        if (moisture > 0.7) return 3; // Тайга
        if (moisture > 0.4) return 4; // Степь
        return 5; // Холодная пустыня
    } else if (temperature < 0.7) {
        if (moisture > 0.7) return 6; // Лиственный лес
        if (moisture > 0.4) return 7; // Саванна
        return 8; // Пустыня
    } else {
        if (moisture > 0.7) return 9; // Тропический лес
        if (moisture > 0.4) return 10; // Тропическая саванна
        return 11; // Горячая пустыня
    }
}

// Нормализация данных
function normalizeData(data) {
    for (const key in data) {
        if (Array.isArray(data[key]) && data[key][0] && Array.isArray(data[key][0])) {
            const size = data[key].length;
            let min = Infinity;
            let max = -Infinity;
            
            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const val = data[key][y][x];
                    if (val < min) min = val;
                    if (val > max) max = val;
                }
            }
            
            const range = max - min || 1;
            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    data[key][y][x] = (data[key][y][x] - min) / range;
                }
            }
        }
    }
}
