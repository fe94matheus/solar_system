import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import getStarfield from './getStarfield.js';

// Astronomical constants (in astronomical units - AU)
const AU = 149597870.7; // 1 AU in kilometers
const SUN_SCALE_FACTOR = 1 / 3000000;
const SCALE_FACTOR = 1 / 100000; // Scaling factor to make visualization manageable
const ORBIT_SCALE_FACTOR = 1;
/*
CELESTIAL_OBJ: {
        semiMajorAxis: , // Average distance to sun in AU - Earth is 1 AU.
        eccentricity:  , // How elliptical Earth's orbit is (0 would be perfectly circular)
        orbitalPeriod: , // Days to complete one orbit around the Sun
        rotationPeriod:, // Days to complete one rotation on its axis
        axialTilt:     , // Degrees of tilt in Earth's rotational axis
        radius: 6371 * SCALE_FACTOR // Earth's radius in kilometers, scaled down
    },

*/

const PLANETARY_DATA = {
    SUN: {
        radius: 696340 * SUN_SCALE_FACTOR,     // Sun's radius in kilometers
        rotationPeriod: 27,                // Solar rotation period at equator
        axialTilt: 7.25,                   // Tilt relative to orbital plane
        position: { x: 0, y: 0, z: 0 }     // Center of the solar system
    },
    MERCURY: {
        semiMajorAxis: 0.387 * ORBIT_SCALE_FACTOR,              // Closest planet to Sun at 0.387 AU
        eccentricity: 0.206,               // Most eccentric orbit of all planets
        orbitalPeriod: 88,                 // Orbital period in Earth days
        rotationPeriod: 58.6,              // Longest day-to-night cycle
        axialTilt: 0.034,                  // Almost no tilt
        radius: 2439.7 * SCALE_FACTOR      // Smallest planet
    },
    VENUS: {
        semiMajorAxis: 0.723 * ORBIT_SCALE_FACTOR,              // Second planet from Sun
        eccentricity: 0.007,               // Nearly circular orbit
        orbitalPeriod: 224.7,              // Venus year in Earth days
        rotationPeriod: -243,              // Retrograde rotation (spins backwards)
        axialTilt: 177.4,                  // Nearly upside down
        radius: 6051.8 * SCALE_FACTOR      // Similar size to Earth
    },
    EARTH: {
        semiMajorAxis: 1 * ORBIT_SCALE_FACTOR,                  // Definition of 1 AU
        eccentricity: 0.017,               // Nearly circular orbit
        orbitalPeriod: 365.25,             // One Earth year
        rotationPeriod: 1,                 // One Earth day
        axialTilt: 23.44,                  // Causes our seasons
        radius: 6371 * SCALE_FACTOR        // Reference for terrestrial planets
    },
    MARS: {
        semiMajorAxis: 1.524 * ORBIT_SCALE_FACTOR,              // Fourth planet from Sun
        eccentricity: 0.093,               // Moderately elliptical orbit
        orbitalPeriod: 687,                // Mars year in Earth days
        rotationPeriod: 1.03,              // Similar day length to Earth
        axialTilt: 25.19,                  // Similar seasons to Earth
        radius: 3389.5 * SCALE_FACTOR      // About half Earth's size
    },
    JUPITER: {
        semiMajorAxis: 5.203 * ORBIT_SCALE_FACTOR,              // First gas giant
        eccentricity: 0.048,               // Fairly circular orbit
        orbitalPeriod: 4333,               // Nearly 12 Earth years
        rotationPeriod: 0.41,              // Fastest rotating planet
        axialTilt: 3.13,                   // Very small tilt
        radius: 69911 * SCALE_FACTOR       // Largest planet
    },
    SATURN: {
        semiMajorAxis: 9.537 * ORBIT_SCALE_FACTOR,              // Second largest planet
        eccentricity: 0.054,               // Similar to Jupiter's orbit
        orbitalPeriod: 10759,              // About 29.5 Earth years
        rotationPeriod: 0.44,              // Fast rotation like Jupiter
        axialTilt: 26.73,                  // Similar to Earth's tilt
        radius: 58232 * SCALE_FACTOR       // Known for its ring system
    },
    URANUS: {
        semiMajorAxis: 19.191 * ORBIT_SCALE_FACTOR,             // First ice giant
        eccentricity: 0.047,               // Fairly circular orbit
        orbitalPeriod: 30687,              // 84 Earth years
        rotationPeriod: -0.72,             // Retrograde rotation
        axialTilt: 97.77,                  // Rolls along its orbital plane
        radius: 25362 * SCALE_FACTOR       // Ice giant planet
    },
    NEPTUNE: {
        semiMajorAxis: 30.069 * ORBIT_SCALE_FACTOR,             // Outermost planet
        eccentricity: 0.009,               // Most circular orbit
        orbitalPeriod: 60190,              // 165 Earth years
        rotationPeriod: 0.67,              // 16 Earth hours
        axialTilt: 28.32,                  // Similar to Earth's tilt
        radius: 24622 * SCALE_FACTOR       // Slightly smaller than Uranus
    }
};




