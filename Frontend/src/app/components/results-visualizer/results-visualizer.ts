import { Component, signal, OnInit, inject, ElementRef, ViewChildren, QueryList, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { Dataset, DatasetVersion } from '../../models/dataset.model';
import { DatasetService } from '../../services/dataset.service';
import { ResultsService, TrainingResult } from '../../services/results.service';

interface InferenceNode {
  id: string; // unique ID for SVG connections
  type: 'outcome' | 'rule' | 'condition';
  label: string;
  confidence?: number;
  children?: InferenceNode[];
}

interface ConnectionLine {
  path: string;
  fromId: string;
  toId: string;
  active: boolean;
}

@Component({
  selector: 'app-results-visualizer',
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './results-visualizer.html',
  styleUrl: './results-visualizer.css',
})
export class ResultsVisualizerComponent implements OnInit, AfterViewChecked {
  private datasetService = inject(DatasetService);
  private resultsService = inject(ResultsService);
  private cdr = inject(ChangeDetectorRef);

  datasets = signal<Dataset[]>([]);
  selectedDataset = signal<Dataset | null>(null);
  selectedVersion = signal<DatasetVersion | null>(null);

  trainingResults = signal<TrainingResult[]>([]);
  latestResult = signal<TrainingResult | null>(null);

  currentInputs: string[] = [];

  outcomes = signal<InferenceNode[]>([]);
  connectionLines: ConnectionLine[] = [];

  // Pan & Zoom State
  transform = { x: 0, y: 0, scale: 1 };
  isDragging = false;
  lastMousePosition = { x: 0, y: 0 };

  // Dimenstions for SVG - largely flexible now if we just overlay
  svgHeight = 0;
  svgWidth = 0;

  isLoading = signal<boolean>(false);
  hasNoTraining = signal<boolean>(false);

  @ViewChildren('nodeElement') nodeElements!: QueryList<ElementRef>;
  activeRuleId: string | null = null;

  ngOnInit() {
    this.datasetService.getDatasets().subscribe(data => {
      this.datasets.set(data);
    });
  }

  ngAfterViewChecked() {
    this.updateLines();
  }

  // PAN & ZOOM LOGIC
  onWheel(event: WheelEvent) {
    if (!this.outcomes().length) return;
    event.preventDefault();
    const zoomIntensity = 0.1;
    const direction = event.deltaY > 0 ? -1 : 1;
    let newScale = this.transform.scale + (direction * zoomIntensity);

    // Clamp scale
    newScale = Math.min(Math.max(0.2, newScale), 3);

    this.transform.scale = newScale;
    this.updateLines(); // Update lines might be needed if lines are not scaled via CSS
  }

  startDrag(event: MouseEvent) {
    if (!this.outcomes().length) return;
    // Only drag if clicking on the background, not nodes
    if ((event.target as HTMLElement).closest('.node')) return;

    this.isDragging = true;
    this.lastMousePosition = { x: event.clientX, y: event.clientY };
  }

  onDrag(event: MouseEvent) {
    if (!this.isDragging) return;
    event.preventDefault();

    const dx = event.clientX - this.lastMousePosition.x;
    const dy = event.clientY - this.lastMousePosition.y;

    this.transform.x += dx;
    this.transform.y += dy;

    this.lastMousePosition = { x: event.clientX, y: event.clientY };
  }

  stopDrag() {
    this.isDragging = false;
  }

  resetView() {
    this.transform = { x: 0, y: 0, scale: 1 };
  }

  centerCanvas() {
    // Simple offset to start slightly padded
    this.transform = { x: 50, y: 50, scale: 1 };
  }


  onSelectDataset(dsId: string) {
    const id = parseInt(dsId, 10);
    const ds = this.datasets().find(d => d.id === id);
    if (ds) {
      this.selectedDataset.set(ds);
      this.selectedVersion.set(null);
      this.trainingResults.set([]);
      this.latestResult.set(null);
      this.outcomes.set([]);
      this.hasNoTraining.set(false);
      this.resetView();
    }
  }

  onSelectVersion(vId: string) {
    const id = parseInt(vId, 10);
    const version = this.selectedDataset()?.versions.find(v => v.id === id);
    if (version) {
      this.selectedVersion.set(version);

      const cols = (this.selectedDataset()?.columns || []);
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
          this.outcomes.set([]);
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
        const parsed = this.parseResultText(res.content);
        this.outcomes.set(parsed);
        // Delay to allow DOM render
        setTimeout(() => {
          this.centerCanvas();
          this.updateLines();
        }, 100);
      }
    });
  }

  parseResultText(text: string): InferenceNode[] {
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    const rulesMap = new Map<string, InferenceNode[]>();

    // Helper to format text: "no_overweight" -> "No Overweight"
    const formatLabel = (str: string) => {
      return str
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
    };

    let ruleCounter = 1;

    lines.forEach(line => {
      // rule-based lines containing arrow
      if (line.includes('->')) {
        const parts = line.split('->');
        const conditionsPart = parts[0].trim();
        const actionPart = parts[1].trim();

        const conditions = conditionsPart.split('^').map(c => formatLabel(c.trim()));

        // Parse "recovery [0.8]"
        const match = actionPart.match(/(.+)\s+\[([\d.]+)\]/);
        const actionLabel = formatLabel(match ? match[1].trim() : actionPart);
        const confidence = match ? parseFloat(match[2]) : 0;

        const ruleId = `rule-${ruleCounter++}`;
        const ruleNode: InferenceNode = {
          id: ruleId,
          type: 'rule',
          label: `Rule #${ruleCounter - 1}`,
          confidence: confidence,
          children: conditions.map((c, i) => ({
            id: `${ruleId}-cond-${i}`,
            type: 'condition',
            label: c
          }))
        };

        const currentRules = rulesMap.get(actionLabel) || [];
        currentRules.push(ruleNode);
        rulesMap.set(actionLabel, currentRules);
      } else {
        // Fallback for lines like "no_recovery [0.55]" (default rule / prior)
        const match = line.match(/(.+)\s+\[([\d.]+)\]/);
        if (match) {
          const actionLabel = formatLabel(match[1].trim());
          const confidence = parseFloat(match[2]);

          // Create a "Default Rule" or "Base Probability" node?
          // Or just treat as a rule with no conditions
          const ruleId = `rule-${ruleCounter++}`;
          const ruleNode: InferenceNode = {
            id: ruleId,
            type: 'rule',
            label: 'Base Probability',
            confidence: confidence,
            children: []
          };

          const currentRules = rulesMap.get(actionLabel) || [];
          currentRules.push(ruleNode);
          rulesMap.set(actionLabel, currentRules);
        }
      }
    });

    const outcomes: InferenceNode[] = [];
    let outcomeIdCounter = 1;

    rulesMap.forEach((rules, actionLabel) => {
      // Sort rules by confidence descending
      rules.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

      outcomes.push({
        id: `outcome-${outcomeIdCounter++}`,
        type: 'outcome',
        label: actionLabel,
        children: rules
      });
    });

    return outcomes;
  }

  updateLines() {
    if (!this.nodeElements || this.outcomes().length === 0) return;

    const newLines: ConnectionLine[] = [];
    const nodeRects = new Map<string, DOMRect>();

    this.nodeElements.forEach(el => {
      const native = el.nativeElement as HTMLElement;
      const id = native.getAttribute('id');
      if (id) {
        nodeRects.set(id, native.getBoundingClientRect());
      }
    });

    const content = document.querySelector('.canvas-content');
    if (!content) return;

    const contentRect = content.getBoundingClientRect(); // Scaled Rect of wrapper
    // We want coordinates relative to .canvas-content's Origin (top-left) but UNSCALED.
    // Because the SVG is inside .canvas-content, it transforms WITH it.

    const scale = this.transform.scale;

    const getRelPos = (rect: DOMRect, point: 'left' | 'right') => {
      const x = point === 'left' ? rect.left : rect.right;
      const y = rect.top + rect.height / 2;

      return {
        x: (x - contentRect.left) / scale,
        y: (y - contentRect.top) / scale
      };
    };

    this.outcomes().forEach(outcome => {
      const outRect = nodeRects.get(outcome.id);
      if (!outRect) return;
      const outPos = getRelPos(outRect, 'right');

      outcome.children?.forEach(rule => {
        const ruleRect = nodeRects.get(rule.id);
        if (!ruleRect) return;
        const ruleInPos = getRelPos(ruleRect, 'left');
        const ruleOutPos = getRelPos(ruleRect, 'right');

        const isActive = this.activeRuleId === rule.id;

        newLines.push({
          fromId: outcome.id,
          toId: rule.id,
          path: this.createBezier(outPos.x, outPos.y, ruleInPos.x, ruleInPos.y),
          active: isActive
        });

        rule.children?.forEach(cond => {
          const condRect = nodeRects.get(cond.id);
          if (!condRect) return;
          const condPos = getRelPos(condRect, 'left');

          newLines.push({
            fromId: rule.id,
            toId: cond.id,
            path: this.createBezier(ruleOutPos.x, ruleOutPos.y, condPos.x, condPos.y),
            active: isActive
          });
        });
      });
    });

    this.connectionLines = newLines;

    // Update SVG dimensions to match the unscaled layout size
    // We can query the unscaled size by looking at .graph-layout's offsetWidth/Height?
    // But .graph-layout is inside .canvas-content which is transformed...
    // Actually offsetWidth/Height reflects unscaled size for transformed elements.
    const layout = document.querySelector('.graph-layout') as HTMLElement;
    if (layout) {
      this.svgWidth = layout.offsetWidth;
      this.svgHeight = layout.offsetHeight;
    }

    this.cdr.detectChanges();
  }

  createBezier(x1: number, y1: number, x2: number, y2: number): string {
    const cpOffset = Math.abs(x2 - x1) * 0.5;
    return `M ${x1} ${y1} C ${x1 + cpOffset} ${y1}, ${x2 - cpOffset} ${y2}, ${x2} ${y2}`;
  }

  setActiveRule(ruleId: string | null) {
    this.activeRuleId = ruleId;
    this.updateLines();
  }

  runInference() {
    // stub
    console.log('Running inference with', this.currentInputs);
  }
}
