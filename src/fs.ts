const filepath = document.getElementById('filepath-breadcrumb') as HTMLDivElement;
const fileList = document.getElementById('entries') as HTMLTableElement;

let currentPath = [] as string[];
const ROOT_LABEL = '~';

enum HttpMethod {
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
    DELETE = "DELETE"
};

const getUrl = (extra?: string) => {
    const BASE_URL = "http://localhost:8080/api/fs";
    return [BASE_URL, ...currentPath, ...(extra ? [extra] : [''])].join('/');
}

const CLICK_HANDLER: Record<string, (entry: string) => Promise<void>> = {
    'GET': async (entry: string) => {
        if (!entry) return;

        if (!entry.endsWith('/')) {
            window.location.href = getUrl(entry);
            return;
        }
        if (entry === '../') {
            currentPath.pop();
        } else {
            currentPath.push(entry.slice(0, -1));
        }

        await navigate(currentPath)
    },
    'POST': async (_s: string) => {
    },
    'PUT': async (_s: string) => {
    },
    'DELETE': async (_s: string) => {

    }
} as const;

const isMethodValid = (s: string): s is keyof typeof CLICK_HANDLER => s in CLICK_HANDLER;

fileList.addEventListener('click', async (e: Event) => {
    const data = (e.target as HTMLElement).closest('td')?.dataset;
    if (!data) return;
    if (!data.name || !data.method) return;
    if (!isMethodValid(data.method)) return;
    await CLICK_HANDLER[data.method](data.name)
})

window.addEventListener('popstate', async (e: PopStateEvent) => {
    currentPath = e.state?.path ?? [];
    await reqListUpdate();
})

const updatePath = () => {
    let list = [];

    const component = (pathComp: string, i: number) => {
        console.log(`component for ${pathComp} index ${i}`);
        const newComp = document.createElement('span');
        newComp.textContent = pathComp + '/';
        newComp.dataset.curr = i.toString();
        newComp.classList.add('file-entry');
        return newComp;

    }
    list.push(component(ROOT_LABEL, 0));

    currentPath.forEach((pathComp, i) => {
        list.push(component(pathComp, i + 1))
    });

    filepath.replaceChildren(...list);
}

filepath.addEventListener('click', async (e: Event) => {
    const span = (e.target as HTMLElement).closest('span');
    const index = Number(span?.dataset.curr);
    await navigate(currentPath.slice(0, index))
})

const navigate = async (newPath: string[]) => {
    currentPath = newPath;
    history.pushState({ path: [...currentPath] }, '', getUrl())
    await reqListUpdate();
}

const updateList = (entries: string[]) => {
    const getTd = (entry: string, txt: string, method: HttpMethod): HTMLTableCellElement => {
        const td = document.createElement('td');
        td.dataset.name = entry;
        td.dataset.method = method;
        td.textContent = txt;
        td.classList.add('file-entry');
        return td;
    }

    const list = entries.map(entry => {
        const tr = document.createElement('tr');
        tr.appendChild(getTd(entry, entry, HttpMethod.GET));
        if (!entry.endsWith('/')) {
            tr.appendChild(getTd(entry, 'mv', HttpMethod.PUT))
        }
        tr.appendChild(getTd(entry, 'rm', HttpMethod.DELETE))
        return tr
    });

    fileList.replaceChildren(...list);
}

const reqListUpdate = async () => {
    const reqUrl = getUrl();

    try {
        const resp = await fetch(reqUrl);
        if (!resp.ok) {
            throw new Error(`status: ${resp.status} `);
        }
        const result = await resp.json();
        console.log(`reqListUpdate fetch: ${result} `);
        updatePath();
        const entries = currentPath.length > 0 ? ['../', ...result['entries']] : result['entries'];
        updateList(entries);
    } catch (error: unknown) {
        console.log("[err] can't fetch directory listing ", error)
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await navigate([])
})
