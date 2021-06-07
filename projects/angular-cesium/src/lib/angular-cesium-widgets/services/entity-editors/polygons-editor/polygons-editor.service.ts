import { EditVector } from './../../../models/edit-vector';
import { publish, tap } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { CesiumService } from '../../../../angular-cesium/services/cesium/cesium.service';
import { MapEventsManagerService } from '../../../../angular-cesium/services/map-events-mananger/map-events-manager';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { CesiumEvent } from '../../../../angular-cesium/services/map-events-mananger/consts/cesium-event.enum';
import { PickOptions } from '../../../../angular-cesium/services/map-events-mananger/consts/pickOptions.enum';
import { PolygonEditUpdate } from '../../../models/polygon-edit-update';
import { EditModes } from '../../../models/edit-mode.enum';
import { EditActions } from '../../../models/edit-actions.enum';
import { DisposableObservable } from '../../../../angular-cesium/services/map-events-mananger/disposable-observable';
import { CoordinateConverter } from '../../../../angular-cesium/services/coordinate-converter/coordinate-converter.service';
import { EditPoint } from '../../../models/edit-point';
import { CameraService } from '../../../../angular-cesium/services/camera/camera.service';
import { Cartesian3 } from '../../../../angular-cesium/models/cartesian3';
import { PolygonsManagerService } from './polygons-manager.service';
import { PolygonEditorObservable } from '../../../models/polygon-editor-observable';
import { EditablePolygon } from '../../../models/editable-polygon';
import { PolygonDisplay, PolygonEditOptions, PolygonProps } from '../../../models/polygon-edit-options';
import { ClampTo3DOptions } from '../../../models/polyline-edit-options';
import { PointProps } from '../../../models/point-edit-options';
import { LabelProps } from '../../../models/label-props';
import { debounce, generateKey } from '../../utils';

export const DEFAULT_POLYGON_OPTIONS: PolygonEditOptions = {
  addPointEvent: CesiumEvent.LEFT_CLICK,
  addLastPointEvent: CesiumEvent.LEFT_DOUBLE_CLICK,
  removePointEvent: CesiumEvent.RIGHT_CLICK,
  dragPointEvent: CesiumEvent.LEFT_CLICK_DRAG,
  dragShapeEvent: CesiumEvent.LEFT_CLICK_DRAG,
  allowDrag: true,
  extrudedHeight: 0,
  pointProps: {
    color: Cesium.Color.WHITE.withAlpha(0.95),
    outlineColor: Cesium.Color.BLACK.withAlpha(0.2),
    outlineWidth: 1,
    pixelSize: 13,
    virtualPointPixelSize: 8,
    show: true,
    showVirtual: true,
    disableDepthTestDistance: Number.POSITIVE_INFINITY,
  },
  polygonProps: {
    material: Cesium.Color.CORNFLOWERBLUE.withAlpha(0.4),
    fill: true,
    classificationType: Cesium.ClassificationType.BOTH,
    zIndex: 0,
    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
  },
  polylineProps: {
    material: Cesium.Color.WHITE,
    width: 3,
    clampToGround: false,
    zIndex: 0,
    classificationType: Cesium.ClassificationType.BOTH,
  },
  wallProps: {
    material: Cesium.Color.CORNFLOWERBLUE.withAlpha(0.4),
    outline: true,
    outlineColor: Cesium.Color.WHITE,
    outlineWidth: 3,
  },
  clampHeightTo3D: false,
  clampHeightTo3DOptions: {
    clampToTerrain: false,
    clampMostDetailed: true,
    clampToHeightPickWidth: 2,
  },
};

