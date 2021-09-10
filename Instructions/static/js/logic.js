$.ajax({
  dataType: "json",
  url: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson",
  data: data,
  success: success
});

// Create the tile layer that will be the background of our map
var lightmap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
  attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
  maxZoom: 18,
  id: "light-v10",
  accessToken: API_KEY
});

// Initialize all of the LayerGroups we'll be using
var layers = {
  BIG: new L.LayerGroup(),
  MIDDLE: new L.LayerGroup(),
  LITTLE: new L.LayerGroup(),
};

// Create the map with our layers
var map = L.map("map-id", {
  center: [40.73, -74.0059],
  zoom: 12,
  layers: [
    layers.BIG,
    layers.MIDDLE,
    layers.LITTLE,
  ]
});

// Add our 'lightmap' tile layer to the map
lightmap.addTo(map);

// Create an overlays object to add to the layer control
var overlays = {
  "4.5": layers.BIG,
  "2.5": layers.MIDDLE,
  "1": layers.LITTLE,
};

// Create a control for our layers, add our overlay layers to it
L.control.layers(null, overlays).addTo(map);

// Create a legend to display information about our map
var info = L.control({
  position: "bottomright"
});

// When the layer control is added, insert a div with the class of "legend"
info.onAdd = function() {
  var div = L.DomUtil.create("div", "legend");
  return div;
};
// Add the info legend to the map
info.addTo(map);

// Initialize an object containing icons for each layer group
var icons = {
  BIG: L.ExtraMarkers.icon({
    icon: "ion-settings",
    iconColor: "white",
    markerColor: "yellow",
    shape: "star"
  }),
  MIDDLE: L.ExtraMarkers.icon({
    icon: "ion-android-bicycle",
    iconColor: "white",
    markerColor: "red",
    shape: "circle"
  }),
  LITTLE: L.ExtraMarkers.icon({
    icon: "ion-minus-circled",
    iconColor: "white",
    markerColor: "blue-dark",
    shape: "penta"
  }),
};

// Perform an API call to the Citi Bike Station Information endpoint
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson").then(function(infoRes) {

  // When the first API call is complete, perform another call to the Citi Bike Station Status endpoint
  d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson").then(function(statusRes) {
    var updatedAt = infoRes.last_updated;
    var lat = statusRes.data.latitude;
    var long = infoRes.data.longitude;
    var mag = infoRes.data.mag;


    // Create an object to keep of the number of markers in each layer
    var stationCount = {
      BIG: 0,
      MIDDLE: 0,
      LITTLE: 0,
    };

    // Initialize a stationStatusCode, which will be used as a key to access the appropriate layers, icons, and station count for layer group
    var stationStatusCode;

    // Loop through the stations (they're the same size and have partially matching data)
    for (var i = 0; i < stationInfo.length; i++) {

      // Create a new station object with properties of both station objects
      var station = Object.assign({}, stationInfo[i], stationStatus[i]);
      // If a station is listed but not installed, it's coming soon
      if (!station.is_installed) {
        stationStatusCode = "BIG";
      }
      // If a station has no bikes available, it's empty
      else if (!station.num_bikes_available) {
        stationStatusCode = "MIDDLE";
      }
      // Otherwise the station is normal
      else {
        stationStatusCode = "LITTLE";
      }

      // Update the station count
      stationCount[stationStatusCode]++;
      // Create a new marker with the appropriate icon and coordinates
      var newMarker = L.marker([station.latitude, station.longitude], {
        icon: icons[stationStatusCode]
      });

      // Add the new marker to the appropriate layer
      newMarker.addTo(layers[stationStatusCode]);

      // Bind a popup to the marker that will  display on click. This will be rendered as HTML
      newMarker.bindPopup(station.name + "<br> Capacity: " + station.capacity + "<br>" + station.num_bikes_available + " Bikes Available");
    }

    // Call the updateLegend function, which will... update the legend!
    updateLegend(updatedAt, stationCount);
  });
});

// Update the legend's innerHTML with the last updated time and station count
function updateLegend(time, stationCount) {
  document.querySelector(".legend").innerHTML = [
    "<p>Updated: " + moment.unix(time).format("h:mm:ss A") + "</p>",
    "<p class='out-of-order'>Out of Order Stations: " + stationCount.OUT_OF_ORDER + "</p>",
    "<p class='coming-soon'>Stations Coming Soon: " + stationCount.COMING_SOON + "</p>",
    "<p class='empty'>Empty Stations: " + stationCount.EMPTY + "</p>",
    "<p class='low'>Low Stations: " + stationCount.LOW + "</p>",
    "<p class='healthy'>Healthy Stations: " + stationCount.NORMAL + "</p>"
  ].join("");
}
