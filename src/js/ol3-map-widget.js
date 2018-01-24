/*
 *   Copyright (c) 2017 CoNWeT Lab., Universidad Politecnica de Madrid
 *   Copyright (c) 2017-2018 Future Internet Consulting and Development Solutions S.L.
 */

/* globals ol, StyledElements */

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

        if (options.style == null) {
            options.style = {};
        }

        let stroke = options.style.stroke;
        if (stroke == null) {
            stroke = {
                color: 'blue',
                width: 3
            };
        } else if (typeof stroke === "string") {
            stroke = {
                color: stroke,
                width: 3
            };
        }

        let fill = options.style.fill;
        if (fill == null) {
            fill = {
                color: 'rgba(0, 0, 255, 0.1)'
            };
        } else if (typeof fill === "string") {
            fill = {
                color: fill
            };
        }

        return new ol.style.Style({
            image: options.image,
            stroke: new ol.style.Stroke({
                color: stroke.color,
                width: stroke.width
            }),
            fill: new ol.style.Fill({
                color: fill.color
            })
        });
    };

    var send_visible_pois = function send_visible_pois() {

        if (this.visiblePoisTimeout != null) {
            clearTimeout(this.visiblePoisTimeout);
            this.visiblePoisTimeout = null;
        }

        if (!MashupPlatform.widget.outputs.poiListOutput.connected) {
            return;
        }

        var extent = this.map.getView().calculateExtent(this.map.getSize());
        var data = this.vector_source.getFeaturesInExtent(extent).map((feature) => {
            return feature.get('data');
        });
        MashupPlatform.widget.outputs.poiListOutput.pushEvent(data);
    };

    // Create the default Marker style
    var DEFAULT_MARKER = build_basic_style();

    var Widget = function Widget() {
        this.selected_feature = null;
        this.layers_widget = null;
        this.base_layer = null;
        this.popover = null;
        this.layers = {};
    };

    Widget.prototype.init = function init() {
        document.getElementById('button').addEventListener('click', function (event) {
            if (this.layers_widget == null) {
                this.layers_widget = MashupPlatform.mashup.addWidget('CoNWeT/layer-selector/0.4', {refposition: event.target.getBoundingClientRect()});
                this.layers_widget.outputs.layerInfoOutput.connect(MashupPlatform.widget.inputs.layerInfo);
            }
        });

        this.base_layer = CORE_LAYERS.WIKIMEDIA;
        var initialCenter = MashupPlatform.prefs.get("initialCenter").split(",").map(Number);
        if (initialCenter.length != 2 || !Number.isFinite(initialCenter[0]) || !Number.isFinite(initialCenter[0])) {
            initialCenter = [0, 0];
        }

        this.vector_source = new ol.source.Vector({});
        this.vector_layer = new ol.layer.Vector({source: this.vector_source, style: DEFAULT_MARKER});
        this.map = new ol.Map({
            target: document.getElementById('map'),
            layers: [
                this.base_layer,
                this.vector_layer
            ],
            view: new ol.View({
                center: ol.proj.transform(initialCenter, 'EPSG:4326', 'EPSG:3857'),
                zoom: parseInt(MashupPlatform.prefs.get('initialZoom'), 10)
            })
        });

        // display popup on click
        this.map.on('click', function (event) {
            var feature = this.map.forEachFeatureAtPixel(event.pixel,
                function (feature, layer) {
                    return feature;
                });

            // Normalize return value, undefined should be treated as null
            feature = feature != null ? feature : null;

            if (feature != null && feature !== this.selected_feature) {
                this.select_feature(feature);
            } else if (feature !== this.selected_feature) {
                this.popover.hide();
                this.popover = null;
                update_selected_feature.call(this, null);
            }
        }.bind(this));

        // change mouse cursor when over marker
        this.map.on('pointermove', function (event) {
            if (event.dragging) {
                if (this.popover != null) {
                    this.popover.hide();
                    this.popover = null;
                }
                update_selected_feature.call(this, null);
                return;
            }
            var pixel = this.map.getEventPixel(event.originalEvent);
            var hit = this.map.hasFeatureAtPixel(pixel);
            this.map.getTarget().style.cursor = hit ? 'pointer' : '';
        }.bind(this));

        // send poi updates on changes
        this.send_visible_pois_bound = send_visible_pois.bind(this);
        this.vector_source.on("change", function () {
            if (this.visiblePoisTimeout != null) {
                clearTimeout(this.visiblePoisTimeout);
            }
            this.visiblePoisTimeout = setTimeout(this.send_visible_pois_bound, 50);
        }.bind(this));
        this.map.on('moveend', this.send_visible_pois_bound);

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

        iconFeature.set('data', poi_info);
        iconFeature.set('title', poi_info.title);
        iconFeature.set('content', poi_info.infoWindow);
        if ('location' in poi_info) {
            var geometry = this.geojsonparser.readGeometry(poi_info.location).transform('EPSG:4326', 'EPSG:3857');
            var marker = new ol.geom.Point(ol.extent.getCenter(geometry.getExtent()));
            iconFeature.setGeometry(new ol.geom.GeometryCollection([geometry, marker]));
        } else {
            iconFeature.setGeometry(
                new ol.geom.Point(
                    ol.proj.transform([poi_info.currentLocation.lng, poi_info.currentLocation.lat], 'EPSG:4326', 'EPSG:3857')
                )
            );
        }

        let icon = null;
        if (typeof poi_info.icon === 'string') {
            icon = {
                src: poi_info.icon
            };
        } else if (poi_info.icon != null && typeof poi_info.icon === 'object') {
            icon = Object.assign({}, poi_info.icon);
        }

        if (icon != null && typeof icon === 'object' && icon.src != null) {
            if (!Array.isArray(icon.anchor)) {
                icon.anchor = [0.5, 0.5];
            }

            if (icon.opacity == null || typeof icon.opacity !== "number") {
                icon.opacity = 1;
            }

            if (icon.scale == null || typeof icon.scale !== "number") {
                icon.scale = 1;
            }

            style = build_basic_style({
                image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
                    anchor: icon.anchor,
                    anchorXUnits: icon.anchorXUnits,
                    anchorYUnits: icon.anchorYUnits,
                    opacity: icon.opacity,
                    src: icon.src,
                    scale: icon.scale
                })),
                style: poi_info.style
            });
        } else if (poi_info.style != null) {
            style = build_basic_style({style: poi_info.style});
        } else {
            style = DEFAULT_MARKER;
        }
        iconFeature.setStyle(style);
    };

    /**
     * Centers map view on the provided PoIs.
     *
     * @param poi_info
     */
    Widget.prototype.centerPoI = function centerPoI(poi_info) {
        var geometry, zoom;

        geometry = new ol.geom.GeometryCollection(poi_info.map((poi) => {
            var feature = this.vector_source.getFeatureById(poi.id);
            return feature.getGeometry();
        }));

        // Update map view
        zoom = parseInt(MashupPlatform.prefs.get('poiZoom'), 10);
        this.map.getView().fit(geometry.getExtent(), {
            maxZoom: zoom
        });

        if (poi_info.length == 1) {
            this.select_feature(this.vector_source.getFeatureById(poi_info[0].id));
        }
    };

    var format_builders = {
        "EsriJSON": ol.format.EsriJSON,
        "GeoJSON": ol.format.GeoJSON,
        "GML": ol.format.GML,
        "GML2": ol.format.GML2,
        "GML3": ol.format.GML3,
        "GPX": ol.format.GPX,
        "KML": ol.format.KML,
        "IGC": ol.format.IGC,
        "OSMXML": ol.format.OSMXML,
        "MVT": ol.format.MVT,
        "Polyline": ol.format.Polyline,
        "TopoJSON": ol.format.TopoJSON,
        "WFS": ol.format.WFS,
        "WKT": ol.format.WKT,
        "WMSGetFeatureInfo": ol.format.WMSGetFeatureInfo,
    }

    var addFormat = function addFormat(layer_info) {
        if (layer_info.format == null) {
            throw new MashupPlatform.wiring.EndpointValueError("format option is required");
        }

        if (typeof layer_info.format === "string") {
            layer_info.format = {
                type: layer_info.format
            };
        }

        if (["GML", "GML2", "GML3"].indexOf(layer_info.format.type) !== -1 && typeof layer_info.format.srsName !== "string") {
            layer_info.format.srsName = layer_info.srsName;
        }

        return new format_builders[layer_info.format.type](layer_info.format)
    }

    Widget.prototype.addLayer = function addLayer(layer_info) {
        var builder = layer_builders[layer_info.type];
        if (builder == null) {
            throw new MashupPlatform.wiring.EndpointValueError("Invalid layer type: " + layer_info.type);
        }

        // Remove any layer with the same id
        this.removeLayer(layer_info);

        var layer = builder(layer_info);
        var layers = this.map.getLayers();
        layers.insertAt(layers.getLength() - 1, layer);

        this.layers[layer_info.id] = layer;
    };

    var build_compatible_url = function build_compatible_url(url, required) {
        if (required != true && url == null) {
            return undefined;
        } else if (required == true && url == null) {
            throw new MashupPlatform.wiring.EndpointValueError("Missing layer url option");
        }

        var parsed_url = new URL(url);
        /* istanbul ignore if */
        if (document.location.protocol === 'https:' && parsed_url.protocol !== 'https:') {
            return MashupPlatform.http.buildProxyURL(parsed_url);
        } else {
            return url;
        }
    };

    var addImageWMSLayer = function addImageWMSLayer(layer_info) {
        var params = layer_info.params;

        if (params == null) {
            params = {
                'LAYERS': layer_info.id
            };
        } else if (params.LAYERS == null) {
            params.LAYERS = layer_info.id;
        }

        return new ol.layer.Image({
            extent: layer_info.extent,
            crossOrigin: 'anonymous',
            source: new ol.source.ImageWMS({
                url: build_compatible_url(layer_info.url, true),
                params: params,
                projection: layer_info.projection,
                crossOrigin: layer_info.crossOrigin,
                hidpi: layer_info.hidpi,
                serverType: layer_info.serverType,
                logo: layer_info.logo,
                ratio: layer_info.ratio
            })
        });
    };

    var addImageArcGISRestLayer = function addImageArcGISRestLayer(layer_info) {
        return new ol.layer.Image({
            extent: layer_info.extent,
            crossOrigin: 'anonymous',
            source: new ol.source.ImageArcGISRest({
                url: build_compatible_url(layer_info.url, true),
                crossOrigin: layer_info.crossOrigin,
                hidpi: layer_info.hidpi,
                logo: layer_info.logo,
                ratio: layer_info.ratio,
                projection: layer_info.projection
            })
        });
    };

    var addImageMapGuideLayer = function addImageMapGuideLayer(layer_info) {
        return new ol.layer.Image({
            extent: layer_info.extent,
            crossOrigin: 'anonymous',
            source: new ol.source.ImageMapGuide({
                url: build_compatible_url(layer_info.url, true),
                displayDpi: layer_info.displayDpi,
                metersPerUnit: layer_info.metersPerUnit,
                hidpi: layer_info.hidpi,
                useOverlay: layer_info.useOverlay,
                ratio: layer_info.ratio
            })
        });
    };

    var addImageStaticLayer = function addImageStaticLayer(layer_info) {
        return new ol.layer.Image({
            extent: layer_info.extent,
            crossOrigin: 'anonymous',
            source: new ol.source.ImageStatic({
                url: build_compatible_url(layer_info.url, true),
                crossOrigin: layer_info.crossOrigin,
                logo: layer_info.logo,
                imageExtent: layer_info.imageExtent,
                projection: layer_info.projection
            })
        });
    };

    var addVectorLayer = function addVectorLayer(layer_info) {
        return new ol.layer.Vector({
            extent: layer_info.extent,
            crossOrigin: 'anonymous',
            source: new ol.source.Vector({
                format: addFormat(layer_info),
                wrapX: layer_info.wrapX,
                // Vector source does not require an url
                // But currently we do not provide any way to populate this layer
                url: build_compatible_url(layer_info.url, true),
            }),
            style: new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'rgba(0, 0, 255, 1.0)',
                    width: 2
                })
            })
        });
    };

    var addVectorTileLayer = function addVectorTileLayer(layer_info) {
        return new ol.layer.Tile({
            extent: layer_info.extent,
            crossOrigin: 'anonymous',
            source: new ol.source.VectorTile({
                cacheSize: layer_info.cacheSize,
                format: addFormat(layer_info),
                logo: layer_info.logo,
                overlaps: layer_info.overlaps,
                projection: layer_info.projection,
                state: layer_info.state,
                tileClass: layer_info.tileClass,
                url: build_compatible_url(layer_info.url, true),
                wrapX: layer_info.wrapX
            })
        });
    };

    var addOSMLayer = function addOSMLayer(layer_info) {
        return new ol.layer.Tile({
            extent: layer_info.extent,
            source: new ol.source.OSM({
                wrapX: layer_info.wrapX,
                url: build_compatible_url(layer_info.url, false),
                cacheSize: layer_info.cacheSize,
                maxZoom: layer_info.maxZoom,
                opaque: layer_info.opaque,
                reprojectionErrorThreshold: layer_info.reprojectionErrorThreshold
            })
        });
    };

    var addTileWMSLayer = function addTileWMSLayer(layer_info) {
        var params = layer_info.params;

        if (params == null) {
            params = {
                'LAYERS': layer_info.id
            };
        } else if (params.LAYERS == null) {
            params.LAYERS = layer_info.id;
        }

        return new ol.layer.Tile({
            extent: layer_info.extent,
            source: new ol.source.TileWMS({
                cacheSize: layer_info.cacheSize,
                crossOrigin: layer_info.crossOrigin,
                hidpi: layer_info.hidpi,
                logo: layer_info.logo,
                opaque: layer_info.opaque,
                params: layer_info.params,
                url: build_compatible_url(layer_info.url, true),
                wrapX: layer_info.wrapX
            })
        });
    };

    var addTileJSONLayer = function addTileJSONLayer(layer_info) {
        return new ol.layer.Tile({
            extent: layer_info.extent,
            source: new ol.source.TileJSON({
                cacheSize: layer_info.cacheSize,
                crossOrigin: layer_info.crossOrigin,
                jsonp: layer_info.jsonp,
                reprojectionErrorThreshold: layer_info.reprojectionErrorThreshold,
                tileJSON: layer_info.tileJSON,
                url: build_compatible_url(layer_info.url, true),
                wrapX: layer_info.wrapX
            })
        });
    };

    var addTileUTFGridLayer = function addTileUTFGridLayer(layer_info) {
        return new ol.layer.Tile({
            extent: layer_info.extent,
            source: new ol.source.TileUTFGrid({
                jsonp: layer_info.jsonp,
                preemptive: layer_info.preemptive,
                tileJSON: layer_info.tileJSON,
                url: build_compatible_url(layer_info.url, false),
            })
        });
    };

    var addXYZLayer = function addXYZLayer(layer_info) {
        return new ol.layer.Tile({
            extent: layer_info.extent,
            source: new ol.source.XYZ({
                wrapX: layer_info.wrapX,
                url: build_compatible_url(layer_info.url, true),
                logo: layer_info.logo,
                maxZoom: layer_info.maxZoom,
                minZoom: layer_info.minZoom,
                tilePixelRatio: layer_info.tilePixelRatio,
                tileSize: layer_info.tileSize
            })
        });
    };

    var addStamenLayer = function addStamenLayer(layer_info) {
        return new ol.layer.Tile({
            extent: layer_info.extent,
            source: new ol.source.Stamen({
                layer: layer_info.layer,
                url: build_compatible_url(layer_info.url, false),
                maxZoom: layer_info.maxZoom,
                minZoom: layer_info.minZoom,
                opaque: layer_info.opaque
            })
        });
    };

    var addBingMapsLayer = function addBingMapsLayer(layer_info) {
        return new ol.layer.Tile({
            extent: layer_info.extent,
            source: new ol.source.BingMaps({
                cacheSize: layer_info.cacheSize,
                hidpi: layer_info.hidpi,
                culture: layer_info.culture,
                key: layer_info.key,
                imagerySet: layer_info.imagerySet,
                maxZoom: layer_info.maxZoom,
                reprojectionErrorThreshold: layer_info.reprojectionErrorThreshold,
                wrapX: layer_info.wrapX
            })
        });
    };

    var addCartoDBLayer = function addCartoDBLayer(layer_info) {
        return new ol.layer.Tile({
            extent: layer_info.extent,
            source: new ol.source.CartoDB({
                attributions: layer_info.attributions,
                cacheSize: layer_info.cacheSize,
                crossOrigin: layer_info.crossOrigin,
                logo: layer_info.logo,
                projection: layer_info.projection,
                maxZoom: layer_info.maxZoom,
                minZoom: layer_info.minZoom,
                wrapX: layer_info.wrapX,
                config: layer_info.config,
                map: layer_info.map,
                account: layer_info.account
            })
        });
    };

    var addWMTSLayer = function addWMTSLayer(layer_info) {
        return new ol.layer.Tile({
            extent: layer_info.extent,
            source: new ol.source.WMTS({
                cacheSize: layer_info.cacheSize,
                logo: layer_info.logo,
                projection: layer_info.projection,
                reprojectionErrorThreshold: layer_info.reprojectionErrorThreshold,
                requestEncoding: layer_info.requestEncoding,
                layer: layer_info.layer,
                style: layer_info.style,
                tilePixelRatio: layer_info.tilePixelRatio,
                version: layer_info.version,
                format: layer_info.format,
                matrixSet: layer_info.matrixSet,
                url: build_compatible_url(layer_info.url, true),
                wrapX: layer_info.wrapX
            })
        });
    };

    var addZoomifyLayer = function addZoomifyLayer(layer_info) {
        return new ol.layer.Tile({
            extent: layer_info.extent,
            source: new ol.source.Zoomify({
                cacheSize: layer_info.cacheSize,
                logo: layer_info.logo,
                projection: layer_info.projection,
                url: build_compatible_url(layer_info.url, false),
                tierSizeCalculation: layer_info.tierSizeCalculation,
                size: layer_info.size
            })
        });
    };

    Widget.prototype.removeLayer = function removeLayer(layer_info) {
        var layer_id = layer_info.id;
        if (layer_id in this.layers) {
            this.map.removeLayer(this.layers[layer_id]);
            delete this.layers[layer_id];
        }
    };

    Widget.prototype.setBaseLayer = function setBaseLayer(layer_info) {
        if (layer_info.id == null || !(layer_info.id in CORE_LAYERS)) {
            throw new MashupPlatform.wiring.EndpointValueError('Invalid layer id');
        }

        this.map.removeLayer(this.base_layer);
        this.base_layer = CORE_LAYERS[layer_info.id];
        this.map.getLayers().insertAt(0, this.base_layer);
    };

    var update_selected_feature = function update_selected_feature(feature) {
        if (this.selected_feature != feature) {
            this.selected_feature = feature;
            MashupPlatform.widget.outputs.poiOutput.pushEvent(feature != null ? feature.get('data') : null);
        }
    };

    Widget.prototype.select_feature = function select_feature(feature) {

        update_selected_feature.call(this, feature);
        let popover = this.popover = new StyledElements.Popover({
            placement: ['top', 'bottom', 'right', 'left'],
            title: feature.get('title'),
            content: new StyledElements.Fragment(feature.get('content'))
        });
        popover.on('show', function () {
            update_selected_feature.call(this, feature);
        }.bind(this));

        // Delay popover show action
        setTimeout(function () {
            var marker_coordinates, marker_position, marker_image, marker_size, marker_style, refpos;

            if (this.popover !== popover) {
                // Selection has changed in the middle
                return;
            }

            marker_coordinates = ol.extent.getCenter(feature.getGeometry().getExtent());
            marker_position = this.map.getPixelFromCoordinate(marker_coordinates);
            marker_style = feature.getStyle();
            marker_image = marker_style.getImage();
            if (marker_image != null && (marker_size = marker_image.getSize()) != null) {
                var marker_scale = marker_image.getScale();
                marker_size = marker_size.map(function (value) {
                    return value * marker_scale;
                });
                refpos = {
                    top: marker_position[1] - marker_size[1],
                    left: marker_position[0] - (marker_size[0] / 2),
                    width: marker_size[0],
                    height: marker_size[1]
                };
            } else {
                refpos = {
                    top: marker_position[1],
                    left: marker_position[0],
                    width: 0,
                    height: 0
                };
            }
            update_selected_feature.call(this, feature);
            this.popover.show(refpos);
        }.bind(this), 100);
    };

    var layer_builders = {
        "BingMaps": addBingMapsLayer,
        "CartoDB": addCartoDBLayer,
        "ImageWMS": addImageWMSLayer,
        "ImageArcGISRest": addImageArcGISRestLayer,
        "ImageMapGuide": addImageMapGuideLayer,
        "ImageStatic": addImageStaticLayer,
        "OSM": addOSMLayer,
        "Stamen": addStamenLayer,
        "TileJSON": addTileJSONLayer,
        "TileUTFGrid": addTileUTFGridLayer,
        "TileWMS": addTileWMSLayer,
        "Vector": addVectorLayer,
        "VectorTile": addVectorTileLayer,
        "WMTS": addWMTSLayer,
        "XYZ": addXYZLayer,
        "Zoomify": addZoomifyLayer
    }

    window.Widget = Widget;

})();
