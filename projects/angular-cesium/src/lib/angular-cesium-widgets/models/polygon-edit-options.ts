import { PolylineEditOptions } from './polyline-edit-options';
import { WallProps } from './wall-edit-options';

export interface PolygonDisplay {
  polygonMaterial: any;
  wallMaterial: any;
  polylineMaterial: any;
}

export interface PolygonProps {
  material?: any;
  fill?: boolean;
  classificationType?: any;
  zIndex?: any;
  extrudedHeight?: number;
  extrudedHeightReference?: any,
  height?: number,
  heightReference?: any,
  closeBottom?: boolean;
}

export interface PolygonEditOptions extends PolylineEditOptions {
  polygonProps?: PolygonProps;
  extrudedHeight?: number;
  wallProps?: WallProps;
}
