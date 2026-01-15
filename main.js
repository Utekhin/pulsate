/**
 * Main application - Wave Circle Sound Game
 * Combines pulsate.js reliability with sample-based audio option
 */

// Global variables
let circles = [];
let audioSystem;
let growthSpeed = 0.5;
let speedMultiplier = 1.0;
const CANVAS_SIZE = 800;

// UI elements
let clearBtn, synthBtn, samplesBtn, speedBtn;

/**
 * p5.js setup - Initialize canvas and audio
 */
function setup() {
    const canvas = createCanvas(CANVAS_SIZE, CANVAS_SIZE);
    canvas.parent(document.body);
    
    // Initialize audio system
    audioSystem = new AudioSystem();
    
    // Setup UI buttons (already in HTML, just get references)
    clearBtn = select('#clearBtn');
    synthBtn = select('#synthBtn');
    samplesBtn = select('#samplesBtn');
    speedBtn = select('#speedBtn');
    
    // Button event handlers
    clearBtn.mousePressed(clearAll);
    synthBtn.mousePressed(() => setAudioMode('synth'));
    samplesBtn.mousePressed(() => setAudioMode('samples'));
    speedBtn.mousePressed(cycleSpeed);
    
    console.log('Wave Circle Sound Game initialized');
    console.log('Click to create circles, Space to clear');
}

/**
 * p5.js draw loop - Main game loop using pulsate.js pattern
 */
function draw() {
    background(20);
    
    // Arrays to track collisions this frame (pulsate.js pattern)
    const bumped = [];      // Track which circles reversed direction
    const collisions = [];  // Track collision data for audio
    
    // Check collisions for all circles
    circles.forEach(circle => {
        circle.checkCollisions(circles, bumped, collisions);
    });
    
    // Update and display all circles
    circles.forEach(circle => {
        circle.update();
        circle.display();
    });
    
    // Play collision sounds (batched, like pulsate.js)
    if (collisions.length > 0) {
        audioSystem.playCollisions(collisions);
    }
}

/**
 * Mouse click handler - Create new circle
 */
function mousePressed() {
    // Don't create circles if clicking on UI
    if (mouseY < 60) return;
    
    const newCircle = new Circle(
        mouseX,
        mouseY,
        0,
        growthSpeed * speedMultiplier,
        circles.length
    );
    newCircle.setMaxRadius(CANVAS_SIZE / 2);
    circles.push(newCircle);
}

/**
 * Keyboard handler - Space to clear
 */
function keyPressed() {
    if (keyCode === 32) { // Space bar
        clearAll();
    }
}

/**
 * Clear all circles
 */
function clearAll() {
    circles = [];
    audioSystem.stopAll();
    console.log('Cleared all circles');
}

/**
 * Set audio mode
 */
function setAudioMode(mode) {
    audioSystem.setMode(mode);
    
    // Update button states
    if (mode === 'synth') {
        synthBtn.addClass('active');
        samplesBtn.removeClass('active');
    } else {
        samplesBtn.addClass('active');
        synthBtn.removeClass('active');
    }
}

/**
 * Cycle through speed multipliers
 */
function cycleSpeed() {
    const speeds = [0.5, 1.0, 1.5, 2.0];
    const currentIndex = speeds.indexOf(speedMultiplier);
    speedMultiplier = speeds[(currentIndex + 1) % speeds.length];
    
    // Update existing circles
    circles.forEach(circle => {
        circle.speed = growthSpeed * speedMultiplier;
    });
    
    speedBtn.html(`Speed: ${speedMultiplier.toFixed(1)}x`);
    console.log(`Speed: ${speedMultiplier}x`);
}

/**
 * Window resize handler (optional)
 */
function windowResized() {
    // Keep canvas size fixed for now
    // Could implement responsive sizing here
}
