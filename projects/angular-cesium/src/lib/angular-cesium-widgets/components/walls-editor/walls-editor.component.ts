import { EditableWall } from './../../models/editable-wall';
import { WallEditUpdate } from './../../models/wall-edit-update';
import { WallsManagerService } from './../../services/entity-editors/walls-editor/walls-manager.service';
import { WallsEditorService } from './../../services/entity-editors/walls-editor/walls-editor.service';
import { ChangeDetectionStrategy, Component, OnDestroy, ViewChild } from '@angular/core';
import { CesiumService } from '../../../angular-cesium/services/cesium/cesium.service';
import { EditModes } from '../../models/edit-mode.enum';
import { AcNotification } from '../../../angular-cesium/models/ac-notification';
import { EditActions } from '../../models/edit-actions.enum';
import { AcLayerComponent } from '../../../angular-cesium/components/ac-layer/ac-layer.component';
import { CoordinateConverter } from '../../../angular-cesium/services/coordinate-converter/coordinate-converter.service';
import { MapEventsManagerService } from '../../../angular-cesium/services/map-events-mananger/map-events-manager';
import { Subject } from 'rxjs';
import { CameraService } from '../../../angular-cesium/services/camera/camera.service';
import { EditPoint } from '../../models/edit-point';
import { LabelProps } from '../../models/label-props';
import { EditVector } from '../../models/edit-vector';

