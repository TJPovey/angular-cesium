import { CesiumEvent } from '../../angular-cesium/services/map-events-mananger/consts/cesium-event.enum';
import { CesiumEventModifier } from '../../angular-cesium/services/map-events-mananger/consts/cesium-event-modifier.enum';
import { EditorEditOptions } from './editor-edit-options';
import { PolylineEditOptions } from './polyline-edit-options';

export interface WallDisplay {
  wallMaterial: any;
  lineMaterial: any;
}

export interface WallProps {
  material?: any;
  outline?: boolean
  outlineColor?: any;
  outlineWidth?: number;
  shadows?: any;
}

export interface WallEditOptions extends PolylineEditOptions {
  clampHeightTo3DOptions?: any;
  addLastPointEvent?: CesiumEvent;
  addLastPointModifier?: CesiumEventModifier;
  removePointEvent?: CesiumEvent;
  removePointModifier?: CesiumEventModifier;
  maximumNumberOfPoints?: number;
  wallProps?: WallProps;
  
}
