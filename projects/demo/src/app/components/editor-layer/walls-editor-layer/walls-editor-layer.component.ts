import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CameraService, CesiumService, WallEditorObservable, WallsEditorService } from 'angular-cesium';

@Component({
  selector: 'walls-editor-layer',
  templateUrl: './walls-editor-layer.component.html',
  styleUrls: ['./walls-editor-layer.component.css'],
  providers: [WallsEditorService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WallsEditorLayerComponent implements OnInit {
  
  editing$: WallEditorObservable;
  enableEditing = true;

  constructor(private wallsEditor: WallsEditorService, private cesiumService: CesiumService, private camService: CameraService) { }

  ngOnInit(): void {
  }

  startEdit() {
    if (this.editing$) {
      this.stopEdit();
    }
    // create accepts PolygonEditOptions object
    this.editing$ = this.wallsEditor.create();
  }

  stopEdit() {
    if (this.editing$) {
      this.editing$.dispose();
      this.editing$ = undefined;
    }
  }

}