/**
 * Service for creating editable polygons
 *
 * You must provide `PolygonsEditorService` yourself.
 * PolygonsEditorService works together with `<polygons-editor>` component. Therefor you need to create `<polygons-editor>`
 * for each `PolygonsEditorService`, And of course somewhere under `<ac-map>`/
 *
 * + `create` for starting a creation of the shape over the map. Returns a extension of `PolygonEditorObservable`.
 * + `edit` for editing shape over the map starting from a given positions. Returns an extension of `PolygonEditorObservable`.
 * + To stop editing call `dsipose()` from the `PolygonEditorObservable` you get back from `create()` \ `edit()`.
 *
 * **Labels over editted shapes**
 * Angular Cesium allows you to draw labels over a shape that is being edited with one of the editors.
 * To add label drawing logic to your editor use the function `setLabelsRenderFn()` that is defined on the
 * `PolygonEditorObservable` that is returned from calling `create()` \ `edit()` of one of the editor services.
 * `setLabelsRenderFn()` - receives a callback that is called every time the shape is redrawn
 * (except when the shape is being dragged). The callback is called with the last shape state and with an array of the current labels.
 * The callback should return type `LabelProps[]`.
 * You can also use `updateLabels()` to pass an array of labels of type `LabelProps[]` to be drawn.
 *
 * usage:
 * ```typescript
 *  // Start creating polygon
 *  const editing$ = polygonsEditorService.create();
 *  this.editing$.subscribe(editResult => {
 *				console.log(editResult.positions);
 *		});
 *
 *  // Or edit polygon from existing polygon positions
 *  const editing$ = this.polygonsEditorService.edit(initialPos);
 *
 * ```
 */
@Injectable()
export class PolygonsEditorService {
  private mapEventsManager: MapEventsManagerService;
  private updateSubject = new Subject<PolygonEditUpdate>();
  private updatePublisher = publish<PolygonEditUpdate>()(this.updateSubject); // TODO maybe not needed
  private coordinateConverter: CoordinateConverter;
  private cameraService: CameraService;
  private polygonsManager: PolygonsManagerService;
  private observablesMap = new Map<string, DisposableObservable<any>[]>();
  private cesiumScene: any;

  private clampPointsDebounced = debounce((id, clampHeightTo3D: boolean, clampHeightTo3DOptions) => {
    this.clampPoints(id, clampHeightTo3D, clampHeightTo3DOptions);
  }, 300);

  init(mapEventsManager: MapEventsManagerService,
       coordinateConverter: CoordinateConverter,
       cameraService: CameraService,
       polygonsManager: PolygonsManagerService,
       cesiumViewer: CesiumService,
  ) {
    this.mapEventsManager = mapEventsManager;
    this.coordinateConverter = coordinateConverter;
    this.cameraService = cameraService;
    this.polygonsManager = polygonsManager;
    this.updatePublisher.connect();

    this.cesiumScene = cesiumViewer.getScene();
  }

  onUpdate(): Observable<PolygonEditUpdate> {
    return this.updatePublisher;
  }

  private clampPoints(id, clampHeightTo3D: boolean, { clampToTerrain, clampMostDetailed, clampToHeightPickWidth }: ClampTo3DOptions) {
    if (clampHeightTo3D && clampMostDetailed) {
      const polygon = this.polygonsManager.get(id);
      const points = polygon.getPoints();

      if (!clampToTerrain) {
        // 3dTiles
        points.forEach(point => {
          point.setPosition(this.cesiumScene.clampToHeight(point.getPosition(), undefined, clampToHeightPickWidth));
        });
        // const cartesians = points.map(point => point.getPosition());
        // const promise = this.cesiumScene.clampToHeightMostDetailed(cartesians, undefined, clampToHeightPickWidth);
        // promise.then((updatedCartesians) => {
        //   points.forEach((point, index) => {
        //     point.setPosition(updatedCartesians[index]);
        //   });
        // });
      } else {
        const cartographics = points.map(point => this.coordinateConverter.cartesian3ToCartographic(point.getPosition()));
        const promise = Cesium.sampleTerrain(this.cesiumScene.terrainProvider, 11, cartographics);
        Cesium.when(promise, (updatedPositions) => {
          points.forEach((point, index) => {
            point.setPosition(Cesium.Cartographic.toCartesian(updatedPositions[index]));
          });
        });
      }
    }
  }

