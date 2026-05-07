const filepath = document.getElementById('filepath-breadcrumb') as HTMLDivElement;
const fileList = document.getElementById('entries') as HTMLTableElement;

const url = "http://localhost:8080/fs";
let current_path = [] as string[];

fileList.addEventListener('click', async (e: Event) => {
    let entry = (e.target as HTMLElement).closest('tr')?.dataset.name ?? '';

    if (entry[entry.length - 1] !== '/') {
        current_path.push(entry);
        window.location.href = `${url}/${current_path.join('/')}`;
        return;
    }

    entry = entry.slice(0, -1);

    if (entry === '..') {
        current_path.pop();
    } else {
        window.location.href = `${getUrl()}/${entry}`;
        return;
    }

    await reqListUpdate();
})

window.addEventListener('popstate', async (e: PopStateEvent) => {
    current_path = e.state?.path ?? [];
    await reqListUpdate();
})

const updatePath = () => {
    let list = [];
    const sep = document.createElement('span');
    sep.textContent = '/';
    sep.dataset.curr = '0';
    list.push(sep);

    current_path.forEach((component, i) => {
        console.log(component);
        const comp = document.createElement('span');
        comp.dataset.curr = i.toString();
        comp.textContent = component;
        list.push(comp)

        const sep = document.createElement('span');
        sep.textContent = '/';
        sep.dataset.curr = i.toString();
        list.push(sep);
    });

    filepath.replaceChildren(...list);
}

filepath.addEventListener('click', async (e: Event) => {
    const span = (e.target as HTMLElement).closest('span');
    const index = Number(span?.dataset.curr);
    current_path = current_path.slice(0, index);

    history.pushState({ path: [...current_path] }, '', `${url}/${current_path.join('/')}`)
})

const updateList = (entries: string[]) => {
    const list = entries.map(entry => {
        const tr = document.createElement('tr');
        tr.dataset.name = entry;
        const filename = document.createElement('td');
        filename.textContent = entry;
        tr.appendChild(filename);
        return tr
    });

    fileList.replaceChildren(...list);
}

const reqListUpdate = async () => {
    const reqUrl = `${url}/${current_path.join('/')}`;

    try {
        const resp = await fetch(reqUrl);
        if (!resp.ok) {
            throw new Error(`status: ${resp.status}`);
        }
        const result = await resp.json();
        console.log(result);
        updatePath();
        const entries = current_path.length > 0 ? ['../', ...result['entries']] : result['entries'];
        updateList(entries);
    } catch (error: any) {
        console.log(error.message)
    }
}

history.pushState({ path: [...current_path] }, '', `${url}/${current_path.join('/')}`)
reqListUpdate()
