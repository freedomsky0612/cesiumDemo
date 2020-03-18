<template>
  <div>
      <div class="title">cesium测试Demo</div>
      <!-- cesium3D显示容器 -->
      <div id="cesiumContainer"></div>
              <!-- Some input elements for our app. -->
        <div class="backdrop" id="menu">
            <h2>Sample NYC Geocaches</h2>
            <span><strong>Camera Mode</strong></span>
            <div class="nowrap">
                <input id="freeMode" name="source" type="radio" checked/>
                <label for="freeMode">Free</label>
            </div>
            <div class="nowrap">
                <input id="droneMode" name="source" type="radio"/>
                <label for="droneMode">Drone View</label>
            </div>
            <br>
            <span><strong>3d Tile Styling</strong></span>
            <div class="nowrap">
                <select id="tileStyle">
                    <option value="none">None</option>
                    <option value="height">Height</option>
                    <option value="transparent">Transparent</option>
                </select>
            </div>
            <br>
            <span><strong>Display Options</strong></span>
            <div class="nowrap">
                <input id="shadows" type="checkbox"/>
                <label for="shadows">Shadows</label>
            </div>

            <div class="nowrap">
                <input id="neighborhoods" type="checkbox" checked/>
                <label for="neighborhoods">Neighborhoods</label>
            </div>
            <br>
        </div>
        <div id="loadingIndicator" class="cover">
            <div id="loadingIcon" class="loadingIndicator"></div>
        </div>
  </div>
</template>