  private clampVirtual(id) {
    const polygon = this.polygonsManager.get(id);
    let points = polygon.getAllVirtualPoints();
    points.forEach((point) => {
      //TODO: 
      let updatedPoint = this.cesiumScene.clampToHeight(point.getPosition());
      if (!Cesium.defined(updatedPoint)) {
        const cart = Cesium.Cartographic.fromCartesian(point.getPosition());
        const height = this.cesiumScene.globe.getHeight(cart);
        cart.height = height;
        updatedPoint = Cesium.Cartographic.toCartesian(cart);
      }
      point.setPosition(updatedPoint);
    });
  }

  private updateVirtualPoints(id) {
    const polygon = this.polygonsManager.get(id);
    const currentPoints = polygon.getPoints();
    currentPoints.forEach((pos, index) => {

      if (pos.isVirtualEditPoint()) {
        const prevIndex = (index - 1) % (currentPoints.length);
        const nextIndex = (index + 1) % (currentPoints.length);
        const midPointCartesian3 = Cesium.Cartesian3.lerp(currentPoints[prevIndex].getPosition(), currentPoints[nextIndex].getPosition(), 0.5, new Cesium.Cartesian3());
        pos.setPosition(midPointCartesian3);
      }
      // const nextPoint = currentPoints[nextIndex];
    });
  }

  private screenToPosition(cartesian2, clampHeightTo3D: boolean, { clampToHeightPickWidth, clampToTerrain }: ClampTo3DOptions) {
    const cartesian3 = this.coordinateConverter.screenToCartesian3(cartesian2);

    // If cartesian3 is undefined then the point inst on the globe
    if (clampHeightTo3D && cartesian3) {
      const globePositionPick = () => {
        const ray = this.cameraService.getCamera().getPickRay(cartesian2);
        return this.cesiumScene.globe.pick(ray, this.cesiumScene);
      };

      // is terrain?
      if (clampToTerrain) {
        return globePositionPick();
      } else {
        const cartesian3PickPosition = this.cesiumScene.pickPosition(cartesian2);
        const latLon = CoordinateConverter.cartesian3ToLatLon(cartesian3PickPosition);
        if (latLon.height < 0) {// means nothing picked -> Validate it
          return globePositionPick();
        }
        return this.cesiumScene.clampToHeight(cartesian3PickPosition, undefined, clampToHeightPickWidth);
      }
    }

    return cartesian3;
  }

