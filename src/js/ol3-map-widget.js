(function () {

    "use strict";

    var CORE_LAYERS = {
        OSM: new ol.layer.Tile({
            source: new ol.source.OSM()
        }),

        MAPQUEST_ROAD: new ol.layer.Tile({
            source: new ol.source.MapQuest({layer: 'osm'})
        }),

        MAPQUEST_HYBRID: new ol.layer.Group({
            layers: [
                new ol.layer.Tile({source: new ol.source.MapQuest({layer: 'sat'})}),
                new ol.layer.Tile({source: new ol.source.MapQuest({layer: 'hyb'})})
            ]
        }),

        MAPQUEST_SATELLITE: new ol.layer.Tile({
            source: new ol.source.MapQuest({layer: 'sat'})
        })
    };
    CORE_LAYERS.GOOGLE_STANDARD = CORE_LAYERS.MAPQUEST_ROAD;
    CORE_LAYERS.GOOGLE_HYBRID = CORE_LAYERS.MAPQUEST_HYBRID;
    CORE_LAYERS.GOOGLE_SATELLITE = CORE_LAYERS.MAPQUEST_SATELLITE;

    // Create the default Marker style
    var DEFAULT_MARKER = new ol.style.Style({
        image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
            anchor: [0.5, 46],
            anchorXUnits: 'fraction',
            anchorYUnits: 'pixels',
            opacity: 0.75,
            src: 'http://openlayers.org/en/v3.11.2/examples/data/icon.png'
        }))
    });

    var Widget = function Widget() {
        this.layers_widget = null;
        this.base_layer = null;
        this.layers = {};
    };

    Widget.prototype.init = function init() {
        document.getElementById('button').addEventListener('click', function (event) {
            if (this.layers_widget == null) {
                this.layers_widget = MashupPlatform.mashup.addWidget('CoNWeT/layer-selector/0.3', {refposition: event.target.getBoundingClientRect()});
                this.layers_widget.outputs.layerInfoOutput.connect(MashupPlatform.widget.inputs.layerInfo);
            }
        });

        MashupPlatform.wiring.registerCallback('layerInfo', function (command_info) {
            command_info = JSON.parse(command_info);
            switch (command_info.action) {
            case "addLayer":
                this.addLayer(command_info.data);
                break;
            case "removeLayer":
                this.removeLayer(command_info.data);
                break;
            case "setBaseLayer":
                this.setBaseLayer(command_info.data);
                break;
            default:
                throw new MashupPlatform.wiring.EndpointValueError();
            }
        }.bind(this));

        MashupPlatform.wiring.registerCallback('poiInput', function (poi_info) {
            poi_info = JSON.parse(poi_info);
            var iconFeature = this.vector_source.getFeatureById(poi_info.id);

            if (iconFeature != null) {
                iconFeature = new ol.Feature({
                    geometry: new ol.geom.Point([poi_info.currentLocation.lat, poi_info.currentLocation.lng]),
                    style: DEFAULT_MARKER,
                    data: poi_info.data
                });
                this.vector_source.addFeature(iconFeature);
            }
        }.bind(this));

        this.vector_source = new ol.source.Vector({});
        this.vector_layer = new ol.layer.Vector({source: this.vector_source, style: DEFAULT_MARKER});
        this.map = new ol.Map({
            target: document.getElementById('map'),
            layers: [this.vector_layer],
            view: new ol.View({
                center: ol.proj.transform([37.41, 8.82], 'EPSG:4326', 'EPSG:3857'),
                zoom: MashupPlatform.prefs.get('initialZoom')
            })
        });

        // change mouse cursor when over marker
        this.map.on('pointermove', function (e) {
            if (e.dragging) {
                //$(element).popover('destroy');
                return;
            }
            var pixel = this.map.getEventPixel(e.originalEvent);
            var hit = this.map.hasFeatureAtPixel(pixel);
            this.map.getTarget().style.cursor = hit ? 'pointer' : '';
        }.bind(this));

        this.setBaseLayer({id: "OSM"});
    };

    Widget.prototype.addLayer = function addLayer(layer_info) {
        var layer, params, service_url;

        params = {
            'LAYERS': layer_info.name,
            'VERSION': layer_info.version
        };

        service_url = new URL(layer_info.url);
        if (document.location.protocol === 'https:' && service_url.protocol !== 'https:') {
            service_url = MashupPlatform.http.buildProxyURL(service_url.href);
        } else {
            service_url = layer_info.url;
        }

        layer = new ol.layer.Image({
            extent: layer_info.extent,
            crossOrigin: 'anonymous',
            source: new ol.source.ImageWMS({
                url: service_url,
                params: params,
                projection: layer_info.projection
            })
        });
        this.map.addLayer(layer);

        this.layers[layer_info.url + '#' + layer_info.name] = layer;
    };

    Widget.prototype.removeLayer = function removeLayer(layer_info) {
        var layer_id = layer_info.url + '#' + layer_info.name;
        if (layer_id in this.layers) {
            this.map.removeLayer(this.layers[layer_id]);
            delete this.layers[layer_id];
        }
    };

    Widget.prototype.setBaseLayer = function setBaseLayer(layer_info) {
        if (this.base_layer != null) {
            this.map.removeLayer(this.base_layer);
            this.base_layer = null;
        }
        this.base_layer = CORE_LAYERS[layer_info.id];
        this.map.getLayers().insertAt(0, this.base_layer);
    };

    window.Widget = Widget;

})();