<script>
 export default {
   name: 'HelloWorld',
   mounted () {
     this.$nextTick(() => {
       var _that = this;
          var viewer = new this.Cesium.Viewer('cesiumContainer', {
              scene3DOnly: true,
              selectionIndicator: false,
              baseLayerPicker: false
          });

          //////////////////////////////////////////////////////////////////////////
          // Loading Imagery
          //////////////////////////////////////////////////////////////////////////

          // Remove default base layer
          viewer.imageryLayers.remove(viewer.imageryLayers.get(0));

          // Add Sentinel-2 imagery
          viewer.imageryLayers.addImageryProvider(new this.Cesium.IonImageryProvider({ assetId: 3954 }));

          //////////////////////////////////////////////////////////////////////////
          // Loading Terrain
          //////////////////////////////////////////////////////////////////////////

          // Load Cesium World Terrain
          viewer.terrainProvider = this.Cesium.createWorldTerrain({
              requestWaterMask : true, // required for water effects
              requestVertexNormals : true // required for terrain lighting
          });
          // Enable depth testing so things behind the terrain disappear.
          viewer.scene.globe.depthTestAgainstTerrain = true;

          //////////////////////////////////////////////////////////////////////////
          // Configuring the Scene
          //////////////////////////////////////////////////////////////////////////

          // Enable lighting based on sun/moon positions
          viewer.scene.globe.enableLighting = true;

          // Create an initial camera view
          var initialPosition = new this.Cesium.Cartesian3.fromDegrees(-73.998114468289017509, 40.674512895646692812, 2631.082799425431);
          var initialOrientation = new this.Cesium.HeadingPitchRoll.fromDegrees(7.1077496389876024807, -31.987223091598949054, 0.025883251314954971306);
          var homeCameraView = {
              destination : initialPosition,
              orientation : {
                  heading : initialOrientation.heading,
                  pitch : initialOrientation.pitch,
                  roll : initialOrientation.roll
              }
          };
          // Set the initial view
          viewer.scene.camera.setView(homeCameraView);

          // Add some camera flight animation options
          homeCameraView.duration = 2.0;
          homeCameraView.maximumHeight = 2000;
          homeCameraView.pitchAdjustHeight = 2000;
          homeCameraView.endTransform = this.Cesium.Matrix4.IDENTITY;
          // Override the default home button
          viewer.homeButton.viewModel.command.beforeExecute.addEventListener(function (e) {
              e.cancel = true;
              viewer.scene.camera.flyTo(homeCameraView);
          });

          // Set up clock and timeline.
          viewer.clock.shouldAnimate = true; // default
          viewer.clock.startTime = this.Cesium.JulianDate.fromIso8601("2017-07-11T16:00:00Z");
          viewer.clock.stopTime = this.Cesium.JulianDate.fromIso8601("2017-07-11T16:20:00Z");
          viewer.clock.currentTime = this.Cesium.JulianDate.fromIso8601("2017-07-11T16:00:00Z");
          viewer.clock.multiplier = 2; // sets a speedup
          viewer.clock.clockStep = this.Cesium.ClockStep.SYSTEM_CLOCK_MULTIPLIER; // tick computation mode
          viewer.clock.clockRange = this.Cesium.ClockRange.LOOP_STOP; // loop at the end
          viewer.timeline.zoomTo(viewer.clock.startTime, viewer.clock.stopTime); // set visible range

          //////////////////////////////////////////////////////////////////////////
          // Loading and Styling Entity Data
          //////////////////////////////////////////////////////////////////////////

          var kmlOptions = {
              camera : viewer.scene.camera,
              canvas : viewer.scene.canvas,
              clampToGround : true
          };
          // Load geocache points of interest from a KML file
          // Data from : http://catalog.opendata.city/dataset/pediacities-nyc-neighborhoods/resource/91778048-3c58-449c-a3f9-365ed203e914
          var geocachePromise = this.Cesium.KmlDataSource.load('../../static/Source/SampleData/sampleGeocacheLocations.kml', kmlOptions);

          // Add geocache billboard entities to scene and style them
          geocachePromise.then(function(dataSource) {
              // Add the new data as entities to the viewer
              viewer.dataSources.add(dataSource);

              // Get the array of entities
              var geocacheEntities = dataSource.entities.values;

              for (var i = 0; i < geocacheEntities.length; i++) {
                  var entity = geocacheEntities[i];
                  if (this.Cesium.defined(entity.billboard)) {
                      // Adjust the vertical origin so pins sit on terrain
                      entity.billboard.verticalOrigin = this.Cesium.VerticalOrigin.BOTTOM;
                      // Disable the labels to reduce clutter
                      entity.label = undefined;
                      // Add distance display condition
                      entity.billboard.distanceDisplayCondition = new this.Cesium.DistanceDisplayCondition(10.0, 20000.0);
                      // Compute latitude and longitude in degrees
                      var cartographicPosition = this.Cesium.Cartographic.fromCartesian(entity.position.getValue(this.Cesium.JulianDate.now()));
                      var latitude = this.Cesium.Math.toDegrees(cartographicPosition.latitude);
                      var longitude = this.Cesium.Math.toDegrees(cartographicPosition.longitude);
                      // Modify description
                      var description = '<table class="cesium-infoBox-defaultTable cesium-infoBox-defaultTable-lighter"><tbody>' +
                          '<tr><th>' + "Longitude" + '</th><td>' + longitude.toFixed(5) + '</td></tr>' +
                          '<tr><th>' + "Latitude" + '</th><td>' + latitude.toFixed(5) + '</td></tr>' +
                          '</tbody></table>';
                      entity.description = description;
                  }
              }
          });

          var geojsonOptions = {
              clampToGround : true
          };
          // Load neighborhood boundaries from a GeoJson file
          // Data from : https://data.cityofnewyork.us/City-Government/Neighborhood-Tabulation-Areas/cpf4-rkhq
          var neighborhoodsPromise = this.Cesium.GeoJsonDataSource.load('../../static/Source/SampleData/sampleNeighborhoods.geojson', geojsonOptions);

          // Save an new entity collection of neighborhood data
          var neighborhoods;
          neighborhoodsPromise.then(function(dataSource) {
              // Add the new data as entities to the viewer
              viewer.dataSources.add(dataSource);
              neighborhoods = dataSource.entities;

              // Get the array of entities
              var neighborhoodEntities = dataSource.entities.values;
              for (var i = 0; i < neighborhoodEntities.length; i++) {
                  var entity = neighborhoodEntities[i];

                  if (this.Cesium.defined(entity.polygon)) {
                      // Use kml neighborhood value as entity name
                      entity.name = entity.properties.neighborhood;
                      // Set the polygon material to a random, translucent color
                      entity.polygon.material = this.Cesium.Color.fromRandom({
                          red : 0.1,
                          maximumGreen : 0.5,
                          minimumBlue : 0.5,
                          alpha : 0.6
                      });
                      // Tells the polygon to color the terrain. ClassificationType.CESIUM_3D_TILE will color the 3D tileset, and ClassificationType.BOTH will color both the 3d tiles and terrain (BOTH is the default)
                      entity.polygon.classificationType = this.Cesium.ClassificationType.TERRAIN;
                      // Generate Polygon center
                      var polyPositions = entity.polygon.hierarchy.getValue(this.Cesium.JulianDate.now()).positions;
                      var polyCenter = this.Cesium.BoundingSphere.fromPoints(polyPositions).center;
                      polyCenter = this.Cesium.Ellipsoid.WGS84.scaleToGeodeticSurface(polyCenter);
                      entity.position = polyCenter;
                      // Generate labels
                      entity.label = {
                          text : entity.name,
                          showBackground : true,
                          scale : 0.6,
                          horizontalOrigin : this.Cesium.HorizontalOrigin.CENTER,
                          verticalOrigin : this.Cesium.VerticalOrigin.BOTTOM,
                          distanceDisplayCondition : new this.Cesium.DistanceDisplayCondition(10.0, 8000.0),
                          disableDepthTestDistance : 100.0
                      };
                  }
              }
          });

          // Load a drone flight path from a CZML file
          var dronePromise = this.Cesium.CzmlDataSource.load('../../static/Source/SampleData/sampleFlight.czml');

          // Save a new drone model entity
          var drone;
          dronePromise.then(function(dataSource) {
              viewer.dataSources.add(dataSource);
              // Get the entity using the id defined in the CZML data
              drone = dataSource.entities.getById('Aircraft/Aircraft1');
              // Attach a 3D model
              drone.model = {
                  uri : '../../static/Source/SampleData/Models/CesiumDrone.gltf',
                  minimumPixelSize : 128,
                  maximumScale : 1000,
                  silhouetteColor : this.Cesium.Color.WHITE,
                  silhouetteSize : 2
              };
              // Add computed orientation based on sampled positions
              drone.orientation = new this.Cesium.VelocityOrientationProperty(drone.position);

              // Smooth path interpolation
              drone.position.setInterpolationOptions({
                  interpolationAlgorithm : this.Cesium.HermitePolynomialApproximation,
                  interpolationDegree : 2
              });
              drone.viewFrom = new this.Cesium.Cartesian3(-30, 0, 0);
          });

          //////////////////////////////////////////////////////////////////////////
          // Load 3D Tileset
          //////////////////////////////////////////////////////////////////////////

          // Load the NYC buildings tileset
          var city = viewer.scene.primitives.add(new this.Cesium.Cesium3DTileset({ url: this.Cesium.IonResource.fromAssetId(75343) }));


          //////////////////////////////////////////////////////////////////////////
          // Style 3D Tileset
          //////////////////////////////////////////////////////////////////////////

          // Define a white, opaque building style
          var defaultStyle = new this.Cesium.Cesium3DTileStyle({
              color : "color('white')",
              show : true
          });

          // Set the tileset style to default
          city.style = defaultStyle;

          // Define a white, transparent building style
          var transparentStyle = new this.Cesium.Cesium3DTileStyle({
              color : "color('white', 0.3)",
              show : true
          });

          // Define a style in which buildings are colored by height
          var heightStyle = new this.Cesium.Cesium3DTileStyle({
              color : {
                  conditions : [
                      ["${Height} >= 300", "rgba(45, 0, 75, 0.5)"],
                      ["${Height} >= 200", "rgb(102, 71, 151)"],
                      ["${Height} >= 100", "rgb(170, 162, 204)"],
                      ["${Height} >= 50", "rgb(224, 226, 238)"],
                      ["${Height} >= 25", "rgb(252, 230, 200)"],
                      ["${Height} >= 10", "rgb(248, 176, 87)"],
                      ["${Height} >= 5", "rgb(198, 106, 11)"],
                      ["true", "rgb(127, 59, 8)"]
                  ]
              }
          });

          var tileStyle = document.getElementById('tileStyle');
          function set3DTileStyle() {
              var selectedStyle = tileStyle.options[tileStyle.selectedIndex].value;
              if (selectedStyle === 'none') {
                  city.style = defaultStyle;
              } else if (selectedStyle === 'height') {
                  city.style = heightStyle;
              } else if (selectedStyle === 'transparent') {
                  city.style = transparentStyle;
              }
          }
          tileStyle.addEventListener('change', set3DTileStyle);

          //////////////////////////////////////////////////////////////////////////
          // Custom mouse interaction for highlighting and selecting
          //////////////////////////////////////////////////////////////////////////

          // If the mouse is over a point of interest, change the entity billboard scale and color
          var previousPickedEntity;
          var handler = viewer.screenSpaceEventHandler;
          handler.setInputAction(function (movement) {
              var pickedPrimitive = viewer.scene.pick(movement.endPosition);
              var pickedEntity = _that.Cesium.defined(pickedPrimitive) ? pickedPrimitive.id : undefined;
              // Unhighlight the previously picked entity
              if (_that.Cesium.defined(previousPickedEntity)) {
                  previousPickedEntity.billboard.scale = 1.0;
                  previousPickedEntity.billboard.color = _that.Cesium.Color.WHITE;
              }
              // Highlight the currently picked entity
              if (_that.Cesium.defined(pickedEntity) && _that.Cesium.defined(pickedEntity.billboard)) {
                  pickedEntity.billboard.scale = 2.0;
                  pickedEntity.billboard.color = _that.Cesium.Color.ORANGERED;
                  previousPickedEntity = pickedEntity;
              }
          }, _that.Cesium.ScreenSpaceEventType.MOUSE_MOVE);

          //////////////////////////////////////////////////////////////////////////
          // Setup Camera Modes
          //////////////////////////////////////////////////////////////////////////

          var freeModeElement = document.getElementById('freeMode');
          var droneModeElement = document.getElementById('droneMode');

          // Create a follow camera by tracking the drone entity
          function setViewMode() {
              if (droneModeElement.checked) {
                  viewer.trackedEntity = drone;
              } else {
                  viewer.trackedEntity = undefined;
                  viewer.scene.camera.flyTo(homeCameraView);
              }
          }

          freeModeElement.addEventListener('change', setViewMode);
          droneModeElement.addEventListener('change', setViewMode);

          viewer.trackedEntityChanged.addEventListener(function() {
              if (viewer.trackedEntity === drone) {
                  freeModeElement.checked = false;
                  droneModeElement.checked = true;
              }
          });

          //////////////////////////////////////////////////////////////////////////
          // Setup Display Options
          //////////////////////////////////////////////////////////////////////////

          var shadowsElement = document.getElementById('shadows');
          var neighborhoodsElement =  document.getElementById('neighborhoods');

          shadowsElement.addEventListener('change', function (e) {
              viewer.shadows = e.target.checked;
          });

          neighborhoodsElement.addEventListener('change', function (e) {
              neighborhoods.show = e.target.checked;
          });

          // Finally, wait for the initial city to be ready before removing the loading indicator.
          var loadingIndicator = document.getElementById('loadingIndicator');
          loadingIndicator.style.display = 'block';
          city.readyPromise.then(function () {
              loadingIndicator.style.display = 'none';
          });
     })
   }
 }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped> 
