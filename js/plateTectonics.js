import { CONFIG } from './config.js';

// Симуляция тектоники плит
export function simulateTectonics(data) {
    if (!data.plates || data.plates.length === 0) {
        initializePlates(data);
    }
    
    const size = data.height.length;
    const plateMovements = calculatePlateMovements(data);
    
    // Применяем движения плит к высотам
    const newHeight = data.height.map(row => [...row]);
    
    for (let y = 1; y < size - 1; y++) {
        for (let x = 1; x < size - 1; x++) {
            const plate = data.plates[y][x];
            const movement = plateMovements[plate];
            
            if (movement) {
                // Смещение высоты в направлении движения
                const strength = Math.random() * CONFIG.PLATE_SPEED;
                const nx = x + Math.sign(movement.x);
                const ny = y + Math.sign(movement.y);
                
                if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
                    // Если плиты сталкиваются - образуются горы
                    if (data.plates[ny][nx] !== plate) {
                        newHeight[y][x] += strength * 2;
                        newHeight[ny][nx] += strength;
                    } 
                    // Если плиты расходятся - образуются впадины
                    else if (Math.random() < 0.1) {
                        newHeight[y][x] -= strength * 0.5;
                    }
                }
            }
        }
    }
    
    // Сглаживаем высоты
    for (let y = 1; y < size - 1; y++) {
        for (let x = 1; x < size - 1; x++) {
            let sum = 0;
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    sum += newHeight[y + dy][x + dx];
                }
            }
            data.height[y][x] = sum / 9;
        }
    }
    
    return data;
}

// Инициализация плит
function initializePlates(data) {
    const size = data.height.length;
    data.plates = Array(size).fill().map(() => Array(size).fill(0));
    
    // Используем шум для создания плит
    const simplex = new SimplexNoise('plates' + Date.now());
    
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const nx = x / size - 0.5;
            const ny = y / size - 0.5;
            
            const plateValue = simplex.noise2D(nx * 0.3, ny * 0.3);
            data.plates[y][x] = Math.floor((plateValue + 1) * 0.5 * CONFIG.NUM_PLATES);
        }
    }
}

// Расчет движений плит
function calculatePlateMovements(data) {
    const movements = [];
    
    for (let i = 0; i < CONFIG.NUM_PLATES; i++) {
        // Каждая плита движется в случайном направлении
        const angle = Math.random() * Math.PI * 2;
        movements.push({
            x: Math.cos(angle) * CONFIG.PLATE_SPEED,
            y: Math.sin(angle) * CONFIG.PLATE_SPEED
        });
    }
    
    return movements;
}
