import { EntityType } from './entity-type.enum';

export interface AcEntity {
  _acentityType?: EntityType;
}

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

  protected _acEntityType?: EntityType;

  /**
   * Creates entity from a json
   * @param json entity object
   * @returns entity as AcEntity
   */
  static create(json?: any) {
    // TODO: May need to add acentitytype here, can't find where this is called
    // if (json) {
    //   return Object.assign(new AcEntity(), json);
    // }
    return new AcEntity();
  }

  /**
   * Creates entity from a json
   * @param json (Optional) entity object
   */
  constructor(json?: any, acEntityType: EntityType = EntityType.DEFAULT) {
    Object.assign(this, json);
    this._acEntityType = acEntityType;
  }

  public get acEntityType(): EntityType {
    return this._acEntityType;
  }

}
