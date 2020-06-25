export function min(values : number[]): number {
    if (values.length == 0) {
        throw new RangeError("No values given")
    }
    let v = values[0]
    values.forEach((i) => {v = Math.min(v, i)})
    return v
}

export function max(values : number[]): number {
    if (values.length == 0) {
        throw new RangeError("No values given")
    }
    let v = values[0]
    values.forEach((i) => {v = Math.max(v, i)})
    return v
}