class CelestialBody {
    constructor({
        radius,
        textureMap,
        rotationPeriod,
        axialTilt,
        semiMajorAxis,
        eccentricity,
        orbitalPeriod,
        position = { x: 0, y: 0, z: 0 },
        scale = 1,
        isSun = false
    }) {
        this.geometry = new THREE.IcosahedronGeometry(radius, 8);
        this.orbitalPeriod = orbitalPeriod;
        this.semiMajorAxis = semiMajorAxis;
        this.eccentricity = eccentricity;
        this.currentTime = 0;

        // Convert rotation period to radians per frame (assuming 60 fps)
        this.rotationSpeed = rotationPeriod ? (2 * Math.PI) / (rotationPeriod * 24 * 60 * 60 * 60) : 0;

        const loader = new THREE.TextureLoader();


        if (isSun) {
            // Create an enhanced material for the sun with proper circular glow
            this.material = new THREE.ShaderMaterial({
                uniforms: {
                    sunTexture: { value: textureMap ? loader.load(textureMap) : null },
                    time: { value: 0 },
                    viewVector: { value: new THREE.Vector3(0, 0, 1) }
                },
                vertexShader: `
                    varying vec2 vUv;
                    varying vec3 vNormal;
                    varying vec3 vViewPosition;
                    
                    void main() {
                        vUv = uv;
                        vNormal = normalize(normalMatrix * normal);
                        
                        // Calculate view position for proper rim lighting
                        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                        vViewPosition = normalize(cameraPosition - worldPosition.xyz);
                        
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform sampler2D sunTexture;
                    uniform float time;
                    
                    varying vec2 vUv;
                    varying vec3 vNormal;
                    varying vec3 vViewPosition;
                    
                    void main() {
                        // Sample the sun texture
                        vec4 texColor = texture2D(sunTexture, vUv);
                        
                        // Create pulsing effect using sine wave
                        float pulse = sin(time * 2.0) * 0.1 + 0.9;
                        
                        // Calculate proper circular rim light
                        float fresnel = dot(vNormal, vViewPosition);
                        float rimLight = smoothstep(0.0, 1.0, 1.0 - fresnel);
                        
                        // Create a soft circular glow
                        float glowIntensity = pow(rimLight, 2.0);
                        
                        // Add subtle surface detail variation
                        float detail = sin(vUv.x * 20.0 + time) * sin(vUv.y * 20.0 + time) * 0.1;
                        
                        // Combine all effects
                        vec3 baseColor = texColor.rgb * 1.5 * pulse;
                        vec3 glowColor = vec3(1.0, 0.6, 0.2) * glowIntensity;
                        vec3 detailColor = vec3(1.0, 0.8, 0.4) * detail;
                        
                        vec3 finalColor = baseColor + glowColor + detailColor;
                        
                        // Add atmospheric scattering effect
                        float atmosphere = pow(rimLight, 4.0) * 0.6;
                        finalColor += vec3(1.0, 0.6, 0.3) * atmosphere;
                        
                        gl_FragColor = vec4(finalColor, 1.0);
                    }
                `,
                transparent: true
            });

            // Create an outer glow using a separate sphere
            const glowGeometry = new THREE.SphereGeometry(radius * 1.2, 32, 32);
            const glowMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 }
                },
                vertexShader: `
                    varying vec3 vNormal;
                    void main() {
                        vNormal = normalize(normalMatrix * normal);
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform float time;
                    varying vec3 vNormal;
                    
                    void main() {
                        float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                        vec3 glowColor = vec3(1.0, 0.6, 0.2) * intensity;
                        gl_FragColor = vec4(glowColor, intensity * 0.6);
                    }
                `,
                transparent: true,
                blending: THREE.AdditiveBlending,
                side: THREE.BackSide
            });

            this.glow = new THREE.Mesh(glowGeometry, glowMaterial);
        } else {
            // Regular material for other celestial bodies
            this.material = new THREE.MeshStandardMaterial({
                map: textureMap ? loader.load(textureMap) : null
            });
        }


        this.mesh = new THREE.Mesh(this.geometry, this.material);

        if (isSun && this.glow) {
            this.mesh.add(this.glow);
        }


        // Apply axial tilt relative to orbit plane 
        this.mesh.rotation.x = THREE.MathUtils.degToRad(axialTilt);

        // Create holder for orbital position: " orbit holder (an invisible connection)"
        /** This setup is crucial for creating realistic planetary motion because it separates
         *  two different types of movement:

            The planet's rotation around its own axis (like Earth spinning to create day and night)
            The planet's revolution around the Sun (like Earth completing its yearly orbit) 
        */

        this.orbitHolder = new THREE.Object3D();
        this.orbitHolder.add(this.mesh);

        // Calculate orbital parameters
        if (semiMajorAxis) {
            this.setupOrbit();
        }

    }

    setupOrbit() {
        // Create visible orbit line
        const orbitGeometry = new THREE.BufferGeometry();
        const orbitPoints = [];
        const segments = 128;

        for (let i = 0; i <= segments; i++) {
            const theta = (i / segments) * Math.PI * 2;
            const x = this.semiMajorAxis * Math.cos(theta);
            const z = this.semiMajorAxis * Math.sin(theta) * (1 - this.eccentricity);
            orbitPoints.push(new THREE.Vector3(x, 0, z));
        }

        orbitGeometry.setFromPoints(orbitPoints);
        this.orbitLine = new THREE.Line(
            orbitGeometry,
            new THREE.LineBasicMaterial({ color: 0x444444 })
        );
    }

    //calculates the orbital moviment and the rotation of the celestial object
    update(deltaTime) {
        // Update current time
        this.currentTime += deltaTime * 20;

        // Update shader uniforms
        if (this.material.type === 'ShaderMaterial') {
            this.material.uniforms.time.value = this.currentTime / 10;
        }

        // Update glow shader if it exists
        if (this.glow && this.glow.material.uniforms) {
            this.glow.material.uniforms.time.value = this.currentTime / 20;
        }

        if (this.semiMajorAxis) {
            // Calculate orbital position
            const orbitalProgress = (this.currentTime / this.orbitalPeriod) * Math.PI * 2;
            const x = this.semiMajorAxis * Math.cos(orbitalProgress);
            const z = this.semiMajorAxis * Math.sin(orbitalProgress) * (1 - this.eccentricity);

            this.orbitHolder.position.set(x, 0, z);
        }

        // Apply rotation around axis
        this.mesh.rotation.y += this.rotationSpeed;
    }

    addToScene(scene) {
        scene.add(this.orbitHolder);
        if (this.orbitLine) scene.add(this.orbitLine);
    }
}

