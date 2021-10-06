import { EditModes } from './edit-mode.enum';
import { EditActions } from './edit-actions.enum';
import { LabelProps } from './label-props';

export interface Display {
  primaryMaterial?: any;
  secondaryMaterial?: any;
  lineMaterial?: any;
}


export interface BasicEditUpdate<T> {
  id: string;
  editMode: EditModes;
  editAction: EditActions;
  labelsRenderFn?: (update: T, labels: LabelProps[]) => LabelProps[];
  updateLabels?: LabelProps[];
  display?: Display;
}