  // TODO: use ray or clamp to height?
  public getRayPosition(
    mousePosition
    ): Cartesian3 {

    var cartesianScratch = new Cesium.Cartesian3();
    var rayScratch = new Cesium.Ray();
    var cartPickRay = new Cesium.Cartographic();
    var globePickScratch = new Cesium.Cartesian3();
    var cartPickGlobe = new Cesium.Cartographic();

    this.cesiumScene.camera.getPickRay(mousePosition, rayScratch);

    if (this.cesiumScene.pickPositionSupported) {

      let pickedObjects = this.cesiumScene.drillPick(mousePosition, 10, 10);
      if (pickedObjects.length > 0) {

        // Seperate sketch and none sketch elements
        let sketchElements: Array<any> = [];
        const noneSketchElements = pickedObjects.filter((pickedObject) => {

          const noneSketchElement = 
            !(pickedObject.primitive && 
              pickedObject.primitive instanceof Cesium.Primitive ||
              pickedObject.primitive instanceof Cesium.GroundPrimitive ||
              pickedObject.primitive instanceof Cesium.GroundPolylinePrimitive ||
              pickedObject.primitive instanceof Cesium.PointPrimitive);

          if (!noneSketchElement) {
            sketchElements.push(pickedObject);
          }

          return noneSketchElement;
        });


        // Get the last none sketch element from drillPick, normally a 3D Tileset
        const noneSketchElement = noneSketchElements[noneSketchElements.length - 1];

        if (
          Cesium.defined(noneSketchElement) &&
          (noneSketchElement instanceof Cesium.Cesium3DTileFeature ||
            noneSketchElement.primitive instanceof Cesium.Cesium3DTileset ||
            noneSketchElement.primitive instanceof Cesium.Model)
        ) {
          
          // Get the intersection of the ray and the picked object, ignore sketch elements
          // pickFromRay is a private cesium function
          // Cesium.Cartesian3.clone(this.cesiumScene.pickFromRay(rayScratch, undefined).position, cartesianScratch);
          var rayIntersection = this.cesiumScene.pickFromRay(rayScratch, sketchElements);

          if (!rayIntersection) {
            return;
          }
          cartesianScratch = rayIntersection.position;
          // console.log("Pick Ray cartesian: ");
          // console.log(cartesianScratch);
          if (!cartesianScratch || cartesianScratch.equals(new Cesium.Cartesian3()))
          {
            return;
          }
          cartPickRay = Cesium.Cartographic.fromCartesian(cartesianScratch);
          // console.log("Pick Ray: ", cartPickRay);
          // If the resulting ray position's elevation is below the terrain,
          // select the terrain instead as otherwise this could cause issues
          this.cesiumScene.globe.pick(rayScratch, this.cesiumScene, globePickScratch);
          cartPickGlobe = Cesium.Cartographic.fromCartesian(globePickScratch);
          // console.log("PickGlobe: ", cartPickGlobe);
          if (cartPickRay.height < cartPickGlobe.height) {
            Cesium.Cartesian3.clone(globePickScratch, cartesianScratch);
          }

          // check to let us know if we should pick against the globe instead
          // don't return new result if cartesian is at centre of ellipsoid (0,0,0)
          if (Cesium.defined(cartesianScratch) && !cartesianScratch.equals(new Cesium.Cartesian3())) {
            return cartesianScratch;
          }
        }
      }
    }
    if (!Cesium.defined(this.cesiumScene.globe)) {
      return;
    }

    // Get the terrain position if no objects have been selected
    this.cesiumScene.globe.pick(rayScratch, this.cesiumScene, cartesianScratch);

    // don't return new result if cartesian is at centre of ellipsoid (0,0,0)
    if (Cesium.defined(cartesianScratch) && !cartesianScratch.equals(new Cesium.Cartesian3())) {
      return cartesianScratch;
    }
  }

