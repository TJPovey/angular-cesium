import { MapsManagerService } from './../../../../../angular-cesium/src/lib/angular-cesium/services/maps-manager/maps-manager.service';
import { CesiumService } from './../../../../../angular-cesium/src/lib/angular-cesium/services/cesium/cesium.service';
import { MapTerrainProviderOptions } from './../../../../../angular-cesium/src/lib/angular-cesium/models/map-terrain-provider-options.enum';
import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { AcMapComponent, MapLayerProviderOptions, SceneMode, ViewerConfiguration } from 'angular-cesium';
import { AppSettingsService } from '../../services/app-settings-service/app-settings-service';
import { Viewer } from 'cesium';

@Component({
  selector: 'demo-map',
  templateUrl: './demo-map.component.html',
  providers: [ViewerConfiguration, MapsManagerService],
  styleUrls: ['./demo-map.component.css']
})
export class DemoMapComponent implements AfterViewInit {
  @ViewChild(AcMapComponent) map: AcMapComponent;
  sceneMode = SceneMode.SCENE3D;
  Cesium = Cesium;
  viewer: Viewer = null;
  mapboxStyleImageryProvider = MapLayerProviderOptions.MapboxStyleImageryProvider;
  mapTerrainProvider = MapTerrainProviderOptions.WorldTerrain;
  constructor(private viewerConf: ViewerConfiguration,
              public appSettingsService: AppSettingsService,
              public mapsManager: MapsManagerService) {
    viewerConf.viewerOptions = {
      selectionIndicator: false,
      timeline: false,
      infoBox: false,
      fullscreenButton: false,
      baseLayerPicker: false,
      animation: false,
      shouldAnimate: false,
      homeButton: false,
      geocoder: true,
      navigationHelpButton: false,
      navigationInstructionsInitiallyVisible: false,
      mapMode2D: Cesium.MapMode2D.ROTATE,
    };

    viewerConf.viewerModifier = (viewer: any) => {
      viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
    };

    this.appSettingsService.showTracksLayer = true;
  }

  ngAfterViewInit(): void {

   this.viewer = this.map.getCesiumViewer();


    var tileset = this.viewer.scene.primitives.add(
      new Cesium.Cesium3DTileset({
        url: Cesium.IonResource.fromAssetId(89181),
      })
    );
    
    tileset.readyPromise
      .then(() => {
        this.viewer.zoomTo(tileset);
      })
      .otherwise((error) => {
        console.log(error);
      })
  }
}
