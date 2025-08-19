// public/processor.js

class AudioProcessor extends AudioWorkletProcessor {
    constructor() {
        super()

        this.cfg = {
            threshold: 0.01,
            silenceFrames: 8,
            minMs: 200,
            maxMs: 10000,
            preRollMs: 50
        }

        this._buffer = new Float32Array(0)
        this._bufIdx = 0
        this._preRoll = new Float32Array(0)
        this._preIdx = 0
        this._silence = 0
        this._speaking = false

        this.port.onmessage = (e) => {
            const msg = e.data
            if (!msg || typeof msg !== 'object') return
            if (msg.type === 'config') {
                Object.assign(this.cfg, msg.payload || {})
            } else if (msg.type === 'reset') {
                this._reset()
            }
        }

        this._recalcCapacities()
    }

    static get parameterDescriptors() { return [] }

    _reset() {
        this._buffer = new Float32Array(this._buffer.length)
        this._bufIdx = 0
        this._preRoll = new Float32Array(this._preRoll.length)
        this._preIdx = 0
        this._silence = 0
        this._speaking = false
    }

    _recalcCapacities() {{
        const sr = sampleRate
        const toSamples = (ms) => Math.max(1, Math.floor((ms / 1000) * sr))

        const cap = toSamples(this.cfg.maxMs)
        if (this._buffer.length !== cap) {
            this._buffer = new Float32Array(cap)
            this._bufIdx = 0
        }

        const pre = toSamples(this.cfg.preRollMs)
        if (this._preRoll.length !== pre) {
            this._preRoll = new Float32Array(pre)
            this._preIdx = 0
        }
    }}

    _pushPreRoll(mono) {
        const space = this._preRoll.length
        const m = Math.min(mono.length, space)
        if (m === 0) return

        if (m <= space - this._preIdx) {
            this._preRoll.set(mono.subarray(0, m), this._preIdx)
            this._preIdx += m
        } else {
            const first = space - this._preIdx
            this._preRoll.set(mono.subarray(0, first), this._preIdx)
            const remain = m - first
            this._preRoll.set(mono.subarray(first, first + remain), 0)
            this._preIdx = remain
        }
    }

    _appendToMain(mono) {
        const need = mono.length
        const left = this._buffer.length - this._bufIdx
        if (need > left) {
            this._flush()
            this._bufIdx = 0
        }
        this._buffer.set(mono, this._bufIdx)
        this._bufIdx += mono.length
    }

    _flush() {
        if (this._bufIdx === 0) return
        const out = new Float32Array(this._bufIdx)
        out.set(this._buffer.subarray(0, this._bufIdx))
        this._bufIdx = 0
        this.port.postMessage(
            { type: 'chunk', data: out, sampleRate },
            [out.buffer]
        )
    }

    process(inputs) {
        const input = inputs[0]
        if (!input || input.length === 0 || !input[0]) return true

        const ch0 = input[0]
        const mono = new Float32Array(ch0.length)
        if (input.length === 1) {
            mono.set(ch0)
        } else {
            for (let i = 0; i < ch0.length; i++) {
                let sum = 0
                for (let c = 0; c < input.length; c++) sum += input[c][i] || 0
                mono[i] = sum / input.length
            }
        }

        let ss = 0
        for (let i = 0; i < mono.length; i++) ss += mono[i] * mono[i]
        const rms = Math.sqrt(ss / mono.length)

        if (rms > this.cfg.threshold) {
            if (!this._speaking) {
                if (this._preRoll.length > 0) {
                    const head = this._preIdx
                    const pr = new Float32Array(this._preRoll.length)
                    const tail = this._preRoll.length - head
                    pr.set(this._preRoll.subarray(head), 0)
                    pr.set(this._preRoll.subarray(0, head), tail)
                    this._appendToMain(pr)
                }
                this._speaking = true
            }
            this._appendToMain(mono)
            this._silence = 0

            const maxSamples = Math.floor((this.cfg.maxMs / 1000) * sampleRate)
            if (this._bufIdx >= maxSamples) {
                this._flush()
            }
        } else {
            this._pushPreRoll(mono)
            if (this._speaking) {
                this._silence++
                if (this._silence >= this.cfg.silenceFrames) {
                    const minSamples = Math.floor((this.cfg.minMs / 1000) * sampleRate)
                    if (this._bufIdx >= minSamples) {
                        this._flush()
                    } else {
                        this._bufIdx = 0
                    }
                    this._speaking = false
                    this._silence = 0
                }
            }
        }

        return true
    }
}

registerProcessor('audio-processor', AudioProcessor)