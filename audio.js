class AudioPlayer {
    constructor() {
        this.context = null;
        this.samples = {};
        this.masterGainNode = null;
        this.compressor = null; // Added compressor
        this.playingSources = [];
        this.isLoaded = false;
        this.loadingPromise = null;
        this.maxVoices = 16; // Maximum simultaneous voices
        this.activeSources = new Map(); // Track active sources with more detail
        
        // Initialize audio context on user interaction
        document.addEventListener("click", () => this.initAudioContext(), { once: true });
    }

    initAudioContext() {
        if (this.context) return;
        
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create compressor node
        this.compressor = this.context.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-24, this.context.currentTime);
        this.compressor.knee.setValueAtTime(30, this.context.currentTime);
        this.compressor.ratio.setValueAtTime(12, this.context.currentTime);
        this.compressor.attack.setValueAtTime(0.003, this.context.currentTime);
        this.compressor.release.setValueAtTime(0.25, this.context.currentTime);

        // Create master gain node
        this.masterGainNode = this.context.createGain();
        this.masterGainNode.gain.value = 0.8;

        // Connect nodes: source -> compressor -> masterGain -> destination
        this.compressor.connect(this.masterGainNode);
        this.masterGainNode.connect(this.context.destination);
        
        // Start loading samples if not already loading
        if (!this.loadingPromise) {
            this.loadingPromise = this.loadSamples();
        }
    }

    async loadSamples() {
        try {
            const loadPromises = [];
            for (let i = 1; i <= 44; i++) {
                const url = `samples/${String(i).padStart(2, "0")}.wav`;
                loadPromises.push(
                    this.loadSample(url)
                        .then(buffer => {
                            this.samples[i] = buffer;
                            console.log(`Loaded sample ${i}`);
                        })
                        .catch(error => {
                            console.error(`Failed to load sample ${i}:`, error);
                            this.samples[i] = null;
                        })
                );
            }
            
            await Promise.all(loadPromises);
            this.isLoaded = true;
            console.log("All samples loaded successfully");
        } catch (error) {
            console.error("Error loading samples:", error);
            this.isLoaded = false;
        }
    }

    async loadSample(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        return await this.context.decodeAudioData(arrayBuffer);
    }

    playSample(sampleIndex, x, canvasWidth) {
        if (!this.context || !this.isLoaded || !this.samples[sampleIndex]) {
            return;
        }

        // Check if we've reached the maximum number of voices
        if (this.activeSources.size >= this.maxVoices) {
            this.removeOldestSource();
        }

        const sample = this.samples[sampleIndex];
        const sourceId = Date.now() + Math.random(); // Unique ID for this source

        // Create and configure audio nodes
        const source = this.context.createBufferSource();
        source.buffer = sample;

        const panner = this.context.createStereoPanner();
        const normalizedX = (x / canvasWidth) * 2 - 1;
        panner.pan.setValueAtTime(normalizedX, this.context.currentTime);

        const gainNode = this.context.createGain();
        
        // Adjust individual gain based on number of active sources
        const baseGain = 0.3 / Math.max(1, Math.sqrt(this.activeSources.size));
        gainNode.gain.setValueAtTime(baseGain, this.context.currentTime);
        gainNode.gain.linearRampToValueAtTime(
            0,
            this.context.currentTime + sample.duration - 0.05
        );

        // Connect audio nodes
        source.connect(gainNode);
        gainNode.connect(panner);
        panner.connect(this.compressor); // Connect to compressor instead of master gain

        // Start playback and track the source
        source.start();
        
        const sourceInfo = {
            source,
            gainNode,
            panner,
            endTime: this.context.currentTime + sample.duration,
            startTime: this.context.currentTime
        };

        this.activeSources.set(sourceId, sourceInfo);
        source.onended = () => this.removeSource(sourceId);

        // Clean up finished sources
        this.cleanupSources();
    }

    removeOldestSource() {
        if (this.activeSources.size === 0) return;
        
        // Find the oldest source
        let oldestId = null;
        let oldestTime = Infinity;
        
        for (const [id, sourceInfo] of this.activeSources) {
            if (sourceInfo.startTime < oldestTime) {
                oldestTime = sourceInfo.startTime;
                oldestId = id;
            }
        }

        if (oldestId) {
            this.removeSource(oldestId);
        }
    }

    removeSource(sourceId) {
        const sourceInfo = this.activeSources.get(sourceId);
        if (sourceInfo) {
            try {
                sourceInfo.source.stop();
                sourceInfo.source.disconnect();
                sourceInfo.gainNode.disconnect();
                sourceInfo.panner.disconnect();
            } catch (e) {
                console.warn("Error removing source:", e);
            }
            this.activeSources.delete(sourceId);
        }
    }

    cleanupSources() {
        const currentTime = this.context.currentTime;
        for (const [id, sourceInfo] of this.activeSources) {
            if (currentTime >= sourceInfo.endTime) {
                this.removeSource(id);
            }
        }
    }

    stopAllSources() {
        for (const id of this.activeSources.keys()) {
            this.removeSource(id);
        }
        this.activeSources.clear();
    }

    setMasterVolume(value) {
        if (this.masterGainNode) {
            this.masterGainNode.gain.value = Math.max(0, Math.min(1, value));
        }
    }

    isReady() {
        return this.context && this.isLoaded;
    }

    resumeAudioContext() {
        if (this.context && this.context.state === 'suspended') {
            this.context.resume();
        }
    }
}

// Export as a module
export const audioPlayer = new AudioPlayer();