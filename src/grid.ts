export default class GridConfig extends HTMLElement {
    rows!: HTMLInputElement
    cols!: HTMLInputElement
    expand!: HTMLButtonElement
    padding!: HTMLInputElement
    paddingBar!: HTMLInputElement
    grid!: HTMLTableElement
    cellGen: (gc: GridConfig, td: HTMLTableCellElement, i: number) => void = (_a, _b, _c) => { }
    fontSize!: HTMLInputElement

    constructor() {
        super()
    }

    el = <K extends keyof HTMLElementTagNameMap>(tag: K, props: Partial<HTMLElementTagNameMap[K]>): HTMLElementTagNameMap[K] => Object.assign(document.createElement(tag), props);

    connectedCallback() {
        this.innerHTML = `
        <label>Rows <input type="number" min="1" step="1" value="5"></label>
        <label>Cols <input type="number" min="1" step="1" value="5"></label>
        <button type="button">Expand grid</button>
        <br>
        <label>Padding (%) <input type="range" min="0" max="100" value="20" step="1"></label>
        <input type="number" min="0" max="100" value="20" step="1">
        <label>Font size(px) <input type="number" min="0" value="12" step="1"></label>
        <table></table>
    `;

        const inputs = this.querySelectorAll('input');
        this.rows = inputs[0];
        this.cols = inputs[1];
        this.paddingBar = inputs[2];
        this.padding = inputs[3];
        this.fontSize = inputs[4];
        this.expand = this.querySelector('button')!;
        this.grid = this.querySelector('table')!;

        this.expand.addEventListener('click', () => {
            const { width, height } = (this.grid.querySelector('td') as HTMLTableCellElement).getBoundingClientRect();
            this.cols.valueAsNumber = Math.floor(window.innerWidth / width);
            this.rows.valueAsNumber = Math.floor(window.innerHeight * 0.7 / height);
            this.dispatchEvent(new CustomEvent('expand', { bubbles: true }));
        });

        this.rows.addEventListener('change', this.regenerateGrid);
        this.cols.addEventListener('change', this.regenerateGrid);

        this.paddingBar.oninput = () => {
            this.padding.valueAsNumber = this.paddingBar.valueAsNumber;
            this.setGridPadding(this.padding.valueAsNumber);
        }
        this.padding.oninput = () => {
            this.paddingBar.valueAsNumber = this.padding.valueAsNumber;
            this.setGridPadding(this.padding.valueAsNumber);
        }

        this.fontSize.addEventListener('change', () => {
            for (const cell of this.grid.querySelectorAll('td')) {
                cell.style.fontSize = `${this.fontSize.valueAsNumber}px`;
            }
        })

        window.addEventListener('resize', () => this.setGridPadding(this.padding.valueAsNumber));
        this.setGridPadding(this.padding.valueAsNumber);
    }


    public setGridPadding = (p: number) => {
        const perCell = (p / 100) * window.innerWidth / this.cols.valueAsNumber;
        this.grid.style.setProperty('--cell-size', `${perCell}px`);
    };

    public setGridSize = (): void => {
        const [cols, rows] = [this.cols.valueAsNumber, this.rows.valueAsNumber];

        const genRow = (i: number): HTMLTableRowElement => {
            const tr = document.createElement('tr');
            const cells = [...Array(cols).keys()].map(j => genCell(i * cols + j + 1));
            tr.append(...cells);
            return tr;
        };
        const genCell = (num: number): HTMLTableCellElement => {
            const td = document.createElement('td');
            td.textContent = num.toString();
            td.style.fontSize = `${this.fontSize.valueAsNumber}px`;
            return td
        }

        const newRows = [...Array(rows).keys()].flatMap(i => genRow(i));
        this.grid.replaceChildren(...newRows);
    }

    public regenerateGrid = (): void => {
        this.setGridSize();
        this.shuffleGrid();
    }

    public shuffleGrid = (): void => {
        const fisherYateShuffle = (n: number): Array<number> => {
            let shuffled = [...Array(n).keys()];
            for (let i = 0; i + 1 < n; i++) {
                const j = i + Math.floor(Math.random() * (n - i));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }

            return shuffled;
        }
        const tds = Array.from(this.grid.querySelectorAll('td')) as HTMLTableCellElement[];
        const order = fisherYateShuffle(this.rows.valueAsNumber * this.cols.valueAsNumber);
        tds.forEach((td, i) => {
            this.cellGen(this, td, order[i])
        })
    }
}

customElements.define('grid-config', GridConfig);
