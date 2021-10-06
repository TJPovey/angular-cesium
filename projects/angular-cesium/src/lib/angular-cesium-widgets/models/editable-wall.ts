import { AcEntity } from "../../angular-cesium/models/ac-entity";
import { EditPoint } from "./edit-point";
import { EditPolyline } from "./edit-polyline";
import { AcLayerComponent } from "../../angular-cesium/components/ac-layer/ac-layer.component";
import { Cartesian3 } from "../../angular-cesium/models/cartesian3";
import { CoordinateConverter } from "../../angular-cesium/services/coordinate-converter/coordinate-converter.service";
import { PointProps } from "./point-edit-options";
import { PolylineEditOptions, PolylineProps } from "./polyline-edit-options";
import { GeoUtilsService } from "../../angular-cesium/services/geo-utils/geo-utils.service";
import { defaultLabelProps, LabelProps } from "./label-props";
import { EntityType } from "../../angular-cesium/models/entity-type.enum";
import { EditWall } from "./edit-wall";
import { WallEditOptions, WallProps } from "./wall-edit-options";
import { CesiumService } from './../../angular-cesium/services/cesium/cesium.service';
import { Display } from "./basic-edit-update";

export class EditableWall extends AcEntity {
  public wall: EditWall;
  private positions: EditPoint[] = [];
  private movingPoint: EditPoint;
  private doneCreation = false;
  private _height: number = 5;
  private _enableEdit = true;
  private _pointProps: PointProps;
  private _wallProps: WallProps;
  private lastDraggedToPosition: any;
  private _labels: LabelProps[] = [];
  private _wallOptions: WallEditOptions;
  private _display: Display;

  constructor(
    private id: string,
    private wallsLayer: AcLayerComponent,
    private pointsLayer: AcLayerComponent,
    private coordinateConverter: CoordinateConverter,
    private cesiumService: CesiumService,
    private wallEditOptions: WallEditOptions,
    positions?: Cartesian3[]
  ) {
    super();
    this._acEntityType = EntityType.EDITABLE_PARENT;
    this.wallProps = {...wallEditOptions.wallProps};
    this.pointProps = {...wallEditOptions.pointProps};
    this.wallOptions = {...wallEditOptions};
    this._display = {
      primaryMaterial: this.wallProps.material,
      lineMaterial: this.wallProps.outlineColor,
    };

    if (positions && positions.length >= 2) {
      // TODO: Implement create from existing
      // this.createFromExisting(positions);
    }
  }

  get labels(): LabelProps[] {
    return this._labels;
  }

  set labels(labels: LabelProps[]) {
    if (!labels) {
      return;
    }
    const positions = this.getRealPositions();
    this._labels = labels.map((label, index) => {
        if (!label.position) {
            label.position = positions[index];
        }
        return Object.assign({}, defaultLabelProps, label);
    });
  }

  get wallProps(): WallProps {
    return this._wallProps;
  }

  set wallProps(value: WallProps) {
    this._wallProps = value;
  }

  get wallOptions(): WallEditOptions {
    return this._wallOptions;
  }

  set wallOptions(value: WallEditOptions) {
    this._wallOptions = value;
  }

  get pointProps(): PointProps {
    return this._pointProps;
  }

  set pointProps(value: PointProps) {
    this._pointProps = value;
  }

  get enableEdit() {
    return this._enableEdit;
  }

  set enableEdit(value: boolean) {
    this._enableEdit = value;
    this.positions.forEach((point) => {
      point.show = value;
      this.updatePointsLayer(false, point);
    });
  }

  get height(): number {
    return this._height;
  }

  set height(value: number) {
    // minimum height 0.1 - warn user
    this._height = value < 0.1 ? 0.1 : value;
  }

  public get display(): Display {
    return this._display;
  }

  private addAllVirtualEditPoints() {
    const currentPoints = [...this.positions];
    currentPoints.forEach((pos, index) => {
      if (index !== currentPoints.length - 1) {
        const currentPoint = pos;
        const nextIndex = (index + 1) % (currentPoints.length);
        const nextPoint = currentPoints[nextIndex];
        const midPoint = this.setMiddleVirtualPoint(currentPoint, nextPoint);
        this.updatePointsLayer(false, midPoint);
      }
    });
  }

