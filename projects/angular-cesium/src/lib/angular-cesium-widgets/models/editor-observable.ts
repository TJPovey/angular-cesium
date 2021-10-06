import { Observable } from 'rxjs';
import { Display } from './basic-edit-update';
import { LabelProps } from './label-props';

export class EditorObservable<T> extends Observable<T> {
  dispose: Function;
  enable: Function;
  disable: Function;
  getLabels: () => LabelProps[];
  getEditValue: () => T;
  setLabelsRenderFn: (func: (update: T, labels: LabelProps[]) => LabelProps[]) => void;
  updateLabels: (labels: LabelProps[]) => void;
  updateDisplay: (display: Display) => void;
  getDisplay: () => Display;
}
