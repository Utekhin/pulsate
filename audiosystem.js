/**
 * AudioSystem - Unified audio handler supporting both synth and samples
 */
class AudioSystem {
    constructor() {
        this.mode = 'synth'; // 'synth' or 'samples'
        this.polySynth = null;
        this.reverb = null;
        this.delay = null;
        this.samplePlayer = null;
        this.initialized = false;
    }

    /**
     * Initialize audio system (called after user interaction)
     */
    init() {
        if (this.initialized) return;
        
        // Initialize p5.sound synth
        this.polySynth = new p5.PolySynth();
        this.reverb = new p5.Reverb();
        this.delay = new p5.Delay();
        this.reverb.process(this.polySynth, 3, 1);
        this.delay.process(this.polySynth, 0.2, 0.3, 2300);
        
        // Initialize sample player
        this.samplePlayer = new SamplePlayer();
        
        this.initialized = true;
        console.log('Audio system initialized');
    }

    /**
     * Set audio mode
     */
    setMode(mode) {
        this.mode = mode;
        console.log(`Audio mode: ${mode}`);
    }

    /**
     * Play collision sounds
     * @param {Array} collisionData - Array of {sumRadii, x, canvasWidth}
     */
    playCollisions(collisionData) {
        if (!this.initialized) this.init();
        
        if (this.mode === 'synth') {
            this.playSynthCollisions(collisionData);
        } else {
            this.playSampleCollisions(collisionData);
        }
    }

    /**
     * Play synth notes (pulsate.js style)
     */
    playSynthCollisions(collisionData) {
        userStartAudio();
        
        collisionData.forEach(({sumRadii}) => {
            // Convert radius sum to note (pulsate.js algorithm)
            let n = round(200 - constrain(sumRadii, 5, 195));
            let oct = floor(map(n, 5, 195, 2, 5));
            let t = n - round(map(oct, 2, 5, 5, 195, true));
            
            let tone;
            if (t < 10) tone = "C";
            else if (t < 20) tone = "D";
            else if (t < 30) tone = "E";
            else if (t < 40) tone = "F";
            else if (t < 50) tone = "G";
            else tone = "B";
            
            let note = tone + oct;
            this.polySynth.play(note, 0.5, 0, 0.1);
        });
    }

    /**
     * Play sample-based sounds
     */
    playSampleCollisions(collisionData) {
        collisionData.forEach(({sumRadii, x, canvasWidth}) => {
            // Map radius to sample index (1-22)
            const normalized = 1 - constrain(sumRadii, 0, 300) / 300;
            const sampleIndex = Math.round(normalized * 21) + 1;
            
            this.samplePlayer.play(sampleIndex, x, canvasWidth);
        });
    }

    /**
     * Stop all playing sounds
     */
    stopAll() {
        if (this.samplePlayer) {
            this.samplePlayer.stopAll();
        }
    }
}

/**
 * SamplePlayer - Handles WAV sample playback
 */
class SamplePlayer {
    constructor() {
        this.context = null;
        this.samples = {};
        this.masterGainNode = null;
        this.playingSources = [];
        this.loadingSamples = false;
        
        // Auto-init on first user click
        document.addEventListener("click", () => this.initAudioContext(), { once: true });
    }

    initAudioContext() {
        if (this.context) return;
        
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGainNode = this.context.createGain();
        this.masterGainNode.gain.value = 0.8;
        this.masterGainNode.connect(this.context.destination);
        
        this.loadSamples();
    }

    async loadSamples() {
        if (this.loadingSamples) return;
        this.loadingSamples = true;
        
        console.log('Loading samples...');
        
        for (let i = 1; i <= 22; i++) {
            const url = `samples/${String(i).padStart(2, "0")}.wav`;
            this.samples[i] = await this.loadSample(url);
        }
        
        console.log('All samples loaded');
    }

    async loadSample(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to load: ${url}`);
            const arrayBuffer = await response.arrayBuffer();
            return await this.context.decodeAudioData(arrayBuffer);
        } catch (error) {
            console.warn(`Could not load ${url}`);
            return null;
        }
    }

    play(sampleIndex, x, canvasWidth) {
        if (!this.context || !this.samples[sampleIndex]) return;

        const sample = this.samples[sampleIndex];
        const source = this.context.createBufferSource();
        source.buffer = sample;

        // Stereo panning based on x position
        const panner = this.context.createStereoPanner();
        const normalizedX = (x / canvasWidth) * 2 - 1;
        panner.pan.setValueAtTime(normalizedX, this.context.currentTime);

        // Fade out envelope
        const gainNode = this.context.createGain();
        gainNode.gain.setValueAtTime(0.3, this.context.currentTime);
        gainNode.gain.linearRampToValueAtTime(
            0,
            this.context.currentTime + sample.duration - 0.05
        );

        source.connect(gainNode);
        gainNode.connect(panner);
        panner.connect(this.masterGainNode);
        source.start();

        this.playingSources.push(source);
        
        // Clean up after playback
        source.onended = () => {
            const index = this.playingSources.indexOf(source);
            if (index > -1) this.playingSources.splice(index, 1);
        };
    }

    stopAll() {
        this.playingSources.forEach(source => {
            try {
                if (source.context.state === 'running') {
                    source.stop();
                }
            } catch (e) {
                // Source may have already stopped
            }
        });
        this.playingSources = [];
    }
}
