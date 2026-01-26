import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Plus, Save, Copy, Trash2, FileSpreadsheet, Upload, History } from 'lucide-angular';
import { Dataset, DatasetVersion } from '../../models/dataset.model';
import { DatasetService } from '../../services/dataset.service';

@Component({
  selector: 'app-dataset-manager',
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './dataset-manager.html',
  styleUrl: './dataset-manager.css',
})
export class DatasetManagerComponent implements OnInit {
  private datasetService = inject(DatasetService);

  datasets = signal<Dataset[]>([]);
  selectedDataset = signal<Dataset | null>(null);
  selectedVersion = signal<DatasetVersion | null>(null);

  // Layout State
  viewMode = signal<'new' | 'history'>('new');
  isSidebarCollapsed = signal(false);

  // Upload Form
  versionNumber = '';
  versionNotes = '';
  selectedFile: File | null = null;

  ngOnInit() {
    this.loadDatasets();
  }

  loadDatasets() {
    this.datasetService.getDatasets().subscribe(data => {
      this.datasets.set(data);
    });
  }

  selectDataset(ds: Dataset) {
    this.selectedDataset.set(ds);
    this.selectedVersion.set(null);
    this.viewMode.set('new'); // Reset to new version view when selecting dataset
    // Refresh datasets to get latest versions
    this.datasetService.getDataset(ds.id).subscribe(data => {
      this.selectedDataset.set(data);
    });
  }

  createNew() {
    const name = prompt('Name des neuen Datensatzes:');
    if (!name) return;

    this.datasetService.createDataset({ name, description: '' }).subscribe(newDs => {
      this.loadDatasets();
      this.selectDataset(newDs);
    });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  // Layout Methods
  toggleSidebar() {
    this.isSidebarCollapsed.update(v => !v);
  }

  setViewMode(mode: 'new' | 'history') {
    this.viewMode.set(mode);
  }

  // Drag & Drop
  isDragOver = signal(false);

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.selectedFile = files[0];
    }
  }

  uploadVersion() {
    const ds = this.selectedDataset();
    if (!ds || !this.selectedFile || !this.versionNumber) {
      alert('Bitte fülle alle Pflichtfelder aus und wähle eine Datei.');
      return;
    }

    this.datasetService.uploadVersion(
      ds.id,
      this.versionNumber,
      this.versionNotes,
      this.selectedFile
    ).subscribe({
      next: (version) => {
        alert(`Version ${version.versionNumber} erfolgreich hochgeladen.`);
        this.versionNumber = '';
        this.versionNotes = '';
        this.selectedFile = null;
        this.selectDataset(ds); // Refresh versions
      },
      error: (err) => alert('Fehler beim Upload: ' + err.error)
    });
  }

  deleteDataset(ds: Dataset) {
    if (confirm(`Möchtest du den Datensatz "${ds.name}" wirklich löschen?`)) {
      this.datasetService.deleteDataset(ds.id).subscribe(() => {
        if (this.selectedDataset()?.id === ds.id) {
          this.selectedDataset.set(null);
        }
        this.loadDatasets();
      });
    }
  }

  // Manual Grid Mode
  isManualMode = signal(false);
  manualColumns = signal<string[]>(['State1', 'State2', 'Action']);
  manualGrid = signal<string[][]>([['0', '0', '0']]);

  toggleManualMode() {
    this.isManualMode.update(v => !v);
  }

  addColumn(name: string) {
    if (!name) return;
    this.manualColumns.update(cols => [...cols, name]);
    this.manualGrid.update(grid => grid.map(row => [...row, '0']));
  }

  removeColumn(index: number) {
    this.manualColumns.update(cols => cols.filter((_, i) => i !== index));
    this.manualGrid.update(grid => grid.map(row => row.filter((_, i) => i !== index)));
  }

  addRow() {
    const cols = this.manualColumns().length;
    this.manualGrid.update(grid => [...grid, Array(cols).fill('0')]);
  }

  deleteRow(index: number) {
    this.manualGrid.update(grid => grid.filter((_, i) => i !== index));
  }

  updateCell(rowIndex: number, colIndex: number, value: string) {
    const grid = [...this.manualGrid()];
    grid[rowIndex] = [...grid[rowIndex]];
    grid[rowIndex][colIndex] = value;
    this.manualGrid.set(grid);
  }

  saveManualVersion() {
    const ds = this.selectedDataset();
    if (!ds || !this.versionNumber) {
      alert('Bitte gib einen Datensatz und eine Versionsnummer an.');
      return;
    }

    const content = this.manualGrid().map(row => row.join(' ')).join('\n');

    this.datasetService.createManualVersion(
      ds.id,
      this.versionNumber,
      this.versionNotes,
      this.manualColumns(),
      content
    ).subscribe({
      next: (version) => {
        alert(`Manuelle Version ${version.versionNumber} erstellt.`);
        this.versionNumber = '';
        this.versionNotes = '';
        this.isManualMode.set(false);
        this.selectDataset(ds);
      },
      error: (err) => alert('Fehler: ' + err.error)
    });
  }

  deleteVersion(version: DatasetVersion) {
    if (confirm(`Möchtest du Version ${version.versionNumber} wirklich löschen?`)) {
      this.datasetService.deleteVersion(version.id).subscribe(() => {
        const ds = this.selectedDataset();
        if (ds) this.selectDataset(ds);
      });
    }
  }
}
