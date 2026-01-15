/**
 * Circle class - Based on pulsate.js reliable collision detection
 * All circles are independent (no nesting) for better performance
 */
class Circle {
    constructor(x, y, initialRadius, speed, id) {
        this.x = x;
        this.y = y;
        this.radius = initialRadius; // Using radius instead of diameter for clarity
        this.speed = speed;
        this.direction = 1; // 1 = expanding, -1 = contracting
        this.id = id;
        this.color = color(random(150, 255), random(150, 255), random(150, 255), 180);
        this.maxRadius = 400; // Will be set to canvas size
        this.minRadius = 1;
    }

    /**
     * Check collisions with other circles
     * Uses pulsate.js algorithm with bump tracking
     * @param {Array} circles - All circles in the scene
     * @param {Array} bumped - Array tracking which circles already reversed this frame
     * @param {Array} collisions - Array to collect collision data for audio
     */
    checkCollisions(circles, bumped, collisions) {
        // Check collisions with circles that come after this one (avoid double-checking)
        for (let i = this.id + 1; i < circles.length; i++) {
            const other = circles[i];
            const distance = dist(this.x, this.y, other.x, other.y);
            const sumRadii = this.radius + other.radius;
            
            // Check if circles are overlapping
            if (distance < sumRadii) {
                const big = max(this.radius, other.radius);
                const small = min(this.radius, other.radius);
                
                // Check if this is a real collision (not one circle inside another)
                // This handles both edge collision and nested collision
                if (distance + small > big) {
                    // Reverse direction for this circle (if not already bumped)
                    if (!bumped.includes(this.id)) {
                        this.direction *= -1;
                        bumped.push(this.id);
                    }
                    
                    // Reverse direction for other circle (if not already bumped)
                    if (!bumped.includes(i)) {
                        other.direction *= -1;
                        bumped.push(i);
                    }
                    
                    // Record collision for audio playback
                    collisions.push({
                        sumRadii: big + small,
                        x: this.x,
                        canvasWidth: width
                    });
                }
            }
        }
        
        // Bounce off boundaries
        if (this.radius < this.minRadius) {
            this.direction = 1; // Start expanding
            this.radius = this.minRadius;
        }
        if (this.radius > this.maxRadius) {
            this.direction = -1; // Start contracting
            this.radius = this.maxRadius;
        }
    }

    /**
     * Update circle size
     */
    update() {
        this.radius += this.speed * this.direction;
    }

    /**
     * Display circle
     */
    display() {
        noFill();
        stroke(this.color);
        strokeWeight(2);
        ellipse(this.x, this.y, this.radius * 2);
    }

    /**
     * Set max radius based on canvas size
     */
    setMaxRadius(maxR) {
        this.maxRadius = maxR;
    }
}
