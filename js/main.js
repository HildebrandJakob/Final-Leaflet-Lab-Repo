/*Jacob Hildebrand*/

//Step 1. Create basemap, import tiles from OSM
function createMap(){
	var map = L.map('map', {
		center: [44, -89],
		zoom: 6
	});

  	L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1,
        accessToken:"pk.eyJ1Ijoiamp0aGVqZXQxMjMiLCJhIjoiY2s2dHBrODgxMDFtdTNob2dwa2xzaWdvciJ9.zRcY4YXY5nI_bbeKN7aujA"
      }).addTo(map);

	getData(map);
	createOverlay(map);
};

//Step 4. Calculate proportional symbol radii
function calcPropRadius(attValue) {
	var scaleFactor = 5;
	var area = attValue * scaleFactor;
	var radius = Math.sqrt(area/Math.PI)*1.5;

	return radius;
};

//Step 5. Create point to layer function to create prop symbol markers
function pointToLayer(feature, latlng, attributes){
	//console.log(attributes);
	var attribute = attributes[1];

	//Style GeoJSON markers
    var geojsonMarkerOptions = {
        radius: 5,
        fillColor: "grey",
        color: "red",
        weight: 0.6,
        opacity: 1,
        fillOpacity: 0.2
	};

	var attValue = feature.properties[attribute];
	geojsonMarkerOptions.radius = calcPropRadius(attValue);

	var layer = L.circleMarker(latlng, geojsonMarkerOptions);
	//Style popup content
	var popupContent = "<p><b>City: </b>" + feature.properties.City + "</p>";

	var year = attribute.split("_")[1];
	popupContent += "<p><b>Population in " + attribute + ": </b> " + feature.properties[attribute] + "</p>"
	layer.bindPopup(popupContent);
	//Open popup on mouseover
    layer.on({
        mouseover: function(){
            this.openPopup();
        },
        mouseout: function(){
            this.closePopup();
        }
    });

	return layer;
};


//Step 6. Implement proportional symbols
function createPropSymbols(data, map, attributes){

    L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);
};


// Create sequence controls that update map based on user input
function createSequenceControls(map, attributes){
	//Moves sequence control bar to lower left corner of map div
	var sequenceControl = L.Control.extend({
		options: {
			position: 'bottomleft'
		},
		onAdd: function(map) {
			var container = L.DomUtil.create('div', 'sequence-control-container');
			$(container).append('<input class = "range-slider" type = "range">');
			$(container).append('<button class="skip" id="reverse">Reverse</button>');
			$(container).append('<button class="skip" id="forward">Skip</button>');
			L.DomEvent.disableClickPropagation(container);
			return container;
		}
	});

	map.addControl(new sequenceControl());

	$('.range-slider').attr({
		max: 7,
		min: 1,
		value: 1,
		step: 1
	});
	//create sequence buttons
	$('.skip').click(function(){
		var index = $('.range-slider').val();
		if($(this).attr('id') == 'forward'){
			index++;
			index = index > 100 ? 0 : index;
		} else if ($(this).attr('id') == 'reverse'){
			index--;
			index = index  < 0 ? 100 : index;
		};
		$('.range-slider').val(index);
		updatePropSymbols(map, attributes[index]);
	});
	//Update map based on range slider
	$('.range-slider').on('input', function(){
		var index = $(this).val();

		updatePropSymbols(map, attributes[index]);
	});
};

//Update prop symbols based on sequence operator
function updatePropSymbols(map, attribute){

	map.eachLayer(function(layer){
		if (layer.feature){
			var props = layer.feature.properties;

			var radius = calcPropRadius(props[attribute]);
			layer.setRadius(radius);

			var popupContent = "<p><b>City: </b>" + props.City + "</p>"

			var year = attribute.split("_")[1];

			popupContent += "<p><b>Population in (thousands) " + attribute + ": </b> " + props[attribute] + "</p>";

			layer.bindPopup(popupContent, {
			offset: new L.Point(0,-radius)
			});
		};
	});
	newLegendupdate(map, attribute);
};

//Step 3. Process data
function processData(data){
	var attributes = [];

	var properties = data.features[0].properties;

	for (var attribute in properties){
		if (attribute.indexOf("Pop_2010") > -16){
			attributes.push(attribute);

		};
	};

	return attributes;
};

