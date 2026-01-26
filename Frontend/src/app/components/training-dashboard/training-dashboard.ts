import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Play, LayoutDashboard, Database, Activity, Info } from 'lucide-angular';
import { Dataset } from '../../models/dataset.model';
import { DatasetService } from '../../services/dataset.service';

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

  datasets = signal<Dataset[]>([]);
  selectedDatasetId = signal<number | null>(null);

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

  startTraining() {
    if (!this.selectedDatasetId()) {
      alert('Bitte wähle einen Datensatz aus.');
      return;
    }

    this.isTraining.set(true);
    this.logs.set(['Training gestartet...', 'Lade Datensatz...', 'IntegkratorToolbox.jar wird aufgerufen...']);

    // Simulate process
    setTimeout(() => {
      this.logs.update(l => [...l, 'Daten werden diskretisiert...', 'Regeln werden gelernt...']);
    }, 1500);

    setTimeout(() => {
      this.logs.update(l => [...l, 'Training erfolgreich abgeschlossen.', 'Wissensbasis wurde gespeichert.']);
      this.isTraining.set(false);
    }, 3000);
  }
}
