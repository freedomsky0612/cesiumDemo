<template>
  <div id="cesiumContainer">
  </div>
</template>

<script>
import 'cesium/Widgets/widgets.css';
let Cesium = require('cesium/Cesium')
 export default {
   name: 'HelloWorld',
   mounted () {
     this.$nextTick(() => {
       const viewer = new Cesium.Viewer('cesiumContainer')
       console.log('viewer: ', viewer)
     })
   }
 }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h1, h2 {
  font-weight: normal;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
