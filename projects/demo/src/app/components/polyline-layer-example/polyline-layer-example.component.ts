import { Component, OnInit } from '@angular/core';
import { AcEntity, AcNotification, ActionType } from 'angular-cesium';
import { map } from 'rxjs/operators';
import { from, Observable } from 'rxjs';

@Component({
  selector: 'polyline-layer-example',
  template: `
      <ac-layer acFor="let polyline of polylines$" [context]="this" [show]="show">
          <ac-polyline-desc props="{
              width : 8,
              positions: polyline.positions,
              material: polyline.material,
            }">
          </ac-polyline-desc>
      </ac-layer>

  `,
})
export class PolylineLayerExampleComponent implements OnInit {
  polylines$: Observable<AcNotification>;

  entities = [new AcEntity ({
    id: '1',
    material: Cesium.Color.RED.withAlpha(0.5),
    positions: Cesium.Cartesian3.fromDegreesArray([-75, 35, -125, 35]),
    }),
    new AcEntity ({
      id: '2',
      material: new Cesium.PolylineGlowMaterialProperty({
        glowPower: 0.2,
        taperPower: 0.5,
        color: Cesium.Color.CORNFLOWERBLUE
      }),
      positions: Cesium.Cartesian3.fromDegreesArray([-75, 37, -125, 37]),
    }),
    new AcEntity ({
      id: '3',
      material:  new Cesium.PolylineOutlineMaterialProperty({
        color : Cesium.Color.ORANGE,
        outlineWidth : 2,
        outlineColor : Cesium.Color.BLACK
      }),
      positions: Cesium.Cartesian3.fromDegreesArray([-75, 39, -125, 39]),
    })
  ];
  Cesium = Cesium;
  show = true;

  constructor() {
  }

  ngOnInit() {
    this.polylines$ = from(this.entities).pipe(map((entity: any) => ({
      id: entity.id,
      actionType: ActionType.ADD_UPDATE,
      entity: entity,
    })));
  }

  setShow($event: boolean) {
    this.show = $event;
  }

}