class SolarSystemScene {
    constructor() {
        this.setupRenderer();
        this.setupCamera();
        this.setupControls();
        this.setupLighting();
        this.setupStars();
        this.celestialBodies = [];
        this.clock = new THREE.Clock();
        this.timeScale = 1; // Days per second in simulation
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
        this.scene = new THREE.Scene();
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.z = 6;
    }

    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
    }

    setupLighting() {
        // Create a point light at the sun's position
        this.sunLight = new THREE.PointLight(0xffffff, 2);
        this.sunLight.position.set(0, 0, 0);
        this.scene.add(this.sunLight);

        // Add a slight yellow tint to the ambient light
        this.ambientLight = new THREE.AmbientLight(0x333320, 3);
        this.scene.add(this.ambientLight);
    }

    setupStars() {
        const stars = getStarfield({ numStars: 1000 });
        this.scene.add(stars);
    }

    addCelestialBody(bodyConfig) {
        const body = new CelestialBody(bodyConfig);
        body.addToScene(this.scene);
        this.celestialBodies.push(body);
        return body;
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        const deltaTime = this.clock.getDelta() * this.timeScale;

        this.celestialBodies.forEach(body => body.update(deltaTime));
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

const solarSystem = new SolarSystemScene();

// Add sun
solarSystem.addCelestialBody({
    ...PLANETARY_DATA.SUN,
    textureMap: '2k_sun.jpg',
    isSun: true
});

solarSystem.addCelestialBody({
    ...PLANETARY_DATA.MERCURY,
    textureMap: 'celestial_maps/mercurymap.jpg',
});

solarSystem.addCelestialBody({
    ...PLANETARY_DATA.VENUS,
    textureMap: './celestial_maps/venusmap.jpg',
});

solarSystem.addCelestialBody({
    ...PLANETARY_DATA.EARTH,
    textureMap: './celestial_maps/earthmap1k.jpg',
});

solarSystem.addCelestialBody({
    ...PLANETARY_DATA.MARS,
    textureMap: './celestial_maps/mars_1k_color.jpg',
});

solarSystem.addCelestialBody({
    ...PLANETARY_DATA.JUPITER,
    textureMap: './celestial_maps/jupiter2_1k.jpg',
});

solarSystem.addCelestialBody({
    ...PLANETARY_DATA.SATURN,
    textureMap: './celestial_maps/2k_saturn.jpg',
});

solarSystem.addCelestialBody({
    ...PLANETARY_DATA.URANUS,
    textureMap: './celestial_maps/2k_uranus.jpg',
});

solarSystem.addCelestialBody({
    ...PLANETARY_DATA.NEPTUNE,
    textureMap: './celestial_maps/neptunemap.jpg',
});

solarSystem.animate();


