import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
import { getColorForMapType } from './utils.js';

let scene, camera, renderer, globe;
let isInitialized = false;

// Инициализация 3D сцены
export function initGlobeScene(containerId) {
    const container = document.getElementById(containerId);
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1929);
    
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 3;
    
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    
    // Освещение
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);
    
    // Обработка изменения размера
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
    
    isInitialized = true;
}

// Обновление глобуса
export function updateGlobe(data, mapType, planetStyle, isNightMode) {
    if (!isInitialized) return;
    
    // Удаляем старый глобус
    if (globe) {
        scene.remove(globe);
        globe.geometry.dispose();
        globe.material.dispose();
    }
    
    // Создаем текстуру
    const texture = createGlobeTexture(data, mapType, planetStyle, isNightMode);
    
    // Создаем геометрию сферы
    const geometry = new THREE.SphereGeometry(1, 64, 64);
    
    // Создаем материал
    const material = new THREE.MeshPhongMaterial({
        map: texture,
        shininess: 5,
        specular: new THREE.Color(0x111111)
    });
    
    // Создаем меш
    globe = new THREE.Mesh(geometry, material);
    scene.add(globe);
    
    // Добавляем атмосферу
    addAtmosphere(isNightMode);
}

// Создание текстуры для глобуса
function createGlobeTexture(data, mapType, planetStyle, isNightMode) {
    const size = data.height.length;
    const canvas = document.createElement('canvas');
    canvas.width = size * 2;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Заполняем текстуру
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size * 2; x++) {
            // Сферические координаты
            const lon = (x / (size * 2)) * 2 * Math.PI - Math.PI;
            const lat = (y / size) * Math.PI - Math.PI / 2;
            
            // Проекция Меркатора (упрощенная)
            const mapX = Math.floor((lon + Math.PI) / (2 * Math.PI) * size);
            const mapY = Math.floor((lat + Math.PI/2) / Math.PI * size);
            
            const safeX = Math.max(0, Math.min(size - 1, mapX));
            const safeY = Math.max(0, Math.min(size - 1, mapY));
            
            const value = data[mapType][safeY][safeX];
            const color = getColorForMapType(mapType, value, data, safeX, safeY, planetStyle, isNightMode);
            
            ctx.fillStyle = color;
            ctx.fillRect(x, y, 1, 1);
        }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

// Добавление атмосферы
function addAtmosphere(isNightMode) {
    // Удаляем старую атмосферу
    scene.children = scene.children.filter(child => 
        child.userData && child.userData.isAtmosphere);
    
    const geometry = new THREE.SphereGeometry(1.05, 64, 64);
    const material = new THREE.MeshPhongMaterial({
        color: isNightMode ? 0x222244 : 0x4488ff,
        transparent: true,
        opacity: 0.15,
        side: THREE.BackSide
    });
    
    const atmosphere = new THREE.Mesh(geometry, material);
    atmosphere.userData = { isAtmosphere: true };
    scene.add(atmosphere);
}

// Анимация глобуса
export function animateGlobe() {
    if (globe) {
        globe.rotation.y += 0.001;
        renderer.render(scene, camera);
    }
}
