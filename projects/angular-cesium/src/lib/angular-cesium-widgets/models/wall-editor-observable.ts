import { WallEditUpdate } from './wall-edit-update';
import { EditPoint } from './edit-point';
import { EditorObservable } from './editor-observable';
import { PointProps } from './point-edit-options';
import { Cartesian3 } from '../../angular-cesium/models/cartesian3';
import { WallProps } from './wall-edit-options';


export class WallEditorObservable extends EditorObservable<WallEditUpdate> {
  setManually: (points: { position: Cartesian3, pointProp?: PointProps }[] | Cartesian3[],
                wallProps?: WallProps) => void;
  getCurrentPoints: () => EditPoint[];
}