  create(options = DEFAULT_POLYGON_OPTIONS, priority = 100): PolygonEditorObservable {
    const positions: Cartesian3[] = [];
    const id = generateKey();
    const polygonOptions = this.setOptions(options);

    const clientEditSubject = new BehaviorSubject<PolygonEditUpdate>({
      id,
      editAction: null,
      editMode: EditModes.CREATE
    });
    let finishedCreate = false;

    this.updateSubject.next({
      id,
      positions,
      editMode: EditModes.CREATE,
      editAction: EditActions.INIT,
      polygonOptions: polygonOptions,
    });

    const mouseMoveRegistration = this.mapEventsManager.register({
      event: CesiumEvent.MOUSE_MOVE,
      pick: PickOptions.NO_PICK,
      pickConfig: options.pickConfiguration,
      priority,
    });
    const addPointRegistration = this.mapEventsManager.register({
      event: polygonOptions.addPointEvent,
      modifier: polygonOptions.addPointModifier,
      pick: PickOptions.NO_PICK,
      pickConfig: options.pickConfiguration,
      priority,
    });
    const addLastPointRegistration = this.mapEventsManager.register({
      event: polygonOptions.addLastPointEvent,
      modifier: polygonOptions.addLastPointModifier,
      pick: PickOptions.NO_PICK,
      pickConfig: options.pickConfiguration,
      priority,
    });

    this.observablesMap.set(id, [mouseMoveRegistration, addPointRegistration, addLastPointRegistration]);
    const editorObservable = this.createEditorObservable(clientEditSubject, id);

    mouseMoveRegistration.subscribe(({ movement: { endPosition } }) => {
      //const position = this.screenToPosition(endPosition, polygonOptions.clampHeightTo3D, polygonOptions.clampHeightTo3DOptions);
      const position = this.getRayPosition(endPosition);

      if (position) {
        this.updateSubject.next({
          id,
          positions: this.getPositions(id),
          editMode: EditModes.CREATE,
          updatedPosition: position,
          editAction: EditActions.MOUSE_MOVE,
        });
      }
    });

    addPointRegistration.subscribe(({ movement: { endPosition } }) => {
      if (finishedCreate) {
        return;
      }
      // const position = this.screenToPosition(endPosition, polygonOptions.clampHeightTo3D, polygonOptions.clampHeightTo3DOptions);
      const position = this.getRayPosition(endPosition);
      if (!position) {
        return;
      }
      const allPositions = this.getPositions(id);
      if (allPositions.find((cartesian) => cartesian.equals(position))) {
        return;
      }

      const updateValue = {
        id,
        positions: allPositions,
        editMode: EditModes.CREATE,
        updatedPosition: position,
        editAction: EditActions.ADD_POINT,
      };
      this.updateSubject.next(updateValue);
      clientEditSubject.next({
        ...updateValue,
        positions: this.getPositions(id),
        points: this.getPoints(id),
      });

      if (polygonOptions.maximumNumberOfPoints && allPositions.length + 1 === polygonOptions.maximumNumberOfPoints) {
        finishedCreate = this.switchToEditMode(
          id,
          position,
          clientEditSubject,
          positions,
          priority,
          polygonOptions,
          editorObservable,
          finishedCreate);
      }
    });


    addLastPointRegistration.subscribe(({ movement: { endPosition } }) => {
      // const position = this.screenToPosition(endPosition, polygonOptions.clampHeightTo3D, polygonOptions.clampHeightTo3DOptions);
      const position = this.getRayPosition(endPosition);
      if (!position) {
        return;
      }
      // position already added by addPointRegistration
      finishedCreate = this.switchToEditMode(
        id,
        position,
        clientEditSubject,
        positions,
        priority,
        polygonOptions,
        editorObservable,
        finishedCreate);
    });

    return editorObservable;
  }

  private switchToEditMode(id,
                           position,
                           clientEditSubject,
                           positions: Cartesian3[],
                           priority,
                           polygonOptions,
                           editorObservable,
                           finishedCreate: boolean) {
    const updateValue = {
      id,
      positions: this.getPositions(id),
      editMode: EditModes.CREATE,
      updatedPosition: position,
      editAction: EditActions.ADD_LAST_POINT,
    };
    this.updateSubject.next(updateValue);
    clientEditSubject.next({
      ...updateValue,
      positions: this.getPositions(id),
      points: this.getPoints(id),
    });

    const changeMode = {
      id,
      editMode: EditModes.CREATE,
      editAction: EditActions.CHANGE_TO_EDIT,
    };
    this.updateSubject.next(changeMode);
    clientEditSubject.next(changeMode);
    if (this.observablesMap.has(id)) {
      this.observablesMap.get(id).forEach(registration => registration.dispose());
    }
    this.observablesMap.delete(id);
    this.editPolygon(id, positions, priority, clientEditSubject, polygonOptions, editorObservable);
    finishedCreate = true;
    return finishedCreate;
  }

  edit(positions: Cartesian3[], options = DEFAULT_POLYGON_OPTIONS, priority = 100): PolygonEditorObservable {
    if (positions.length < 3) {
      throw new Error('Polygons editor error edit(): polygon should have at least 3 positions');
    }
    const id = generateKey();
    const polygonOptions = this.setOptions(options);
    const editSubject = new BehaviorSubject<PolygonEditUpdate>({
      id,
      editAction: null,
      editMode: EditModes.EDIT
    });
    const update = {
      id,
      positions: positions,
      editMode: EditModes.EDIT,
      editAction: EditActions.INIT,
      polygonOptions: polygonOptions,
    };
    this.updateSubject.next(update);
    editSubject.next({
      ...update,
      positions: this.getPositions(id),
      points: this.getPoints(id),
    });
    return this.editPolygon(
      id,
      positions,
      priority,
      editSubject,
      polygonOptions
    );
  }

