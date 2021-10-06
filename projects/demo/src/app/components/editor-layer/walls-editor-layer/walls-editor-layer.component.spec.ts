import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WallsEditorLayerComponent } from './walls-editor-layer.component';

describe('WallsEditorLayerComponent', () => {
  let component: WallsEditorLayerComponent;
  let fixture: ComponentFixture<WallsEditorLayerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WallsEditorLayerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WallsEditorLayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
