import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Dataset, DatasetVersion } from '../models/dataset.model';

@Injectable({
    providedIn: 'root'
})
export class DatasetService {
    private http = inject(HttpClient);
    private apiUrl = 'api/dataset'; // Assuming proxy or base URL configuration
    private versionUrl = 'api/version';

    getDatasets(): Observable<Dataset[]> {
        return this.http.get<Dataset[]>(this.apiUrl);
    }

    getDataset(id: number): Observable<Dataset> {
        return this.http.get<Dataset>(`${this.apiUrl}/${id}`);
    }

    createDataset(dataset: Partial<Dataset>): Observable<Dataset> {
        return this.http.post<Dataset>(this.apiUrl, dataset);
    }

    updateDataset(id: number, dataset: Dataset): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${id}`, dataset);
    }

    deleteDataset(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    getVersions(datasetId: number): Observable<DatasetVersion[]> {
        return this.http.get<DatasetVersion[]>(`${this.versionUrl}/dataset/${datasetId}`);
    }

    createManualVersion(datasetId: number, versionNumber: string, notes: string, columns: string[], content: string): Observable<DatasetVersion> {
        return this.http.post<DatasetVersion>(`${this.versionUrl}/manual`, {
            datasetId, versionNumber, notes, columns, content
        });
    }

    uploadVersion(datasetId: number, versionNumber: string, notes: string, file: File, useFirstRowAsHeader: boolean, columns?: string[]): Observable<DatasetVersion> {
        const formData = new FormData();
        formData.append('datasetId', datasetId.toString());
        formData.append('versionNumber', versionNumber);
        formData.append('notes', notes);
        formData.append('file', file);
        formData.append('useFirstRowAsHeader', useFirstRowAsHeader.toString());

        if (columns && columns.length > 0) {
            formData.append('manualColumns', columns.join(','));
        }

        return this.http.post<DatasetVersion>(`${this.versionUrl}/upload`, formData);
    }

    deleteVersion(id: number): Observable<void> {
        return this.http.delete<void>(`${this.versionUrl}/${id}`);
    }
}
