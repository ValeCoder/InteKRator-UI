import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Play, LayoutDashboard, Database, Activity, Info } from 'lucide-angular';
import { Dataset, DatasetVersion } from '../../models/dataset.model';
import { DatasetService } from '../../services/dataset.service';
import { TrainingService } from '../../services/training.service';

interface TrainingConfig {
  top: boolean;
  all: boolean;
  discretize: boolean;
  discretizeParams: string;
  preselect: boolean;
  preselectN: number | null;
  sample: boolean;
  sampleN: string;
  avoid: string;
  important: boolean;
  importantSD: number;
}

@Component({
  selector: 'app-training-dashboard',
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './training-dashboard.html',
  styleUrl: './training-dashboard.css',
})
export class TrainingDashboardComponent implements OnInit {
  private datasetService = inject(DatasetService);
  private trainingService = inject(TrainingService);

  datasets = signal<Dataset[]>([]);
  selectedDatasetId = signal<number | null>(null);
  selectedVersionId = signal<number | null>(null);

  selectedDataset = signal<Dataset | null>(null);

  config = signal<TrainingConfig>({
    top: false,
    all: false,
    discretize: false,
    discretizeParams: '',
    preselect: false,
    preselectN: null,
    sample: false,
    sampleN: '',
    avoid: '',
    important: false,
    importantSD: 1.0
  });

  isTraining = signal(false);
  logs = signal<string[]>([]);

  ngOnInit() {
    this.datasetService.getDatasets().subscribe(data => {
      this.datasets.set(data);
    });
  }

  onDatasetChange(id: number) {
    this.selectedDatasetId.set(id);
    const ds = this.datasets().find(d => d.id == id) || null;
    this.selectedDataset.set(ds);
    // Reset version selection
    this.selectedVersionId.set(null);
    // Auto-select latest version if available
    if (ds && ds.versions.length > 0) {
      // Assuming sorted or just pick last/first. Let's pick the one with highest ID or just first.
      // Usually latest is added last.
      const latest = ds.versions.reduce((prev, current) => (prev.id > current.id) ? prev : current);
      this.selectedVersionId.set(latest.id);
    }
  }

  startTraining() {
    const versionId = this.selectedVersionId();
    if (!versionId) {
      alert('Bitte wähle eine Version aus.');
      return;
    }

    this.isTraining.set(true);
    this.logs.set(['Training gestartet...', 'Anfrage an Backend gesendet...']);

    this.trainingService.startTraining(versionId).subscribe({
      next: (response) => {
        this.logs.update(l => [...l, 'Backend: ' + response.message, 'Prozess läuft im Hintergrund...']);
        // Start polling for results
        this.pollResults(versionId);
      },
      error: (err) => {
        console.error(err);
        this.logs.update(l => [...l, 'Fehler beim Starten: ' + (err.error?.message || err.message)]);
        this.isTraining.set(false);
      }
    });
  }

  pollResults(versionId: number) {
    const intervalId = setInterval(() => {
      this.trainingService.getResults(versionId).subscribe({
        next: (results) => {
          // Find the latest result for this training session (simplification: assume the latest one created is ours)
          // In a real app we might want the process ID or result ID returned from start.
          // But sorting by createdAt desc, the first one should be the one we just started.
          if (results.length > 0) {
            const latest = results[0];
            if (latest.status === 'Completed') {
              this.logs.update(l => [...l, 'Training erfolgreich abgeschlossen!', 'Status: Completed']);
              this.isTraining.set(false);
              clearInterval(intervalId);
            } else if (latest.status === 'Failed') {
              this.logs.update(l => [...l, 'Training fehlgeschlagen.', 'Fehler: ' + latest.errorMessage]);
              this.isTraining.set(false);
              clearInterval(intervalId);
            } else {
              // Still running
              // We could log updates but we don't want to spam
            }
          }
        },
        error: (err) => {
          this.logs.update(l => [...l, 'Fehler beim Abrufen des Status.']);
          clearInterval(intervalId);
          this.isTraining.set(false);
        }
      });
    }, 2000); // Poll every 2 seconds
  }
}