//Step 2. Import GeoJSON data
function getData(map){
    //load the data
    $.ajax("data/wisconsin_population.geojson", {
        dataType: "json",
        success: function(response){

			var attributes = processData(response);

            //call function to create proportional symbols
			createPropSymbols(response, map, attributes);
			createSequenceControls(map, attributes);
			createLegend(map, attributes);
        }
    });
};

// Create legend and legend container
function createLegend(map, attributes, attribute, properties){
	var LegendControl = L.Control.extend({
		options: {
			position: 'bottomleft'
		},
		onAdd: function (map) {
			var container = L.DomUtil.create('div', 'legend-control-container');

			$(container).append('<div id="temporal-legend">')
			var svg = '<svg id="attribute-legend" width="160px" height="60px">';

			var circles = {
				max: 10,
				mean: 20,
				min: 40
			};

			//Create dynamic legend
			for(var circle in circles){
				svg += '<circle class="legend-circle" id="' + circle + '"fill="#ffffff" fill-opacity="1.0" stroke="#A4123F" cx="30"/>';
				svg += '<text id="' + circle + '-text" x="65" y="' + circles[circle] + '"></text>';
				//svg += '<text id="' + circles[i] + '-text" x="65" y="60"></text>';
			};

			svg += "</svg>";

			$(container).append(svg);

			L.DomEvent.disableClickPropagation(container);
			return container;
		}
	});

	map.addControl(new LegendControl());
	newLegendupdate(map, attributes[1]);
	getCircleValues(map, attribute);
};

// Calculate circle values for legend
function getCircleValues(map, attribute){
	var min = 1000,
		max = -1000;

	map.eachLayer(function(layer){
		if (layer.feature){
			var attributeValue = Number(layer.feature.properties[attribute]);
			if (attributeValue < min){
				min = attributeValue;
			};
			if (attributeValue > max){
				max = attributeValue;
			};
		};
	});
	var mean = ((max + min) / 2);
	return {
		max: max,
		mean: mean,
		min: min
	};

};

// Update legend with circle values
function newLegendupdate(map, attribute){
	var year = attribute.split("_")[1];
	var content = "Population" + attribute;


	$('#temporal-legend').html(content);

	var circleValues = getCircleValues(map, attribute);
		for (var key in circleValues){
			var radius = calcPropRadius(circleValues[key]);

			$('#'+key).attr({
				cy: 50 - radius,
				r: radius
			});

			$('#'+key+'-text').text(Math.round(circleValues[key]*100)/100);
		};
};

// Create overlay function so user can overlay importantLandmarks on map when they wish





function createOverlay(map){
	var importantLandmarks = new L.LayerGroup();
	map.closePopup(importantLandmarks);



	//Define markers as importantLandmarks
	L.marker([45.4511, -90.1951])
		.bindPopup('<b>Timms Hill:</b> Highest Elevation in Wisconsin at 1951 feet!.').addTo(importantLandmarks),
	L.marker([43.4284, -89.7314])
		.bindPopup('<b>Devils Lake State Park:</b> Most popular state park in Wisconsin with over 3 million annual visitors.  Known especially for rock climbing and swimming.').addTo(importantLandmarks),
	L.marker([43.6275, -89.7710])
		.bindPopup('<b>Wisconsin Dells: </b> Waterpark Capitol of the World. Home to several large waterparks!.').addTo(importantLandmarks),
	L.marker([46.952295, -90.688468])
		.bindPopup('<b>Apostle Island National Lakeshore:</b> Stunning National Lakeshore on Lake Superior.').addTo(importantLandmarks);
	L.marker([43.07484, -89.384149])
	.bindPopup('<b>Wisconsin State Capitol:</b> The Wisconsin State Capitol was built in 1917.  Modeled after the National Captial building in DC, this building features impressive staircases and interior artwork!  Check out the video below to learn more about the Wisconsin State Capitol').addTo(importantLandmarks);





	var overlays = {
		"Important Landmarks": importantLandmarks
	};

	L.control.layers(overlays).addTo(map);

					if(control.layers.collapsed) {
				importantLandmarks.expand();
				} else {
				importantLandmarks.collapse();
				}
};





// assign funvtions to map
$(document).ready(createMap);