  private setMiddleVirtualPoint(
    firstP: EditPoint,
    secondP: EditPoint
  ): EditPoint {
    const midPointCartesian3 = Cesium.Cartesian3.lerp(
      firstP.getPosition(),
      secondP.getPosition(),
      0.5,
      new Cesium.Cartesian3()
    );
    let midPoint: EditPoint = new EditPoint(
      this.id,
      midPointCartesian3,
      this.pointProps,
      undefined,
      EntityType.EDITABLE_CHILD
    );
    midPoint.setVirtualEditPoint(true);

    const firstIndex = this.positions.indexOf(firstP);
    this.positions.splice(firstIndex + 1, 0, midPoint);
    return midPoint;
  }

  private updateMiddleVirtualPoint(
    virtualEditPoint: EditPoint,
    prevPoint: EditPoint,
    nextPoint: EditPoint
  ) {
    const midPointCartesian3 = Cesium.Cartesian3.lerp(
      prevPoint.getPosition(),
      nextPoint.getPosition(),
      0.5,
      new Cesium.Cartesian3()
    );
    virtualEditPoint.setPosition(midPointCartesian3);
    return;
  }

  changeVirtualPointToRealPoint(point: EditPoint) {
    point.setVirtualEditPoint(false);
    const pointsCount = this.positions.length;
    const pointIndex = this.positions.indexOf(point);
    const nextIndex = (pointIndex + 1) % pointsCount;
    const preIndex = (pointIndex - 1 + pointsCount) % pointsCount;

    const nextPoint = this.positions[nextIndex];
    const prePoint = this.positions[preIndex];

    const firstMidPoint = this.setMiddleVirtualPoint(prePoint, point);
    const secMidPoint = this.setMiddleVirtualPoint(point, nextPoint);
    this.updatePointsLayer(true, firstMidPoint, secMidPoint, point);
  }

  private renderWall() {

    const realPositions = this.getAllRealPositions();

    if(!this.wall) {
      this.wall = new EditWall(
        this.id,
        realPositions,
        this.height,
        this.wallProps,
        EntityType.EDITABLE_CHILD
      );
      this.wallsLayer.update(this.wall, this.wall.getId());
    } else {
      this.wall.setPositions(realPositions);
    }
  }

  addPoint(position: Cartesian3) {
    if (this.doneCreation) {
      return;
    }
    const isFirstPoint = !this.positions.length;
    if (isFirstPoint) {
      const firstPoint = new EditPoint(this.id, position, this.pointProps, undefined, EntityType.EDITABLE_CHILD);
      this.positions.push(firstPoint);
      this.updatePointsLayer(true, firstPoint);
    }

    this.movingPoint = new EditPoint(this.id, position.clone(), this.pointProps, undefined, EntityType.EDITABLE_CHILD);
    this.positions.push(this.movingPoint);

    this.updatePointsLayer(true, this.movingPoint);
  }

  movePointFinish(editPoint: EditPoint) {
    editPoint.props.disableDepthTestDistance = Number.POSITIVE_INFINITY;
    this.updatePointsLayer(false, editPoint);
    // this.renderWidgets();
  }

  movePoint(toPosition: Cartesian3, editPoint: EditPoint) {
    editPoint.setPosition(toPosition);
    if (this.doneCreation) {
      if (editPoint.props.disableDepthTestDistance) { // && this.polygonEditOptions.clampHeightTo3D
        // To avoid bug with pickPosition() on point with disableDepthTestDistance
        editPoint.props.disableDepthTestDistance = undefined;
        return; // ignore first move because the pickPosition() could be wrong
      }

      if (editPoint.isVirtualEditPoint()) {
        this.changeVirtualPointToRealPoint(editPoint);
      }

      const pointsCount = this.positions.length;
      const pointIndex = this.positions.indexOf(editPoint);

      if (pointIndex < this.positions.length - 1) {
        const nextVirtualPoint = this.positions[(pointIndex + 1) % (pointsCount)];
        const nextRealPoint = this.positions[(pointIndex + 2) % (pointsCount)];
        this.updateMiddleVirtualPoint(nextVirtualPoint, editPoint, nextRealPoint);
      }

      if (pointIndex > 0) {
        const prevVirtualPoint = this.positions[((pointIndex - 1) + pointsCount) % pointsCount];
        const prevRealPoint = this.positions[((pointIndex - 2) + pointsCount) % pointsCount];
        this.updateMiddleVirtualPoint(prevVirtualPoint, editPoint, prevRealPoint);
      }
    }
    this.updatePointsLayer(true, editPoint);
  }

