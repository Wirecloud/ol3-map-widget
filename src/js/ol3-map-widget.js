/*
 * Copyright (c) 2017 CoNWeT Lab., Universidad Politecnica de Madrid
 * Copyright (c) 2017-2019 Future Internet Consulting and Development Solutions S.L.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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

        let style = new ol.style.Style({
            image: options.image,
            stroke: new ol.style.Stroke({
                color: stroke.color,
                width: stroke.width
            }),
            fill: new ol.style.Fill({
                color: fill.color
            })
        });

        return (feature, resolution) => {
            if (this.selected_feature === feature) {
                return style;
            }

            var minzoom = feature.get('minzoom');

            if (minzoom != null && resolution > minzoom) {
                return null;
            }

            return style;
        };
    };

    var parse_marker_definition = function parse_marker_definition(icon, vector_style) {
        let clone = false;
        if (icon == null && vector_style == null) {
            return DEFAULT_MARKER;
        } else if (icon == null) {
            icon = {};
        } else if (typeof icon === 'string') {
            icon = {
                src: icon
            };
        } else {
            clone = true;
        }

        if (icon.hash != null && icon.hash in this.marker_cache) {
            return this.marker_cache[icon.hash];
        } else if (clone) {
            icon = Object.assign({}, icon);
        }

        if (!Array.isArray(icon.anchor)) {
            icon.anchor = [0.5, 0.5];
        }

        if (icon.opacity == null || typeof icon.opacity !== "number") {
            icon.opacity = 1;
        }

        if (icon.scale == null || typeof icon.scale !== "number") {
            icon.scale = 1;
        }

        if (icon.src != null) {
            var image = new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
                anchor: icon.anchor,
                anchorXUnits: icon.anchorXUnits,
                anchorYUnits: icon.anchorYUnits,
                opacity: icon.opacity,
                src: icon.src,
                scale: icon.scale
            }));
        }
        let marker_style = build_basic_style.call(this, {
            image: image,
            style: vector_style
        });

        if (icon.hash != null) {
            this.marker_cache[icon.hash] = marker_style;
        }

        return marker_style;
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
    var DEFAULT_MARKER = null;

    var Widget = function Widget() {
        this.selected_feature = null;
        this.layers_widget = null;
        this.base_layer = null;
        this.popover = null;
        this.layers = {};
    };

    Widget.prototype.init = function init() {

        let layers_button = document.getElementById('button');
        layers_button.addEventListener('click', (event) => {
            if (this.layers_widget == null) {
                this.layers_widget = MashupPlatform.mashup.addWidget(MashupPlatform.prefs.get('layerswidget').trim(), {refposition: event.target.getBoundingClientRect()});
                this.layers_widget.outputs.layerInfoOutput.connect(MashupPlatform.widget.inputs.layerInfo);
            }
        });
        let layers_widget_ref = MashupPlatform.prefs.get('layerswidget').trim();
        if (layers_widget_ref === "") {
            layers_button.classList.add('hidden');
        } else {
            layers_button.classList.remove('hidden');
        }

        DEFAULT_MARKER = build_basic_style.call(this);
        this.base_layer = CORE_LAYERS.WIKIMEDIA;
        var initialCenter = MashupPlatform.prefs.get("initialCenter").split(",").map(Number);
        if (initialCenter.length != 2 || !Number.isFinite(initialCenter[0]) || !Number.isFinite(initialCenter[1])) {
            initialCenter = [0, 0];
        }

        this.vector_source = new ol.source.Vector({});
        this.marker_cache = {};
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
            var features = [];
            this.map.forEachFeatureAtPixel(
                event.pixel,
                (feature, layer) => {
                    if (feature.get('selectable')) {
                        features.push(feature);
                    }
                },
                {
                    hitTolerance: 2
                }
            );

            // Normalize return value, undefined should be treated as null
            if (features.length > 1) {
                if (this.selected_feature != null && features.indexOf(this.selected_feature) !== -1) {
                    unselect.call(this, this.selected_feature);
                    update_selected_feature.call(this, null);
                } else {
                    var popup_menu = new StyledElements.PopupMenu();
                    features.forEach((feature) => {
                        popup_menu.append(new StyledElements.MenuItem(feature.get('title'), null, feature));
                    });
                    popup_menu.addEventListener("click", (menu, item) => {
                        this.select_feature(item.context);
                    });
                    setTimeout(function () {
                        popup_menu.show({
                            top: event.pixel[1],
                            bottom: event.pixel[1],
                            left: event.pixel[0],
                            right: event.pixel[0]
                        });
                    }, 0);
                }

                return;
            }

            var feature = features[0];

            if (feature != null && feature !== this.selected_feature) {
                this.select_feature(feature);
            } else if (this.selected_feature != null && this.selected_feature.get('content') == null) {
                unselect.call(this, this.selected_feature);
                update_selected_feature.call(this, null);
            } else if (feature !== this.selected_feature && this.popover != null) {
                this.popover.hide();
                update_selected_feature.call(this, null);
            }
        }.bind(this));

        // change mouse cursor when over marker
        this.map.on('pointermove', function (event) {
            if (event.dragging) {
                if (this.popover != null) {
                    this.popover.hide();
                    update_selected_feature.call(this, null);
                }
                return;
            }
            var pixel = this.map.getEventPixel(event.originalEvent);
            var hit = this.map.hasFeatureAtPixel(pixel);
            this.map.getTarget().style.cursor = hit ? 'pointer' : '';
        }.bind(this));

        // send poi updates on changes
        this.send_visible_pois_bound = send_visible_pois.bind(this);
        this.vector_source.on("change", () => {
            if (this.visiblePoisTimeout != null) {
                clearTimeout(this.visiblePoisTimeout);
            }
            this.visiblePoisTimeout = setTimeout(this.send_visible_pois_bound, 50);
        });
        this.map.on('moveend', this.send_visible_pois_bound);

        this.geojsonparser = new ol.format.GeoJSON();
    };

    Widget.prototype.registerPoI = function registerPoI(poi_info) {
        var iconFeature, style, geometry, marker, minzoom;

        if ('location' in poi_info) {
            geometry = this.geojsonparser.readGeometry(poi_info.location).transform('EPSG:4326', 'EPSG:3857');
            if (poi_info.selectable) {
                switch (geometry.getType()) {
                case "Polygon":
                    marker = new ol.geom.Point(geometry.getInteriorPoint().getCoordinates());
                    geometry = new ol.geom.GeometryCollection([geometry, marker]);
                    break;
                case "LineString":
                    marker = new ol.geom.Point(geometry.getCoordinateAt(0.5));
                    geometry = new ol.geom.GeometryCollection([geometry, marker]);
                    break;
                }
            }
        } else {
            geometry = new ol.geom.Point(
                ol.proj.transform([poi_info.currentLocation.lng, poi_info.currentLocation.lat], 'EPSG:4326', 'EPSG:3857')
            );
        }

        iconFeature = this.vector_source.getFeatureById(poi_info.id);
        minzoom = poi_info.minzoom != null ? this.map.getView().getResolutionForZoom(poi_info.minzoom) : null;
        if (iconFeature == null) {
            iconFeature = new ol.Feature({
                geometry: geometry,
                point: marker || geometry,
                data: poi_info,
                title: poi_info.title,
                content: poi_info.infoWindow,
                // PoI are selectable by default
                selectable: poi_info.selectable == null || !!poi_info.selectable,
                minzoom: minzoom
            });
            iconFeature.setId(poi_info.id);
            this.vector_source.addFeature(iconFeature);
        } else {
            iconFeature.setProperties({
                geometry: geometry,
                point: marker || geometry,
                data: poi_info,
                title: poi_info.title,
                content: poi_info.infoWindow,
                // PoI are selectable by default
                selectable: poi_info.selectable == null || !!poi_info.selectable,
                minzoom: minzoom
            });
        }

        if (this.selected_feature === iconFeature) {
            style = parse_marker_definition.call(this, poi_info.iconHighlighted || poi_info.icon, poi_info.styleHighlighted || poi_info.style);
        } else {
            style = parse_marker_definition.call(this, poi_info.icon, poi_info.style);
        }
        iconFeature.setStyle(style);

        if (this.selected_feature === iconFeature) {
            MashupPlatform.widget.outputs.poiOutput.pushEvent(iconFeature.get('data'));
        }
    };

    /**
     * Replace all the PoIs currently displayed on the map with the ones provided as parameters.
     *
     * @param poi_info
     */
    Widget.prototype.replacePoIs = function replacePoIs(poi_info) {
        this.vector_source.clear();
        poi_info.forEach(this.registerPoI, this);
        if (this.selected_feature != null) {
            if (this.popover != null) {
                this.popover.hide();
            }
            let new_selected_feature = this.vector_source.getFeatureById(this.selected_feature.getId());
            if (new_selected_feature != null) {
                this.select_feature(new_selected_feature);
            }
        }
    };

    /**
     * Centers map view on the provided PoIs.
     *
     * @param poi_info
     */
    Widget.prototype.centerPoI = function centerPoI(poi_info) {
        if (poi_info.length === 0) {
            // Just empty current selection
            unselect.call(this, this.selected_feature);
            return update_selected_feature.call(this, null);
        }

        let geometry = new ol.geom.GeometryCollection(poi_info.map((poi) => {
            var feature = this.vector_source.getFeatureById(poi.id);
            return feature.getGeometry();
        }));

        // Update map view
        let zoom = parseInt(MashupPlatform.prefs.get('poiZoom'), 10);
        let currentZoom = this.map.getView().getZoom();
        if (currentZoom < zoom) {
            this.map.getView().fit(geometry.getExtent(), {
                maxZoom: zoom
            });
        } else {
            let view_extent = this.map.getView().calculateExtent(this.map.getSize());
            let geometry_extent = geometry.getExtent();
            if (!ol.extent.containsExtent(view_extent, geometry_extent)) {
                let view_size = ol.extent.getSize(view_extent);
                let geometry_size = ol.extent.getSize(geometry_extent);

                if (view_size[0] < geometry_size[0] && view_size[1] < geometry_size[1]) {
                    this.map.getView().fit(geometry.getExtent(), {
                        maxZoom: zoom
                    });
                } else {
                    let center = ol.extent.getCenter(geometry_extent);
                    this.map.getView().setCenter(center);
                }
            }
        }

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

    var unselect = function unselect(feature) {
        if (feature == null) {
            return;
        }

        var poi_info = feature.get('data');
        var style = parse_marker_definition.call(this, poi_info.icon, poi_info.style);
        feature.setStyle(style);
    };

    Widget.prototype.select_feature = function select_feature(feature) {

        unselect.call(this, this.selected_feature);

        var poi_info = feature.get('data');
        var style = parse_marker_definition.call(this, poi_info.iconHighlighted || poi_info.icon, poi_info.styleHighlighted || poi_info.style);
        feature.setStyle(style);

        update_selected_feature.call(this, feature);

        if (feature.get('content') != null) {
            // The feature has content to be used on a popover
            let popover = this.popover = new StyledElements.Popover({
                placement: ['top', 'bottom', 'right', 'left'],
                title: feature.get('title'),
                content: new StyledElements.Fragment(feature.get('content'))
            });
            popover.on('show', function () {
                update_selected_feature.call(this, feature);
            }.bind(this));
            popover.on('hide', function () {
                // The popover can be hidden by clicking outside the widget. Manage also this case
                this.popover = null;
                update_selected_feature.call(this, null);
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
                marker_style = feature.getStyle()(feature);
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
        }
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
