import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Plus, Save, Copy, Trash2, FileSpreadsheet } from 'lucide-angular';
import { Dataset } from '../../models/dataset.model';

@Component({
  selector: 'app-dataset-manager',
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './dataset-manager.html',
  styleUrl: './dataset-manager.css',
})
export class DatasetManagerComponent {
  datasets = signal<Dataset[]>([
    {
      id: '1',
      name: 'Grid Welt',
      version: 1,
      createdAt: new Date().toISOString(),
      description: 'Einfache Navigation in einer Grid-Welt',
      columns: ['X', 'Y', 'Hindernis', 'Aktion'],
      content: '0 0 0 Rechts\n0 1 0 Unten'
    }
  ]);

  selectedDataset = signal<Dataset | null>(null);
  currentGrid = signal<string[][]>([]);

  // Computed view for grid (if needed, or just use currentGrid)
  parsedData = computed(() => this.currentGrid());

  selectDataset(ds: Dataset) {
    this.selectedDataset.set({ ...ds }); // Clone to avoid direct mutation
    this.parseContentToGrid(ds.content);
  }

  createNew() {
    const newDs: Dataset = {
      id: crypto.randomUUID(),
      name: 'New Dataset',
      version: 1,
      createdAt: new Date().toISOString(),
      description: '',
      columns: ['State1', 'State2', 'Action'],
      content: ''
    };
    this.datasets.update(list => [newDs, ...list]);
    this.selectDataset(newDs);
  }

  duplicate() {
    const current = this.selectedDataset();
    if (!current) return;

    const copy: Dataset = {
      ...current,
      id: crypto.randomUUID(),
      name: current.name + ' (Copy)',
      version: 1,
      createdAt: new Date().toISOString()
    };
    this.datasets.update(list => [copy, ...list]);
    this.selectDataset(copy);
  }

  saveNewVersion() {
    const current = this.selectedDataset();
    if (!current) return;

    // Serialize grid
    current.content = this.currentGrid().map(row => row.join(' ')).join('\n');

    // Increment version
    const newVersion: Dataset = {
      ...current,
      id: crypto.randomUUID(),
      version: current.version + 1,
      createdAt: new Date().toISOString()
    };

    // In a real app, we'd save to backend here.
    // For now, just add to list.
    // Ideally we replace the "latest" in the list or show history.
    // I'll just add it to top for now.

    this.datasets.update(list => [newVersion, ...list]);
    this.selectedDataset.set(newVersion);
    alert(`Saved version ${newVersion.version}`);
  }

  // Grid editing
  parseContentToGrid(content: string) {
    if (!content) {
      this.currentGrid.set([]);
      return;
    }
    const rows = content.trim().split('\n').map(line => line.trim().split(/\s+/));
    this.currentGrid.set(rows);
  }

  updateCell(rowIndex: number, colIndex: number, value: string) {
    const grid = [...this.currentGrid()]; // Shallow copy array
    grid[rowIndex] = [...grid[rowIndex]]; // Shallow copy row
    grid[rowIndex][colIndex] = value;
    this.currentGrid.set(grid);
  }

  addRow() {
    const cols = this.selectedDataset()?.columns.length || 0;
    const newRow = Array(cols).fill('0');
    this.currentGrid.update(grid => [...grid, newRow]);
  }

  deleteRow(index: number) {
    this.currentGrid.update(grid => grid.filter((_, i) => i !== index));
  }

  // Schema editing
  addColumn(name: string) {
    if (!name) return;
    this.selectedDataset.update(ds => {
      if (!ds) return null;
      return { ...ds, columns: [...ds.columns, name] };
    });
    // Update grid
    this.currentGrid.update(grid => grid.map(row => [...row, '0']));
  }

  removeColumn(index: number) {
    this.selectedDataset.update(ds => {
      if (!ds) return null;
      const newCols = [...ds.columns];
      newCols.splice(index, 1);
      return { ...ds, columns: newCols };
    });
    // Update grid
    this.currentGrid.update(grid => grid.map(row => {
      const newRow = [...row];
      newRow.splice(index, 1);
      return newRow;
    }));
  }
}

