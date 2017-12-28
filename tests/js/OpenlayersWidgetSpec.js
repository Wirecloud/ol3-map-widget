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

        it("supports adding PoIs", () => {
            widget.init();
            widget.registerPoI({
                id: '1',
                data: {},
                location: {
                    type: 'Point',
                    coordinates: [0, 0]
                }
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

            it("supports ImageWMS layers", function () {
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
