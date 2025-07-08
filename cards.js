// cards.js - Simplified card battle game

import { scene, cardBackMaterial } from "./threeSetup.js";

// Simplified card data with only attack values
export const cardData = [
    // Core battle cards with attack values only (10-50 damage range)
    { id: 1, name: "Fire Dragon", atk: 45, imagePath: "./cards/a1.webp" },
    { id: 2, name: "Lightning Bolt", atk: 35, imagePath: "./cards/a2.webp" },
    { id: 3, name: "Ice Shard", atk: 25, imagePath: "./cards/a3.webp" },
    { id: 4, name: "Earth Golem", atk: 40, imagePath: "./cards/a4.webp" },
    { id: 5, name: "Wind Strike", atk: 30, imagePath: "./cards/a5.webp" },
    { id: 6, name: "Dark Shadow", atk: 50, imagePath: "./cards/a6.webp" },
    { id: 7, name: "Light Beam", atk: 20, imagePath: "./cards/a7.webp" },
    { id: 8, name: "Flame Burst", atk: 35, imagePath: "./cards/a8.webp" },
    { id: 9, name: "Frost Bite", atk: 15, imagePath: "./cards/a9.webp" },
    { id: 10, name: "Thunder Storm", atk: 45, imagePath: "./cards/a10.webp" },
    { id: 11, name: "Rock Slide", atk: 40, imagePath: "./cards/a11.webp" },
    { id: 12, name: "Gale Force", atk: 25, imagePath: "./cards/a12.webp" },
    { id: 13, name: "Void Strike", atk: 50, imagePath: "./cards/a13.webp" },
    { id: 14, name: "Solar Flare", atk: 30, imagePath: "./cards/a14.webp" },
    { id: 15, name: "Blizzard", atk: 35, imagePath: "./cards/a15.webp" },
    { id: 16, name: "Earthquake", atk: 45, imagePath: "./cards/a16.webp" },
    { id: 17, name: "Hurricane", atk: 40, imagePath: "./cards/a17.webp" },
    { id: 18, name: "Shadow Blade", atk: 30, imagePath: "./cards/a18.webp" },
    { id: 19, name: "Divine Light", atk: 25, imagePath: "./cards/a19.webp" },
    { id: 20, name: "Meteor", atk: 50, imagePath: "./cards/a20.webp" }
];

// --- Shader Code (inline for browser compatibility) ---
const vertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const fragmentShader = `
    uniform sampler2D cardTexture;
    varying vec2 vUv;

    void main() {
        vec4 texColor = texture2D(cardTexture, vUv);

        float borderWidth = 0.03;
        float borderGlow = smoothstep(0.0, borderWidth, vUv.x) * smoothstep(0.0, borderWidth, 1.0 - vUv.x)
                         * smoothstep(0.0, borderWidth, vUv.y) * smoothstep(0.0, borderWidth, 1.0 - vUv.y);

        vec3 glowColor = mix(vec3(1.0, 0.84, 0.0), texColor.rgb, 0.9); // gold glow
        vec3 finalColor = mix(glowColor, texColor.rgb, borderGlow);

        gl_FragColor = vec4(finalColor, texColor.a);
    }
`;

// --- Card Class ---
export class Card {
  constructor(data, isPlayer) {
    this.data = { ...data };
    this.isPlayer = isPlayer;
    this.mesh = this.createCardMesh();
    this.targetPosition = new THREE.Vector3();
    this.targetRotation = new THREE.Euler();
    this.targetScale = new THREE.Vector3(1, 1, 1);
    this.isZoomed = false; // Flag to prevent repositioning when zoomed
  }

  createCardMesh() {
  // Detect screen width
  const isMobile = window.innerWidth <= 768;

  // Smaller size for mobile
  const width = isMobile ? 1.2 : 2;
  const height = isMobile ? 1.8 : 3;

  const geometry = new THREE.PlaneGeometry(width, height);
  const texture = new THREE.TextureLoader().load(this.data.imagePath);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      cardTexture: { value: this.isPlayer ? texture : cardBackMaterial.map },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.userData = this;
  scene.add(mesh);
  return mesh;
}

  reveal() {
    if (!this.isPlayer) {
      const texture = new THREE.TextureLoader().load(this.data.imagePath);
      this.mesh.material.uniforms.cardTexture.value = texture;
      this.mesh.material.needsUpdate = true;
    }
  }

  update() {
    // Don't auto-reposition if card is zoomed
    if (this.isZoomed) return;
    
    this.mesh.position.lerp(this.targetPosition, 0.1);
    this.mesh.scale.lerp(this.targetScale, 0.1);
    this.mesh.rotation.x +=
      (this.targetRotation.x - this.mesh.rotation.x) * 0.1;
    this.mesh.rotation.y +=
      (this.targetRotation.y - this.mesh.rotation.y) * 0.1;
    this.mesh.rotation.z +=
      (this.targetRotation.z - this.mesh.rotation.z) * 0.1;
  }
}