  private editPolygon(id: string,
                      positions: Cartesian3[],
                      priority: number,
                      editSubject: Subject<PolygonEditUpdate>,
                      options: PolygonEditOptions,
                      editObservable?: PolygonEditorObservable): PolygonEditorObservable {
    //this.clampPoints(id, options.clampHeightTo3D, options.clampHeightTo3DOptions);

    const pointDragRegistration = this.mapEventsManager.register({
      event: options.dragPointEvent,
      entityType: EditPoint,
      pick: PickOptions.PICK_FIRST,
      pickConfig: options.pickConfiguration,
      priority,
      pickFilter: entity => id === entity.editedEntityId,
    });

    const widgetDragRegistration = this.mapEventsManager.register({
      event: CesiumEvent.LEFT_CLICK_DRAG,
      entityType: EditVector,
      pick: PickOptions.PICK_FIRST,
      pickConfig: options.pickConfiguration,
      priority,
      pickFilter: entity => id === entity.editedEntityId,
    });

    let shapeDragRegistration;
    if (options.allowDrag) {
      shapeDragRegistration = this.mapEventsManager.register({
        event: options.dragShapeEvent,
        entityType: EditablePolygon,
        pick: PickOptions.PICK_FIRST,
        pickConfig: options.pickConfiguration,
        priority,
        pickFilter: entity => id === entity.id,
      });
    }
    const pointRemoveRegistration = this.mapEventsManager.register({
      event: options.removePointEvent,
      entityType: EditPoint,
      modifier: options.removePointModifier,
      pick: PickOptions.PICK_FIRST,
      pickConfig: options.pickConfiguration,
      priority,
      pickFilter: entity => id === entity.editedEntityId,
    });

    pointDragRegistration.pipe(
      tap(({ movement: { drop } }) => 
      this.polygonsManager.get(id).enableEdit && this.cameraService.enableInputs(drop, 400))
      )
      .subscribe(({ movement: { endPosition, drop }, entities }) => {
        // const position = this.screenToPosition(endPosition, options.clampHeightTo3D, options.clampHeightTo3DOptions);

        const position = this.getRayPosition(endPosition);
        if (!position) {
          return;
        }
        const point: EditPoint = entities[0];

        const update = {
          id,
          positions: this.getPositions(id),
          editMode: EditModes.EDIT,
          updatedPosition: position,
          updatedPoint: point,
          editAction: drop ? EditActions.DRAG_POINT_FINISH : EditActions.DRAG_POINT,
        };
        this.updateSubject.next(update);
        editSubject.next({
          ...update,
          positions: this.getPositions(id),
          points: this.getPoints(id),
        });

        if (this.polygonsManager.get(id).height <= 0) {
          this.clampVirtual(id);
        }
        // this.clampPointsDebounced(id, options.clampHeightTo3D, options.clampHeightTo3DOptions);
      });

      widgetDragRegistration.pipe(
        tap(({ movement: { drop } }) => 
        this.polygonsManager.get(id).enableEdit && this.cameraService.enableInputs(drop, 400)))
        .subscribe(({ movement: { startPosition, endPosition } }) => {
          
          const polygon = this.polygonsManager.get(id);
          let deltaY = (startPosition.y - endPosition.y) * 0.009;
          const updatedHeight = polygon.height + deltaY;

          // TODO: look into classification
          const updateHeight = {
            id,
            polygonOptions: {
              extrudedHeight: updatedHeight <= 0 ? 0 : updatedHeight,
              polygonProps: {
                heightReference: updatedHeight <= 0 ? Cesium.HeightReference.CLAMP_TO_GROUND : Cesium.HeightReference.NONE,
              }
            },
            editMode: EditModes.EDIT,
            editAction: EditActions.TRANSFORM,
          }
          
          this.updateSubject.next(updateHeight);
          editSubject.next({
            ...updateHeight,
          });
          if (updatedHeight > 0) {
            this.updateVirtualPoints(id);
          }
          else {
            // TODO: why won't deboucne work
            // timeout required as point will clamp to top of wall otherwise
            setTimeout(() => {
              this.clampVirtual(id)
            }, 1);
          }

        });


    if (shapeDragRegistration) {
      shapeDragRegistration
        .pipe(tap(({ movement: { drop } }) => this.polygonsManager.get(id).enableEdit && this.cameraService.enableInputs(drop, 400)))
        .subscribe(({ movement: { startPosition, endPosition, drop }, entities }) => {
          // const endDragPosition = this.screenToPosition(endPosition, false, options.clampHeightTo3DOptions);
          const endDragPosition = this.getRayPosition(endPosition);
          // const startDragPosition = this.screenToPosition(startPosition, false, options.clampHeightTo3DOptions);
          const startDragPosition = this.getRayPosition(startPosition);
          if (!endDragPosition) {
            return;
          }

          const update = {
            id,
            positions: this.getPositions(id),
            editMode: EditModes.EDIT,
            updatedPosition: endDragPosition,
            draggedPosition: startDragPosition,
            editAction: drop ? EditActions.DRAG_SHAPE_FINISH : EditActions.DRAG_SHAPE,
          };
          this.updateSubject.next(update);
          editSubject.next({
            ...update,
            positions: this.getPositions(id),
            points: this.getPoints(id),
          });
        });
    }

    pointRemoveRegistration.subscribe(({ entities }) => {
      const point: EditPoint = entities[0];
      const allPositions = [...this.getPositions(id)];
      if (allPositions.length < 4) {
        return;
      }
      const index = allPositions.findIndex(position => point.getPosition().equals(position as Cartesian3));
      if (index < 0) {
        return;
      }

      const update = {
        id,
        positions: allPositions,
        editMode: EditModes.EDIT,
        updatedPoint: point,
        editAction: EditActions.REMOVE_POINT,
      };
      this.updateSubject.next(update);
      editSubject.next({
        ...update,
        positions: this.getPositions(id),
        points: this.getPoints(id),
      });

      //this.clampPoints(id, options.clampHeightTo3D, options.clampHeightTo3DOptions);
    });

    const observables = [pointDragRegistration, pointRemoveRegistration, widgetDragRegistration];
    if (shapeDragRegistration) {
      observables.push(shapeDragRegistration);
    }

    this.observablesMap.set(id, observables);
    return editObservable || this.createEditorObservable(editSubject, id);
  }