.backdrop {
    display: inline-block;
    background: rgba(42, 42, 42, 0.7);
    border-radius: 5px;
    border: 1px solid #444;
    padding: 5px 10px;
    color: #fff;
    line-height: 150%;
    font-size: small;
}

#heightSliderLabel, #heightValue {
    vertical-align: top;
}

.backdrop a:link, .backdrop a:visited, .backdrop a:hover {
    color: #fff
}

.loadingIndicator {
    display: none;
    position: absolute;
    top: 50%;
    left: 50%;
    margin-top: -33px;
    margin-left: -33px;
    width: 66px;
    height: 66px;
    background: url('../../static/Source/images/ajax-loader.gif') center no-repeat;
}

.cover {
    display: none;
    position: absolute;
    background-color: rgba(0, 0, 0, 0.75);
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
}

#menu {
    position: absolute;
    left: 10px;
    top: 10px;
}

.nowrap {
    white-space: nowrap;
}

html, body, #cesiumContainer {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
    font-family: sans-serif;
    background: #000;
}

button.cesium-infoBox-camera {
    display: none;
}
.title {
  width: 300px;
  height: 50px;
  text-align: center;
  line-height: 50px;
  font-size: 30px;
  position: absolute;
  top: 50px;
  left: 50%;
  margin-left: -150px;
  color: red;
  z-index: 999;
}
</style>
