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

        if (options.style.stroke == null) {
            options.style.stroke = 'blue';
        }

        if (options.style.fill == null) {
            options.style.fill = 'rgba(0, 0, 255, 0.1)';
        }

        return new ol.style.Style({
            image: options.image,
            stroke: new ol.style.Stroke({
                color: options.style.stroke,
                width: 3
            }),
            fill: new ol.style.Fill({
                color: options.style.fill
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
        this.layers_widget = null;
        this.base_layer = null;
        this.layers = {};
    };

    Widget.prototype.init = function init() {
        document.getElementById('button').addEventListener('click', function (event) {
            if (this.layers_widget == null) {
                this.layers_widget = MashupPlatform.mashup.addWidget('CoNWeT/layer-selector/0.4', {refposition: event.target.getBoundingClientRect()});
                this.layers_widget.outputs.layerInfoOutput.connect(MashupPlatform.widget.inputs.layerInfo);
            }
        });

        var initialLayer = CORE_LAYERS.WIKIMEDIA;
        var initialCenter = MashupPlatform.prefs.get("initialCenter").split(",").map(Number);
        if (initialCenter.length != 2 || !Number.isFinite(initialCenter[0]) || !Number.isFinite(initialCenter[0])) {
            initialCenter = [0, 0];
        }

        this.vector_source = new ol.source.Vector({});
        this.vector_layer = new ol.layer.Vector({source: this.vector_source, style: DEFAULT_MARKER});
        this.map = new ol.Map({
            target: document.getElementById('map'),
            layers: [
                initialLayer,
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

            if (feature != null && feature !== this.selected_feature) {
                this.select_feature(feature);
            } else if (feature !== this.selected_feature) {
                if (this.popover != null) {
                    this.popover.hide();
                    this.popover = null;
                }
            }
        }.bind(this));

        // change mouse cursor when over marker
        this.map.on('pointermove', function (event) {
            if (event.dragging) {
                if (this.popover != null) {
                    this.popover.hide();
                    this.popover = null;
                }
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

        iconFeature.set('data', poi_info.data);
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

        if (typeof poi_info.icon === 'string') {
            style = build_basic_style({
                image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
                    anchor: [0.5, 0.5],
                    anchorXUnits: 'fraction',
                    anchorYUnits: 'fraction',
                    opacity: 1,
                    src: poi_info.icon,
                    scale: 0.5
                })),
                style: poi_info.style
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

    var format_builders = {
        "GPX": ol.format.GPX,
        "KML": ol.format.KML,
        "OSMXML": ol.format.OSMXML,
        "WFS": ol.format.WFS,
        "WMSGetFeatureInfo": ol.format.WMSGetFeatureInfo,
        "IGC": ol.format.IGC,
        "Polyline": ol.format.Polyline,
        "WKT": ol.format.WKT,
        "MVT": ol.format.MVT,
        "EsriJSON": ol.format.EsriJSON,
        "GeoJSON": ol.format.GeoJSON,
        "TopoJSON": ol.format.TopoJSON
    }

    var addFormat = function addFormat(layer_info) {
        if (!layer_info.format) {
            return undefined;
        }

        if (layer_info.format === "GML") {
            return new ol.format.GML({srsName: layer_info.srsName});
        }
        if (layer_info.format === "GML2") {
            return new ol.format.GML2({srsName: layer_info.srsName});
        }
        if (layer_info.format === "GML3") {
            return new ol.format.GML3({srsName: layer_info.srsName});
        }

        return new format_builders[layer_info.format]()
    }

    Widget.prototype.addLayer = function addLayer(layer_info) {
        var layer;

        layer = layer_builders[layer_info.type](layer_info);

        this.map.addLayer(layer);

        this.layers[layer_info.name] = layer;
    };

    var addImageWMSLayer = function addImageWMSLayer(layer_info) {
        var layer, params, service_url;

        params = layer_info.params;

        if (params == null) {
            params = {
                'LAYERS': layer_info.id
            };
        } else if (params.LAYERS == null) {
            params.LAYERS = layer_info.id;
        }

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
                projection: layer_info.projection,
                crossOrigin: layer_info.crossOrigin,
                hidpi: layer_info.hidpi,
                serverType: layer_info.serverType,
                logo: layer_info.logo,
                ratio: layer_info.ratio
            })
        });

        return layer;
    }

    var addImageArcGISRestLayer = function addImageArcGISRestLayer(layer_info) {
        var layer, service_url;

        service_url = new URL(layer_info.url);
        if (document.location.protocol === 'https:' && service_url.protocol !== 'https:') {
            service_url = MashupPlatform.http.buildProxyURL(service_url.href);
        } else {
            service_url = layer_info.url;
        }

        layer = new ol.layer.Image({
            extent: layer_info.extent,
            crossOrigin: 'anonymous',
            source: new ol.source.ImageArcGISRest({
                url: service_url,
                crossOrigin: layer_info.crossOrigin,
                hidpi: layer_info.hidpi,
                logo: layer_info.logo,
                ratio: layer_info.ratio,
                projection: layer_info.projection
            })
        });

        return layer;
    }

    var addImageMapGuideLayer = function addImageMapGuideLayer(layer_info) {
        var layer, service_url;

        service_url = new URL(layer_info.url);
        if (document.location.protocol === 'https:' && service_url.protocol !== 'https:') {
            service_url = MashupPlatform.http.buildProxyURL(service_url.href);
        } else {
            service_url = layer_info.url;
        }

        layer = new ol.layer.Image({
            extent: layer_info.extent,
            crossOrigin: 'anonymous',
            source: new ol.source.ImageMapGuide({
                url: service_url,
                displayDpi: layer_info.displayDpi,
                metersPerUnit: layer_info.metersPerUnit,
                hidpi: layer_info.hidpi,
                useOverlay: layer_info.useOverlay,
                ratio: layer_info.ratio

            })
        });

        return layer;
    }

    var addImageStaticLayer = function addImageStaticLayer(layer_info) {
        var layer, service_url;

        service_url = new URL(layer_info.url);
        if (document.location.protocol === 'https:' && service_url.protocol !== 'https:') {
            service_url = MashupPlatform.http.buildProxyURL(service_url.href);
        } else {
            service_url = layer_info.url;
        }

        layer = new ol.layer.Image({
            extent: layer_info.extent,
            crossOrigin: 'anonymous',
            source: new ol.source.ImageStatic({
                url: service_url,
                crossOrigin: layer_info.crossOrigin,
                logo: layer_info.logo,
                imageExtent: layer_info.imageExtent,
                projection: layer_info.projection
            })
        });

        return layer;
    }

    var addVectorLayer = function addVectorLayer(layer_info) {
        var layer, service_url;

        service_url = new URL(layer_info.url);
        if (document.location.protocol === 'https:' && service_url.protocol !== 'https:') {
            service_url = MashupPlatform.http.buildProxyURL(service_url.href);
        } else {
            service_url = layer_info.url;
        }

        layer = new ol.layer.Vector({
            extent: layer_info.extent,
            crossOrigin: 'anonymous',
            source: new ol.source.Vector({
                format: addFormat(layer_info),
                wrapX: layer_info.wrapX,
                url: service_url,
            }),
            style: new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'rgba(0, 0, 255, 1.0)',
                    width: 2
                })
            })
        });

        return layer;
    }

    var addVectorTileLayer = function addVectorTileLayer(layer_info) {
        var layer, service_url;

        service_url = new URL(layer_info.url);
        if (document.location.protocol === 'https:' && service_url.protocol !== 'https:') {
            service_url = MashupPlatform.http.buildProxyURL(service_url.href);
        } else {
            service_url = layer_info.url;
        }

        layer = new ol.layer.Tile({
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
                url: service_url,
                wrapX: layer_info.wrapX
            })
        });

        return layer;
    }

    var addOSMLayer = function addOSMLayer(layer_info) {
        var layer, service_url;

        service_url = new URL(layer_info.tileLoadFunction);
        if (document.location.protocol === 'https:' && service_url.protocol !== 'https:') {
            service_url = MashupPlatform.http.buildProxyURL(service_url.href);
        } else {
            service_url = layer_info.tileLoadFunction;
        }

        layer = new ol.layer.Tile({
            extent: layer_info.extent,
            source: new ol.source.OSM({
                wrapX: layer_info.wrapX,
                url: service_url,
                cacheSize: layer_info.cacheSize,
                maxZoom: layer_info.maxZoom,
                opaque: layer_info.opaque,
                reprojectionErrorThreshold: layer_info.reprojectionErrorThreshold
            })
        });


        return layer;
    }

    var addTileImageLayer = function addTileImageLayer(layer_info) {
        var layer, service_url;

        service_url = new URL(layer_info.url);
        if (document.location.protocol === 'https:' && service_url.protocol !== 'https:') {
            service_url = MashupPlatform.http.buildProxyURL(service_url.href);
        } else {
            service_url = layer_info.url;
        }

        layer = new ol.layer.Tile({
            extent: layer_info.extent,
            source: new ol.source.TileImage({
                wrapX: layer_info.wrapX,
                tilePixelRatio: layer_info.tilePixelRatio,
                opaque: layer_info.opaque,
                logo: layer_info.logo,
                url: service_url
            })
        });

        return layer;
    }

    var addTileJsonLayer = function addTileJsonLayer(layer_info) {
        var layer, service_url;

        service_url = new URL(layer_info.url);
        if (document.location.protocol === 'https:' && service_url.protocol !== 'https:') {
            service_url = MashupPlatform.http.buildProxyURL(service_url.href);
        } else {
            service_url = layer_info.url;
        }

        layer = new ol.layer.Tile({
            extent: layer_info.extent,
            source: new ol.source.TileJson({
                cacheSize: layer_info.cacheSize,
                crossOrigin: layer_info.crossOrigin,
                jsonp: layer_info.jsonp,
                reprojectionErrorThreshold: layer_info.reprojectionErrorThreshold,
                tileJSON: layer_info.tileJSON,
                url: service_url,
                wrapX: layer_info.wrapX
            })
        });

        return layer;
    }

    var addTileUTFGridLayer = function addTileUTFGridLayer(layer_info) {
        var layer, service_url;

        service_url = new URL(layer_info.url);
        if (document.location.protocol === 'https:' && service_url.protocol !== 'https:') {
            service_url = MashupPlatform.http.buildProxyURL(service_url.href);
        } else {
            service_url = layer_info.url;
        }

        layer = new ol.layer.Tile({
            extent: layer_info.extent,
            source: new ol.source.TileUTFGrid({
                jsonp: layer_info.jsonp,
                preemptive: layer_info.preemptive,
                tileJSON: layer_info.tileJSON,
                url: service_url,
            })
        });

        return layer;
    }

    var addXYZLayer = function addXYZLayer(layer_info) {
        var layer, service_url;

        service_url = new URL(layer_info.url);
        if (document.location.protocol === 'https:' && service_url.protocol !== 'https:') {
            service_url = MashupPlatform.http.buildProxyURL(service_url.href);
        } else {
            service_url = layer_info.url;
        }

        layer = new ol.layer.Tile({
            extent: layer_info.extent,
            source: new ol.source.XYZ({
                wrapX: layer_info.wrapX,
                url: service_url,
                logo: layer_info.logo,
                maxZoom: layer_info.maxZoom,
                minZoom: layer_info.minZoom,
                tilePixelRatio: layer_info.tilePixelRatio,
                tileSize: layer_info.tileSize
            })
        });

        return layer;
    }

    var addStamenLayer = function addStamenLayer(layer_info) {
        var layer, service_url;

        service_url = new URL(layer_info.url);
        if (document.location.protocol === 'https:' && service_url.protocol !== 'https:') {
            service_url = MashupPlatform.http.buildProxyURL(service_url.href);
        } else {
            service_url = layer_info.url;
        }

        layer = new ol.layer.Tile({
            extent: layer_info.extent,
            source: new ol.source.Stamen({
                layer: layer_info.wrapX,
                url: service_url,
                maxZoom: layer_info.maxZoom,
                minZoom: layer_info.minZoom,
                opaque: layer_info.opaque
            })
        });

        return layer;
    }

    var addMapQuestLayer = function addMapQuestLayer(layer_info) {
        var layer, service_url;

        service_url = new URL(layer_info.url);
        if (document.location.protocol === 'https:' && service_url.protocol !== 'https:') {
            service_url = MashupPlatform.http.buildProxyURL(service_url.href);
        } else {
            service_url = layer_info.url;
        }

        layer = new ol.layer.Tile({
            extent: layer_info.extent,
            source: new ol.source.MapQuest({
                layer: layer_info.layer,
                url: service_url
            })
        });

        return layer;
    }

    var addBingMapsLayer = function addBingMapsLayer(layer_info) {
        var layer;

        layer = new ol.layer.Tile({
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

        return layer;
    }

    var addCartoDBLayer = function addCartoDBLayer(layer_info) {
        var layer;

        layer = new ol.layer.Tile({
            extent: layer_info.extent,
            source: new ol.source.BingMaps({
                cacheSize: layer_info.cacheSize,
                crossOrigin: layer_info.crossOrigin,
                logo: layer_info.logo,
                maxZoom: layer_info.maxZoom,
                minZoom: layer_info.minZoom,
                wrapX: layer_info.wrapX,
                config: layer_info.config,
                map: layer_info.map,
                account: layer_info.account
            })
        });

        return layer;
    }

    var addWMTSLayer = function addWMTSLayer(layer_info) {
        var layer, service_url;

        service_url = new URL(layer_info.url);
        if (document.location.protocol === 'https:' && service_url.protocol !== 'https:') {
            service_url = MashupPlatform.http.buildProxyURL(service_url.href);
        } else {
            service_url = layer_info.url;
        }

        layer = new ol.layer.Tile({
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
                format: addFormat(layer_info),
                matrixSet: layer_info.matrixSet,
                url: service_url,
                wrapX: layer_info.wrapX
            })
        });

        return layer;
    }

    var addZoomifyLayer = function addZoomifyLayer(layer_info) {
        var layer, service_url;

        service_url = new URL(layer_info.url);
        if (document.location.protocol === 'https:' && service_url.protocol !== 'https:') {
            service_url = MashupPlatform.http.buildProxyURL(service_url.href);
        } else {
            service_url = layer_info.url;
        }

        layer = new ol.layer.Tile({
            extent: layer_info.extent,
            source: new ol.source.Zoomify({
                cacheSize: layer_info.cacheSize,
                logo: layer_info.logo,
                projection: layer_info.projection,
                url: service_url,
                tierSizeCalculation: layer_info.tierSizeCalculation,
                size: layer_info.size
            })
        });

        return layer;
    }

    Widget.prototype.removeLayer = function removeLayer(layer_info) {
        var layer_id = layer_info.name;
        if (layer_id in this.layers) {
            this.map.removeLayer(this.layers[layer_id]);
            delete this.layers[layer_id];
        }
    };

    Widget.prototype.setBaseLayer = function setBaseLayer(layer_info) {
        if ('id' in layer_info && !(layer_info.id in CORE_LAYERS)) {
            throw new TypeError('Invalid layer id');
        }

        if (this.base_layer != null) {
            this.map.removeLayer(this.base_layer);
            this.base_layer = null;
        }
        this.base_layer = CORE_LAYERS[layer_info.id];
        this.map.getLayers().insertAt(0, this.base_layer);
    };

    Widget.prototype.center_popup_menu = function center_popup_menu(feature) {

        this.selected_feature = feature;
        this.popover = new StyledElements.Popover({
            placement: ['top', 'bottom', 'right', 'left'],
            title: feature.get('title'),
            content: new StyledElements.Fragment(feature.get('content'))
        });
        this.popover.on('show', function () {
            this.selected_feature = feature;
        }.bind(this));
        this.popover.on('hide', function () {
            if (this.selected_feature === feature) {
                this.selected_feature = null;
            }
        }.bind(this));

        // Delay popover show action
        setTimeout(function () {
            var marker_coordinates, marker_position, marker_image, refpos;

            marker_coordinates = ol.extent.getCenter(feature.getGeometry().getExtent());
            marker_position = this.map.getPixelFromCoordinate(marker_coordinates);
            marker_image = feature.getStyle().getImage();
            if (marker_image != null) {
                var marker_scale = marker_image.getScale();
                var marker_size = marker_image.getSize().map(function (value) {
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
            this.selected_feature = feature;
            this.popover.show(refpos);
        }.bind(this), 100);
    };

    Widget.prototype.select_feature = function select_feature(feature) {
        // this.selected_feature = feature;
        this.center_popup_menu(feature);
    };

    var layer_builders = {
        "ImageWMS": addImageWMSLayer,
        "Vector": addVectorLayer,
        "OSM": addOSMLayer,
        "TileImage": addTileImageLayer,
        "XYZ": addXYZLayer,
        "Stamen": addStamenLayer,
        "MapQuest": addMapQuestLayer,
        "ImageArcGisRest": addImageArcGISRestLayer,
        "ImageMapGuide": addImageMapGuideLayer,
        "ImageStatic": addImageStaticLayer,
        "BingMaps": addBingMapsLayer,
        "CartoDB": addCartoDBLayer,
        "TileUTFGrid": addTileUTFGridLayer,
        "TileJson": addTileJsonLayer,
        "VectorTile": addVectorTileLayer,
        "WMTS": addWMTSLayer,
        "Zoomify": addZoomifyLayer
    }

    window.Widget = Widget;

})();
