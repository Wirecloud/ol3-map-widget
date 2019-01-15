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

    var deepFreeze = function deepFreeze(obj) {

        // Retrieve the property names defined on obj
        var propNames = Object.getOwnPropertyNames(obj);

        // Freeze properties before freezing self
        propNames.forEach(function(name) {
            var prop = obj[name];

            // Freeze prop if it is an object
            if (typeof prop == 'object' && prop !== null) {
                deepFreeze(prop);
            }
        });

        // Freeze self (no-op if already frozen)
        return Object.freeze(obj);
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
                outputs: ['poiListOutput', 'poiOutput']
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

        describe("prefs", () => {

            describe("initialCenter", () => {

                it("empty", () => {
                    MashupPlatform.prefs.set("initialCenter", "");

                    widget.init();

                    expect(widget.map.getView().getCenter()).toEqual(ol.proj.transform([0, 0], 'EPSG:4326', 'EPSG:3857'));
                });

                it("missing longitude", () => {
                    MashupPlatform.prefs.set("initialCenter", "-4.4212964");

                    widget.init();

                    expect(widget.map.getView().getCenter()).toEqual(ol.proj.transform([0, 0], 'EPSG:4326', 'EPSG:3857'));
                });

                it("invalid latitude", () => {
                    MashupPlatform.prefs.set("initialCenter", "a, 36.7212828");

                    widget.init();

                    expect(widget.map.getView().getCenter()).toEqual(ol.proj.transform([0, 0], 'EPSG:4326', 'EPSG:3857'));
                });

                it("invalid longitude", () => {
                    MashupPlatform.prefs.set("initialCenter", "-4.4212964, a");

                    widget.init();

                    expect(widget.map.getView().getCenter()).toEqual(ol.proj.transform([0, 0], 'EPSG:4326', 'EPSG:3857'));
                });

                it("extra data", () => {
                    MashupPlatform.prefs.set("initialCenter", "-4.4212964, 36.7212828, 1");

                    widget.init();

                    expect(widget.map.getView().getCenter()).toEqual(ol.proj.transform([0, 0], 'EPSG:4326', 'EPSG:3857'));
                });

                it("valid coordinate", () => {
                    MashupPlatform.prefs.set("initialCenter", "-4.4212964, 36.7212828");

                    widget.init();

                    expect(widget.map.getView().getCenter()).toEqual(ol.proj.transform([-4.4212964, 36.7212828], 'EPSG:4326', 'EPSG:3857'));
                });

            });

        });

        describe("events", () => {

            describe("click", () => {

                it("on a not selected feature", () => {
                    let pixel_mock = jasmine.createSpy('pixel');
                    let feature_mock = new ol.Feature();
                    feature_mock.set('selectable', true);
                    widget.init();
                    spyOn(widget, "select_feature");
                    spyOn(widget.map, 'forEachFeatureAtPixel').and.callFake((pixel, listener) => {
                        expect(pixel).toBe(pixel_mock);
                        return listener(feature_mock);
                    });

                    widget.map.dispatchEvent({
                        type: "click",
                        pixel: pixel_mock
                    });

                    expect(widget.select_feature).toHaveBeenCalledWith(feature_mock);
                });

                it("on a not selected feature (with a marker)", () => {
                    let pixel_mock = jasmine.createSpy('pixel');
                    let feature_mock = new ol.Feature();
                    feature_mock.set('selectable', true);
                    feature_mock.setGeometry(new ol.geom.Point([0, 0]));
                    let style_mock = new ol.style.Style();
                    feature_mock.setStyle(() => {return style_mock});
                    style_mock.getImage = function () {
                        return {
                            getScale: () => {return 0.5;},
                            getSize: () => {return [1, 2];}
                        };
                    };
                    widget.init();
                    spyOn(widget, "select_feature").and.callThrough();
                    spyOn(widget.map, 'forEachFeatureAtPixel').and.callFake((pixel, listener) => {
                        expect(pixel).toBe(pixel_mock);
                        return listener(feature_mock);
                    });

                    widget.map.dispatchEvent({
                        type: "click",
                        pixel: pixel_mock
                    });

                    expect(widget.select_feature).toHaveBeenCalledWith(feature_mock);
                });

                it("on the selected feature", () => {
                    let pixel_mock = jasmine.createSpy('pixel');
                    let feature_mock = new ol.Feature();
                    feature_mock.set('selectable', true);
                    widget.init();
                    widget.selected_feature = feature_mock;
                    spyOn(widget, "select_feature");
                    spyOn(widget.map, 'forEachFeatureAtPixel').and.callFake((pixel, listener) => {
                        expect(pixel).toBe(pixel_mock);
                        return listener(feature_mock);
                    });

                    widget.map.dispatchEvent({
                        type: "click",
                        pixel: pixel_mock
                    });

                    expect(widget.select_feature).not.toHaveBeenCalled();
                });

                it("on a not selected feature (but while there is a selected feature)", () => {
                    let pixel_mock = jasmine.createSpy('pixel');
                    let feature_mock1 = new ol.Feature();
                    feature_mock1.set('selectable', true);
                    let feature_mock2 = new ol.Feature();
                    feature_mock2.set('selectable', true);
                    widget.init();
                    widget.selected_feature = feature_mock1;
                    widget.popover = {
                        hide: jasmine.createSpy('hide')
                    };
                    spyOn(widget, "select_feature");
                    spyOn(widget.map, 'forEachFeatureAtPixel').and.callFake((pixel, listener) => {
                        expect(pixel).toBe(pixel_mock);
                        return listener(feature_mock2);
                    });

                    widget.map.dispatchEvent({
                        type: "click",
                        pixel: pixel_mock
                    });

                    expect(widget.popover.hide).not.toHaveBeenCalled();
                    expect(widget.select_feature).toHaveBeenCalledWith(feature_mock2);
                });

                it("outside any feature", () => {
                    let pixel_mock = jasmine.createSpy('pixel');
                    widget.init();
                    spyOn(widget, "select_feature");
                    spyOn(widget.map, 'forEachFeatureAtPixel').and.callFake((pixel, listener) => {
                        expect(pixel).toBe(pixel_mock);
                        return undefined;
                    });

                    widget.map.dispatchEvent({
                        type: "click",
                        pixel: pixel_mock
                    });

                    expect(widget.select_feature).not.toHaveBeenCalled();
                    expect(MashupPlatform.widget.outputs.poiOutput.pushEvent).not.toHaveBeenCalled();
                });

                it("outside any feature (but while there is a selected feature)", (done) => {
                    let pixel_mock = jasmine.createSpy('pixel');
                    let feature_mock = new ol.Feature();
                    feature_mock.set('selectable', true);
                    feature_mock.setGeometry(new ol.geom.Point([0, 0]));
                    feature_mock.setStyle(() => {return new ol.style.Style()});

                    widget.init();
                    widget.select_feature(feature_mock);
                    widget.popover.on('show', () => {
                        MashupPlatform.widget.outputs.poiOutput.reset();
                        let popover = widget.popover;
                        // TODO, the following line is required as the CSS
                        // animation is not processed
                        popover.element.classList.remove('in');
                        spyOn(popover, "on");
                        spyOn(popover, "hide").and.callThrough();
                        spyOn(widget, "select_feature");

                        spyOn(widget.map, 'forEachFeatureAtPixel').and.callFake((pixel, listener) => {
                            expect(pixel).toBe(pixel_mock);
                            return undefined;
                        });

                        widget.map.dispatchEvent({
                            type: "click",
                            pixel: pixel_mock
                        });

                        expect(widget.popover).toBe(null)
                        expect(widget.selected_feature).toBe(null);
                        expect(popover.hide).toHaveBeenCalled();
                        expect(widget.select_feature).not.toHaveBeenCalled();
                        expect(MashupPlatform.widget.outputs.poiOutput.pushEvent).toHaveBeenCalledWith(null);
                        done();
                    });
                });

                it("outside the widget (but while there is a selected feature)", () => {
                    let pixel_mock = jasmine.createSpy('pixel');
                    let feature_mock = new ol.Feature();
                    feature_mock.set('selectable', true);
                    feature_mock.setGeometry(new ol.geom.Point([0, 0]));
                    feature_mock.setStyle(() => {return new ol.style.Style()});

                    widget.init();
                    widget.select_feature(feature_mock);
                    MashupPlatform.widget.outputs.poiOutput.reset();
                    let popover = widget.popover;
                    spyOn(popover, "on");
                    spyOn(widget, "select_feature");

                    // Simulate the popover has been hidden by a third party code
                    widget.popover.dispatchEvent("hide");

                    expect(widget.popover).toBe(null)
                    expect(widget.selected_feature).toBe(null);
                    expect(MashupPlatform.widget.outputs.poiOutput.pushEvent).toHaveBeenCalledWith(null);
                });
            });

            describe("pointermove", () => {

                it("outside any feature", () => {
                    widget.init();
                    spyOn(widget.map, "getEventPixel");
                    spyOn(widget.map, "hasFeatureAtPixel").and.returnValue(null);
                    widget.map.dispatchEvent({
                        type: "pointermove",
                        dragging: false
                    });

                    expect(widget.map.getTarget().style.cursor).toBe("");
                });

                it("inside a feature", () => {
                    widget.init();
                    spyOn(widget.map, "getEventPixel");
                    spyOn(widget.map, "hasFeatureAtPixel").and.returnValue({});
                    widget.map.dispatchEvent({
                        type: "pointermove",
                        dragging: false
                    });

                    expect(widget.map.getTarget().style.cursor).toBe("pointer");
                });

                it("dragging (no popover)", () => {
                    widget.init();
                    spyOn(widget.map, "getEventPixel");
                    spyOn(widget.map, "hasFeatureAtPixel").and.returnValue({});

                    widget.map.dispatchEvent({
                        type: "pointermove",
                        dragging: true
                    });
                });

                it("dragging (popover)", () => {
                    widget.init();
                    spyOn(widget.map, "getEventPixel");
                    spyOn(widget.map, "hasFeatureAtPixel").and.returnValue({});
                    let popover_mock = widget.popover = {
                        hide: jasmine.createSpy('hide')
                    };

                    widget.map.dispatchEvent({
                        type: "pointermove",
                        dragging: true
                    });

                    expect(popover_mock.hide).toHaveBeenCalled();
                });

            });

            describe("moveend", () => {

                it("should send visible pois", () => {
                    widget.init();
                    MashupPlatform.widget.outputs.poiListOutput.connect({simulate: () => {}});
                    spyOn(widget.map.getView(), 'calculateExtent');
                    const poi_info = {
                        "id": "1",
                        "location": {"type": "Point"}
                    };
                    spyOn(widget.vector_source, 'getFeaturesInExtent').and.returnValue([
                        {get: () => {return poi_info;}}
                    ]);

                    widget.map.dispatchEvent("moveend");

                    expect(MashupPlatform.widget.outputs.poiListOutput.pushEvent).toHaveBeenCalledWith([poi_info]);
                });

            });

        });

        describe("registerPoI(poi)", () => {

            it("supports adding PoIs", () => {
                widget.init();
                spyOn(widget.vector_source, 'addFeature');
                widget.registerPoI(deepFreeze({
                    id: '1',
                    data: {},
                    location: {
                        type: 'Point',
                        coordinates: [0, 0]
                    }
                }));
                expect(widget.vector_source.addFeature).toHaveBeenCalledTimes(1);
                expect(widget.vector_source.addFeature).toHaveBeenCalledWith(jasmine.any(ol.Feature));
            });

            it("supports adding PoIs using the deprecated currentLocation option", () => {
                widget.init();
                spyOn(widget.vector_source, 'addFeature');
                widget.registerPoI(deepFreeze({
                    id: '1',
                    data: {},
                    currentLocation: {
                        lat: 0,
                        lng: 0
                    }
                }));
                expect(widget.vector_source.addFeature).toHaveBeenCalledTimes(1);
                expect(widget.vector_source.addFeature).toHaveBeenCalledWith(jasmine.any(ol.Feature));
            });

            it("supports updating PoIs", () => {
                widget.init();
                var feature_mock = new ol.Feature();
                spyOn(feature_mock, 'set');
                spyOn(feature_mock, 'setProperties');
                spyOn(feature_mock, 'setStyle');

                spyOn(widget.vector_source, 'addFeature');
                spyOn(widget.vector_source, 'getFeatureById').and.returnValue(feature_mock);
                let poi_info = deepFreeze({
                    id: '1',
                    data: {},
                    location: {
                        type: 'Point',
                        coordinates: [0, 0]
                    }
                });
                widget.registerPoI(poi_info);

                expect(feature_mock.setProperties).toHaveBeenCalledWith({
                    'geometry': jasmine.anything(),
                    'point': jasmine.anything(),
                    'data': poi_info,
                    'title': undefined,
                    'content': undefined,
                    'selectable': true,
                    'minzoom': null
                });
                expect(feature_mock.setStyle).toHaveBeenCalledTimes(1);

                expect(widget.vector_source.addFeature).toHaveBeenCalledTimes(0);
                expect(feature_mock.setStyle).toHaveBeenCalledWith(jasmine.any(Function));
            });

            it("sends update events when updating the selected PoI", () => {
                var feature_mock = new ol.Feature();
                widget.init();
                widget.selected_feature = feature_mock;
                spyOn(feature_mock, 'set');
                spyOn(feature_mock, 'setGeometry');
                spyOn(feature_mock, 'setStyle');

                spyOn(widget.vector_source, 'addFeature');
                spyOn(widget.vector_source, 'getFeatureById').and.returnValue(feature_mock);
                let poi_info = deepFreeze({
                    id: '1',
                    data: {},
                    location: {
                        type: 'Point',
                        coordinates: [0, 0]
                    }
                });
                spyOn(feature_mock, 'get').and.returnValue(poi_info);
                MashupPlatform.widget.outputs.poiOutput.reset();
                widget.registerPoI(poi_info);

                expect(MashupPlatform.widget.outputs.poiOutput.pushEvent).toHaveBeenCalledWith(poi_info);
            });

            describe("handles the style option:", () => {
                const test = function (style, expected) {
                    return () => {
                        widget.init();
                        spyOn(widget.vector_source, 'addFeature');
                        widget.registerPoI(deepFreeze({
                            id: '1',
                            data: {},
                            location: {
                                type: 'Point',
                                coordinates: [0, 0]
                            },
                            style: style
                        }));
                        expect(widget.vector_source.addFeature).toHaveBeenCalledTimes(1);
                        expect(widget.vector_source.addFeature).toHaveBeenCalledWith(jasmine.any(ol.Feature));
                        let feature = widget.vector_source.addFeature.calls.argsFor(0)[0];
                        let fstyle = feature.getStyle()(feature);
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
                        widget.registerPoI(deepFreeze({
                            id: '1',
                            data: {},
                            location: {
                                type: 'Point',
                                coordinates: [0, 0]
                            },
                            icon: icon
                        }));
                        expect(widget.vector_source.addFeature).toHaveBeenCalledTimes(1);
                        expect(widget.vector_source.addFeature).toHaveBeenCalledWith(jasmine.any(ol.Feature));
                        let feature = widget.vector_source.addFeature.calls.argsFor(0)[0];
                        let fimage = feature.getStyle()(feature).getImage();
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

                it("Should support caching styles", () => {
                    const hash = "vendor:domain:id";
                    const expected = {opacity: 0.75, src: "http://localhost:9876/images/icon.png", scale: 1};
                    const iconStyle = {
                        anchor: [40, 50],
                        anchorXUnits: 'pixels',
                        anchorYUnits: 'pixels',
                        hash: hash,
                        src: "https://www.example.com/image.png",
                        opacity: 0.2,
                        scale: 0.1
                    };
                    widget.init();
                    spyOn(widget.vector_source, 'addFeature');
                    // First element, will add style to cache
                    widget.registerPoI(deepFreeze({
                        id: '1',
                        data: {},
                        location: {
                            type: 'Point',
                            coordinates: [0, 0]
                        },
                        icon: iconStyle,
                    }));
                    // Second PoI, will use cached style
                    widget.registerPoI(deepFreeze({
                        id: '1',
                        data: {},
                        location: {
                            type: 'Point',
                            coordinates: [0, 0]
                        },
                        icon: iconStyle,
                    }));
                    let feature1 = widget.vector_source.addFeature.calls.argsFor(0)[0];
                    let feature2 = widget.vector_source.addFeature.calls.argsFor(1)[0];
                    expect(feature1.getStyle()).toBe(feature2.getStyle());
                });

            });

            describe("handles the minzoom option:", () => {
                const test = function (resolution, displayed) {
                    return () => {
                        widget.init();
                        spyOn(widget.vector_source, 'addFeature');
                        widget.registerPoI(deepFreeze({
                            id: '1',
                            data: {},
                            location: {
                                type: 'Point',
                                coordinates: [0, 0]
                            },
                            minzoom: 13
                        }));
                        expect(widget.vector_source.addFeature).toHaveBeenCalledTimes(1);
                        expect(widget.vector_source.addFeature).toHaveBeenCalledWith(jasmine.any(ol.Feature));
                        let feature = widget.vector_source.addFeature.calls.argsFor(0)[0];
                        let fstyle = feature.getStyle()(feature, resolution);
                        expect(fstyle).toEqual(displayed ? jasmine.any(ol.style.Style) : null);
                    };
                };

                it("displays the PoI if the zoom level is greather than the configured one", test(2.388657133911758, true));
                it("hides the PoI if the zoom level is lower than the configured one", test(152.8740565703525, false));

            });

        });

        describe("replacePoIs(poi_info)", () => {

            it("supports cleaning current PoIs", () => {
                widget.init();
                spyOn(widget, 'registerPoI');
                spyOn(widget.vector_source, 'clear');

                widget.replacePoIs([]);

                expect(widget.registerPoI).not.toHaveBeenCalled();
                expect(widget.selected_feature).toBe(null);
            });

            it("should maintain current selection if it exists on the new status", () => {
                let poi_info = deepFreeze({
                    id: '1',
                    data: {},
                    location: {
                        type: 'Point',
                        coordinates: [0, 0]
                    }
                });
                widget.init();
                let initial_feature_mock = new ol.Feature();
                initial_feature_mock.setId("1");
                widget.selected_feature = initial_feature_mock;
                widget.popover = {
                    hide: jasmine.createSpy('hide')
                };
                let new_feature_mock = new ol.Feature();
                spyOn(new_feature_mock, "get").and.returnValue(poi_info);
                spyOn(widget, "registerPoI");
                spyOn(widget, "select_feature");
                spyOn(widget.vector_source, 'clear');
                spyOn(widget.vector_source, 'getFeatureById').and.returnValue(new_feature_mock);

                widget.replacePoIs([poi_info]);

                expect(widget.registerPoI).toHaveBeenCalledTimes(1);
                expect(widget.vector_source.getFeatureById).toHaveBeenCalledTimes(1);
                expect(widget.vector_source.getFeatureById).toHaveBeenCalledWith("1");
                expect(widget.select_feature).toHaveBeenCalledWith(new_feature_mock);
            });

            it("should clean current selection if it does not exist on the new status", () => {
                let poi_info = deepFreeze({
                    id: '1',
                    data: {},
                    location: {
                        type: 'Point',
                        coordinates: [0, 0]
                    }
                });
                widget.init();
                let initial_feature_mock = new ol.Feature();
                initial_feature_mock.setId("5");
                widget.selected_feature = initial_feature_mock;
                let popover = widget.popover = {
                    hide: jasmine.createSpy('hide')
                };
                spyOn(widget, 'registerPoI');
                spyOn(widget.vector_source, 'clear');
                spyOn(widget.vector_source, 'getFeatureById').and.returnValue(null);

                widget.replacePoIs([poi_info]);

                expect(widget.registerPoI).toHaveBeenCalledTimes(1);
                expect(widget.vector_source.getFeatureById).toHaveBeenCalledTimes(1);
                expect(widget.vector_source.getFeatureById).toHaveBeenCalledWith("5");
                expect(popover.hide).toHaveBeenCalledTimes(1);
            });

        });

        describe("centerPoI(poi_list)", () => {

            it("should work with one Poi", () => {
                widget.init();
                spyOn(widget.map.getView(), 'fit').and.callThrough();
                // TODO
                let poi_info = deepFreeze({
                    id: '1',
                    data: {},
                    location: {
                        type: 'Point',
                        coordinates: [0, 0]
                    }
                });
                widget.registerPoI(poi_info);

                widget.centerPoI([{id: '1'}]);

                expect(widget.map.getView().fit).toHaveBeenCalledTimes(1);
                expect(MashupPlatform.widget.outputs.poiOutput.pushEvent).toHaveBeenCalledWith(poi_info);
            });

            it("should work with multiple Poi", () => {
                widget.init();
                spyOn(widget.map.getView(), 'fit').and.callThrough();
                // TODO
                widget.registerPoI(deepFreeze({
                    id: '1',
                    data: {},
                    location: {
                        type: 'Point',
                        coordinates: [0, 0]
                    }
                }));
                widget.registerPoI(deepFreeze({
                    id: '2',
                    data: {},
                    location: {
                        type: 'Point',
                        coordinates: [1, 0]
                    }
                }));

                widget.centerPoI([{id: '1'}, {id: '2'}]);

                expect(widget.map.getView().fit).toHaveBeenCalledTimes(1);
            });

        });

        describe("addLayer(options)", function () {

            var mock_layers = function mock_layers(widget) {
                var layers_mock = {
                    getLength: () => {return 2;},
                    insertAt: jasmine.createSpy('insertAt')
                };
                spyOn(widget.map, 'getLayers').and.returnValue(layers_mock);
                return layers_mock;
            };

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
                var layers_mock = mock_layers(widget);

                widget.addLayer({
                    type: "ImageWMS",
                    url: "http://wms.example.com",
                    id: "LayerName",
                    params: {
                        'LAYERS': 'mylayer'
                    }
                });

                expect(layers_mock.insertAt).toHaveBeenCalledWith(1, jasmine.any(ol.layer.Image));
                expect(layers_mock.insertAt.calls.argsFor(0)[1].getSource()).toEqual(jasmine.any(ol.source.ImageWMS));
            });

            it("supports Image WMS layers (provides a default params option)", function () {
                widget.init();
                var layers_mock = mock_layers(widget);

                widget.addLayer({
                    type: "ImageWMS",
                    url: "http://wms.example.com",
                    id: "LayerName"
                });

                expect(layers_mock.insertAt).toHaveBeenCalledWith(1, jasmine.any(ol.layer.Image));
                expect(layers_mock.insertAt.calls.argsFor(0)[1].getSource()).toEqual(jasmine.any(ol.source.ImageWMS));
            });

            it("supports Image WMS layers (uses layer id as default LAYERS parameter)", function () {
                widget.init();
                var layers_mock = mock_layers(widget);

                widget.addLayer({
                    type: "ImageWMS",
                    url: "http://wms.example.com",
                    id: "LayerName",
                    params: {
                        'FORMAT': 'image/jpeg'
                    }
                });

                expect(layers_mock.insertAt).toHaveBeenCalledWith(1, jasmine.any(ol.layer.Image));
                expect(layers_mock.insertAt.calls.argsFor(0)[1].getSource()).toEqual(jasmine.any(ol.source.ImageWMS));
            });

            it("supports ImageArcGISRest layers", function () {
                widget.init();
                var layers_mock = mock_layers(widget);

                widget.addLayer({
                    type: "ImageArcGISRest",
                    url: "http://wms.example.com",
                    id: "LayerName"
                });

                expect(layers_mock.insertAt).toHaveBeenCalledWith(1, jasmine.any(ol.layer.Image));
                expect(layers_mock.insertAt.calls.argsFor(0)[1].getSource()).toEqual(jasmine.any(ol.source.ImageArcGISRest));
            });

            it("supports ImageMapGuide layers", function () {
                widget.init();
                var layers_mock = mock_layers(widget);

                widget.addLayer({
                    type: "ImageMapGuide",
                    url: "http://wms.example.com",
                    id: "LayerName"
                });

                expect(layers_mock.insertAt).toHaveBeenCalledWith(1, jasmine.any(ol.layer.Image));
                expect(layers_mock.insertAt.calls.argsFor(0)[1].getSource()).toEqual(jasmine.any(ol.source.ImageMapGuide));
            });

            it("supports ImageStatic layers", function () {
                widget.init();
                var layers_mock = mock_layers(widget);

                widget.addLayer({
                    type: "ImageStatic",
                    url: "http://www.example.com/map.png",
                    id: "LayerName"
                });

                expect(layers_mock.insertAt).toHaveBeenCalledWith(1, jasmine.any(ol.layer.Image));
                expect(layers_mock.insertAt.calls.argsFor(0)[1].getSource()).toEqual(jasmine.any(ol.source.ImageStatic));
            });

            it("supports Vector layers", function () {
                widget.init();
                var layers_mock = mock_layers(widget);

                widget.addLayer({
                    type: "Vector",
                    url: 'https://openlayers.org/en/v4.6.4/examples/data/kml/2012_Earthquakes_Mag5.kml',
                    format: "KML",
                    id: "LayerName"
                });

                expect(layers_mock.insertAt).toHaveBeenCalledWith(1, jasmine.any(ol.layer.Vector));
                expect(layers_mock.insertAt.calls.argsFor(0)[1].getSource()).toEqual(jasmine.any(ol.source.Vector));
            });

            it("raises an EndpointValueError exception when trying to create a Vector layer without providing the format", function () {
                widget.init();
                var layers_mock = mock_layers(widget);

                expect(() => {
                    widget.addLayer({
                        type: "Vector",
                        url: 'https://openlayers.org/en/v4.6.4/examples/data/kml/2012_Earthquakes_Mag5.kml',
                        id: "LayerName"
                    });
                }).toThrowError(MashupPlatform.wiring.EndpointValueError);
            });

            it("raises an EndpointValueError exception when trying to create a Vector layer without providing a layer url", function () {
                widget.init();
                var layers_mock = mock_layers(widget);

                expect(() => {
                    widget.addLayer({
                        type: "Vector",
                        id: "LayerName",
                        format: "KML"
                    });
                }).toThrowError(MashupPlatform.wiring.EndpointValueError);
            });

            it("supports Vector layers (with format options)", function () {
                widget.init();
                var layers_mock = mock_layers(widget);

                widget.addLayer({
                    type: "Vector",
                    url: 'https://openlayers.org/en/v4.6.4/examples/data/kml/2012_Earthquakes_Mag5.kml',
                    format: {
                        type: "KML",
                        extractStyles: false
                    },
                    id: "LayerName"
                });

                expect(layers_mock.insertAt).toHaveBeenCalledWith(1, jasmine.any(ol.layer.Vector));
                expect(layers_mock.insertAt.calls.argsFor(0)[1].getSource()).toEqual(jasmine.any(ol.source.Vector));
            });

            it("supports Vector layers (with GML format options)", function () {
                widget.init();
                var layers_mock = mock_layers(widget);

                widget.addLayer({
                    type: "Vector",
                    url: 'https://openlayers.org/en/v4.6.4/examples/data/kml/2012_Earthquakes_Mag5.kml',
                    format: {
                        type: "GML",
                        curve: true
                    },
                    id: "LayerName"
                });

                expect(layers_mock.insertAt).toHaveBeenCalledWith(1, jasmine.any(ol.layer.Vector));
                expect(layers_mock.insertAt.calls.argsFor(0)[1].getSource()).toEqual(jasmine.any(ol.source.Vector));
            });


            it("supports VectorTile layers", function () {
                widget.init();
                var layers_mock = mock_layers(widget);

                widget.addLayer({
                    type: "VectorTile",
                    url: 'https://tile.mapzen.com/mapzen/vector/v1/all/{z}/{x}/{y}.topojson?api_key=XXX',
                    format: {
                        type: "TopoJSON",
                        layerName: 'layer',
                        layers: ['water', 'roads', 'buildings']
                    },
                    id: "LayerName"
                });

                expect(layers_mock.insertAt).toHaveBeenCalledWith(1, jasmine.any(ol.layer.Tile));
                expect(layers_mock.insertAt.calls.argsFor(0)[1].getSource()).toEqual(jasmine.any(ol.source.VectorTile));
            });

            it("supports OSM layers", function () {
                widget.init();
                var layers_mock = mock_layers(widget);

                widget.addLayer({
                    type: "OSM",
                    id: "LayerName"
                });

                expect(layers_mock.insertAt).toHaveBeenCalledWith(1, jasmine.any(ol.layer.Tile));
                expect(layers_mock.insertAt.calls.argsFor(0)[1].getSource()).toEqual(jasmine.any(ol.source.OSM));
            });

            it("supports Tile WMS layers", function () {
                widget.init();
                var layers_mock = mock_layers(widget);

                widget.addLayer({
                    type: "TileWMS",
                    id: "LayerName",
                    url: 'https://wms.geo.admin.ch/',
                    params: {
                        'LAYERS': 'ch.swisstopo.pixelkarte-farbe-pk1000.noscale',
                        'FORMAT': 'image/jpeg'
                    },
                    serverType: 'mapserver'
                });

                expect(layers_mock.insertAt).toHaveBeenCalledWith(1, jasmine.any(ol.layer.Tile));
                expect(layers_mock.insertAt.calls.argsFor(0)[1].getSource()).toEqual(jasmine.any(ol.source.TileWMS));
            });

            it("supports Tile WMS layers (provides a default params option)", function () {
                widget.init();
                var layers_mock = mock_layers(widget);

                widget.addLayer({
                    type: "TileWMS",
                    id: "LayerName",
                    url: 'https://wms.geo.admin.ch/',
                    serverType: 'mapserver'
                });

                expect(layers_mock.insertAt).toHaveBeenCalledWith(1, jasmine.any(ol.layer.Tile));
                expect(layers_mock.insertAt.calls.argsFor(0)[1].getSource()).toEqual(jasmine.any(ol.source.TileWMS));
            });

            it("supports Tile WMS layers (uses layer id as default LAYERS parameter)", function () {
                widget.init();
                var layers_mock = mock_layers(widget);

                widget.addLayer({
                    type: "TileWMS",
                    id: "LayerName",
                    url: 'https://wms.geo.admin.ch/',
                    params: {
                        'FORMAT': 'image/jpeg'
                    },
                    serverType: 'mapserver'
                });

                expect(layers_mock.insertAt).toHaveBeenCalledWith(1, jasmine.any(ol.layer.Tile));
                expect(layers_mock.insertAt.calls.argsFor(0)[1].getSource()).toEqual(jasmine.any(ol.source.TileWMS));
            });

            it("supports Tile JSON layers", function () {
                widget.init();
                var layers_mock = mock_layers(widget);

                widget.addLayer({
                    type: "TileJSON",
                    id: "LayerName",
                    url: 'https://api.tiles.mapbox.com/v3/mapbox.geography-class.json?secure',
                    crossOrigin: 'anonymous'
                });

                expect(layers_mock.insertAt).toHaveBeenCalledWith(1, jasmine.any(ol.layer.Tile));
                expect(layers_mock.insertAt.calls.argsFor(0)[1].getSource()).toEqual(jasmine.any(ol.source.TileJSON));
            });

            it("supports Tile UTF Grid layers", function () {
                widget.init();
                var layers_mock = mock_layers(widget);

                widget.addLayer({
                    type: "TileUTFGrid",
                    id: "LayerName",
                    url: 'https://api.tiles.mapbox.com/v4/mapbox.geography-class.json?secure&access_token=XXX'
                });

                expect(layers_mock.insertAt).toHaveBeenCalledWith(1, jasmine.any(ol.layer.Tile));
                expect(layers_mock.insertAt.calls.argsFor(0)[1].getSource()).toEqual(jasmine.any(ol.source.TileUTFGrid));
            });

            it("supports XYZ layers", function () {
                widget.init();
                var layers_mock = mock_layers(widget);

                widget.addLayer({
                    type: "XYZ",
                    url: "https://{a-c}.maptile.maps.svc.ovi.com/maptiler/v2/maptile/newest/carnav.day/{z}/{x}/{y}/256/png",
                    id: "LayerName"
                });

                expect(layers_mock.insertAt).toHaveBeenCalledWith(1, jasmine.any(ol.layer.Tile));
                expect(layers_mock.insertAt.calls.argsFor(0)[1].getSource()).toEqual(jasmine.any(ol.source.XYZ));
            });

            it("supports Stamen layers", function () {
                widget.init();
                var layers_mock = mock_layers(widget);

                widget.addLayer({
                    type: "Stamen",
                    layer: "watercolor",
                    id: "LayerName"
                });

                expect(layers_mock.insertAt).toHaveBeenCalledWith(1, jasmine.any(ol.layer.Tile));
                expect(layers_mock.insertAt.calls.argsFor(0)[1].getSource()).toEqual(jasmine.any(ol.source.Stamen));
            });

            it("supports BingMaps layers", function () {
                widget.init();
                var layers_mock = mock_layers(widget);

                widget.addLayer({
                    type: "BingMaps",
                    imagerySet: "Road",
                    id: "LayerName"
                });

                expect(layers_mock.insertAt).toHaveBeenCalledWith(1, jasmine.any(ol.layer.Tile));
                expect(layers_mock.insertAt.calls.argsFor(0)[1].getSource()).toEqual(jasmine.any(ol.source.BingMaps));
            });

            it("supports CartoDB layers", function () {
                widget.init();
                var layers_mock = mock_layers(widget);

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
                    id: "LayerName"
                });

                expect(layers_mock.insertAt).toHaveBeenCalledWith(1, jasmine.any(ol.layer.Tile));
                expect(layers_mock.insertAt.calls.argsFor(0)[1].getSource()).toEqual(jasmine.any(ol.source.CartoDB));
            });

            it("supports WMTS layers", function () {
                widget.init();
                var layers_mock = mock_layers(widget);

                widget.addLayer({
                    type: "WMTS",
                    url: "https://www.example.com/MapServer/WMTS/",
                    id: "LayerName"
                });

                expect(layers_mock.insertAt).toHaveBeenCalledWith(1, jasmine.any(ol.layer.Tile));
                expect(layers_mock.insertAt.calls.argsFor(0)[1].getSource()).toEqual(jasmine.any(ol.source.WMTS));
            });

            it("supports Zoomify layers", function () {
                widget.init();
                var layers_mock = mock_layers(widget);

                widget.addLayer({
                    type: "Zoomify",
                    url: "http://vips.vtech.fr/cgi-bin/iipsrv.fcgi?zoomify=/mnt/MD1/AD00/plan_CHU-4HD-01/FOND.TIF/",
                    size: [9911, 6100],
                    id: "LayerName"
                });

                expect(layers_mock.insertAt).toHaveBeenCalledWith(1, jasmine.any(ol.layer.Tile));
                expect(layers_mock.insertAt.calls.argsFor(0)[1].getSource()).toEqual(jasmine.any(ol.source.Zoomify));
            });

            it("replaces layers with the same id", function () {
                widget.init();
                var layers_mock = mock_layers(widget);
                spyOn(widget.map, 'removeLayer');
                let layer_mock = jasmine.createSpy('layer_mock');
                widget.layers["LayerName"] = layer_mock;

                widget.addLayer({
                    type: "Vector",
                    url: 'https://openlayers.org/en/v4.6.4/examples/data/kml/2012_Earthquakes_Mag5.kml',
                    format: {
                        type: "KML",
                        extractStyles: false
                    },
                    id: "LayerName"
                });

                expect(widget.map.removeLayer).toHaveBeenCalledWith(layer_mock);
                expect(layers_mock.insertAt).toHaveBeenCalledWith(1, jasmine.any(ol.layer.Vector));
                expect(layers_mock.insertAt.calls.argsFor(0)[1].getSource()).toEqual(jasmine.any(ol.source.Vector));
                expect(widget.layers.LayerName).toBe(layers_mock.insertAt.calls.argsFor(0)[1]);
            });

        });

        describe("removeLayer(options)", () => {

            it("does nothing if the layer does not exist", () => {
                widget.init();
                spyOn(widget.map, 'removeLayer');

                widget.removeLayer({
                    id: "LayerName"
                });

                expect(widget.map.removeLayer).not.toHaveBeenCalled();
            });

            it("removes existing layers", () => {
                widget.init();
                spyOn(widget.map, 'removeLayer');
                let layer_mock = jasmine.createSpy('layer_mock');
                widget.layers["LayerName"] = layer_mock;

                widget.removeLayer({
                    id: "LayerName"
                });

                expect(widget.map.removeLayer).toHaveBeenCalledWith(layer_mock);
                expect(widget.layers.LayerName).toBe(undefined);
            });

        });

        describe("setBaseLayer(options)", () => {

            it("throws an EndpointValueError if the new layer is not available", () => {
                widget.init();

                expect(() => {
                    widget.setBaseLayer({
                        id: 'inexistent'
                    });
                }).toThrowError(MashupPlatform.wiring.EndpointValueError);
            });

            it("switches current base layer", () => {
                widget.init();

                let initial_base_layer = widget.base_layer;
                widget.setBaseLayer({
                    id: 'CARTODB_LIGHT'
                });

                expect(widget.base_layer).not.toBe(initial_base_layer);
            });

        });

    });

})();
