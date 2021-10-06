import { WallProps } from './wall-edit-options';
import { AcEntity } from '../../angular-cesium/models/ac-entity';
import { Cartesian3 } from '../../angular-cesium/models/cartesian3';
import { EntityType } from '../../angular-cesium/models/entity-type.enum';

export class EditWall extends AcEntity {
  static counter = 0;
  private id: string;
  private editedEntityId: string;
  private positions: Cartesian3[];
  private _show = true;
  private _height: number;
  private _wallProps: WallProps;

  constructor(entityId: string, positions: Cartesian3[], height: number, wallProps?: WallProps, acEntityType: EntityType = EntityType.DEFAULT) {
    super();
    this.editedEntityId = entityId;
    this.positions = positions;
    this._height = height;
    this.id = this.generateId();
    this._wallProps = {...wallProps};
    this._acEntityType = acEntityType;
  }

  get props(): WallProps {
    return this._wallProps;
  }

  set props(value: WallProps) {
    this._wallProps = value;
  }

  get show() {
    return this._show;
  }

  set show(value) {
    this._show = value;
  }

  get height() {
    return this._height;
  }

  set height(value) {
    this._height = value;
  }

  getEditedEntityId(): string {
    return this.editedEntityId;
  }

  getPositions(): any[] {
    return this.positions.map(p => p.clone());
  }

  getWallPositionsCallback() {
    return new Cesium.CallbackProperty(this.getPositions.bind(this), false);
  }

  getPositionsMinHeight(): number[] {
    return this.getPositions().map(pos => 
      Cesium.Cartographic.fromCartesian(pos).height);
  }

  getPositionsMinHeightCallback() {
    return new Cesium.CallbackProperty(this.getPositionsMinHeight.bind(this), false);
  }

  getPositionsMaxHeight(): number[] {
    const positions = this.getPositionsMinHeight();
    const maxHeight = positions
      .reduce((prev, next) => prev > next ? prev : next, 0)
      + this.height;
    return Array(positions.length).fill(maxHeight);
  }

  getPositionsConstantHeight(): number[] {
    return this.getPositionsMinHeight().map(pos => pos + this.height);
  }

  getPositionsMaxHeightCallback() {
    return new Cesium.CallbackProperty(this.getPositionsMaxHeight.bind(this), false);
  }

  getPositionsConstantHeightCallback() {
    return new Cesium.CallbackProperty(this.getPositionsConstantHeight.bind(this), false);
  }

  setPositions(positions: Cartesian3[]) {
    this.positions = positions;
  }

  getId(): string {
    return this.id;
  }

  private generateId(): string {
    return 'edit-wall-' + EditWall.counter++;
  }
}
