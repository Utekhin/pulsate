class AudioPlayer {
    constructor() {
        this.context = null;
        this.samples = {};
        this.masterGainNode = null;
        this.playingSources = [];
        this.isLoaded = false;
        this.loadingPromise = null;
        
        // Initialize audio context on user interaction
        document.addEventListener("click", () => this.initAudioContext(), { once: true });
    }

    initAudioContext() {
        if (this.context) return;
        
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGainNode = this.context.createGain();
        this.masterGainNode.gain.value = 0.8;
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

        const sample = this.samples[sampleIndex];
        
        // Create and configure audio nodes
        const source = this.context.createBufferSource();
        source.buffer = sample;

        const panner = this.context.createStereoPanner();
        const normalizedX = (x / canvasWidth) * 2 - 1;
        panner.pan.setValueAtTime(normalizedX, this.context.currentTime);

        const gainNode = this.context.createGain();
        gainNode.gain.setValueAtTime(0.3, this.context.currentTime);
        gainNode.gain.linearRampToValueAtTime(
            0,
            this.context.currentTime + sample.duration - 0.05
        );

        // Connect audio nodes
        source.connect(gainNode);
        gainNode.connect(panner);
        panner.connect(this.masterGainNode);

        // Start playback and track the source
        source.start();
        this.playingSources.push({
            source,
            endTime: this.context.currentTime + sample.duration
        });

        // Clean up finished sources
        this.cleanupSources();
    }

    cleanupSources() {
        const currentTime = this.context.currentTime;
        this.playingSources = this.playingSources.filter(({source, endTime}) => {
            if (currentTime >= endTime) {
                source.disconnect();
                return false;
            }
            return true;
        });
    }

    stopAllSources() {
        this.playingSources.forEach(({source}) => {
            try {
                source.stop();
                source.disconnect();
            } catch (e) {
                console.warn("Error stopping source:", e);
            }
        });
        this.playingSources = [];
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
