export interface Cell {
    col: number,
    row: number,
    value: number,
    isGiven: boolean,
    candidates: Set<number>,
}

export interface Unit {
    col?: number,
    row?: number,
    cells: Cell[],
}

export interface Column extends Unit {
    col: number,
}

export interface Row extends Unit {
    row: number,
}

export interface Box extends Unit {
    col: number,
    row: number,
}

export interface Board {
    boxSize: number,
    units: Unit[],
}