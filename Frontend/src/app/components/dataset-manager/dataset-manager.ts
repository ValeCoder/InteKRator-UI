import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Plus, Save, Copy, Trash2, FileSpreadsheet, Upload, History, ChevronUp, ChevronDown } from 'lucide-angular';
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

  // Creation State
  creationSource = signal<'upload' | 'manual' | 'copy'>('upload');

  // Upload Form
  versionNumber = '';
  versionNotes = '';
  selectedFile: File | null = null;
  useFirstRowAsHeader = signal(true);
  uploadColumns = signal<string[]>(['State1', 'State2', 'Action']); // Reusing logic but separate from manual grid

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

  setCreationSource(source: 'upload' | 'manual' | 'copy') {
    this.creationSource.set(source);
  }

  // Copy from Version
  sourceVersionId = signal<number | null>(null);

  createFromVersion() {
    const ds = this.selectedDataset();
    const sourceId = this.sourceVersionId();

    if (!ds || !sourceId) {
      alert('Bitte eine Quell-Version wählen.');
      return;
    }

    // Find the source version object
    const sourceVersion = ds.versions.find(v => v.id === sourceId);
    if (!sourceVersion) {
      alert('Version nicht gefunden.');
      return;
    }

    // Parse content to grid
    const grid = this.getParsedContent(sourceVersion);
    const cols = this.getColumns(sourceVersion);

    if (grid.length === 0 || cols.length === 0) {
      alert('Die gewählte Version hat keinen gültigen Inhalt.');
      return;
    }

    // Switch to manual mode with pre-filled data
    this.manualColumns.set(cols);
    this.manualGrid.set(grid);

    // Switch to manual mode
    this.creationSource.set('manual');
    alert('Daten wurden in den Editor geladen. Sie können diese nun bearbeiten und speichern.');
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

  addUploadColumn(name: string) {
    if (!name) return;
    this.uploadColumns.update(cols => [...cols, name]);
  }

  removeUploadColumn(index: number) {
    this.uploadColumns.update(cols => cols.filter((_, i) => i !== index));
  }

  uploadVersion() {
    const ds = this.selectedDataset();
    if (!ds || !this.selectedFile || !this.versionNumber) {
      alert('Bitte fülle alle Pflichtfelder aus und wähle eine Datei.');
      return;
    }

    // If manual columns enabled, check if we have columns
    if (!this.useFirstRowAsHeader() && this.uploadColumns().length === 0) {
      alert('Bitte definieren Sie mindestens eine Spalte.');
      return;
    }

    this.datasetService.uploadVersion(
      ds.id,
      this.versionNumber,
      this.versionNotes,
      this.selectedFile,
      this.useFirstRowAsHeader(),
      this.useFirstRowAsHeader() ? undefined : this.uploadColumns()
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
  // isManualMode deprecated in favor of creationSource, but keeping for compatibility if referenced elsewhere. 
  // Actually, let's remove references to isManualMode logic and rely on creationSource.
  // But wait, the template uses isManualMode(). Let's map it.
  isManualMode() { return this.creationSource() === 'manual'; }

  manualColumns = signal<string[]>(['State1', 'State2', 'Action']);
  manualGrid = signal<string[][]>([['0', '0', '0']]);

  toggleManualMode() {
    // Legacy support or remove? We will update template to use setCreationSource.
    if (this.creationSource() === 'manual') this.creationSource.set('upload');
    else this.creationSource.set('manual');
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

  trackByIndex(index: number, item: any): number {
    return index;
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
        this.creationSource.set('upload'); // Reset
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

  // Accordion Logic
  expandedVersionId = signal<number | null>(null);

  toggleVersion(versionId: number) {
    this.expandedVersionId.update(current => current === versionId ? null : versionId);
  }

  getParsedContent(version: DatasetVersion): string[][] {
    if (!version.content) return [];

    // Split by newlines for rows
    const rows = version.content.trim().split('\n');

    // Split each row by spaces (handling multiple spaces if necessary)
    return rows.map(row => row.trim().split(/\s+/));
  }

  getColumns(version: DatasetVersion): string[] {
    if (Array.isArray(version.columns)) {
      return version.columns;
    }
    // Fallback if columns is a string (e.g. "Col1, Col2")
    if (typeof version.columns === 'string') {
      const cols: string = version.columns;
      return cols.split(',').map(c => c.trim());
    }
    return [];
  }
}
