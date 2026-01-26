import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultsVisualizer } from './results-visualizer';

describe('ResultsVisualizer', () => {
  let component: ResultsVisualizer;
  let fixture: ComponentFixture<ResultsVisualizer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResultsVisualizer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResultsVisualizer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
