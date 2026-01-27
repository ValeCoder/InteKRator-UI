import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { Dataset, DatasetVersion } from '../../models/dataset.model';
import { DatasetService } from '../../services/dataset.service';
import { ResultsService, TrainingResult } from '../../services/results.service';

interface InferenceNode {
  type: 'action' | 'rule' | 'condition';
  label: string;
  children?: InferenceNode[];
  status?: 'active' | 'inactive';
}

@Component({
  selector: 'app-results-visualizer',
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './results-visualizer.html',
  styleUrl: './results-visualizer.css',
})
export class ResultsVisualizerComponent implements OnInit {
  private datasetService = inject(DatasetService);
  private resultsService = inject(ResultsService);

  datasets = signal<Dataset[]>([]);
  selectedDataset = signal<Dataset | null>(null);
  selectedVersion = signal<DatasetVersion | null>(null);

  trainingResults = signal<TrainingResult[]>([]);
  latestResult = signal<TrainingResult | null>(null);

  currentInputs: string[] = [];
  resultTree = signal<InferenceNode | null>(null);

  isLoading = signal<boolean>(false);
  hasNoTraining = signal<boolean>(false);

  ngOnInit() {
    this.datasetService.getDatasets().subscribe(data => {
      this.datasets.set(data);
    });
  }

  onSelectDataset(dsId: string) {
    const id = parseInt(dsId, 10);
    const ds = this.datasets().find(d => d.id === id);
    if (ds) {
      this.selectedDataset.set(ds);
      this.selectedVersion.set(null);
      this.trainingResults.set([]);
      this.latestResult.set(null);
      this.resultTree.set(null);
      this.hasNoTraining.set(false);
    }
  }

  onSelectVersion(vId: string) {
    const id = parseInt(vId, 10);
    const version = this.selectedDataset()?.versions.find(v => v.id === id);
    if (version) {
      this.selectedVersion.set(version);

      //todo implement parser for tree nodes from result

      const inputCols = cols.slice(0, -1);
      this.currentInputs = new Array(inputCols.length).fill('');

      this.fetchResults(version.id);
    }
  }

  fetchResults(versionId: number) {
    this.isLoading.set(true);
    this.resultsService.getResultsByVersion(versionId).subscribe({
      next: (results) => {
        this.trainingResults.set(results);
        this.isLoading.set(false);

        const completed = results.find(r => r.status === 'Completed');
        if (completed) {
          this.latestResult.set(completed);
          this.hasNoTraining.set(false);
          this.loadResultContent(completed.id);
        } else {
          this.latestResult.set(null);
          this.resultTree.set(null);
          this.hasNoTraining.set(true);
        }
      },
      error: (err) => {
        console.error('Error fetching results:', err);
        this.isLoading.set(false);
      }
    });
  }

  loadResultContent(resultId: number) {
    this.resultsService.getResultContent(resultId).subscribe({
      next: (res) => {
        // TODO: Implement actual parsing of the decision tree text output
        const tree: InferenceNode = {
          type: 'rule',
          label: 'Displaying Raw Result (Parser to be implemented)',
          children: [
            { type: 'condition', label: res.content.substring(0, 100) + '...' }
          ]
        };
        this.resultTree.set(tree);
      }
    });
  }

  runInference() {
    if (!this.selectedDataset() || !this.selectedVersion()) return;

    // todo call an API to evaluate the inputs against the tree
    // stub for now
    console.log('Running inference with', this.currentInputs);
  }
}