@Component({
  selector: 'walls-editor',
  template: /*html*/ `

    <ac-layer #editPointsLayer acFor="let point of editPoints$" [context]="this">
      <ac-point-desc
        props="{
        position: point.getPositionCallbackProperty(),
        pixelSize: getPointSize(point),
        color: point.props.color,
        outlineColor: point.props.outlineColor,
        outlineWidth: point.props.outlineWidth,
        show: getPointShow(point),
        disableDepthTestDistance: point.props.disableDepthTestDistance,
        heightReference: point.props.heightReference,
    }"
      >
      </ac-point-desc>
    </ac-layer>

    <ac-layer #editWallsLayer acFor="let wall of editWalls$" [context]="this">
      <ac-wall-desc props="{
        positions: wall.getWallPositionsCallback(),
        minimumHeights: wall.getPositionsMinHeightCallback(),
        maximumHeights: wall.getPositionsConstantHeightCallback(),
        outline: wall.props.outline,
        outlineColor: wall.props.outlineColor,
        outlineWidth: wall.props.outlineWidth,
        material: wall.props.material
      }">
      </ac-wall-desc>
    </ac-layer>
  `,
  providers: [CoordinateConverter, WallsManagerService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WallsEditorComponent implements OnDestroy {
  private editLabelsRenderFn: (update: WallEditUpdate, labels: LabelProps[]) => LabelProps[];
  public Cesium = Cesium;
  public editPoints$ = new Subject<AcNotification>();
  public editWalls$ = new Subject<AcNotification>();

  @ViewChild('editPointsLayer') private editPointsLayer: AcLayerComponent;
  @ViewChild('editWallsLayer') private editWallsLayer: AcLayerComponent;

  constructor(
    private wallsEditor: WallsEditorService,
    private coordinateConverter: CoordinateConverter,
    private mapEventsManager: MapEventsManagerService,
    private cameraService: CameraService,
    private wallsManager: WallsManagerService,
    private cesiumService: CesiumService
  ) {
    this.wallsEditor.init(this.mapEventsManager, this.coordinateConverter, this.cameraService, wallsManager, this.cesiumService);
    this.startListeningToEditorUpdates();
  }

  private startListeningToEditorUpdates() {
    this.wallsEditor.onUpdate().subscribe((update: WallEditUpdate) => {
      if (update.editMode === EditModes.CREATE || update.editMode === EditModes.CREATE_OR_EDIT) {
        this.handleCreateUpdates(update);
      } else if (update.editMode === EditModes.EDIT) {
        this.handleEditUpdates(update);
      }
    });
  }

  getLabelId(element: any, index: number): string {
    return index.toString();
  }

  renderEditLabels(wall: EditableWall, update: WallEditUpdate, labels?: LabelProps[]) {
    update.positions = wall.getRealPositions();
    update.points = wall.getRealPoints();

    if (labels) {
      wall.labels = labels;
      this.editWallsLayer.update(wall, wall.getId());
      return;
    }

    if (!this.editLabelsRenderFn) {
      return;
    }

    wall.labels = this.editLabelsRenderFn(update, wall.labels);
    this.editWallsLayer.update(wall, wall.getId());
  }

  removeEditLabels(wall: EditableWall) {
    wall.labels = [];
    this.editWallsLayer.update(wall, wall.getId());
  }

  handleCreateUpdates(update: WallEditUpdate) {
    switch (update.editAction) {
      case EditActions.INIT: {
        this.wallsManager.createEditableWall(
          update.id,
          this.editWallsLayer,
          this.editPointsLayer,
          this.coordinateConverter,
          this.cesiumService,
          update.wallOptions,
        );
        break;
      }
      case EditActions.MOUSE_MOVE: {
        const wall = this.wallsManager.get(update.id);
        if (update.updatedPosition) {
          wall.moveTempMovingPoint(update.updatedPosition);
          this.renderEditLabels(wall, update);
        }
        break;
      }
      case EditActions.ADD_POINT: {
        const wall = this.wallsManager.get(update.id);
        if (update.updatedPosition) {
          wall.addPoint(update.updatedPosition);
          this.renderEditLabels(wall, update);
        }
        break;
      }
      case EditActions.ADD_LAST_POINT: {
        const wall = this.wallsManager.get(update.id);
        if (update.updatedPosition) {
          wall.addLastPoint(update.updatedPosition);
          this.renderEditLabels(wall, update);
        }
        break;
      }
      case EditActions.DISPOSE: {
        const wall = this.wallsManager.get(update.id);
        if (wall) {
          wall.dispose();
          //TODO: See polyline-editor component for adding extra ac-layer for labels
          // this.removeEditLabels(wall);
          // this.editLabelsRenderFn = undefined;
        }
        break;
      }
      case EditActions.SET_EDIT_LABELS_RENDER_CALLBACK: {
        const wall = this.wallsManager.get(update.id);
        this.editLabelsRenderFn = update.labelsRenderFn;
        this.renderEditLabels(wall, update);
        break;
      }
      case EditActions.UPDATE_EDIT_LABELS: {
        const wall = this.wallsManager.get(update.id);
        this.renderEditLabels(wall, update, update.updateLabels);
        break;
      }
      case EditActions.SET_MANUALLY: {
        const wall = this.wallsManager.get(update.id);
        this.renderEditLabels(wall, update, update.updateLabels);
        break;
      }
      default: {
        return;
      }
    }
  }

  handleEditUpdates(update: WallEditUpdate) {
    switch (update.editAction) {
      case EditActions.INIT: {
        this.wallsManager.createEditableWall(
          update.id,
          this.editWallsLayer,
          this.editPointsLayer,
          this.coordinateConverter,
          this.cesiumService,
          update.wallOptions,
          update.positions,
        );
        break;
      }
      case EditActions.DRAG_POINT: {
        const wall = this.wallsManager.get(update.id);
        if (wall && wall.enableEdit) {
          wall.movePoint(update.updatedPosition, update.updatedPoint);
          this.renderEditLabels(wall, update);
        }
        break;
      }
      case EditActions.DRAG_POINT_FINISH: {
        const wall = this.wallsManager.get(update.id);
        if (wall && wall.enableEdit) {
          wall.movePointFinish(update.updatedPoint);

          if (update.updatedPoint.isVirtualEditPoint()) {
            wall.changeVirtualPointToRealPoint(update.updatedPoint);
            this.renderEditLabels(wall, update);
          }
        }
        break;
      }
      case EditActions.REMOVE_POINT: {
        const wall = this.wallsManager.get(update.id);
        if (wall && wall.enableEdit) {
          wall.removePoint(update.updatedPoint);
          this.renderEditLabels(wall, update);
        }
        break;
      }
      case EditActions.DISABLE: {
        const wall = this.wallsManager.get(update.id);
        if (wall) {
          wall.enableEdit = false;
          this.renderEditLabels(wall, update);
        }
        break;
      }
      case EditActions.DRAG_SHAPE: {
        const wall = this.wallsManager.get(update.id);
        if (wall && wall.enableEdit) {
          // wall.movePolygon(update.draggedPosition, update.updatedPosition);
          this.renderEditLabels(wall, update);
        }
        break;
      }

      case EditActions.DRAG_SHAPE_FINISH: {
        const wall = this.wallsManager.get(update.id);
        if (wall && wall.enableEdit) {
          // wall.endMovePolygon();
          this.renderEditLabels(wall, update);
        }
        break;
      }
      case EditActions.ENABLE: {
        const wall = this.wallsManager.get(update.id);
        if (wall) {
          wall.enableEdit = true;
          this.renderEditLabels(wall, update);
        }
        break;
      }
      case EditActions.TRANSFORM: {
        const wall = this.wallsManager.get(update.id);
        if (wall) {
          wall.enableEdit = true;
          // wall.updateHeight(update.wallOptions);
          this.renderEditLabels(wall, update);
        }
        break;
      }
      case EditActions.SET_MATERIAL: {
        const wall = this.wallsManager.get(update.id);
        if (wall) {
          wall.updateDisplay(update.display);
        }
        break;
      }
      default: {
        return;
      }
    }
  }

  ngOnDestroy(): void {
    this.wallsManager.clear();
  }

  getPointSize(point: EditPoint) {
    return point.isVirtualEditPoint() ? point.props.virtualPointPixelSize : point.props.pixelSize;
  }

  getPointShow(point: EditPoint) {
    return point.show && (point.isVirtualEditPoint() ? point.props.showVirtual : point.props.show);
  }

  getWidgetShow(widget: EditVector) {
    return widget.show;
  }

}
