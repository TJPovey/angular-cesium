import { Display } from './../../../../../../angular-cesium/src/lib/angular-cesium-widgets/models/basic-edit-update';
import { PolygonEditOptions } from './../../../../../../angular-cesium/src/lib/angular-cesium-widgets/models/polygon-edit-options';
import { WallProps } from './../../../../../../angular-cesium/src/lib/angular-cesium-widgets/models/wall-edit-options';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
// tslint:disable-next-line:max-line-length
import {
  CameraService,
  CesiumService,
  EditActions,
  LabelProps,
  PolygonEditorObservable,
  PolygonEditUpdate,
  PolygonsEditorService
} from 'angular-cesium';

@Component({
  selector: 'polygons-editor-example',
  templateUrl: 'polygons-editor-example.component.html',
  styleUrls: ['./polygons-editor-example.component.css'],
  providers: [PolygonsEditorService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PolygonsEditorExampleComponent implements OnInit {
  editing$: PolygonEditorObservable;
  enableEditing = true;
  tileset: any;
  tilesLocation = {longitude: 0.5433407074863252, latitude: 0.523107775892968, height: 450};

  constructor(private polygonsEditor: PolygonsEditorService, private cesiumService: CesiumService, private camService: CameraService) {
  }

  ngOnInit(): void {
  }

  startEdit() {
    if (this.editing$) {
      this.stopEdit();
    }
    // create accepts PolygonEditOptions object
    this.editing$ = this.polygonsEditor.create();
    this.editing$.subscribe((editUpdate: PolygonEditUpdate) => {
      console.log(editUpdate.points); // point = position with id
      console.log(editUpdate.positions); // or just position
      console.log(editUpdate.updatedPosition); // added position
    });
  }

  startEdit3D() {

    // if (this.editing$) {
    //   this.stopEdit();
    // }
    this.editing$ = this.polygonsEditor.create({
      clampHeightTo3D: true,
      extrudedHeight: 0,
      clampHeightTo3DOptions: {
        clampMostDetailed: true,
        clampToTerrain: false,
        clampToHeightPickWidth: 3,
      },
      allowDrag: true,
      pointProps: {
        heightReference: 0,
      },
      polygonProps: {
        // material: new Cesium.Color(0, 0, 1, 0.3),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
      polylineProps: {
        // material: Cesium.Color.BLACK,
        width: 2.0,
      },
      wallProps: {
        outline: true,
        outlineWidth: 2.0,
        // outlineColor: Cesium.Color.BLACK,
        // material: Cesium.Color.RED,
      }
    });
  }

  updateMaterial() {

    let options: Display = {
      primaryMaterial: Cesium.Color.fromRandom({alpha : 1.0}),
      secondaryMaterial: Cesium.Color.fromRandom({alpha : 1.0}),
      lineMaterial: Cesium.Color.fromRandom({alpha : 1.0}),
    }

    this.editing$.updateDisplay(options);
  }

  stopEdit() {
    if (this.editing$) {
      this.editing$.dispose();
      this.editing$ = undefined;
    }
  }


  editFromExisting() {
    if (this.editing$) {
      this.stopEdit();
    }
    const initialPos = [
      Cesium.Cartesian3.fromDegrees(20, 40),
      Cesium.Cartesian3.fromDegrees(45, 40),
      Cesium.Cartesian3.fromDegrees(30, 20)];
    this.editing$ = this.polygonsEditor.edit(initialPos);
    this.editing$.setLabelsRenderFn((update: PolygonEditUpdate) => {
      let counter = 0;
      const newLabels: LabelProps[] = [];
      update.positions.forEach(position => newLabels.push({
        text: `Point ${counter++}`,
        scale: 0.6,
        eyeOffset: new Cesium.Cartesian3(10, 10, -1000),
        fillColor: Cesium.Color.BLUE,
      }));
      return newLabels;
    });
    setTimeout(() =>
      this.editing$.updateLabels(
        this.editing$.getLabels().map(label => {
          label.text += '*';
          label.fillColor = Cesium.Color.RED;
          label.showBackground = true;
          return label;
        })
      ), 2000);
    this.editing$.subscribe((editUpdate: PolygonEditUpdate) => {
      if (editUpdate.editAction === EditActions.DRAG_POINT_FINISH) {
        console.log(editUpdate.points); // point = position with id
        console.log(editUpdate.positions); // or just position
        console.log(editUpdate.updatedPosition); // added position
      }
    });
  }

  toggleEnableEditing() {
    // Only effects if in edit mode (all polygon points were created)
    if (!this.editing$) {
      return;
    }
    this.enableEditing = !this.enableEditing;
    if (this.enableEditing) {
      this.editing$.enable();
    } else {
      this.editing$.disable();
    }
  }

  updatePointManually() {
    if (this.editing$) {
      // Only effects if in edit mode (all polygon points were created)
      // update current point
      const polygonPoints = this.editing$.getCurrentPoints();
      const firstPoint = polygonPoints[0];
      firstPoint.setPosition(Cesium.Cartesian3.fromDegrees(20, 20));
      const newUpdatedPoints = polygonPoints.map(p => ({
        position: p.getPosition(),
        pointProps: p.props,
      }));
      this.editing$.setManually(newUpdatedPoints);


      // or add new point
      const polygonPositions = this.editing$.getCurrentPoints().map(p => p.getPosition());
      const newPosition = Cesium.Cartesian3.fromDegrees(30, 24);
      polygonPositions.push(newPosition);
      this.editing$.setManually(polygonPositions);
    }
  }
}
