import { AcEntity } from '../../angular-cesium/models/ac-entity';
import { EntityType } from '../../angular-cesium/models/entity-type.enum';
import { Cartesian3 } from '../../angular-cesium/models/cartesian3';
import { VectorProps } from './vector-edit-options';

export class EditVector extends AcEntity {
  static counter = 0;
  private id: string;
  private editedEntityId: string;
  private _show = true;
  private _length: number;
  private _vectorProps: VectorProps;
  private _position: Cartesian3;
  private _direction: Cartesian3;

  constructor(entityId: string, position: Cartesian3, direction: Cartesian3, length: number, vectorProps?: VectorProps, acEntityType: EntityType = EntityType.DEFAULT) {
    super();
    this.editedEntityId = entityId;
    this._length = length;
    this.id = this.generateId();
    this._vectorProps = {...vectorProps};
    this._position = position;
    this._direction = direction;
    this._acEntityType = acEntityType;
  }

  get props(): VectorProps {
    return this._vectorProps;
  }
  set props(value: VectorProps) {
    this._vectorProps = value;
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

  get position(): Cartesian3 {
    return this._position;
  }
  set position(value: Cartesian3) {
    this._position = value;
  }

  get direction(): Cartesian3 {
    return this._direction;
  }
  set direction(value: Cartesian3) {
    this._direction = value;
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
    return 'edit-vector-' + EditVector.counter++;
  }
}
