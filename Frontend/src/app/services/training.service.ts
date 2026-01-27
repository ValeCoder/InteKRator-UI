import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TrainingResult {
    id: number;
    datasetVersionId: number;
    status: string;
    createdAt: string;
    errorMessage?: string;
    filePath?: string;
}

@Injectable({
    providedIn: 'root'
})
export class TrainingService {
    private http = inject(HttpClient);
    private apiUrl = '/api/training';

    startTraining(datasetVersionId: number): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`${this.apiUrl}/start/${datasetVersionId}`, {});
    }

    getResults(datasetVersionId: number): Observable<TrainingResult[]> {
        return this.http.get<TrainingResult[]>(`${this.apiUrl}/results/${datasetVersionId}`);
    }

    getResultContent(resultId: number): Observable<{ content: string }> {
        return this.http.get<{ content: string }>(`${this.apiUrl}/result/${resultId}/content`);
    }
}
