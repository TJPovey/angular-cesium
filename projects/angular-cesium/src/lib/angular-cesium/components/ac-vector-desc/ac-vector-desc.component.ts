import { Component, forwardRef } from '@angular/core';
import { BasicDesc } from '../../services/basic-desc/basic-desc.service';
import { LayerService } from '../../services/layer-service/layer-service.service';
import { ComputationCache } from '../../services/computation-cache/computation-cache.service';
import { CesiumProperties } from '../../services/cesium-properties/cesium-properties.service';
import { VectorDrawerService } from '../../services/drawers/vector-drawer/vector-drawer.service';


@Component({
  selector: 'ac-vector-desc',
  template: '',
  providers: [{provide: BasicDesc, useExisting: forwardRef(() => AcVectorDescComponent)}],
})
export class AcVectorDescComponent extends BasicDesc {

  constructor(drawerService: VectorDrawerService, layerService: LayerService,
              computationCache: ComputationCache, cesiumProperties: CesiumProperties) {
    super(drawerService, layerService, computationCache, cesiumProperties);
  }
}
