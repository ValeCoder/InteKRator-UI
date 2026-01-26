import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DatasetManager } from './dataset-manager';

describe('DatasetManager', () => {
  let component: DatasetManager;
  let fixture: ComponentFixture<DatasetManager>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatasetManager]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DatasetManager);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
