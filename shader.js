// --- shader.js ---

// Vertex Shader
const vertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

// Fragment Shader with glowing border
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

// Export shaders
export { vertexShader, fragmentShader };
