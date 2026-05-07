const filepath = document.getElementById('filepath-breadcrumb') as HTMLDivElement;
const fileList = document.getElementById('entries') as HTMLTableElement;

let currentPath = [] as string[];
const ROOT_LABEL = '~';

const getUrl = (extra?: string) => {
    const BASE_URL = "http://localhost:8080/fs";
    return [BASE_URL, ...currentPath, ...(extra ? [extra] : [''])].join('/');
}

fileList.addEventListener('click', async (e: Event) => {
    const entry = (e.target as HTMLElement).closest('tr')?.dataset.name ?? '';
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
    const list = entries.map(entry => {
        const tr = document.createElement('tr');
        tr.dataset.name = entry;
        const filename = document.createElement('td');
        filename.textContent = entry;
        filename.classList.add('file-entry');
        tr.appendChild(filename);
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
