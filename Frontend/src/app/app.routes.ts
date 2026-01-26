import { Routes } from '@angular/router';
import { DatasetManagerComponent } from './components/dataset-manager/dataset-manager';
import { TrainingDashboardComponent } from './components/training-dashboard/training-dashboard';
import { ResultsVisualizerComponent } from './components/results-visualizer/results-visualizer';

export const routes: Routes = [
    { path: 'datasets', component: DatasetManagerComponent },
    { path: 'training', component: TrainingDashboardComponent },
    { path: 'results', component: ResultsVisualizerComponent },
    { path: '', redirectTo: 'datasets', pathMatch: 'full' },
    { path: '**', redirectTo: 'datasets' }
];
