import GridConfig from './grid';
import Stats from './stats';

const randomize = document.getElementById('randomize') as HTMLInputElement;
const colorize = document.getElementById('colorize') as HTMLInputElement;
const disabled = document.getElementById('disable_past') as HTMLInputElement;
const grid = document.querySelector('grid-config') as GridConfig;
const stats = document.querySelector('stats-game') as Stats;
const nextN = document.getElementById('next-n') as HTMLSpanElement;

let currState: GameState;

enum ActionResult {
    Wrong,
    Right,
    Won,
}

class GameState {
    current: number
    max: number

    public constructor(max: number) {
        this.current = 0;
        this.max = max;
        nextN.textContent = (this.current + 1).toString()
    }

    public advance(clicked: number): ActionResult {
        let res = ActionResult.Wrong;
        if (this.current + 1 === clicked) {
            this.current++;
            res = ActionResult.Right;
        }
        if (this.current === 1) {
            stats.startStopWatch();
        }
        if (this.current === this.max) {
            res = ActionResult.Won;
            stats.recordAttempt();
        } else {
            nextN.textContent = (this.current + 1).toString()
        }

        return res;
    }
}


const gridClickOn = (obj: HTMLTableCellElement): void => {
    if (obj.classList.contains('past')) {
        return
    }
    const n = Number(obj.textContent);
    const res = currState.advance(n);

    if (res === ActionResult.Wrong) {
        if (colorize.checked) {
            obj.animate([{ backgroundColor: '#fb4934' }, { backgroundColor: '#282828' }], {
                easing: 'ease-out',
                duration: 300
            })
        }
        return
    }
    if (colorize.checked) {
        obj.animate([{ backgroundColor: '#8ec07c' }, { backgroundColor: '#282828' }], {
            easing: 'ease-out',
            duration: 300
        })
    }
    if (disabled.checked && n <= currState.current) {
        obj.classList.add('past');
    }

    if (res === ActionResult.Right && randomize.checked) {
        grid.shuffleGrid();
    }
}

const restart = (): void => {
    if (currState != null) {
        stats.clear();
    }
    currState = new GameState(grid.rows.valueAsNumber * grid.cols.valueAsNumber);
    grid.regenerateGrid();
};

const start = (): void => {
    restart();
}


Promise.all([customElements.whenDefined('grid-config'), customElements.whenDefined('stats-game')]).then(_ => {
    grid.addEventListener('expand', restart)
    grid.grid.addEventListener('click', (e) => {
        const td = (e.target as HTMLElement).closest('td') as HTMLTableCellElement;
        if (td) gridClickOn(td);
    })
    disabled.addEventListener('change', grid.regenerateGrid);
    stats.addEventListener('restart', restart);

    grid.cellGen = (_gc: GridConfig, td: HTMLTableCellElement, i: number): void => {
        const n = i + 1;
        td.textContent = n.toString();
        if (disabled.checked && n <= currState.current) {
            td.classList.add('past');
        } else {
            td.classList.remove('past');
        }
    };
    requestAnimationFrame(start)
});
