const glowGeometry = new THREE.SphereGeometry(PLANETARY_DATA.SUN.radius * 1.2, 32, 32);
const glowMaterial = new THREE.ShaderMaterial({
    uniforms: {
        glowColor: { value: new THREE.Color(0xFFFF99) },
        glowIntensity: { value: 1.0 }
    },
    vertexShader: `
varying vec3 vNormal;
void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,
    fragmentShader: `
uniform vec3 glowColor;
uniform float glowIntensity;
varying vec3 vNormal;
void main() {
    float intensity = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
    gl_FragColor = vec4(glowColor * glowIntensity * intensity, 1.0);
}
`,
    blending: THREE.AdditiveBlending,
    transparent: true
});
const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
this.mesh.add(glowMesh);