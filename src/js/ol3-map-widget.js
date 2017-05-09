(function () {

    "use strict";

    var internalUrl = function internalUrl(data) {
        var url = document.createElement("a");
        url.setAttribute('href', data);
        return url.href;
    };

    var CORE_LAYERS = {
        WIKIMEDIA: new ol.layer.Tile({
            source: new ol.source.OSM({
                url: "https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png"
            })
        }),
        CARTODB_LIGHT: new ol.layer.Tile({
            source: new ol.source.OSM({
                url: "https://cartodb-basemaps-{1-4}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png"
            })
        }),
        NOKIA_HERE_CARNAV_DAY: new ol.layer.Tile({
            source: new ol.source.XYZ({
                url: "https://{a-c}.maptile.maps.svc.ovi.com/maptiler/v2/maptile/newest/carnav.day/{z}/{x}/{y}/256/png",
                attribution: 'Map Tiles &copy; ' + new Date().getFullYear() + ' ' + '<a target="_blank" href="http://developer.here.com">HERE</a>'
            })
        }),
        NOKIA_HERE_NORMAL_DAY: new ol.layer.Tile({
            source: new ol.source.XYZ({
                url: "https://{a-c}.maptile.maps.svc.ovi.com/maptiler/v2/maptile/newest/normal.day/{z}/{x}/{y}/256/png",
                attribution: 'Map Tiles &copy; ' + new Date().getFullYear() + ' ' + '<a target="_blank" href="http://developer.here.com">HERE</a>'
            })
        }),
        NOKIA_HERE_NORMAL_DAY_TRANSIT: new ol.layer.Tile({
            source: new ol.source.XYZ({
                url: "https://{a-c}.maptile.maps.svc.ovi.com/maptiler/v2/maptile/newest/normal.day.transit/{z}/{x}/{y}/256/png",
                attribution: 'Map Tiles &copy; ' + new Date().getFullYear() + ' ' + '<a target="_blank" href="http://developer.here.com">HERE</a>'
            })
        }),
        NOKIA_HERE_NORMAL_NIGHT: new ol.layer.Tile({
            source: new ol.source.XYZ({
                url: "https://{a-c}.maptile.maps.svc.ovi.com/maptiler/v2/maptile/newest/normal.night/{z}/{x}/{y}/256/png",
                attribution: 'Map Tiles &copy; ' + new Date().getFullYear() + ' ' + '<a target="_blank" href="http://developer.here.com">HERE</a>'
            })
        }),
        NOKIA_HERE_PEDESTRIAN: new ol.layer.Tile({
            source: new ol.source.XYZ({
                url: "https://{a-c}.maptile.maps.svc.ovi.com/maptiler/v2/maptile/newest/pedestrian.day/{z}/{x}/{y}/256/png",
                attribution: 'Map Tiles &copy; ' + new Date().getFullYear() + ' ' + '<a target="_blank" href="http://developer.here.com">HERE</a>'
            })
        }),
        NOKIA_HERE_TERRAIN_DAY: new ol.layer.Tile({
            source: new ol.source.XYZ({
                url: "https://{a-c}.maptile.maps.svc.ovi.com/maptiler/v2/maptile/newest/terrain.day/{z}/{x}/{y}/256/png",
                attribution: 'Map Tiles &copy; ' + new Date().getFullYear() + ' ' + '<a target="_blank" href="http://developer.here.com">HERE</a>'
            })
        }),
        NOKIA_HERE_SATELLITE_DAY: new ol.layer.Tile({
            source: new ol.source.XYZ({
                url: "https://{a-c}.maptile.maps.svc.ovi.com/maptiler/v2/maptile/newest/satellite.day/{z}/{x}/{y}/256/png",
                attribution: 'Map Tiles &copy; ' + new Date().getFullYear() + ' ' + '<a target="_blank" href="http://developer.here.com">HERE</a>'
            })
        }),
        NOKIA_HERE_HIBRID_DAY: new ol.layer.Tile({
            source: new ol.source.XYZ({
                url: "https://{a-c}.maptile.maps.svc.ovi.com/maptiler/v2/maptile/newest/hibrid.day/{z}/{x}/{y}/256/png",
                attribution: 'Map Tiles &copy; ' + new Date().getFullYear() + ' ' + '<a target="_blank" href="http://developer.here.com">HERE</a>'
            })
        }),
        OSM: new ol.layer.Tile({
            source: new ol.source.OSM()
        }),
    };
    CORE_LAYERS.GOOGLE_STANDARD = CORE_LAYERS.MAPQUEST_ROAD;
    CORE_LAYERS.GOOGLE_HYBRID = CORE_LAYERS.MAPQUEST_HYBRID;
    CORE_LAYERS.GOOGLE_SATELLITE = CORE_LAYERS.MAPQUEST_SATELLITE;

    var build_basic_style = function build_basic_style(options) {
        if (options == null) {
            options = {};
        }

        if (options.image == null) {
            options.image = new ol.style.Icon({
                anchor: [0.5, 46],
                anchorXUnits: 'fraction',
                anchorYUnits: 'pixels',
                opacity: 0.75,
                src: internalUrl('images/icon.png')
            });
        }

        return new ol.style.Style({
            image: options.image,
            stroke: new ol.style.Stroke({
                color: 'blue',
                width: 3
            }),
            fill: new ol.style.Fill({
                color: 'rgba(0, 0, 255, 0.1)'
            })
        });
    };

    // Create the default Marker style
    var DEFAULT_MARKER = build_basic_style();

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
        this.geojsonparser = new ol.format.GeoJSON();
    };

    Widget.prototype.registerPoI = function registerPoI(poi_info) {
        var iconFeature, style;
        iconFeature = this.vector_source.getFeatureById(poi_info.id);

        if (iconFeature == null) {
            iconFeature = new ol.Feature();
            iconFeature.setId(poi_info.id);
            this.vector_source.addFeature(iconFeature);
        }

        iconFeature.set('data', poi_info.data);
        iconFeature.set('title', poi_info.title);
        iconFeature.set('content', poi_info.infoWindow);
        if ('location' in poi_info) {
            iconFeature.setGeometry(this.geojsonparser.readGeometry(poi_info.location).transform('EPSG:4326', 'EPSG:3857'));
        } else {
            iconFeature.setGeometry(
                new ol.geom.Point(
                    ol.proj.transform([poi_info.currentLocation.lng, poi_info.currentLocation.lat], 'EPSG:4326', 'EPSG:3857')
                )
            );
        }

        if (typeof poi_info.icon === 'string') {
            style = build_basic_style({
                image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
                    anchor: [0.5, 0.5],
                    anchorXUnits: 'fraction',
                    anchorYUnits: 'fraction',
                    opacity: 1,
                    src: poi_info.icon,
                    scale: 0.5
                }))
            });
        } else if (typeof poi_info.icon === 'object') {
            style = build_basic_style({
                image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
                    anchor: poi_info.icon.anchor,
                    anchorXUnits: 'fraction',
                    anchorYUnits: 'fraction',
                    opacity: 1,
                    src: poi_info.icon.src,
                    scale: poi_info.icon.scale
                }))
            });
        } else if (poi_info.style != null) {
            style = new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: poi_info.style.stroke,
                    width: 3
                }),
                fill: new ol.style.Fill({
                    color: poi_info.style.fill
                })
            });
        } else {
            style = DEFAULT_MARKER;
        }
        iconFeature.setStyle(style);
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