  private setOptions(options: PolygonEditOptions) {
    if (options.maximumNumberOfPoints && options.maximumNumberOfPoints < 3) {
      console.warn('Warn: PolygonEditor invalid option.' +
        ' maximumNumberOfPoints smaller then 3, maximumNumberOfPoints changed to 3');
      options.maximumNumberOfPoints = 3;
    }

    const defaultClone = JSON.parse(JSON.stringify(DEFAULT_POLYGON_OPTIONS));
    const polygonOptions: PolygonEditOptions = Object.assign(defaultClone, options);
    polygonOptions.pointProps = { ...DEFAULT_POLYGON_OPTIONS.pointProps, ...options.pointProps};
    polygonOptions.polygonProps = {...DEFAULT_POLYGON_OPTIONS.polygonProps, ...options.polygonProps};
    polygonOptions.polylineProps = {...DEFAULT_POLYGON_OPTIONS.polylineProps, ...options.polylineProps};
    polygonOptions.wallProps = {...DEFAULT_POLYGON_OPTIONS.wallProps, ...options.wallProps};
    polygonOptions.clampHeightTo3DOptions = { ...DEFAULT_POLYGON_OPTIONS.clampHeightTo3DOptions, ...options.clampHeightTo3DOptions};
    
    // if (!polygonOptions.extrudedHeight || polygonOptions.extrudedHeight === 0) {
    //   polygonOptions.extrudedHeight = undefined;
    // }

    if (options.clampHeightTo3D) {
      if (!this.cesiumScene.pickPositionSupported || !this.cesiumScene.clampToHeightSupported) {
        throw new Error(`Cesium pickPosition and clampToHeight must be supported to use clampHeightTo3D`);
      }

      if (this.cesiumScene.pickTranslucentDepth) {
        console.warn(`Cesium scene.pickTranslucentDepth must be false in order to make the editors work properly on 3D`);
      }

      if (polygonOptions.pointProps.color.alpha === 1 || polygonOptions.pointProps.outlineColor.alpha === 1) {
        console.warn('Point color and outline color must have alpha in order to make the editor work properly on 3D');
      }

      polygonOptions.allowDrag = false;
      polygonOptions.polylineProps.clampToGround = true;
      // polygonOptions.pointProps.heightReference = polygonOptions.clampHeightTo3DOptions.clampToTerrain ?
      //   Cesium.HeightReference.CLAMP_TO_GROUND : Cesium.HeightReference.RELATIVE_TO_GROUND;
      polygonOptions.pointProps.disableDepthTestDistance = Number.POSITIVE_INFINITY;
    }
    return polygonOptions;
  }


