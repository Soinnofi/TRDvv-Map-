import { CONFIG } from './config.js';

// Симуляция погоды
export function simulateWeather(data, time) {
    const size = data.height.length;
    const season = Math.sin(time / CONFIG.SEASON_CYCLE * Math.PI * 2) * 0.1;
    
    // Новые массивы для обновленных данных
    const newTemp = Array(size).fill().map(() => Array(size).fill(0));
    const newMoisture = Array(size).fill().map(() => Array(size).fill(0));
    const newClouds = Array(size).fill().map(() => Array(size).fill(0));
    const newPrecipitation = Array(size).fill().map(() => Array(size).fill(0));
    const newWindX = Array(size).fill().map(() => Array(size).fill(0));
    const newWindY = Array(size).fill().map(() => Array(size).fill(0));
    
    // Симуляция температуры
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const ny = y / size - 0.5;
            
            // Базовая температура от широты
            let temp = (1 - Math.abs(ny * 2)) * 0.7 + 0.15;
            
            // Сезонные изменения
            temp += season * (1 - Math.abs(ny * 2));
            
            // Высота влияет на температуру
            temp -= Math.abs(data.height[y][x] - 0.5) * 0.3;
            
            // Влияние океанов
            if (data.height[y][x] < 0.45) {
                temp += 0.1; // Океаны смягчают температуру
            }
            
            // Случайные вариации
            const variation = (Math.random() * 2 - 1) * CONFIG.TEMPERATURE_VARIATION;
            temp += variation;
            
            // Сглаживание с предыдущим значением
            temp = (data.temperature[y][x] * 0.7 + temp * 0.3);
            newTemp[y][x] = Math.max(0, Math.min(1, temp));
        }
    }
    
    // Симуляция ветра и влажности
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            // Ветер переносит влагу и тепло
            if (x > 0 && x < size - 1 && y > 0 && y < size - 1) {
                // Простая модель адвекции
                const u = data.windX[y][x];
                const v = data.windY[y][x];
                
                // Новый ветер с турбулентностью
                newWindX[y][x] = u * 0.8 + (Math.random() * 0.4 - 0.2);
                newWindY[y][x] = v * 0.8 + (Math.random() * 0.4 - 0.2);
                
                // Влажность переносится ветром
                const dx = Math.round(u * 2);
                const dy = Math.round(v * 2);
                const srcX = Math.max(0, Math.min(size - 1, x - dx));
                const srcY = Math.max(0, Math.min(size - 1, y - dy));
                
                newMoisture[y][x] = data.moisture[srcY][srcX] * 0.8 + 
                                   data.moisture[y][x] * 0.2;
                
                // Испарение с океанов
                if (data.height[y][x] < 0.45) {
                    newMoisture[y][x] += 0.05;
                }
                
                // Конденсация в облака
                const cloudFormation = newMoisture[y][x] * (1 - newTemp[y][x]) * 0.5;
                newClouds[y][x] = Math.min(1, data.clouds[y][x] * 0.8 + cloudFormation);
                
                // Осадки из облаков
                const precipChance = newClouds[y][x] * newMoisture[y][x] * 0.3;
                if (Math.random() < precipChance) {
                    newPrecipitation[y][x] = newClouds[y][x] * 0.5;
                    newClouds[y][x] *= 0.5;
                    newMoisture[y][x] += newPrecipitation[y][x] * 0.3;
                }
            }
        }
    }
    
    // Обновляем данные
    data.temperature = newTemp;
    data.moisture = newMoisture.map(row => row.map(v => Math.min(1, Math.max(0, v))));
    data.clouds = newClouds;
    data.precipitation = newPrecipitation;
    data.windX = newWindX;
    data.windY = newWindY;
    
    // Обновляем биомы
    updateBiomes(data);
    
    return data;
}

// Симуляция эрозии
export function simulateErosion(data) {
    const size = data.height.length;
    const newHeight = data.height.map(row => [...row]);
    
    for (let y = 1; y < size - 1; y++) {
        for (let x = 1; x < size - 1; x++) {
            if (data.height[y][x] > 0.45) { // Только на суше
                // Находим направление наибольшего уклона
                let maxSlope = 0;
                let targetX = x;
                let targetY = y;
                
                // Проверяем соседей
                const neighbors = [
                    {dx: -1, dy: -1}, {dx: 0, dy: -1}, {dx: 1, dy: -1},
                    {dx: -1, dy: 0}, {dx: 1, dy: 0},
                    {dx: -1, dy: 1}, {dx: 0, dy: 1}, {dx: 1, dy: 1}
                ];
                
                for (const n of neighbors) {
                    const nx = x + n.dx;
                    const ny = y + n.dy;
                    const slope = data.height[y][x] - data.height[ny][nx];
                    
                    if (slope > maxSlope && data.height[ny][nx] < data.height[y][x]) {
                        maxSlope = slope;
                        targetX = nx;
                        targetY = ny;
                    }
                }
                
                if (maxSlope > 0.01) {
                    // Перенос материала
                    const erosionAmount = maxSlope * CONFIG.EROSION_RATE * 
                                         (data.precipitation[y][x] + 0.1);
                    
                    newHeight[y][x] -= erosionAmount;
                    newHeight[targetY][targetX] += erosionAmount * CONFIG.DEPOSITION_RATE;
                    
                    // Увеличиваем влажность в низинах
                    if (data.moisture) {
                        data.moisture[targetY][targetX] = Math.min(1, 
                            data.moisture[targetY][targetX] + erosionAmount * 0.1);
                    }
                }
            }
        }
    }
    
    data.height = newHeight;
    return data;
}

// Обновление биомов
function updateBiomes(data) {
    const size = data.height.length;
    
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const height = data.height[y][x];
            const temp = data.temperature[y][x];
            const moisture = data.moisture[y][x];
            
            // Простая логика биомов
            if (height < 0.45) {
                data.biome[y][x] = 0; // Океан
            } else if (temp < 0.3) {
                data.biome[y][x] = moisture > 0.6 ? 1 : 2; // Тундра или ледник
            } else if (temp < 0.5) {
                if (moisture > 0.7) data.biome[y][x] = 3; // Тайга
                else if (moisture > 0.4) data.biome[y][x] = 4; // Степь
                else data.biome[y][x] = 5; // Холодная пустыня
            } else if (temp < 0.7) {
                if (moisture > 0.7) data.biome[y][x] = 6; // Лиственный лес
                else if (moisture > 0.4) data.biome[y][x] = 7; // Саванна
                else data.biome[y][x] = 8; // Пустыня
            } else {
                if (moisture > 0.7) data.biome[y][x] = 9; // Тропический лес
                else if (moisture > 0.4) data.biome[y][x] = 10; // Тропическая саванна
                else data.biome[y][x] = 11; // Горячая пустыня
            }
        }
    }
}
