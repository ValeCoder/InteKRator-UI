import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, BarChart3, Target, ScrollText, Binary, X, Info } from 'lucide-angular';
import { Dataset } from '../../models/dataset.model';

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
export class ResultsVisualizerComponent {
  datasets = signal<Dataset[]>([
    {
      id: '1',
      name: 'Grid Welt',
      version: 1,
      createdAt: '',
      description: '',
      columns: ['X', 'Y', 'Hindernis', 'Aktion'],
      content: ''
    }
  ]);

  selectedDataset = signal<Dataset | null>(null);
  currentInputs: string[] = [];

  resultTree = signal<InferenceNode | null>(null);

  onSelectDataset(dsId: string) {
    const ds = this.datasets().find(d => d.id === dsId);
    if (ds) {
      this.selectedDataset.set(ds);
      // Initialize inputs (excluding last column Action)
      const inputCols = ds.columns.slice(0, -1);
      this.currentInputs = new Array(inputCols.length).fill('');
      this.resultTree.set(null);
    }
  }

  runInference() {
    if (!this.selectedDataset()) return;

    // Simulate API call
    // Mock result for Grid Welt
    const action = 'Rechts';

    const tree: InferenceNode = {
      type: 'action',
      label: `Entscheidung: ${action}`,
      status: 'active',
      children: [
        {
          type: 'rule',
          label: 'Regel #1 (Priorität 10)',
          status: 'active',
          children: [
            { type: 'condition', label: 'X == 0', status: 'active' },
            { type: 'condition', label: 'Y == 0', status: 'active' },
            { type: 'condition', label: 'Hindernis != 1', status: 'active' }
          ]
        }
      ]
    };

    this.resultTree.set(tree);
  }
}
