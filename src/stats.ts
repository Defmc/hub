export default class Stats extends HTMLElement {
    record!: HTMLSpanElement
    current!: HTMLSpanElement
    bestTime: number
    timeStarted!: DOMHighResTimeStamp
    frameReq: number

    constructor() {
        super();
        this.bestTime = Infinity;
        this.frameReq = -1;
    }

    connectedCallback() {
        this.innerHTML = `
            <span>Record time: <span id="record"></span></span>
            <span>Current time: <span id="curr-time"></span></span>
            <button type="button" id="restart-btn">Restart</button>
        `;

        this.record = this.querySelector('#record') as HTMLSpanElement;
        this.current = this.querySelector('#curr-time') as HTMLSpanElement;
        this.querySelector('#restart-btn')?.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('restart', { bubbles: true }))
        })
        this.clear();
    }

    public static showTime(ms: number): string {
        const SEC = 1000;
        const MIN = SEC * 60;
        const mins = Math.floor(ms / MIN);
        ms -= mins * MIN;
        const secs = Math.floor(ms / SEC);
        ms -= secs * SEC;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(Math.floor(ms)).padStart(3, '0')}`;
    }

    public startStopWatch = () => {
        this.timeStarted = performance.now();
        this.stopWatchFrame();
    }

    public stopWatchFrame = () => {
        const now = performance.now();
        const elapsed = now - this.timeStarted;
        this.current.textContent = Stats.showTime(elapsed);
        this.frameReq = requestAnimationFrame(this.stopWatchFrame);
    }

    stop = (): number => {
        if (this.frameReq < 0) return - 1;
        cancelAnimationFrame(this.frameReq);
        const now = performance.now();
        const elapsed = now - this.timeStarted;
        this.current.textContent = Stats.showTime(elapsed);
        return elapsed;
    }

    clear = () => {
        this.current.textContent = "00:00.000";
        if (this.frameReq < 0) return - 1;
        cancelAnimationFrame(this.frameReq);
        this.frameReq = -1;
        this.timeStarted = -1;
    }

    recordAttempt = () => {
        const elapsed = this.stop();
        if (elapsed > 0 && elapsed < this.bestTime) {
            this.bestTime = elapsed;
            this.record.textContent = this.current.textContent;
        }
    }
}

customElements.define('stats-game', Stats)
