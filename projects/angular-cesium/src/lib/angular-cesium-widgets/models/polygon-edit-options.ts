import { PolylineEditOptions } from './polyline-edit-options';

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
}
