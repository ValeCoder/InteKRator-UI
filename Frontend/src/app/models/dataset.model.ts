export interface Dataset {
    id: number;
    name: string;
    description: string;
    createdAt: string;
    versions: DatasetVersion[];
    columns?: string[]; // Keep for compatibility with existing components
}

export interface DatasetVersion {
    id: number;
    versionNumber: string;
    notes: string;
    filePath: string;
    columns: string[];
    content: string;
    createdAt: string;
    datasetId: number;
}
