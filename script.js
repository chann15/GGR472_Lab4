/*--------------------------------------------------------------------
GGR472 LAB 4: Incorporating GIS Analysis into web maps using Turf.js 
--------------------------------------------------------------------*/

/*--------------------------------------------------------------------
Step 1: INITIALIZE MAP
--------------------------------------------------------------------*/
// Define access token
mapboxgl.accessToken = 'pk.eyJ1IjoiY2hhbm5pNDIiLCJhIjoiY201cjdmdmJxMDdodTJycHc2a3ExMnVqaiJ9.qKDYRE5K3C9f05Cj_JNbWA'; // Add default public map token from your Mapbox account

// Initialize map and edit to your preference
const map = new mapboxgl.Map({
    container: 'map', // container id in HTML
    style: 'mapbox://styles/mapbox/standard',  // ****ADD MAP STYLE HERE *****
    center: [-79.39514670504386, 43.661694006349904],
    zoom: 11 // starting zoom level
});


/*--------------------------------------------------------------------
Step 2: VIEW GEOJSON POINT DATA ON MAP
--------------------------------------------------------------------*/
//HINT: Create an empty variable
//      Use the fetch method to access the GeoJSON from your online repository
//      Convert the response to JSON format and then store the response in your new variable


let collisionData;
fetch('https://raw.githubusercontent.com/smith-lg/ggr472-lab4/refs/heads/main/data/pedcyc_collision_06-21.geojson')
  .then(response => response.json())
  .then(response => {
    console.log(response); //Check response in console
    collisionData = response; // Store geojson as variable using URL from fetch response
});

/*--------------------------------------------------------------------
    Step 3: CREATE BOUNDING BOX AND HEXGRID
--------------------------------------------------------------------*/
//HINT: All code to create and view the hexgrid will go inside a map load event handler
//      First create a bounding box around the collision point data
//      Access and store the bounding box coordinates as an array variable
//      Use bounding box coordinates as argument in the turf hexgrid function
//      **Option: You may want to consider how to increase the size of your bbox to enable greater geog coverage of your hexgrid
//                Consider return types from different turf functions and required argument types carefully here
map.on('load', () => {
    let bboxresult = turf.bbox(collisionData); // Create bounding box around collision data
    let hexdata = turf.hexGrid(bboxresult, 0.5, {units: 'kilometers'}); // Create hexgrid using bounding box




/*--------------------------------------------------------------------
Step 4: AGGREGATE COLLISIONS BY HEXGRID
--------------------------------------------------------------------*/
//HINT: Use Turf collect function to collect all '_id' properties from the collision points data for each heaxagon
//      View the collect output in the console. Where there are no intersecting points in polygons, arrays will be empty

let collishex = turf.collect(hexdata, collisionData, '_id', 'values'); // Aggregate collisions by hexgrid
let maxcollisions = 0;

collishex.features.forEach((feature) => {
    feature.properties.COUNT = feature.properties.values.length;
    if (feature.properties.COUNT > maxcollisions) {
        maxcollisions = feature.properties.COUNT;
    }
});

// /*--------------------------------------------------------------------
// Step 5: FINALIZE YOUR WEB MAP
// --------------------------------------------------------------------*/
map.addSource('hexgrid', {
    'type': 'geojson',
    'data': collishex
});

map.addLayer({
    'id': 'hexgrid',
    'type': 'fill',
    'source': 'hexgrid',
    'paint': {
        'fill-outline-color': '#000',
        'fill-color': [
            'step',
            ['get', 'COUNT'],
            '#f7f7f7',  // color for lower count
            10, '#ffcccc',  // color for count >= 10
            50, '#ff6666',  // color for count >= 50
            maxcollisions, '#ff0000'  // color for count >= maxcollisions
        ],
        'fill-opacity': 0.8
    },
    filter: ['!=', "COUNT", 0]   
});

});



map.on('click', 'hexgrid', (e) => {
    let popup = new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML('<b>Collision Count:</b>' + e.features[0].properties.COUNT)
        .addTo(map);
});

//HINT: Think about the display of your data and usability of your web map.
//      Update the addlayer paint properties for your hexgrid using:
//        - an expression
//        - The COUNT attribute
//        - The maximum number of collisions found in a hexagon
//      Add a legend and additional functionality including pop-up windows