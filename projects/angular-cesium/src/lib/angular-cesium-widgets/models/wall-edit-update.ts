import { WallEditOptions, WallDisplay } from './wall-edit-options';
import { EditPoint } from './edit-point';
import { Cartesian3 } from '../../angular-cesium/models/cartesian3';
import { BasicEditUpdate } from './basic-edit-update';

export interface WallEditUpdate extends BasicEditUpdate<WallEditUpdate> {
  positions?: Cartesian3[];
  updatedPosition?: Cartesian3;
  draggedPosition?: Cartesian3;
  points?: EditPoint[];
  updatedPoint?: EditPoint;
  wallOptions?: WallEditOptions;
  wallDisplay?: WallDisplay;
}
