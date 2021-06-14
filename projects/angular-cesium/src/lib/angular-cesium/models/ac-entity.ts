import { EntityType } from './entity-type.enum';

/**
 * Angular Cesium parent entity, all entities should inherit from it.
 * ```typescript
 * entity= new AcEntity({
 *  	id: 0,
 *  	name: 'click me',
 *  	position: Cesium.Cartesian3.fromRadians(0.5, 0.5),
 * });
 * ```
 */
export class AcEntity {

  protected _acEntityType: EntityType;

  /**
   * Creates entity from a json
   * @param json (Optional) entity object
   * @param acEntityType (Optional) The type of the AcEntity
   */
  constructor(json?: any, acEntityType: EntityType = EntityType.DEFAULT) {
    Object.assign(this, json);
    this._acEntityType = acEntityType;
  }

  public get acEntityType(): EntityType {
    return this._acEntityType;
  }
}
