import { AcEntity } from '../../angular-cesium/models/ac-entity';
import { EntityType } from '../../angular-cesium/models/entity-type.enum';
import { Cartesian3 } from '../../angular-cesium/models/cartesian3';
import { CylinderProps } from './cylinder-edit-options';

export class EditCylinder extends AcEntity {
  static counter = 0;
  private id: string;
  private editedEntityId: string;
  private _show = true;
  private _length: number;
  private _cylinderProps: CylinderProps;
  private _topRadius: number;
  private _bottomRadius: number;
  private _position: Cartesian3;

  constructor(entityId: string, position: Cartesian3, topRadius: number, bottomRadius: number, length: number, cylinderProps?: CylinderProps, acEntityType: EntityType = EntityType.DEFAULT) {
    super();
    this.editedEntityId = entityId;
    this._length = length;
    this.id = this.generateId();
    this._cylinderProps = {...cylinderProps};
    this._topRadius = topRadius;
    this._bottomRadius = bottomRadius;
    this._position = position;
    this._acEntityType = acEntityType;
  }

  get props(): CylinderProps {
    return this._cylinderProps;
  }
  set props(value: CylinderProps) {
    this._cylinderProps = value;
  }

  get show() {
    return this._show;
  }
  set show(value) {
    this._show = value;
  }

  get length() {
    return this._length;
  }
  set length(value) {
    this._length = value;
  }

  get topRadius(): number {
    return this._topRadius;
  }
  set topRadius(value: number) {
    this._topRadius = value;
  }

  get bottomRadius(): number {
    return this._bottomRadius;
  }
  set bottomRadius(value: number) {
    this._bottomRadius = value;
  }

  get position(): Cartesian3 {
    return this._position;
  }
  set position(value: Cartesian3) {
    this._position = value;
  }

  getEditedEntityId(): string {
    return this.editedEntityId;
  }

  getPosition(): Cartesian3 {
    return this.position.clone();
  }

  getPositionCallback(): Cartesian3 {
    return new Cesium.CallbackProperty(this.getPosition.bind(this), false);
  }

  setPositions(position: Cartesian3) {
    this.position = position;
  }

  getId(): string {
    return this.id;
  }

  private generateId(): string {
    return 'edit-cylinder-' + EditCylinder.counter++;
  }
}