  moveTempMovingPoint(toPosition: Cartesian3) {
    if (this.movingPoint) {
      this.movePoint(toPosition, this.movingPoint);
    }
  }

  removePoint(pointToRemove: EditPoint) {
    this.removePosition(pointToRemove);
    this.positions
      .filter(p => p.isVirtualEditPoint())
      .forEach(p => this.removePosition(p));
    this.addAllVirtualEditPoints();

    this.renderWall();
    // this.renderWidgets();
  }

  addLastPoint(position: Cartesian3) {
    this.doneCreation = true;
    this.removePosition(this.movingPoint); // remove movingPoint
    this.movingPoint = null;
    // this.renderWidgets();
    this.addAllVirtualEditPoints();
  }

/*
  updateHeight(polygonOptions: PolygonEditOptions) {
    this.polygonOptions = {...this.polygonOptions, ...polygonOptions};
    this.polygonProps = {...this.polygonProps, ...polygonOptions.polygonProps};
    this.height = this.polygonOptions.extrudedHeight;
    // this.polygonsLayer.update(this, this.id); only required when not using polygon callbacks for height and height reference
    this.renderWall();
    // this.renderPolylines();
    // update vector position
    // this.vectorWidget.position = this.getTopCentrePoint();
  }
*/

  updateDisplay(display: Display) {
    this._display = display;
    this.wall.props.material = display.primaryMaterial;
    this.wall.props.outlineColor = display.lineMaterial;
    this.wallsLayer.update(this.wall, this.wall.getId());
  }


  getRealPositions(): Cartesian3[] {
    return this.getRealPoints().map(position => position.getPosition());
  }

  getRealPoints(): EditPoint[] {
    return this.positions.filter(position => !position.isVirtualEditPoint() && position !== this.movingPoint);
  }

  getAllRealPoints(): EditPoint[] {
    return this.positions.filter(position => !position.isVirtualEditPoint());
  }

  getAllRealPositions(): Cartesian3[] {
    return this.getAllRealPoints().map(position => position.getPosition());
  }

  // TODO: required?
  getAllVirtualPoints(): EditPoint[] {
    return this.positions.filter(position => position.isVirtualEditPoint() && position !== this.movingPoint);
  }

  getPoints(): EditPoint[] {
    return this.positions.filter(position => position !== this.movingPoint);
  }

  getMaxHeight(): number {
    return this.getAllRealPositions()
      .map(pos => Cesium.Cartographic.fromCartesian(pos).height)
      .reduce((prev, next) => prev > next ? prev : next, 0) + this.height;
  }

  getMaxHeightCallback() {
    return new Cesium.CallbackProperty(this.getMaxHeight.bind(this), false);
  }

  private removePosition(point: EditPoint) {
    const index = this.positions.findIndex((p) => p === point);
    if (index < 0) {
      return;
    }
    this.positions.splice(index, 1);
    this.pointsLayer.remove(point.getId());
  }

  private updatePointsLayer(renderWalls = true, ...points: EditPoint[]) {
    if (renderWalls) {
      this.renderWall();
    }
    points.forEach(p => this.pointsLayer.update(p, p.getId()));
  }

  dispose() {

    // if (this.vectorWidget) {
    //   this.widgetLayer.remove(this.vectorWidget.getId());
    //   this.vectorWidget = undefined;
    // }
    
    if (this.wall) {
      this.wallsLayer.remove(this.wall.getId());
      this.wall = undefined;
    }

    this.positions.forEach(editPoint => {
      this.pointsLayer.remove(editPoint.getId());
    });

    if (this.movingPoint) {
      this.pointsLayer.remove(this.movingPoint.getId());
      this.movingPoint = undefined;
    }
    this.positions.length = 0;

  }

  getPointsCount(): number {
    return this.positions.length;
  }

  getId() {
    return this.id;
  }
}
