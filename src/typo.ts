const TEXT = "Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.";

const FORBIDDEN = new Set(["Shift"]);
class State {
    charIdx: number
    text: string
    typed: HTMLDivElement
    chars: HTMLSpanElement[]

    constructor(text: string) {
        this.charIdx = 0;
        this.text = text;
        this.typed = document.getElementById('typed') as HTMLDivElement;

        this.chars = [];
        for (const char of text) {
            const span = document.createElement('span');
            span.textContent = char;
            this.chars.push(span);
        }

        this.jumpChar(0);
        this.typed.replaceChildren(...this.chars);
    }

    jumpChar(offset: number) {
        this.chars[this.charIdx].classList.remove('current');
        this.charIdx += offset;
        void this.chars[this.charIdx].offsetWidth;
        this.chars[this.charIdx].classList.add('current');
    }

    isValid(formatted: string) {
        return this.text[this.charIdx] == formatted;
    }

    static formatChar(e: KeyboardEvent): string {
        const c = e.key;
        if (e.shiftKey && c.length == 1) {
            return c.toUpperCase();
        } else {
            return c;
        }
    }

    handle(formatted: string) {
        if (formatted == 'Backspace' && this.charIdx > 0) {
            const innerLastChild = this.chars[this.charIdx - 1].lastElementChild;
            if (innerLastChild) {
                innerLastChild.remove();
                return;
            }
            this.chars[this.charIdx - 1].classList.remove('right-char');
            this.jumpChar(-1);
            return
        }
        if (formatted.length > 1) return;

        if (this.isValid(formatted)) {
            this.chars[this.charIdx].classList.add('right-char');
            this.jumpChar(1);
        } else {
            const wrong = document.createElement('span');
            wrong.textContent = formatted;
            wrong.classList.add('wrong-char');
            this.chars[this.charIdx - 1].appendChild(wrong);
        }
    }

    isRunning(): boolean {
        return this.charIdx !== 0;
    }
}

let currState = new State(TEXT);

document.addEventListener('keydown', (e: KeyboardEvent) => {
    const fmted = State.formatChar(e);
    if (currState.isRunning() || currState.isValid(fmted)) {
        currState.handle(fmted);
    }
})

document.addEventListener('DOMContentLoaded', () => {
})
