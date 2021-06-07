import { EditorEditOptions } from './editor-edit-options';


export interface VectorProps {
  position?: any;
  direction?: any;
  length?: number;
  minimumLengthInPixels?: number;
  color?: any;
}

export interface VectorEditOptions extends EditorEditOptions {
  vectorProps?: VectorProps;
}