  private createEditorObservable(observableToExtend: any, id: string): PolygonEditorObservable {
    observableToExtend.dispose = () => {
      const observables = this.observablesMap.get(id);
      if (observables) {
        observables.forEach(obs => obs.dispose());
      }
      this.observablesMap.delete(id);
      this.updateSubject.next({
        id,
        editMode: EditModes.CREATE_OR_EDIT,
        editAction: EditActions.DISPOSE,
      });
    };
    observableToExtend.enable = () => {
      this.updateSubject.next({
        id,
        positions: this.getPositions(id),
        editMode: EditModes.EDIT,
        editAction: EditActions.ENABLE,
      });
    };
    observableToExtend.disable = () => {
      this.updateSubject.next({
        id,
        positions: this.getPositions(id),
        editMode: EditModes.EDIT,
        editAction: EditActions.DISABLE,
      });
    };
    observableToExtend.setManually = (points: {
      position: Cartesian3, pointProps: PointProps
    }[] | Cartesian3[], polygonProps?: PolygonProps) => {
      const polygon = this.polygonsManager.get(id);
      polygon.setPointsManually(points, polygonProps);
      this.updateSubject.next({
        id,
        editMode: EditModes.CREATE_OR_EDIT,
        editAction: EditActions.SET_MANUALLY,
      });
    };

    observableToExtend.setLabelsRenderFn = (callback: any) => {
      this.updateSubject.next({
        id,
        editMode: EditModes.CREATE_OR_EDIT,
        editAction: EditActions.SET_EDIT_LABELS_RENDER_CALLBACK,
        labelsRenderFn: callback,
      });
    };

    observableToExtend.updateLabels = (labels: LabelProps[]) => {
      this.updateSubject.next({
        id,
        editMode: EditModes.CREATE_OR_EDIT,
        editAction: EditActions.UPDATE_EDIT_LABELS,
        updateLabels: labels,
      });
    };

    observableToExtend.updateDisplay = (display: PolygonDisplay) => {
      this.updateSubject.next({
        id,
        editMode: EditModes.EDIT,
        editAction: EditActions.SET_MATERIAL,
        polygonDisplay: display,
      });
    };

    observableToExtend.getCurrentPoints = () => this.getPoints(id);

    observableToExtend.getEditValue = () => observableToExtend.getValue();

    observableToExtend.getLabels = (): LabelProps[] => this.polygonsManager.get(id).labels;

    return observableToExtend as PolygonEditorObservable;
  }

  private getPositions(id: string) {
    const polygon = this.polygonsManager.get(id);
    return polygon.getRealPositions();
  }

  private getPoints(id: string) {
    const polygon = this.polygonsManager.get(id);
    return polygon.getRealPoints();
  }
}
