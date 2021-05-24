import { CesiumEvent } from '../../angular-cesium/services/map-events-mananger/consts/cesium-event.enum';
import { CesiumEventModifier } from '../../angular-cesium/services/map-events-mananger/consts/cesium-event-modifier.enum';
import { EditorEditOptions } from './editor-edit-options';


export interface WallProps {
  material?: Function;
  outline: boolean
  outlineColor?: any;
  outlineWidth?: number;
  shadows?: any;
}

export interface WallEditOptions extends EditorEditOptions {
  addLastPointEvent?: CesiumEvent;
  addLastPointModifier?: CesiumEventModifier;
  removePointEvent?: CesiumEvent;
  removePointModifier?: CesiumEventModifier;
  maximumNumberOfPoints?: number;
  wallProps?: WallProps;
}
