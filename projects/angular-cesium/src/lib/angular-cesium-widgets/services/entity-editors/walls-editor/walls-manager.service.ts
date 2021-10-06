import { EditableWall } from '../../../models/editable-wall';
import { CesiumService } from '../../../../angular-cesium/services/cesium/cesium.service';
import { Injectable } from '@angular/core';
import { Cartesian3 } from '../../../../angular-cesium/models/cartesian3';
import { AcLayerComponent } from '../../../../angular-cesium/components/ac-layer/ac-layer.component';
import { CoordinateConverter } from '../../../../angular-cesium/services/coordinate-converter/coordinate-converter.service';
import { WallEditOptions } from '../../../models/wall-edit-options';

@Injectable()
export class WallsManagerService {
  walls: Map<string, EditableWall> = new Map<string, EditableWall>();

  createEditableWall(
    id: string,
    editWallsLayer: AcLayerComponent,
    editPointsLayer: AcLayerComponent,
    coordinateConverter: CoordinateConverter, 
    cesiumService: CesiumService, 
    wallOptions?: WallEditOptions, 
    positions?: Cartesian3[]) {

    const editableWall = new EditableWall(
      id,
      editWallsLayer,
      editPointsLayer,
      coordinateConverter,
      cesiumService,
      wallOptions,
      positions);

    this.walls.set(id, editableWall);
  }

  get(id: string): EditableWall {
    return this.walls.get(id);
  }

  clear() {
    this.walls.forEach(wall => wall.dispose());
    this.walls.clear();
  }
}
