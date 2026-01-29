import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TrainingResult {
    id: number;
    datasetVersionId: number;
    filePath: string;
    status: string; // 'Pending', 'Completed', 'Failed'
    createdAt: string;
    errorMessage?: string;
    content?: string; // Content won't be in the list, but we might overlap types
}

@Injectable({
    providedIn: 'root'
})
export class ResultsService {
    private apiUrl = '/api/training';

    constructor(private http: HttpClient) { }

    getResultsByVersion(datasetVersionId: number): Observable<TrainingResult[]> {
        return this.http.get<TrainingResult[]>(`${this.apiUrl}/results/${datasetVersionId}`);
    }

    getResultContent(resultId: number): Observable<{ content: string }> {
        return this.http.get<{ content: string }>(`${this.apiUrl}/result/${resultId}/content`);
    }

    runInference(resultId: number, state: string): Observable<{ output: string }> {
        return this.http.post<{ output: string }>('/api/inference', { resultId, state });
    }
}
