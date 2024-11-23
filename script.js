import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {getFresnelMat} from '../threejs/getFresnelMat.js';
import getStarfild from '../threejs/getStarfield.js';

const w = window.innerWidth;
const h = window.innerHeight;

const fov = 75;
const aspect = w / h;
const near = 0.1;
const far = 1000;

const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

const stars = getStarfild({numStars:1000});
scene.add(stars)

const earth = new THREE.IcosahedronGeometry(1, 16);

const loader = new THREE.TextureLoader();

const material = new THREE.MeshStandardMaterial({
    map: loader.load('earthmap1k.jpg')
});

const lightsMat = new THREE.MeshBasicMaterial({
    map: loader.load('earthlights1k.jpg'),
    blending: THREE.AdditiveBlending
});

const cloundsMat = new THREE.MeshStandardMaterial({
    map: loader.load('04_earthcloudmap.jpg'),
    blending: THREE.AdditiveBlending
});

const fresnelMat = getFresnelMat();

const glowMesh = new THREE.Mesh(earth, fresnelMat);
glowMesh.scale.setScalar(1.01);
const cloundsMesh = new THREE.Mesh(earth, cloundsMat);
cloundsMesh.scale.setScalar(1.002);
const lightsMesh = new THREE.Mesh(earth, lightsMat);
const earthMesh = new THREE.Mesh(earth, material);

scene.add(glowMesh);
scene.add(lightsMesh);
scene.add(earthMesh);
scene.add(cloundsMesh);

camera.position.z = 5;

const sunLight = new THREE.DirectionalLight(0xffffff);
sunLight.position.set(-2, -0.5, 1.5);

scene.add(sunLight);

function animate() {
    requestAnimationFrame(animate);
    earthMesh.rotation.y += 0.01;
    lightsMesh.rotation.y += 0.01;
    cloundsMesh.rotation.y += 0.012;
    glowMesh.rotation.y += 0.01;
    renderer.render(scene, camera);
    controls.update();
}


animate();