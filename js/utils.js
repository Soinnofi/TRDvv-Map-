import { CONFIG } from './config.js';

// Получение цвета для типа карты
export function getColorForMapType(mapType, value, data, x, y, planetStyle, isNightMode) {
    const style = CONFIG.PLANET_STYLES[planetStyle];
    
    switch(mapType) {
        case 'height':
            return getHeightColor(value, style, isNightMode);
            
        case 'temperature':
            return getTemperatureColor(value, isNightMode);
            
        case 'moisture':
            return getMoistureColor(value, isNightMode);
            
        case 'wind':
            if (data.windX && data.windY) {
                const windSpeed = Math.sqrt(
                    Math.pow(data.windX[y][x], 2) + 
                    Math.pow(data.windY[y][x], 2)
                );
                return getWindColor(windSpeed, isNightMode);
            }
            return '#0000ff';
            
        case 'clouds':
            return getCloudColor(value, isNightMode);
            
        case 'precipitation':
            return getPrecipitationColor(value, isNightMode);
            
        case 'biome':
            return getBiomeColor(value, isNightMode);
            
        case 'plates':
            return getPlateColor(data.plates[y][x], isNightMode);
            
        default:
            return getHeightColor(value, style, isNightMode);
    }
}

// Цвета для высот
function getHeightColor(value, style, isNightMode) {
    let r, g, b;
    
    if (value < style.oceanLevel - 0.1) {
        // Глубокий океан
        [r, g, b] = style.colors.deepOcean;
    } else if (value < style.oceanLevel) {
        // Мелкий океан
        [r, g, b] = style.colors.shallowOcean;
    } else if (value < style.oceanLevel + 0.05) {
        // Пляж
        [r, g, b] = style.colors.beach;
    } else if (value < style.oceanLevel + 0.2) {
        // Равнины
        [r, g, b] = style.colors.grass;
    } else if (value < style.oceanLevel + 0.4) {
        // Леса/Холмы
        [r, g, b] = style.colors.forest;
    } else if (value < style.oceanLevel + 0.7) {
        // Горы
        [r, g, b] = style.colors.mountain;
    } else {
        // Высокие горы/Снег
        [r, g, b] = style.colors.snow;
    }
    
    if (isNightMode) {
        r = Math.floor(r * 0.5);
        g = Math.floor(g * 0.5);
        b = Math.floor(b * 0.5);
    }
    
    return `rgb(${r}, ${g}, ${b})`;
}

// Цвета для температуры
function getTemperatureColor(value, isNightMode) {
    let r, g, b;
    
    if (value < 0.2) {
        r = 0; g = 100; b = 255; // Очень холодно
    } else if (value < 0.4) {
        r = 0; g = 200; b = 255; // Холодно
    } else if (value < 0.6) {
        r = 255; g = 255; b = 100; // Умеренно
    } else if (value < 0.8) {
        r = 255; g = 150; b = 0; // Тепло
    } else {
        r = 255; g = 0; b = 0; // Жарко
    }
    
    if (isNightMode) {
        r = Math.floor(r * 0.6);
        g = Math.floor(g * 0.6);
        b = Math.floor(b * 0.6);
    }
    
    return `rgb(${r}, ${g}, ${b})`;
}

// Цвета для влажности
function getMoistureColor(value, isNightMode) {
    const intensity = Math.floor(value * 255);
    let color;
    
    if (value < 0.3) {
        color = `rgb(${139 + intensity}, ${69 + intensity}, ${19 + intensity})`;
    } else if (value < 0.7) {
        const green = Math.floor(100 + value * 155);
        color = `rgb(0, ${green}, 0)`;
    } else {
        const blue = Math.floor(100 + value * 155);
        color = `rgb(0, 0, ${blue})`;
    }
    
    if (isNightMode) {
        return darkenColor(color, 0.6);
    }
    
    return color;
}

// Цвета для ветра
function getWindColor(strength, isNightMode) {
    const intensity = Math.floor(strength * 255);
    const color = `rgb(${intensity}, ${intensity}, ${100 + intensity})`;
    
    if (isNightMode) {
        return darkenColor(color, 0.6);
    }
    
    return color;
}

// Цвета для облаков
function getCloudColor(value, isNightMode) {
    const alpha = Math.floor(value * 200);
    if (isNightMode) {
        return `rgba(150, 150, 200, ${alpha/255})`;
    }
    return `rgba(255, 255, 255, ${alpha/255})`;
}

// Цвета для осадков
function getPrecipitationColor(value, isNightMode) {
    const intensity = Math.floor(value * 255);
    if (isNightMode) {
        return `rgb(0, 0, ${Math.floor(intensity * 0.7)})`;
    }
    return `rgb(0, 0, ${intensity})`;
}

// Цвета для биомов
function getBiomeColor(value, isNightMode) {
    const biomeColors = [
        [0, 0, 150],     // 0: Океан
        [200, 240, 255], // 1: Тундра
        [255, 255, 255], // 2: Ледник
        [34, 139, 34],   // 3: Тайга
        [189, 183, 107], // 4: Степь
        [210, 180, 140], // 5: Холодная пустыня
        [0, 100, 0],     // 6: Лиственный лес
        [255, 255, 0],   // 7: Саванна
        [210, 180, 140], // 8: Пустыня
        [0, 60, 0],      // 9: Тропический лес
        [238, 232, 170], // 10: Тропическая саванна
        [255, 200, 150]  // 11: Горячая пустыня
    ];
    
    const index = Math.min(Math.floor(value * biomeColors.length), biomeColors.length - 1);
    let [r, g, b] = biomeColors[index];
    
    if (isNightMode) {
        r = Math.floor(r * 0.5);
        g = Math.floor(g * 0.5);
        b = Math.floor(b * 0.5);
    }
    
    return `rgb(${r}, ${g}, ${b})`;
}

// Цвета для плит
function getPlateColor(plateId, isNightMode) {
    const hue = (plateId * 137) % 360;
    const saturation = 80;
    const lightness = isNightMode ? 40 : 60;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// Затемнение цвета
function darkenColor(color, factor) {
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!match) return color;
    
    const r = Math.floor(parseInt(match[1]) * factor);
    const g = Math.floor(parseInt(match[2]) * factor);
    const b = Math.floor(parseInt(match[3]) * factor);
    
    return `rgb(${r}, ${g}, ${b})`;
}

// Создание текстуры из данных
export function createTextureFromData(data, width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    const imageData = ctx.createImageData(width, height);
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = (y * width + x) * 4;
            const value = data[y][x] * 255;
            
            imageData.data[index] = value;
            imageData.data[index + 1] = value;
            imageData.data[index + 2] = value;
            imageData.data[index + 3] = 255;
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas;
}

// Изменение размера canvas
export function resizeCanvas(canvas) {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}
