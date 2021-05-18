import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

Cesium.buildModuleUrl.setBaseUrl('/assets/cesium/');
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIzZGFiODFkMi1lM2VhLTRmMGMtYmQ1MS1lZDI5NmYxYTdjNGEiLCJpZCI6MTU3MzYsInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJpYXQiOjE1Njg3MzE5NzB9.9qw8Aceuwh0AHDn-JC2SPZnjcAhznFs35-y_JosSTSA'

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
