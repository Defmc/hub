const rows = document.getElementById('rows') as HTMLInputElement;
const cols = document.getElementById('cols') as HTMLInputElement;
const randomize = document.getElementById('randomize') as HTMLInputElement;
const colorize = document.getElementById('colorize') as HTMLInputElement;
const record = document.getElementById('record') as HTMLSpanElement;
const grid = document.getElementById('grid') as HTMLTableElement;
const currTime = document.getElementById('curr_time') as HTMLSpanElement;
const nextN = document.getElementById('next_n') as HTMLSpanElement;
const padding = document.getElementById('padding') as HTMLInputElement;
const paddingBar = document.getElementById('padding_bar') as HTMLInputElement;
const disabled = document.getElementById('disable_past') as HTMLInputElement;

document.getElementById('fill_grid')?.addEventListener('click', () => {
    const { width, height } = (grid.querySelector('td') as HTMLTableCellElement).getBoundingClientRect();
    cols.valueAsNumber = Math.floor(window.innerWidth / width);
    rows.valueAsNumber = Math.floor(window.innerHeight * 0.7 / height);
    restart();
});

paddingBar.oninput = () => {
    padding.valueAsNumber = paddingBar.valueAsNumber;
    setGridPadding(padding.valueAsNumber);
}

padding.oninput = () => {
    paddingBar.valueAsNumber = padding.valueAsNumber;
    setGridPadding(padding.valueAsNumber);
}

document.addEventListener('resize', () => setGridPadding(padding.valueAsNumber));
disabled.addEventListener('change', () => regenerateGrid);

const setGridPadding = (p: number) => {
    const perCell = (p / 100) * window.innerWidth / cols.valueAsNumber;
    grid.style.setProperty('--cell-size', `${perCell}px`);
}
setGridPadding(padding.valueAsNumber);

let currState: GameState;
let bestTime: number = Infinity;

enum ActionResult {
    Wrong,
    Right,
    Won,
}

class GameState {
    current: number
    max: number
    timeStarted: DOMHighResTimeStamp
    frameReq: number

    public constructor(max: number) {
        this.current = 0;
        this.max = max;
        this.timeStarted = 0;
        this.frameReq = 0;
        nextN.textContent = (this.current + 1).toString()
    }

    public advance(clicked: number): ActionResult {
        let res = ActionResult.Wrong;
        if (this.current + 1 == clicked) {
            this.current++;
            res = ActionResult.Right;
        }
        if (this.current == 1) {
            this.timeStarted = performance.now();
            this.stopWatchFrame();
        }
        if (this.current == this.max) {
            res = ActionResult.Won;
            const now = performance.now();
            const elapsed = now - this.timeStarted;
            currTime.textContent = GameState.showTime(elapsed);
            if (elapsed < bestTime) {
                record.textContent = currTime.textContent;
                bestTime = elapsed;
            }
        } else {
            nextN.textContent = (this.current + 1).toString()
        }

        return res;
    }

    public static showTime(ms: number): string {
        const SEC = 1000;
        const MIN = SEC * 60;
        const mins = Math.floor(ms / MIN);
        ms -= mins * MIN;
        const secs = Math.floor(ms / SEC);
        ms -= secs * SEC;
        return `${String(mins).padStart(2, '0')}: ${String(secs).padStart(2, '0')}.${String(Math.floor(ms)).padStart(3, '0')}`;
    }

    public stopWatchFrame = () => {
        const now = performance.now();
        const elapsed = now - this.timeStarted;
        currTime.textContent = GameState.showTime(elapsed);
        if (this.current != this.max) {
            this.frameReq = requestAnimationFrame(this.stopWatchFrame);
        }
    }

    stop = () => {
        cancelAnimationFrame(this.frameReq)
    }
}


grid.addEventListener('click', (e) => {
    const td = (e.target as HTMLElement).closest('td') as HTMLTableCellElement;
    if (td) gridClickOn(td);
})

const gridClickOn = (obj: HTMLTableCellElement): void => {
    const res = currState.advance(Number(obj.textContent));
    if (res == ActionResult.Wrong) {
        if (colorize.checked) {
            obj.animate([{ backgroundColor: '#fb4934' }, { backgroundColor: '#282828' }], {
                fill: 'forwards',
                easing: 'ease-out',
                duration: 500
            })
        }
        return
    }
    if (disabled.checked) {
        obj.classList.add('past');
    }
    if (res == ActionResult.Right && randomize.checked) {
        regenerateGrid();
    }
}

const setGridSize = (rows: number, cols: number): void => {
    const currRows = grid.querySelectorAll('tr').length;
    if (currRows == rows && grid.querySelectorAll('td').length == currRows * cols) {
        return;
    }

    const genRow = (i: number): HTMLTableRowElement => {
        const tr = document.createElement('tr');
        const cells = [...Array(cols).keys()].map(j => genCell(i * cols + j + 1));
        tr.append(...cells);
        return tr;
    };
    const genCell = (num: number): HTMLTableCellElement => {
        const th = document.createElement('td');
        th.textContent = num.toString();
        return th
    }

    const newRows = [...Array(rows).keys()].flatMap(i => genRow(i));
    grid.replaceChildren(...newRows);
}

const regenerateGrid = (): void => {
    setGridSize(rows.valueAsNumber, cols.valueAsNumber);
    shuffleGrid();
}

const shuffleGrid = (): void => {
    const fisherYateShuffle = (n: number): Array<number> => {
        let shuffled = [...Array(n).keys()];
        for (let i = 0; i + 1 < n; i++) {
            const j = i + Math.floor(Math.random() * (n - i));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        return shuffled;
    }
    const tds = Array.from(grid.querySelectorAll('td')) as HTMLTableCellElement[];
    const order = fisherYateShuffle(rows.valueAsNumber * cols.valueAsNumber);
    tds.forEach((td, i) => {
        const n = order[i] + 1;
        td.textContent = n.toString();
        if (disabled.checked && n <= currState.current) {
            td.classList.add('past');
        } else {
            td.classList.remove('past');
        }
    })
}

const restart = (): void => {
    if (currState != null) {
        currState.stop();
    }
    currState = new GameState(rows.valueAsNumber * cols.valueAsNumber);
    regenerateGrid();
};

rows.addEventListener('change', restart);
cols.addEventListener('change', restart);

const start = (): void => {
    restart();
}

start()
