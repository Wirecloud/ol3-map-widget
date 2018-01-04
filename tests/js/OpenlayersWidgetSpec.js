/*
 *   Copyright (c) 2017 CoNWeT Lab., Universidad Politecnica de Madrid
 *   Copyright (c) 2017-2018 Future Internet Consulting and Development Solutions S.L.
 */

/* global MashupPlatform, MockMP, ol, Widget */

(function () {

    "use strict";

    var HTML_FIXTURE = '<div id="map" class="map"></div>\n' +
        '<div id="button" class="se-btn"><span>Capas</span></div>';

    var clearDocument = function clearDocument() {
        var elements = document.querySelectorAll('body > *:not(.jasmine_html-reporter)');

        for (var i = 0; i < elements.length; i++) {
            elements[i].parentElement.removeChild(elements[i]);
        }
    };

    describe("ol3-map", function () {

        var widget;

        beforeAll(function () {
            window.MashupPlatform = new MockMP({
                type: 'widget',
                prefs: {
                    'initialCenter': '',
                    'initialZoom': '',
                    'poiZoom': 10
                },
                outputs: ['poiListOutput']
            });
        });

        beforeEach(function () {
            clearDocument();
            document.body.innerHTML += HTML_FIXTURE;
            MashupPlatform.reset();
            widget = new Widget();
        });

        afterEach(function () {
            if (widget && widget.visiblePoisTimeout) {
                clearTimeout(widget.visiblePoisTimeout);
            }
        });

        describe("registerPoI(poi)", () => {

            it("supports adding PoIs", () => {
                widget.init();
                spyOn(widget.vector_source, 'addFeature');
                widget.registerPoI({
                    id: '1',
                    data: {},
                    location: {
                        type: 'Point',
                        coordinates: [0, 0]
                    }
                });
                expect(widget.vector_source.addFeature).toHaveBeenCalledTimes(1);
                expect(widget.vector_source.addFeature).toHaveBeenCalledWith(jasmine.any(ol.Feature));
            });

            it("supports adding PoIs using the deprecated currentLocation ", () => {
                widget.init();
                spyOn(widget.vector_source, 'addFeature');
                widget.registerPoI({
                    id: '1',
                    data: {},
                    location: {
                        type: 'Point',
                        coordinates: [0, 0]
                    }
                });
                expect(widget.vector_source.addFeature).toHaveBeenCalledTimes(1);
                expect(widget.vector_source.addFeature).toHaveBeenCalledWith(jasmine.any(ol.Feature));
            });

            it("supports updating PoIs", () => {
                widget.init();
                var feature_mock = new ol.Feature();
                spyOn(feature_mock, 'set');
                spyOn(feature_mock, 'setGeometry');
                spyOn(feature_mock, 'setStyle');

                spyOn(widget.vector_source, 'addFeature');
                spyOn(widget.vector_source, 'getFeatureById').and.returnValue(feature_mock);
                widget.registerPoI({
                    id: '1',
                    data: {},
                    location: {
                        type: 'Point',
                        coordinates: [0, 0]
                    }
                });

                expect(feature_mock.set).toHaveBeenCalledWith('data', {});
                expect(feature_mock.set).toHaveBeenCalledWith('title', undefined);
                expect(feature_mock.set).toHaveBeenCalledWith('content', undefined);
                expect(feature_mock.setGeometry).toHaveBeenCalledTimes(1);
                expect(feature_mock.setStyle).toHaveBeenCalledTimes(1);

                expect(widget.vector_source.addFeature).toHaveBeenCalledTimes(0);
                expect(feature_mock.setStyle).toHaveBeenCalledWith(jasmine.any(Object));
            });

            describe("handles the style option:", () => {
                const test = function (style, expected) {
                    return () => {
                        widget.init();
                        spyOn(widget.vector_source, 'addFeature');
                        widget.registerPoI({
                            id: '1',
                            data: {},
                            location: {
                                type: 'Point',
                                coordinates: [0, 0]
                            },
                            style: style
                        });
                        expect(widget.vector_source.addFeature).toHaveBeenCalledTimes(1);
                        expect(widget.vector_source.addFeature).toHaveBeenCalledWith(jasmine.any(ol.Feature));
                        let fstyle = widget.vector_source.addFeature.calls.argsFor(0)[0].getStyle();
                        expect(fstyle.getStroke().getColor()).toEqual(expected.stroke.color);
                        expect(fstyle.getStroke().getWidth()).toEqual(expected.stroke.width);
                        expect(fstyle.getFill().getColor()).toEqual(expected.fill.color);
                    };
                };

                it("null (default)", test(
                    null,
                    {stroke: {color: "blue", width: 3}, fill: {color: "rgba(0, 0, 255, 0.1)"}}
                ));
                it("empty (default)", test(
                    {},
                    {stroke: {color: "blue", width: 3}, fill: {color: "rgba(0, 0, 255, 0.1)"}}
                ));
                it("partial (stroke)", test(
                    {stroke: "#F00"},
                    {stroke: {color: "#F00", width: 3}, fill: {color: "rgba(0, 0, 255, 0.1)"}}
                ));
                it("partial (fill)", test(
                    {fill: "#F00"},
                    {stroke: {color: "blue", width: 3}, fill: {color: "#F00"}}
                ));
                it("full sytle", test(
                    {stroke: {color: "#F00", width: 5}, fill: {color: "#0F0"}},
                    {stroke: {color: "#F00", width: 5}, fill: {color: "#0F0"}}
                ));

            });

            describe("handles the icon option:", () => {
                const test = function (icon, expected) {
                    return () => {
                        widget.init();
                        spyOn(widget.vector_source, 'addFeature');
                        widget.registerPoI({
                            id: '1',
                            data: {},
                            location: {
                                type: 'Point',
                                coordinates: [0, 0]
                            },
                            icon: icon
                        });
                        expect(widget.vector_source.addFeature).toHaveBeenCalledTimes(1);
                        expect(widget.vector_source.addFeature).toHaveBeenCalledWith(jasmine.any(ol.Feature));
                        let fimage = widget.vector_source.addFeature.calls.argsFor(0)[0].getStyle().getImage();
                        // TODO anchor can only be tested if anchorXUnits and anchorYUnits are both set to pixels
                        if (expected.anchor != null) {
                            expect(fimage.getAnchor()).toEqual(expected.anchor);
                        }
                        expect(fimage.getOpacity()).toEqual(expected.opacity);
                        expect(fimage.getScale()).toEqual(expected.scale);
                        expect(fimage.getSrc()).toEqual(expected.src);
                        // TODO search a way to test anchorXUnits and anchorYUnits are handled correctly
                    };
                };

                it("null (default)", test(
                    null,
                    {opacity: 0.75, src: "http://localhost:9876/images/icon.png", scale: 1}
                ));
                it("empty (default)", test(
                    {},
                    {opacity: 0.75, src: "http://localhost:9876/images/icon.png", scale: 1}
                ));
                it("url string", test(
                    "https://www.example.com/image.png",
                    {opacity: 1, src: "https://www.example.com/image.png", scale: 1}
                ));
                it("partial (url)", test(
                    {src: "https://www.example.com/image.png"},
                    {opacity: 1, src: "https://www.example.com/image.png", scale: 1}
                ));
                it("full icon", test(
                    {anchor: [40, 50], anchorXUnits: 'pixels', anchorYUnits: 'pixels', opacity: 0.2, src: "https://www.example.com/image.png", scale: 0.1},
                    {anchor: [40, 50], opacity: 0.2, src: "https://www.example.com/image.png", scale: 0.1}
                ));

            });

        });

        describe("centerPoI(poi_list)", () => {

            it("should work with one Poi", () => {
                widget.init();
                spyOn(widget.map.getView(), 'fit').and.callThrough();
                // TODO
                widget.registerPoI({
                    id: '1',
                    data: {},
                    location: {
                        type: 'Point',
                        coordinates: [0, 0]
                    }
                });

                widget.centerPoI([{id: '1'}]);

                expect(widget.map.getView().fit).toHaveBeenCalledTimes(1);
            });

            it("should work with multiple Poi", () => {
                widget.init();
                spyOn(widget.map.getView(), 'fit').and.callThrough();
                // TODO
                widget.registerPoI({
                    id: '1',
                    data: {},
                    location: {
                        type: 'Point',
                        coordinates: [0, 0]
                    }
                });
                widget.registerPoI({
                    id: '2',
                    data: {},
                    location: {
                        type: 'Point',
                        coordinates: [1, 0]
                    }
                });

                widget.centerPoI([{id: '1'}, {id: '2'}]);

                expect(widget.map.getView().fit).toHaveBeenCalledTimes(1);
            });

        });

        describe("addLayer(options)", function () {

            it("throws an EndpointValueError exception for invalid layer types", () => {
                widget.init();
                expect(() => {
                    widget.addLayer({
                        type: "invalid"
                    });
                }).toThrowError(MashupPlatform.wiring.EndpointValueError);
            });

            it("supports Image WMS layers", function () {
                widget.init();
                spyOn(widget.map, 'addLayer');

                widget.addLayer({
                    type: "ImageWMS",
                    url: "http://wms.example.com",
                    name: "LayerName",
                    params: {
                        'LAYERS': 'mylayer'
                    }
                });

                expect(widget.map.addLayer).toHaveBeenCalledWith(jasmine.any(ol.layer.Image));
                expect(widget.map.addLayer.calls.argsFor(0)[0].getSource()).toEqual(jasmine.any(ol.source.ImageWMS));
            });

            it("supports Image WMS layers (provides a default params option)", function () {
                widget.init();
                spyOn(widget.map, 'addLayer');

                widget.addLayer({
                    type: "ImageWMS",
                    url: "http://wms.example.com",
                    name: "LayerName"
                });

                expect(widget.map.addLayer).toHaveBeenCalledWith(jasmine.any(ol.layer.Image));
                expect(widget.map.addLayer.calls.argsFor(0)[0].getSource()).toEqual(jasmine.any(ol.source.ImageWMS));
            });

            it("supports Image WMS layers (uses layer name as default LAYERS parameter)", function () {
                widget.init();
                spyOn(widget.map, 'addLayer');

                widget.addLayer({
                    type: "ImageWMS",
                    url: "http://wms.example.com",
                    name: "LayerName",
                    params: {
                        'FORMAT': 'image/jpeg'
                    }
                });

                expect(widget.map.addLayer).toHaveBeenCalledWith(jasmine.any(ol.layer.Image));
                expect(widget.map.addLayer.calls.argsFor(0)[0].getSource()).toEqual(jasmine.any(ol.source.ImageWMS));
            });

            it("supports ImageArcGISRest layers", function () {
                widget.init();
                spyOn(widget.map, 'addLayer');

                widget.addLayer({
                    type: "ImageArcGISRest",
                    url: "http://wms.example.com",
                    name: "LayerName"
                });

                expect(widget.map.addLayer).toHaveBeenCalledWith(jasmine.any(ol.layer.Image));
                expect(widget.map.addLayer.calls.argsFor(0)[0].getSource()).toEqual(jasmine.any(ol.source.ImageArcGISRest));
            });

            it("supports ImageMapGuide layers", function () {
                widget.init();
                spyOn(widget.map, 'addLayer');

                widget.addLayer({
                    type: "ImageMapGuide",
                    url: "http://wms.example.com",
                    name: "LayerName"
                });

                expect(widget.map.addLayer).toHaveBeenCalledWith(jasmine.any(ol.layer.Image));
                expect(widget.map.addLayer.calls.argsFor(0)[0].getSource()).toEqual(jasmine.any(ol.source.ImageMapGuide));
            });

            it("supports ImageStatic layers", function () {
                widget.init();
                spyOn(widget.map, 'addLayer');

                widget.addLayer({
                    type: "ImageStatic",
                    url: "http://www.example.com/map.png",
                    name: "LayerName"
                });

                expect(widget.map.addLayer).toHaveBeenCalledWith(jasmine.any(ol.layer.Image));
                expect(widget.map.addLayer.calls.argsFor(0)[0].getSource()).toEqual(jasmine.any(ol.source.ImageStatic));
            });

            it("supports Vector layers", function () {
                widget.init();
                spyOn(widget.map, 'addLayer');

                widget.addLayer({
                    type: "Vector",
                    url: 'https://openlayers.org/en/v4.6.4/examples/data/kml/2012_Earthquakes_Mag5.kml',
                    format: "KML",
                    name: "LayerName"
                });

                expect(widget.map.addLayer).toHaveBeenCalledWith(jasmine.any(ol.layer.Vector));
                expect(widget.map.addLayer.calls.argsFor(0)[0].getSource()).toEqual(jasmine.any(ol.source.Vector));
            });

            it("raises an EndpointValueError exception when trying to create a Vector layer without providing the format", function () {
                widget.init();
                spyOn(widget.map, 'addLayer');

                expect(() => {
                    widget.addLayer({
                        type: "Vector",
                        url: 'https://openlayers.org/en/v4.6.4/examples/data/kml/2012_Earthquakes_Mag5.kml',
                        name: "LayerName"
                    });
                }).toThrowError(MashupPlatform.wiring.EndpointValueError);
            });

            it("supports Vector layers (with format options)", function () {
                widget.init();
                spyOn(widget.map, 'addLayer');

                widget.addLayer({
                    type: "Vector",
                    url: 'https://openlayers.org/en/v4.6.4/examples/data/kml/2012_Earthquakes_Mag5.kml',
                    format: {
                        type: "KML",
                        extractStyles: false
                    },
                    name: "LayerName"
                });

                expect(widget.map.addLayer).toHaveBeenCalledWith(jasmine.any(ol.layer.Vector));
                expect(widget.map.addLayer.calls.argsFor(0)[0].getSource()).toEqual(jasmine.any(ol.source.Vector));
            });

            it("supports Vector layers (with GML format options)", function () {
                widget.init();
                spyOn(widget.map, 'addLayer');

                widget.addLayer({
                    type: "Vector",
                    url: 'https://openlayers.org/en/v4.6.4/examples/data/kml/2012_Earthquakes_Mag5.kml',
                    format: {
                        type: "GML",
                        curve: true
                    },
                    name: "LayerName"
                });

                expect(widget.map.addLayer).toHaveBeenCalledWith(jasmine.any(ol.layer.Vector));
                expect(widget.map.addLayer.calls.argsFor(0)[0].getSource()).toEqual(jasmine.any(ol.source.Vector));
            });


            it("supports VectorTile layers", function () {
                widget.init();
                spyOn(widget.map, 'addLayer');

                widget.addLayer({
                    type: "VectorTile",
                    url: 'https://tile.mapzen.com/mapzen/vector/v1/all/{z}/{x}/{y}.topojson?api_key=XXX',
                    format: {
                        type: "TopoJSON",
                        layerName: 'layer',
                        layers: ['water', 'roads', 'buildings']
                    },
                    name: "LayerName"
                });

                expect(widget.map.addLayer).toHaveBeenCalledWith(jasmine.any(ol.layer.Tile));
                expect(widget.map.addLayer.calls.argsFor(0)[0].getSource()).toEqual(jasmine.any(ol.source.VectorTile));
            });

            it("supports OSM layers", function () {
                widget.init();
                spyOn(widget.map, 'addLayer');

                widget.addLayer({
                    type: "OSM",
                    name: "LayerName"
                });

                expect(widget.map.addLayer).toHaveBeenCalledWith(jasmine.any(ol.layer.Tile));
                expect(widget.map.addLayer.calls.argsFor(0)[0].getSource()).toEqual(jasmine.any(ol.source.OSM));
            });

            it("supports Tile WMS layers", function () {
                widget.init();
                spyOn(widget.map, 'addLayer');

                widget.addLayer({
                    type: "TileWMS",
                    name: "LayerName",
                    url: 'https://wms.geo.admin.ch/',
                    params: {
                        'LAYERS': 'ch.swisstopo.pixelkarte-farbe-pk1000.noscale',
                        'FORMAT': 'image/jpeg'
                    },
                    serverType: 'mapserver'
                });

                expect(widget.map.addLayer).toHaveBeenCalledWith(jasmine.any(ol.layer.Tile));
                expect(widget.map.addLayer.calls.argsFor(0)[0].getSource()).toEqual(jasmine.any(ol.source.TileWMS));
            });

            it("supports Tile WMS layers (provides a default params option)", function () {
                widget.init();
                spyOn(widget.map, 'addLayer');

                widget.addLayer({
                    type: "TileWMS",
                    name: "LayerName",
                    url: 'https://wms.geo.admin.ch/',
                    serverType: 'mapserver'
                });

                expect(widget.map.addLayer).toHaveBeenCalledWith(jasmine.any(ol.layer.Tile));
                expect(widget.map.addLayer.calls.argsFor(0)[0].getSource()).toEqual(jasmine.any(ol.source.TileWMS));
            });

            it("supports Tile WMS layers (uses layer name as default LAYERS parameter)", function () {
                widget.init();
                spyOn(widget.map, 'addLayer');

                widget.addLayer({
                    type: "TileWMS",
                    name: "LayerName",
                    url: 'https://wms.geo.admin.ch/',
                    params: {
                        'FORMAT': 'image/jpeg'
                    },
                    serverType: 'mapserver'
                });

                expect(widget.map.addLayer).toHaveBeenCalledWith(jasmine.any(ol.layer.Tile));
                expect(widget.map.addLayer.calls.argsFor(0)[0].getSource()).toEqual(jasmine.any(ol.source.TileWMS));
            });

            it("supports Tile JSON layers", function () {
                widget.init();
                spyOn(widget.map, 'addLayer');

                widget.addLayer({
                    type: "TileJSON",
                    name: "LayerName",
                    url: 'https://api.tiles.mapbox.com/v3/mapbox.geography-class.json?secure',
                    crossOrigin: 'anonymous'
                });

                expect(widget.map.addLayer).toHaveBeenCalledWith(jasmine.any(ol.layer.Tile));
                expect(widget.map.addLayer.calls.argsFor(0)[0].getSource()).toEqual(jasmine.any(ol.source.TileJSON));
            });

            it("supports Tile UTF Grid layers", function () {
                widget.init();
                spyOn(widget.map, 'addLayer');

                widget.addLayer({
                    type: "TileUTFGrid",
                    name: "LayerName",
                    url: 'https://api.tiles.mapbox.com/v4/mapbox.geography-class.json?secure&access_token=XXX'
                });

                expect(widget.map.addLayer).toHaveBeenCalledWith(jasmine.any(ol.layer.Tile));
                expect(widget.map.addLayer.calls.argsFor(0)[0].getSource()).toEqual(jasmine.any(ol.source.TileUTFGrid));
            });

            it("supports XYZ layers", function () {
                widget.init();
                spyOn(widget.map, 'addLayer');

                widget.addLayer({
                    type: "XYZ",
                    url: "https://{a-c}.maptile.maps.svc.ovi.com/maptiler/v2/maptile/newest/carnav.day/{z}/{x}/{y}/256/png",
                    name: "LayerName"
                });

                expect(widget.map.addLayer).toHaveBeenCalledWith(jasmine.any(ol.layer.Tile));
                expect(widget.map.addLayer.calls.argsFor(0)[0].getSource()).toEqual(jasmine.any(ol.source.XYZ));
            });

            it("supports Stamen layers", function () {
                widget.init();
                spyOn(widget.map, 'addLayer');

                widget.addLayer({
                    type: "Stamen",
                    layer: "watercolor",
                    name: "LayerName"
                });

                expect(widget.map.addLayer).toHaveBeenCalledWith(jasmine.any(ol.layer.Tile));
                expect(widget.map.addLayer.calls.argsFor(0)[0].getSource()).toEqual(jasmine.any(ol.source.Stamen));
            });

            it("supports BingMaps layers", function () {
                widget.init();
                spyOn(widget.map, 'addLayer');

                widget.addLayer({
                    type: "BingMaps",
                    imagerySet: "Road",
                    name: "LayerName"
                });

                expect(widget.map.addLayer).toHaveBeenCalledWith(jasmine.any(ol.layer.Tile));
                expect(widget.map.addLayer.calls.argsFor(0)[0].getSource()).toEqual(jasmine.any(ol.source.BingMaps));
            });

            it("supports CartoDB layers", function () {
                widget.init();
                spyOn(widget.map, 'addLayer');

                widget.addLayer({
                    type: "CartoDB",
                    account: 'documentation',
                    config: {
                        layers: [{
                            type: 'cartodb',
                            options: {
                                cartocss_version: '2.1.1',
                                cartocss: '#layer { polygon-fill: #F00; }',
                                sql: 'select * from european_countries_e where area > 0'
                            }
                        }]
                    },
                    name: "LayerName"
                });

                expect(widget.map.addLayer).toHaveBeenCalledWith(jasmine.any(ol.layer.Tile));
                expect(widget.map.addLayer.calls.argsFor(0)[0].getSource()).toEqual(jasmine.any(ol.source.CartoDB));
            });

            it("supports WMTS layers", function () {
                widget.init();
                spyOn(widget.map, 'addLayer');

                widget.addLayer({
                    type: "WMTS",
                    url: "https://www.example.com/MapServer/WMTS/",
                    name: "LayerName"
                });

                expect(widget.map.addLayer).toHaveBeenCalledWith(jasmine.any(ol.layer.Tile));
                expect(widget.map.addLayer.calls.argsFor(0)[0].getSource()).toEqual(jasmine.any(ol.source.WMTS));
            });

            it("supports Zoomify layers", function () {
                widget.init();
                spyOn(widget.map, 'addLayer');

                widget.addLayer({
                    type: "Zoomify",
                    url: "http://vips.vtech.fr/cgi-bin/iipsrv.fcgi?zoomify=/mnt/MD1/AD00/plan_CHU-4HD-01/FOND.TIF/",
                    size: [9911, 6100],
                    name: "LayerName"
                });

                expect(widget.map.addLayer).toHaveBeenCalledWith(jasmine.any(ol.layer.Tile));
                expect(widget.map.addLayer.calls.argsFor(0)[0].getSource()).toEqual(jasmine.any(ol.source.Zoomify));
            });

        });
    });

})();
