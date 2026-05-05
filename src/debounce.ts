const Debounce = (f: (...params: any[]) => void, ms: number) => {
    let timeout = 0;
    const toExec = (...params: any[]) => f(...params);
    return (...params: any[]) => {
        clearTimeout(timeout);
        timeout = setTimeout(toExec, ms, ...params)
    }
}

export default Debounce
