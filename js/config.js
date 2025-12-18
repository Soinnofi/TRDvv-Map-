// Конфигурация приложения
export const CONFIG = {
    // Настройки генерации
    MAP_SIZE: 256,
    MAP_DETAIL: 6,
    
    // Процессы симуляции
    TECTONICS_ENABLED: true,
    CLIMATE_ENABLED: true,
    EROSION_ENABLED: true,
    
    // Параметры тектоники
    NUM_PLATES: 10,
    PLATE_SPEED: 0.001,
    
    // Параметры климата
    SEASON_CYCLE: 10000, // лет
    TEMPERATURE_VARIATION: 0.1,
    
    // Параметры эрозии
    EROSION_RATE: 0.0001,
    DEPOSITION_RATE: 0.00005,
    
    // Стили планет
    PLANET_STYLES: {
        earth: {
            heightScale: 1.0,
            temperatureRange: [-20, 40],
            moistureRange: [0, 100],
            oceanLevel: 0.45,
            colors: {
                deepOcean: [0, 0, 100],
                shallowOcean: [0, 100, 200],
                beach: [238, 214, 175],
                grass: [34, 139, 34],
                forest: [0, 100, 0],
                mountain: [139, 137, 137],
                snow: [255, 255, 255]
            }
        },
        rocky: {
            heightScale: 2.5,
            temperatureRange: [-30, 60],
            moistureRange: [0, 20],
            oceanLevel: 0.3,
            colors: {
                deepOcean: [50, 50, 80],
                shallowOcean: [70, 70, 100],
                beach: [158, 134, 100],
                grass: [120, 120, 80],
                forest: [80, 80, 50],
                mountain: [100, 90, 80],
                snow: [230, 230, 230]
            }
        },
        mars: {
            heightScale: 3.0,
            temperatureRange: [-60, 20],
            moistureRange: [0, 10],
            oceanLevel: 0.2,
            colors: {
                deepOcean: [100, 0, 0],
                shallowOcean: [150, 50, 50],
                beach: [193, 154, 107],
                grass: [165, 42, 42],
                forest: [139, 0, 0],
                mountain: [178, 34, 34],
                snow: [255, 200, 200]
            }
        },
        gas: {
            heightScale: 0.3,
            temperatureRange: [-100, -50],
            moistureRange: [90, 100],
            oceanLevel: 0.6,
            colors: {
                deepOcean: [75, 0, 130],
                shallowOcean: [138, 43, 226],
                beach: [186, 85, 211],
                grass: [147, 112, 219],
                forest: [123, 104, 238],
                mountain: [106, 90, 205],
                snow: [255, 255, 255]
            }
        }
    }
};
