export interface Dataset {
    id: string;
    name: string;
    version: number;
    createdAt: string;
    description: string;
    columns: string[]; // Names of the state variables and the action (last one)
    content: string; // Raw text content "s1 s2 a\n..."
}

export interface DatasetVersion {
    version: number;
    createdAt: string;
    content: string;
}
