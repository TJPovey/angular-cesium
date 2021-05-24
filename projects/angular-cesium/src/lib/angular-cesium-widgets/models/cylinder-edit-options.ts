import { EditorEditOptions } from './editor-edit-options';


export interface CylinderProps {
  material?: Function;
  outline: boolean
  outlineColor?: any;
  outlineWidth?: number;
  shadows?: any;
  length: number;
  topRadius: number;
  bottomRadius: number;
  fill?: boolean;
}

export interface CylinderEditOptions extends EditorEditOptions {
  cylinderProps?: CylinderProps;
}
