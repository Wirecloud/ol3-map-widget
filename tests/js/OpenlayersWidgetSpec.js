/*
 *   Copyright (c) 2017 CoNWeT Lab., Universidad Politecnica de Madrid
 *   Copyright (c) 2017-2021 Future Internet Consulting and Development Solutions S.L.
 */

/* global MashupPlatform, MockMP, ol, StyledElements, Widget */

(function () {

    "use strict";

    const HTML_FIXTURE = '<div id="map" class="map"></div>\n' +
        '<div id="button" class="se-btn fade"></div>\n' +
        '<div id="setcenter-button" class="se-btn"/><div id="setzoom-button" class="se-btn"/><div id="setcenterzoom-button" class="se-btn"/>';

    const clearDocument = function clearDocument() {
        const elements = document.querySelectorAll('body > *:not(.jasmine_html-reporter)');

        for (let i = 0; i < elements.length; i++) {
            elements[i].remove();
        }
    };

    const deepFreeze = function deepFreeze(obj) {

        // Retrieve the property names defined on obj
        const propNames = Object.getOwnPropertyNames(obj);

        // Freeze properties before freezing self
        propNames.forEach(function (name) {
            const prop = obj[name];

            // Freeze prop if it is an object
            if (typeof prop == 'object' && prop !== null) {
                deepFreeze(prop);
            }
        });

        // Freeze self (no-op if already frozen)
        return Object.freeze(obj);
    };

    const createAddWidgetMock = function createAddWidgetMock() {
        MashupPlatform.mashup.addWidget.and.returnValue({
            addEventListener: jasmine.createSpy("addEventListener"),
            outputs: {
                layerInfoOutput: {
                    connect: jasmine.createSpy("connect")
                }
            }
        });
    };

    describe("ol3-map", () => {

        let widget;

        beforeAll(() => {
            window.MashupPlatform = new MockMP({
                type: 'widget',
                prefs: {
                    'initialCenter': '',
                    'initialZoom': '10',
                    'poiZoom': 10,
                    'layerswidget': '',
                    'useclustering': false
                },
                inputs: ['layerInfo'],
                outputs: ['poiListOutput', 'poiOutput']
            });
        });

        beforeEach(() => {
            clearDocument();
            document.body.innerHTML += HTML_FIXTURE;
            MashupPlatform.reset();
            MashupPlatform.prefs.set.calls.reset();
            widget = new Widget();
        });

        afterEach(() => {
            if (widget && widget.visiblePoisTimeout) {
                clearTimeout(widget.visiblePoisTimeout);
            }
        });

        describe("prefs", () => {

            describe("initialCenter", () => {

                it("empty", (done) => {
                    MashupPlatform.prefs.set("initialCenter", "");

                    widget.init();

                    setTimeout(() => {
                        expect(widget.map.getView().getCenter()).toEqual(ol.proj.transform([0, 0], 'EPSG:4326', 'EPSG:3857'));
                        done();
                    }, 200);
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

            describe("layerswidget", () => {

                it("empty", () => {
                    MashupPlatform.prefs.set("layerswidget", "");

                    widget.init();

                    const layers_button = document.getElementById('button');
                    expect(layers_button.className).toBe('se-btn fade');
                });

                it("widget ref", () => {
                    MashupPlatform.prefs.set("layerswidget", "CoNWeT/layer-selector/0.4");

                    widget.init();

                    const layers_button = document.getElementById('button');
                    expect(layers_button.className).toBe('se-btn fade in');
                });

                it("widget ref (click)", () => {
                    const ref = "CoNWeT/layer-selector/0.4";
                    MashupPlatform.prefs.set("layerswidget", ref);
                    widget.init();
                    createAddWidgetMock();

                    const layers_button = document.getElementById('button');
                    layers_button.click();
                    expect(MashupPlatform.mashup.addWidget).toHaveBeenCalledWith(ref, jasmine.any(Object));
                    expect(MashupPlatform.mashup.addWidget().outputs.layerInfoOutput.connect).toHaveBeenCalledWith(MashupPlatform.widget.inputs.layerInfo);
                });

                it("widget ref (creation is cached)", () => {
                    const ref = "CoNWeT/layer-selector/0.4";
                    MashupPlatform.prefs.set("layerswidget", ref);
                    widget.init();
                    createAddWidgetMock();

                    const layers_button = document.getElementById('button');
                    layers_button.click();
                    MashupPlatform.mashup.addWidget.calls.reset();
                    layers_button.click();
                    expect(MashupPlatform.mashup.addWidget).not.toHaveBeenCalled();
                });

                it("widget ref (listens close events)", () => {
                    const ref = "CoNWeT/layer-selector/0.4";
                    MashupPlatform.prefs.set("layerswidget", ref);
                    widget.init();
                    createAddWidgetMock();

                    const layers_button = document.getElementById('button');
                    layers_button.click();
                    expect(MashupPlatform.mashup.addWidget().addEventListener).toHaveBeenCalledWith("remove", jasmine.any(Function));
                    MashupPlatform.mashup.addWidget().addEventListener.calls.argsFor(0)[1]();
                });

                it("widget ref (creation after close)", () => {
                    const ref = "CoNWeT/layer-selector/0.4";
                    MashupPlatform.prefs.set("layerswidget", ref);
                    widget.init();
                    createAddWidgetMock();

                    // Open layers widget
                    const layers_button = document.getElementById('button');
                    layers_button.click();
                    // Close it
                    MashupPlatform.mashup.addWidget().addEventListener.calls.argsFor(0)[1]();
                    MashupPlatform.mashup.addWidget.calls.reset();
                    MashupPlatform.mashup.addWidget().outputs.layerInfoOutput.connect.calls.reset();

                    // Open again the layers widget
                    layers_button.click();

                    expect(MashupPlatform.mashup.addWidget).toHaveBeenCalledWith(ref, jasmine.any(Object));
                    expect(MashupPlatform.mashup.addWidget().outputs.layerInfoOutput.connect).toHaveBeenCalledWith(MashupPlatform.widget.inputs.layerInfo);
                });

            });

            describe("edit buttons", () => {

                it("should be hidden if the widget was started in view mode", () => {
                    MashupPlatform.mashup.context.setContext({editing: false});

                    widget.init();

                    const setcenter_button = document.getElementById('setcenter-button');
                    expect(setcenter_button.className).toBe('se-btn hidden');
                    const setzoom_button = document.getElementById('setzoom-button');
                    expect(setzoom_button.className).toBe('se-btn hidden');
                    const setcenterzoom_button = document.getElementById('setcenterzoom-button');
                    expect(setcenterzoom_button.className).toBe('se-btn hidden');
                });

                it("should be visible if the widget was started in edit mode", () => {
                    MashupPlatform.mashup.context.setContext({editing: true});

                    widget.init();

                    const setcenter_button = document.getElementById('setcenter-button');
                    expect(setcenter_button.className).toBe('se-btn');
                    const setzoom_button = document.getElementById('setzoom-button');
                    expect(setzoom_button.className).toBe('se-btn');
                    const setcenterzoom_button = document.getElementById('setcenterzoom-button');
                    expect(setcenterzoom_button.className).toBe('se-btn');
                });

                it("should update dynamically", () => {
                    MashupPlatform.mashup.context.setContext({editing: false});
                    widget.init();

                    MashupPlatform.mashup.context.registerCallback.calls.argsFor(0)[0]({editing: true});

                    const setcenter_button = document.getElementById('setcenter-button');
                    expect(setcenter_button.className).toBe('se-btn');
                    const setzoom_button = document.getElementById('setzoom-button');
                    expect(setzoom_button.className).toBe('se-btn');
                    const setcenterzoom_button = document.getElementById('setcenterzoom-button');
                    expect(setcenterzoom_button.className).toBe('se-btn');
                });

                it("should allow to setup current center as the default value for the initialCenter setting", () => {
                    MashupPlatform.mashup.context.setContext({editing: true});
                    widget.init();
                    const setcenter_button = document.getElementById('setcenter-button');

                    setcenter_button.click();

                    expect(MashupPlatform.prefs.set).toHaveBeenCalledWith("initialCenter", jasmine.any(String));
                });

                it("should allow to setup current zoom level as the default value for the initialZoom setting", () => {
                    MashupPlatform.mashup.context.setContext({editing: true});
                    widget.init();
                    const setzoom_button = document.getElementById('setzoom-button');

                    setzoom_button.click();

                    expect(MashupPlatform.prefs.set).toHaveBeenCalledWith("initialZoom", jasmine.any(Number));
                });

                it("should allow to setup current zoom level and center position as the default initial values", () => {
                    MashupPlatform.mashup.context.setContext({editing: true});
                    widget.init();
                    const setcenterzoom_button = document.getElementById('setcenterzoom-button');

                    setcenterzoom_button.click();

                    expect(MashupPlatform.prefs.set).toHaveBeenCalledWith({
                        initialCenter: jasmine.any(String),
                        initialZoom: jasmine.any(Number)
                    });
                });
            });

            describe("useclustering", () => {

                it("should switch to use a cluster source for the main vector layer", () => {
                    MashupPlatform.prefs.set("useclustering", true);
                    widget.init();
                    expect(widget.map.getLayers().getArray()[1].getSource()).toEqual(jasmine.any(ol.source.Cluster));
                });

                it("should be possible to enabled after load", () => {
                    MashupPlatform.prefs.set("useclustering", false);
                    widget.init();

                    widget.setClustering(true);
                    expect(widget.map.getLayers().getArray()[1].getSource()).toEqual(jasmine.any(ol.source.Cluster));
                });

                it("should be possible to disabled after load", () => {
                    MashupPlatform.prefs.set("useclustering", true);
                    widget.init();

                    widget.setClustering(false);
                    expect(widget.map.getLayers().getArray()[1].getSource()).toEqual(jasmine.any(ol.source.Vector));
                });

            });

        });

        describe("events", () => {

            describe("click", () => {

                it("on a not selected feature", () => {
                    const pixel_mock = jasmine.createSpy('pixel');
                    const feature_mock = new ol.Feature();
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

                it("on a not selected feature (through selection menu)", () => {
                    const pixel_mock = jasmine.createSpy('pixel');
                    const feature1_mock = new ol.Feature();
                    feature1_mock.set('selectable', true);
                    const feature2_mock = new ol.Feature();
                    feature2_mock.set('selectable', true);
                    const feature3_mock = new ol.Feature();
                    feature3_mock.set('selectable', true);
                    widget.init();
                    spyOn(widget, "select_feature");
                    spyOn(widget.map, 'forEachFeatureAtPixel').and.callFake((pixel, listener) => {
                        expect(pixel).toBe(pixel_mock);
                        listener(feature1_mock);
                        listener(feature2_mock);
                        listener(feature3_mock);
                    });
                    spyOn(StyledElements.PopupMenu.prototype, "addEventListener").and.callThrough();

                    widget.map.dispatchEvent({
                        type: "click",
                        pixel: pixel_mock
                    });

                    StyledElements.PopupMenu.prototype.addEventListener.calls.argsFor(0)[1](null, {context: feature3_mock});

                    expect(widget.select_feature).toHaveBeenCalledWith(feature3_mock);
                });

                it("on a not selected feature (through selection menu of a cluster)", () => {
                    MashupPlatform.prefs.set("useclustering", true);
                    const pixel_mock = jasmine.createSpy('pixel');
                    const feature1_mock = new ol.Feature();
                    feature1_mock.set('selectable', true);
                    const feature2_mock = new ol.Feature();
                    const feature3_mock = new ol.Feature();
                    feature3_mock.set('selectable', true);
                    const cluster_feature_mock = new ol.Feature();
                    spyOn(cluster_feature_mock, "get").and.returnValue([feature1_mock, feature2_mock, feature3_mock]);
                    widget.init();
                    spyOn(widget, "select_feature");
                    spyOn(widget.map, 'forEachFeatureAtPixel').and.callFake((pixel, listener) => {
                        expect(pixel).toBe(pixel_mock);
                        listener(cluster_feature_mock);
                    });
                    spyOn(StyledElements.PopupMenu.prototype, "addEventListener").and.callThrough();
                    spyOn(StyledElements.PopupMenu.prototype, "append").and.callThrough();

                    widget.map.dispatchEvent({
                        type: "click",
                        pixel: pixel_mock
                    });

                    StyledElements.PopupMenu.prototype.addEventListener.calls.argsFor(0)[1](null, {context: cluster_feature_mock});

                    expect(StyledElements.PopupMenu.prototype.append).toHaveBeenCalledTimes(2);
                    expect(widget.select_feature).toHaveBeenCalledWith(cluster_feature_mock);
                });

                it("on a not selectable feature", () => {
                    const pixel_mock = jasmine.createSpy('pixel');
                    const feature_mock = new ol.Feature();
                    feature_mock.set('selectable', false);
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

                    expect(widget.select_feature).not.toHaveBeenCalled();
                });

                it("on a not selected feature (with a marker)", (done) => {
                    const pixel_mock = jasmine.createSpy('pixel');
                    const feature_mock = new ol.Feature();
                    feature_mock.set('selectable', true);
                    feature_mock.set("content", "mycontent");
                    feature_mock.set("data", {});
                    feature_mock.setGeometry(new ol.geom.Point([0, 0]));
                    const style_mock = new ol.style.Style();
                    spyOn(feature_mock, "getStyle").and.callFake(() => {return () => {return style_mock};});
                    spyOn(style_mock, 'getImage').and.returnValue({
                        getScale: () => {return 0.5;},
                        getAnchor: jasmine.createSpy().and.callFake(() => {return [0.5, 2];}),
                        getSize: jasmine.createSpy().and.callFake(() => {return [1, 2];})
                    });
                    widget.init();
                    spyOn(widget, "select_feature").and.callThrough();
                    spyOn(widget.map, 'getPixelFromCoordinate').and.returnValue([0, 0]);
                    spyOn(widget.map, 'forEachFeatureAtPixel').and.callFake((pixel, listener) => {
                        expect(pixel).toBe(pixel_mock);
                        return listener(feature_mock);
                    });

                    widget.map.dispatchEvent({
                        type: "click",
                        pixel: pixel_mock
                    });

                    setTimeout(() => {
                        // Check popover is placed taking into account the poi marker position
                        expect(style_mock.getImage().getSize).toHaveBeenCalledTimes(1);
                        expect(widget.select_feature).toHaveBeenCalledWith(feature_mock);
                        done();
                    }, 150);
                });

                it("on the selected feature", () => {
                    const pixel_mock = jasmine.createSpy('pixel');
                    const feature_mock = new ol.Feature();
                    feature_mock.set("data", {});
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

                it("on the selected feature (through selection menu)", () => {
                    const pixel_mock = jasmine.createSpy('pixel');
                    const feature1_mock = new ol.Feature();
                    feature1_mock.set('selectable', true);
                    const feature2_mock = new ol.Feature();
                    feature2_mock.set('selectable', true);
                    feature2_mock.set('data', {});
                    const feature3_mock = new ol.Feature();
                    feature3_mock.set('selectable', true);
                    widget.init();
                    widget.selected_feature = feature2_mock;
                    spyOn(widget, "select_feature");
                    spyOn(widget.map, 'forEachFeatureAtPixel').and.callFake((pixel, listener) => {
                        expect(pixel).toBe(pixel_mock);
                        listener(feature1_mock);
                        listener(feature2_mock);
                        listener(feature3_mock);
                    });

                    widget.map.dispatchEvent({
                        type: "click",
                        pixel: pixel_mock
                    });

                    expect(widget.selected_feature).toBe(null);
                });

                it("on a not selected feature (but while there is a selected feature)", () => {
                    const pixel_mock = jasmine.createSpy('pixel');
                    const feature_mock1 = new ol.Feature();
                    feature_mock1.set('selectable', true);
                    const feature_mock2 = new ol.Feature();
                    feature_mock2.set('selectable', true);
                    widget.init();
                    widget.selected_feature = feature_mock1;
                    widget.popover = {
                        hide: jasmine.createSpy('hide')
                    };
                    spyOn(window, "setTimeout");
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
                    const pixel_mock = jasmine.createSpy('pixel');
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
                    const pixel_mock = jasmine.createSpy('pixel');
                    const feature_mock = new ol.Feature();
                    feature_mock.set('selectable', true);
                    feature_mock.set("content", "my content");
                    feature_mock.set("data", {});
                    feature_mock.setGeometry(new ol.geom.Point([0, 0]));
                    feature_mock.setStyle(() => {return new ol.style.Style()});

                    widget.init();
                    spyOn(widget.map, 'getPixelFromCoordinate').and.returnValue([0, 0]);
                    widget.select_feature(feature_mock);
                    widget.popover.addEventListener('show', () => {
                        MashupPlatform.widget.outputs.poiOutput.reset();
                        const popover = widget.popover;
                        // TODO, the following line is required as the CSS
                        // animation is not processed
                        document.body.querySelector('.popover').classList.remove('in');
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
                    const feature_mock = new ol.Feature();
                    feature_mock.set('selectable', true);
                    feature_mock.setGeometry(new ol.geom.Point([0, 0]));
                    feature_mock.setStyle(() => {return new ol.style.Style()});
                    feature_mock.set("content", "my text");
                    feature_mock.set("data", {});

                    widget.init();
                    widget.select_feature(feature_mock);
                    MashupPlatform.widget.outputs.poiOutput.reset();
                    const popover = widget.popover;
                    spyOn(popover, "on");
                    spyOn(widget, "select_feature");

                    // Simulate the popover has been hidden by a third party code
                    widget.popover.dispatchEvent("hide");

                    expect(widget.popover).toBe(null)
                    expect(widget.selected_feature).toBe(null);
                    expect(MashupPlatform.widget.outputs.poiOutput.pushEvent).toHaveBeenCalledWith(null);
                });
            });

            describe("moveend", () => {

                it("wirecloud 1.3 and below", () => {
                    widget.init();
                    widget.popover = {
                        repaint: jasmine.createSpy("repaint")
                    };

                    widget.map.dispatchEvent({
                        type: "moveend"
                    });

                    expect(widget.popover.repaint).toHaveBeenCalledWith();
                });

                it("wirecloud 1.4+", () => {
                    widget.init();
                    widget.popover = {
                        enablePointerEvents: jasmine.createSpy("enablePointerEvents"),
                        repaint: jasmine.createSpy("repaint")
                    };

                    widget.map.dispatchEvent({
                        type: "moveend"
                    });

                    expect(widget.popover.enablePointerEvents).toHaveBeenCalledWith();
                    expect(widget.popover.repaint).toHaveBeenCalledWith();
                });

            });

            describe("movestart", () => {

                it("without popover", () => {
                    widget.init();

                    widget.map.dispatchEvent({
                        type: "movestart"
                    });
                });

                it("wirecloud 1.3 and below", () => {
                    widget.init();
                    widget.popover = {
                        hide: jasmine.createSpy('hide')
                    };

                    widget.map.dispatchEvent({
                        type: "movestart"
                    });

                    expect(widget.popover.hide).toHaveBeenCalledWith();
                });

                it("wirecloud 1.4+", () => {
                    widget.init();
                    widget.popover = {
                        disablePointerEvents: jasmine.createSpy("disablePointerEvents")
                    };

                    widget.map.dispatchEvent({
                        type: "movestart"
                    });

                    expect(widget.popover.disablePointerEvents).toHaveBeenCalledWith();
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
                    const popover_mock = widget.popover = {
                        repaint: jasmine.createSpy('repaint')
                    };

                    widget.map.dispatchEvent({
                        type: "pointermove",
                        dragging: true
                    });

                    expect(popover_mock.repaint).toHaveBeenCalled();
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

            it("supports adding PoIs (clustering)", () => {
                MashupPlatform.prefs.set("useclustering", true);
                widget.init();
                spyOn(widget.vector_source, 'addFeature').and.callThrough();
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

            it("should cluster pois when using clustering", (done) => {
                MashupPlatform.prefs.set("useclustering", true);
                widget.init();
                spyOn(widget.vector_source, 'addFeature').and.callThrough();
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
                        coordinates: [0, 0.1]
                    }
                }));
                expect(widget.vector_source.addFeature).toHaveBeenCalledTimes(2);
                setTimeout(done, 200);
            });

            it("supports adding selectable PoIs (polygon)", () => {
                widget.init();
                spyOn(widget.vector_source, 'addFeature');
                widget.registerPoI(deepFreeze({
                    id: '1',
                    data: {},
                    selectable: true,
                    location: {
                        type: 'Polygon',
                        coordinates: [[0, 0], [1, 1], [2, 0], [0, 0]]
                    }
                }));
                expect(widget.vector_source.addFeature).toHaveBeenCalledTimes(1);
                expect(widget.vector_source.addFeature).toHaveBeenCalledWith(jasmine.any(ol.Feature));
                const feature = widget.vector_source.addFeature.calls.argsFor(0)[0];
                // Widget should add a marker point
                expect(feature.getGeometry().getType()).toBe("GeometryCollection");
            });

            it("supports adding selectable PoIs (linestring)", () => {
                widget.init();
                spyOn(widget.vector_source, 'addFeature');
                widget.registerPoI(deepFreeze({
                    id: '1',
                    data: {},
                    selectable: true,
                    location: {
                        type: 'LineString',
                        coordinates: [[0, 0], [1, 1], [2, 0]]
                    }
                }));
                expect(widget.vector_source.addFeature).toHaveBeenCalledTimes(1);
                expect(widget.vector_source.addFeature).toHaveBeenCalledWith(jasmine.any(ol.Feature));
                const feature = widget.vector_source.addFeature.calls.argsFor(0)[0];
                // Widget should add a marker point
                expect(feature.getGeometry().getType()).toBe("GeometryCollection");
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
                const feature_mock = new ol.Feature();
                spyOn(feature_mock, 'set');
                spyOn(feature_mock, 'setProperties');
                spyOn(feature_mock, 'setStyle');

                spyOn(widget.vector_source, 'addFeature');
                spyOn(widget.vector_source, 'getFeatureById').and.returnValue(feature_mock);
                const poi_info = deepFreeze({
                    id: '1',
                    data: {},
                    location: {
                        type: 'Point',
                        coordinates: [0, 0]
                    }
                });
                widget.registerPoI(poi_info);

                expect(feature_mock.setProperties).toHaveBeenCalledWith({
                    geometry: jasmine.anything(),
                    point: jasmine.anything(),
                    data: poi_info,
                    title: undefined,
                    content: undefined,
                    selectable: true,
                    minzoom: null,
                    maxzoom: null
                });
                expect(feature_mock.setStyle).toHaveBeenCalledTimes(1);

                expect(widget.vector_source.addFeature).toHaveBeenCalledTimes(0);
                expect(feature_mock.setStyle).toHaveBeenCalledWith(jasmine.any(Function));
            });

            it("supports updating selected PoIs", () => {
                widget.init();
                const feature_mock = new ol.Feature();
                spyOn(feature_mock, 'set');
                spyOn(feature_mock, 'setProperties');
                spyOn(feature_mock, 'setStyle');

                spyOn(widget.vector_source, 'addFeature');
                spyOn(widget.vector_source, 'getFeatureById').and.returnValue(feature_mock);
                const poi_info = deepFreeze({
                    id: '1',
                    data: {},
                    location: {
                        type: 'Point',
                        coordinates: [0, 0]
                    },
                    icon: {
                        hash: "hash1",
                        src: "https://www.example.com/image.png",
                    },
                    iconHighlighted: {
                        hash: "hash2",
                        src: "https://www.example.com/image.png",
                    }
                });
                widget.registerPoI(poi_info);
                widget.selected_feature = feature_mock;
                widget.registerPoI(poi_info);
                widget.selected_feature = null;
                widget.registerPoI(poi_info);

                expect(feature_mock.setStyle).toHaveBeenCalledTimes(3);
                const style1 = feature_mock.setStyle.calls.argsFor(0)[0];
                const style2 = feature_mock.setStyle.calls.argsFor(1)[0];
                const style3 = feature_mock.setStyle.calls.argsFor(2)[0];

                expect(style1).not.toBe(style2);
                expect(style1).toBe(style3);
            });

            it("sends update events when updating the selected PoI", () => {
                const feature_mock = new ol.Feature();
                widget.init();
                widget.selected_feature = feature_mock;
                spyOn(feature_mock, 'set');
                spyOn(feature_mock, 'setGeometry');
                spyOn(feature_mock, 'setStyle');
                spyOn(widget.vector_source, 'addFeature');
                spyOn(widget.vector_source, 'getFeatureById').and.returnValue(feature_mock);
                const poi_info = deepFreeze({
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

                expect(MashupPlatform.widget.outputs.poiOutput.pushEvent).toHaveBeenCalledTimes(1);
                expect(MashupPlatform.widget.outputs.poiOutput.pushEvent).toHaveBeenCalledWith(poi_info);
                expect(widget.selected_feature).toBe(feature_mock);
            });

            it("updates popovers when updating the selected PoI", () => {
                const feature_mock = new ol.Feature();
                widget.init();
                widget.selected_feature = feature_mock;
                widget.popover = {
                    update: jasmine.createSpy("update")
                };
                spyOn(feature_mock, 'set');
                spyOn(feature_mock, 'setGeometry');
                spyOn(feature_mock, 'setStyle');
                spyOn(widget.vector_source, 'addFeature');
                spyOn(widget.vector_source, 'getFeatureById').and.returnValue(feature_mock);
                const poi_info = deepFreeze({
                    id: '1',
                    data: {},
                    title: "testtitle",
                    infoWindow: "testcontent",
                    location: {
                        type: 'Point',
                        coordinates: [0, 0]
                    }
                });
                spyOn(feature_mock, "get").and.callFake((attr) => {
                    if (attr == "conent") {
                        return poi_info.infoWindow;
                    } else {
                        return poi_info[attr];
                    }
                });
                widget.registerPoI(poi_info);

                expect(widget.popover.update).toHaveBeenCalledTimes(1);
                expect(widget.popover.update).toHaveBeenCalledWith(poi_info.title, jasmine.any(StyledElements.Fragment));
                expect(widget.selected_feature).toBe(feature_mock);
            });

            it("updates popovers when updating the selected PoI (WireCloud 1.3 and below)", () => {
                const feature_mock = new ol.Feature();
                widget.init();
                widget.selected_feature = feature_mock;
                const mock_popover = widget.popover = {
                    options: {},
                    hide: jasmine.createSpy("hide").and.callFake(() => mock_popover),
                    show: jasmine.createSpy("show")
                };
                spyOn(feature_mock, 'set');
                spyOn(feature_mock, 'setGeometry');
                spyOn(feature_mock, 'setStyle');
                spyOn(widget.vector_source, 'addFeature');
                spyOn(widget.vector_source, 'getFeatureById').and.returnValue(feature_mock);
                const poi_info = deepFreeze({
                    id: '1',
                    data: {},
                    title: "testtitle",
                    infoWindow: "testcontent",
                    location: {
                        type: 'Point',
                        coordinates: [0, 0]
                    }
                });
                spyOn(feature_mock, "get").and.callFake((attr) => {
                    if (attr == "conent") {
                        return poi_info.infoWindow;
                    } else {
                        return poi_info[attr];
                    }
                });
                widget.registerPoI(poi_info);

                expect(widget.popover.hide).toHaveBeenCalledTimes(2);
                expect(widget.popover.show).toHaveBeenCalledTimes(1);
                expect(widget.selected_feature).toBe(feature_mock);
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
                        const feature = widget.vector_source.addFeature.calls.argsFor(0)[0];
                        const fstyle = feature.getStyle()(feature);
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
                        const feature = widget.vector_source.addFeature.calls.argsFor(0)[0];
                        const fimage = feature.getStyle()(feature).getImage();
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
                        id: '2',
                        data: {},
                        location: {
                            type: 'Point',
                            coordinates: [0, 0]
                        },
                        icon: iconStyle,
                    }));
                    const feature1 = widget.vector_source.addFeature.calls.argsFor(0)[0];
                    const feature2 = widget.vector_source.addFeature.calls.argsFor(1)[0];
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
                        const feature = widget.vector_source.addFeature.calls.argsFor(0)[0];
                        const fstyle = feature.getStyle()(feature, resolution);
                        expect(fstyle).toEqual(displayed ? jasmine.any(ol.style.Style) : null);
                    };
                };

                it("displays the PoI if the zoom level is greather than the configured one", test(2.388657133911758, true));
                it("hides the PoI if the zoom level is lower than the configured one", test(152.8740565703525, false));

            });

            describe("handles the maxzoom option:", () => {
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
                            maxzoom: 13
                        }));
                        expect(widget.vector_source.addFeature).toHaveBeenCalledTimes(1);
                        expect(widget.vector_source.addFeature).toHaveBeenCalledWith(jasmine.any(ol.Feature));
                        const feature = widget.vector_source.addFeature.calls.argsFor(0)[0];
                        const fstyle = feature.getStyle()(feature, resolution);
                        expect(fstyle).toEqual(displayed ? jasmine.any(ol.style.Style) : null);
                    };
                };

                it("hides the PoI if the zoom level is greather than the configured one", test(2.388657133911758, false));
                it("displays the PoI if the zoom level is lower than the configured one", test(152.8740565703525, true));

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
                expect(MashupPlatform.widget.outputs.poiOutput.pushEvent).not.toHaveBeenCalled();
            });

            it("supports cleaning current PoIs (having a selected poi)", () => {
                widget.init();
                const initial_feature_mock = new ol.Feature();
                initial_feature_mock.setId("1");
                widget.selected_feature = initial_feature_mock;
                const popover = widget.popover = {
                    update: jasmine.createSpy("update"),
                    hide: jasmine.createSpy("hide")
                };
                spyOn(widget, "registerPoI");
                spyOn(widget, "select_feature");
                spyOn(widget.vector_source, "clear");

                widget.replacePoIs([]);

                expect(widget.registerPoI).not.toHaveBeenCalled();
                expect(widget.select_feature).not.toHaveBeenCalled();
                expect(popover.update).not.toHaveBeenCalled();
                expect(popover.hide).toHaveBeenCalledWith();
                expect(widget.popover).toBe(null);
                expect(widget.selected_feature).toBe(null);
                expect(MashupPlatform.widget.outputs.poiOutput.pushEvent).toHaveBeenCalledTimes(1);
                expect(MashupPlatform.widget.outputs.poiOutput.pushEvent).toHaveBeenCalledWith(null);
            });

            it("should maintain current selection if it exists on the new status", () => {
                const poi_info = deepFreeze({
                    id: '1',
                    data: {},
                    title: "test",
                    location: {
                        type: 'Point',
                        coordinates: [0, 0]
                    }
                });
                widget.init();
                const initial_feature_mock = new ol.Feature();
                initial_feature_mock.setId("1");
                widget.selected_feature = initial_feature_mock;
                const popover = widget.popover = {
                    update: jasmine.createSpy("update"),
                    hide: jasmine.createSpy("hide")
                };
                const new_feature_mock = new ol.Feature();
                spyOn(new_feature_mock, "get").and.callFake((attr) => attr == "data" ? poi_info : poi_info[attr]);
                spyOn(widget, "registerPoI");
                spyOn(widget, "select_feature");
                spyOn(widget.vector_source, 'clear');
                spyOn(widget.vector_source, 'getFeatureById').and.returnValue(new_feature_mock);

                widget.replacePoIs([poi_info]);

                expect(widget.registerPoI).toHaveBeenCalledTimes(1);
                expect(widget.vector_source.getFeatureById).toHaveBeenCalledTimes(1);
                expect(widget.vector_source.getFeatureById).toHaveBeenCalledWith("1");
                expect(widget.popover).toBe(popover);
                expect(popover.update).toHaveBeenCalledWith("test", jasmine.any(StyledElements.Fragment));
                expect(widget.selected_feature).toBe(new_feature_mock);
                expect(MashupPlatform.widget.outputs.poiOutput.pushEvent).toHaveBeenCalledTimes(1);
                expect(MashupPlatform.widget.outputs.poiOutput.pushEvent).toHaveBeenCalledWith(poi_info);
            });

            it("should maintain current selection if it exists on the new status (WireCloud 1.3 and below)", () => {
                const poi_info = deepFreeze({
                    id: '1',
                    data: {},
                    title: "test",
                    location: {
                        type: 'Point',
                        coordinates: [0, 0]
                    }
                });
                widget.init();
                const initial_feature_mock = new ol.Feature();
                initial_feature_mock.setId("1");
                widget.selected_feature = initial_feature_mock;
                const popover = widget.popover = {
                    options: {},
                    hide: jasmine.createSpy("hide").and.callFake(() => popover),
                    show: jasmine.createSpy("show")
                };
                const new_feature_mock = new ol.Feature();
                spyOn(new_feature_mock, "get").and.callFake((attr) => attr == "data" ? poi_info : poi_info[attr]);
                spyOn(widget, "registerPoI");
                spyOn(widget, "select_feature");
                spyOn(widget.vector_source, 'clear');
                spyOn(widget.vector_source, 'getFeatureById').and.returnValue(new_feature_mock);

                widget.replacePoIs([poi_info]);

                expect(widget.registerPoI).toHaveBeenCalledTimes(1);
                expect(widget.vector_source.getFeatureById).toHaveBeenCalledTimes(1);
                expect(widget.vector_source.getFeatureById).toHaveBeenCalledWith("1");
                expect(widget.popover).toBe(popover);
                expect(popover.hide).toHaveBeenCalledTimes(2);
                expect(popover.show).toHaveBeenCalledTimes(1);
                expect(widget.selected_feature).toBe(new_feature_mock);
                expect(MashupPlatform.widget.outputs.poiOutput.pushEvent).toHaveBeenCalledTimes(1);
                expect(MashupPlatform.widget.outputs.poiOutput.pushEvent).toHaveBeenCalledWith(poi_info);
            });

            it("should clean current selection if it does not exist on the new status", () => {
                const poi_info = deepFreeze({
                    id: '1',
                    data: {},
                    location: {
                        type: 'Point',
                        coordinates: [0, 0]
                    }
                });
                widget.init();
                const initial_feature_mock = new ol.Feature();
                initial_feature_mock.setId("5");
                widget.selected_feature = initial_feature_mock;
                const popover = widget.popover = {
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
                expect(widget.popover).toBe(null);
                expect(MashupPlatform.widget.outputs.poiOutput.pushEvent).toHaveBeenCalledTimes(1);
                expect(MashupPlatform.widget.outputs.poiOutput.pushEvent).toHaveBeenCalledWith(null);
            });

        });

        describe("centerPoI(poi_list)", () => {

            it("should work with an empty list of PoIs", () => {
                widget.init();
                spyOn(widget.map.getView(), 'fit').and.callThrough();
                widget.centerPoI([]);

                expect(widget.map.getView().fit).not.toHaveBeenCalled();
                expect(MashupPlatform.widget.outputs.poiOutput.pushEvent).not.toHaveBeenCalled();
            });

            it("should work with one Poi on a PoI with iconHighlighted details", () => {
                widget.init();
                spyOn(widget.vector_source, 'addFeature').and.callThrough();
                spyOn(widget.map.getView(), 'fit').and.callThrough();
                spyOn(widget.map.getView(), 'getZoom').and.returnValue(11);
                spyOn(ol.extent, 'containsExtent').and.returnValue(true);
                // TODO
                const poi_info = deepFreeze({
                    id: '1',
                    data: {
                        iconHighlighted: {
                            src: "https://www.example.com/image.png",
                            opacity: 0.2,
                            scale: 0.1
                        }
                    },
                    location: {
                        type: 'Point',
                        coordinates: [0, 0]
                    }
                });
                widget.registerPoI(poi_info);
                const feature = widget.vector_source.addFeature.calls.argsFor(0)[0];
                spyOn(feature, "setStyle");

                widget.centerPoI([{id: '1'}]);

                expect(widget.selected_feature).toBe(feature);
                expect(feature.setStyle).toHaveBeenCalledTimes(1);
                expect(widget.map.getView().fit).not.toHaveBeenCalled();
                expect(MashupPlatform.widget.outputs.poiOutput.pushEvent).toHaveBeenCalledWith(poi_info);
            });

            it("should empty current selection when passing an empty list of PoIs", () => {
                widget.init();
                spyOn(widget.map.getView(), 'fit').and.callThrough();
                // TODO
                const poi_info = deepFreeze({
                    id: '1',
                    data: {
                        iconHighlighted: {
                            src: "https://www.example.com/image.png",
                            opacity: 0.2,
                            scale: 0.1
                        }
                    },
                    location: {
                        type: 'Point',
                        coordinates: [0, 0]
                    }
                });
                widget.registerPoI(poi_info);
                widget.centerPoI([{id: '1'}]);
                widget.map.getView().fit.calls.reset();
                MashupPlatform.widget.outputs.poiOutput.pushEvent.calls.reset();

                widget.centerPoI([]);

                expect(widget.map.getView().fit).not.toHaveBeenCalled();
                expect(MashupPlatform.widget.outputs.poiOutput.pushEvent).toHaveBeenCalledTimes(1);
                expect(MashupPlatform.widget.outputs.poiOutput.pushEvent).toHaveBeenCalledWith(null);
                expect(widget.selected_feature).toBe(null);
            });

            it("should manage selection changes", (done) => {
                widget.init();
                spyOn(widget.map.getView(), 'fit').and.callThrough();
                const poi_info1 = deepFreeze({
                    id: '1',
                    infoWindow: "Hello world!",
                    location: {
                        type: 'Point',
                        coordinates: [0, 0]
                    }
                });
                widget.registerPoI(poi_info1);
                spyOn(widget.vector_source, 'addFeature').and.callThrough();
                const poi_info2 = deepFreeze({
                    id: '2',
                    data: {
                        iconHighlighted: {
                            src: "https://www.example.com/image.png",
                            opacity: 0.2,
                            scale: 0.1
                        }
                    },
                    location: {
                        type: 'Point',
                        coordinates: [0, 0]
                    }
                });
                widget.registerPoI(poi_info2);
                const feature = widget.vector_source.addFeature.calls.argsFor(0)[0];
                spyOn(widget.map, 'getPixelFromCoordinate').and.returnValue([0, 0]);
                widget.centerPoI([{id: '1'}]);
                widget.map.getView().fit.calls.reset();
                MashupPlatform.widget.outputs.poiOutput.pushEvent.calls.reset();

                setTimeout(() => {
                    expect(widget.popover).not.toBe(null);
                    widget.centerPoI([{id: '2'}]);

                    setTimeout(() => {
                        expect(widget.map.getView().fit).not.toHaveBeenCalled();
                        expect(MashupPlatform.widget.outputs.poiOutput.pushEvent).toHaveBeenCalledTimes(1);
                        expect(MashupPlatform.widget.outputs.poiOutput.pushEvent).toHaveBeenCalledWith(poi_info2);
                        expect(widget.popover).toBe(null);
                        expect(widget.selected_feature).toBe(feature);
                        done();
                    });
                }, 300);
            });

            it("should manage selection changes (by id)", (done) => {
                widget.init();
                spyOn(widget.map.getView(), 'fit').and.callThrough();
                const poi_info1 = deepFreeze({
                    id: '1',
                    infoWindow: "Hello world!",
                    location: {
                        type: 'Point',
                        coordinates: [0, 0]
                    }
                });
                widget.registerPoI(poi_info1);
                spyOn(widget.vector_source, 'addFeature').and.callThrough();
                const poi_info2 = deepFreeze({
                    id: '2',
                    data: {
                        iconHighlighted: {
                            src: "https://www.example.com/image.png",
                            opacity: 0.2,
                            scale: 0.1
                        }
                    },
                    location: {
                        type: 'Point',
                        coordinates: [0, 0]
                    }
                });
                widget.registerPoI(poi_info2);
                const feature = widget.vector_source.addFeature.calls.argsFor(0)[0];
                spyOn(widget.map, 'getPixelFromCoordinate').and.returnValue([0, 0]);
                widget.centerPoI(["1"]);
                widget.map.getView().fit.calls.reset();
                MashupPlatform.widget.outputs.poiOutput.pushEvent.calls.reset();

                setTimeout(() => {
                    expect(widget.popover).not.toBe(null);
                    widget.centerPoI(['2']);

                    setTimeout(() => {
                        expect(widget.map.getView().fit).not.toHaveBeenCalled();
                        expect(MashupPlatform.widget.outputs.poiOutput.pushEvent).toHaveBeenCalledTimes(1);
                        expect(MashupPlatform.widget.outputs.poiOutput.pushEvent).toHaveBeenCalledWith(poi_info2);
                        expect(widget.popover).toBe(null);
                        expect(widget.selected_feature).toBe(feature);
                        done();
                    });
                }, 300);
            });

            it("should mantain selection (by id)", (done) => {
                widget.init();
                spyOn(widget.map.getView(), 'fit').and.callThrough();
                spyOn(widget.vector_source, 'addFeature').and.callThrough();
                const poi_info1 = deepFreeze({
                    id: '1',
                    infoWindow: "Hello world!",
                    location: {
                        type: 'Point',
                        coordinates: [0, 0]
                    }
                });
                widget.registerPoI(poi_info1);
                const feature = widget.vector_source.addFeature.calls.argsFor(0)[0];
                spyOn(widget.map, 'getPixelFromCoordinate').and.returnValue([0, 0]);
                widget.centerPoI(["1"]);
                widget.map.getView().fit.calls.reset();
                MashupPlatform.widget.outputs.poiOutput.pushEvent.calls.reset();

                setTimeout(() => {
                    expect(widget.popover).not.toBe(null);
                    widget.centerPoI(["1"]);

                    setTimeout(() => {
                        expect(widget.map.getView().fit).not.toHaveBeenCalled();
                        expect(MashupPlatform.widget.outputs.poiOutput.pushEvent).not.toHaveBeenCalled();
                        expect(widget.popover).not.toBe(null);
                        expect(widget.selected_feature).toBe(feature);
                        done();
                    });
                }, 300);
            });

            it("should work with multiple Pois (zoom no changed)", () => {
                widget.init();
                spyOn(widget.map.getView(), 'fit').and.callThrough();
                spyOn(widget.map.getView(), 'setCenter').and.callThrough();
                spyOn(widget.map.getView(), 'getZoom').and.returnValue(15);
                spyOn(ol.extent, 'containsExtent').and.returnValue(false);
                spyOn(ol.extent, 'getSize').and.returnValues(
                    [100, 100],  // view size
                    [5, 5]       // selection size
                );
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

                expect(widget.map.getView().fit).not.toHaveBeenCalled();
                expect(widget.map.getView().setCenter).toHaveBeenCalledTimes(1);
            });

            it("should work with multiple Pois (zoom out to fit)", () => {
                widget.init();
                spyOn(widget.map.getView(), 'fit');
                spyOn(widget.map.getView(), 'setCenter');
                spyOn(widget.map.getView(), 'getZoom').and.returnValue(17);
                spyOn(ol.extent, 'containsExtent').and.returnValue(false);
                spyOn(ol.extent, 'getSize').and.returnValues(
                    [10, 10],  // view size
                    [50, 50]   // selection size
                );
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
                expect(widget.map.getView().setCenter).not.toHaveBeenCalled();
            });

        });

        describe("addLayer(options)", () => {

            const mock_layers = function mock_layers(widget) {
                const layers_mock = {
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

            it("allows to configure general options", () => {
                // current supported general options are:
                // extent
                // opacity
                // viewMinZoom
                // viewMaxZoom
                // visible
                widget.init();
                const layers_mock = mock_layers(widget);

                widget.addLayer({
                    type: "ImageStatic",
                    url: "http://www.example.com/map.png",
                    id: "LayerName",
                    opacity: 0.2,
                    visible: false,
                    viewMinZoom: 3,
                    viewMaxZoom: 10,
                    extent: [0, 0, 0, 0]
                });

                expect(layers_mock.insertAt).toHaveBeenCalledWith(1, jasmine.any(ol.layer.Image));
                const layer = layers_mock.insertAt.calls.argsFor(0)[1];
                expect(layer.getSource()).toEqual(jasmine.any(ol.source.ImageStatic));
                expect(layer.getOpacity()).toBe(0.2);
                expect(layer.getVisible()).toBe(false);
                expect(layer.getExtent()).toEqual([
                    jasmine.any(Number),
                    jasmine.any(Number),
                    jasmine.any(Number),
                    jasmine.any(Number)
                ]);
            });

            it("transform extents from EPSG:4326 to current map projection by default", () => {
                widget.init();
                const layers_mock = mock_layers(widget);

                widget.addLayer({
                    type: "ImageStatic",
                    url: "http://www.example.com/map.png",
                    id: "LayerName",
                    extent: [1, 1, 1, 1]
                });

                expect(layers_mock.insertAt).toHaveBeenCalledWith(1, jasmine.any(ol.layer.Image));
                const layer = layers_mock.insertAt.calls.argsFor(0)[1];
                expect(layer.getExtent()).toEqual([
                    jasmine.any(Number),
                    jasmine.any(Number),
                    jasmine.any(Number),
                    jasmine.any(Number)
                ]);
                expect(layer.getExtent()).not.toEqual([1, 1, 1, 1]);
            });

            it("supports Image WMS layers", () => {
                widget.init();
                const layers_mock = mock_layers(widget);

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

            it("supports Image WMS layers (provides a default params option)", () => {
                widget.init();
                const layers_mock = mock_layers(widget);

                widget.addLayer({
                    type: "ImageWMS",
                    url: "http://wms.example.com",
                    id: "LayerName"
                });

                expect(layers_mock.insertAt).toHaveBeenCalledWith(1, jasmine.any(ol.layer.Image));
                expect(layers_mock.insertAt.calls.argsFor(0)[1].getSource()).toEqual(jasmine.any(ol.source.ImageWMS));
            });

            it("supports Image WMS layers (uses layer id as default LAYERS parameter)", () => {
                widget.init();
                const layers_mock = mock_layers(widget);

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

            it("supports ImageArcGISRest layers", () => {
                widget.init();
                const layers_mock = mock_layers(widget);

                widget.addLayer({
                    type: "ImageArcGISRest",
                    url: "http://wms.example.com",
                    id: "LayerName"
                });

                expect(layers_mock.insertAt).toHaveBeenCalledWith(1, jasmine.any(ol.layer.Image));
                expect(layers_mock.insertAt.calls.argsFor(0)[1].getSource()).toEqual(jasmine.any(ol.source.ImageArcGISRest));
            });

            it("supports ImageMapGuide layers", () => {
                widget.init();
                const layers_mock = mock_layers(widget);

                widget.addLayer({
                    type: "ImageMapGuide",
                    url: "http://wms.example.com",
                    id: "LayerName"
                });

                expect(layers_mock.insertAt).toHaveBeenCalledWith(1, jasmine.any(ol.layer.Image));
                expect(layers_mock.insertAt.calls.argsFor(0)[1].getSource()).toEqual(jasmine.any(ol.source.ImageMapGuide));
            });

            it("supports ImageStatic layers", () => {
                widget.init();
                const layers_mock = mock_layers(widget);

                widget.addLayer({
                    type: "ImageStatic",
                    url: "http://www.example.com/map.png",
                    id: "LayerName"
                });

                expect(layers_mock.insertAt).toHaveBeenCalledWith(1, jasmine.any(ol.layer.Image));
                expect(layers_mock.insertAt.calls.argsFor(0)[1].getSource()).toEqual(jasmine.any(ol.source.ImageStatic));
            });

            it("supports Vector layers", () => {
                widget.init();
                const layers_mock = mock_layers(widget);

                widget.addLayer({
                    type: "Vector",
                    url: 'https://openlayers.org/en/v4.6.4/examples/data/kml/2012_Earthquakes_Mag5.kml',
                    format: "KML",
                    id: "LayerName"
                });

                expect(layers_mock.insertAt).toHaveBeenCalledWith(1, jasmine.any(ol.layer.Vector));
                expect(layers_mock.insertAt.calls.argsFor(0)[1].getSource()).toEqual(jasmine.any(ol.source.Vector));
            });

            it("raises an EndpointValueError exception when trying to create a Vector layer without providing the format", () => {
                widget.init();

                expect(() => {
                    widget.addLayer({
                        type: "Vector",
                        url: 'https://openlayers.org/en/v4.6.4/examples/data/kml/2012_Earthquakes_Mag5.kml',
                        id: "LayerName"
                    });
                }).toThrowError(MashupPlatform.wiring.EndpointValueError);
            });

            it("raises an EndpointValueError exception when trying to create a Vector layer without providing a layer url", () => {
                widget.init();

                expect(() => {
                    widget.addLayer({
                        type: "Vector",
                        id: "LayerName",
                        format: "KML"
                    });
                }).toThrowError(MashupPlatform.wiring.EndpointValueError);
            });

            it("supports Vector layers (with format options)", () => {
                widget.init();
                const layers_mock = mock_layers(widget);

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

            it("supports Vector layers (with GML format options)", () => {
                widget.init();
                const layers_mock = mock_layers(widget);

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


            it("supports VectorTile layers", () => {
                widget.init();
                const layers_mock = mock_layers(widget);

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

            it("supports OSM layers", () => {
                widget.init();
                const layers_mock = mock_layers(widget);

                widget.addLayer({
                    type: "OSM",
                    id: "LayerName"
                });

                expect(layers_mock.insertAt).toHaveBeenCalledWith(1, jasmine.any(ol.layer.Tile));
                expect(layers_mock.insertAt.calls.argsFor(0)[1].getSource()).toEqual(jasmine.any(ol.source.OSM));
            });

            it("supports Tile WMS layers", () => {
                widget.init();
                const layers_mock = mock_layers(widget);

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

            it("supports Tile WMS layers (provides a default params option)", () => {
                widget.init();
                const layers_mock = mock_layers(widget);

                widget.addLayer({
                    type: "TileWMS",
                    id: "LayerName",
                    url: 'https://wms.geo.admin.ch/',
                    serverType: 'mapserver'
                });

                expect(layers_mock.insertAt).toHaveBeenCalledWith(1, jasmine.any(ol.layer.Tile));
                expect(layers_mock.insertAt.calls.argsFor(0)[1].getSource()).toEqual(jasmine.any(ol.source.TileWMS));
            });

            it("supports Tile WMS layers (uses layer id as default LAYERS parameter)", () => {
                widget.init();
                const layers_mock = mock_layers(widget);

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

            it("supports Tile JSON layers", () => {
                widget.init();
                const layers_mock = mock_layers(widget);

                widget.addLayer({
                    type: "TileJSON",
                    id: "LayerName",
                    url: 'https://api.tiles.mapbox.com/v3/mapbox.geography-class.json?secure',
                    crossOrigin: 'anonymous'
                });

                expect(layers_mock.insertAt).toHaveBeenCalledWith(1, jasmine.any(ol.layer.Tile));
                expect(layers_mock.insertAt.calls.argsFor(0)[1].getSource()).toEqual(jasmine.any(ol.source.TileJSON));
            });

            it("supports Tile UTF Grid layers", () => {
                widget.init();
                const layers_mock = mock_layers(widget);

                widget.addLayer({
                    type: "TileUTFGrid",
                    id: "LayerName",
                    url: 'https://api.tiles.mapbox.com/v4/mapbox.geography-class.json?secure&access_token=XXX'
                });

                expect(layers_mock.insertAt).toHaveBeenCalledWith(1, jasmine.any(ol.layer.Tile));
                expect(layers_mock.insertAt.calls.argsFor(0)[1].getSource()).toEqual(jasmine.any(ol.source.UTFGrid));
            });

            it("supports XYZ layers", () => {
                widget.init();
                const layers_mock = mock_layers(widget);

                widget.addLayer({
                    type: "XYZ",
                    url: "https://{a-c}.maptile.maps.svc.ovi.com/maptiler/v2/maptile/newest/carnav.day/{z}/{x}/{y}/256/png",
                    id: "LayerName"
                });

                expect(layers_mock.insertAt).toHaveBeenCalledWith(1, jasmine.any(ol.layer.Tile));
                expect(layers_mock.insertAt.calls.argsFor(0)[1].getSource()).toEqual(jasmine.any(ol.source.XYZ));
            });

            it("supports Stamen layers", () => {
                widget.init();
                const layers_mock = mock_layers(widget);

                widget.addLayer({
                    type: "Stamen",
                    layer: "watercolor",
                    id: "LayerName"
                });

                expect(layers_mock.insertAt).toHaveBeenCalledWith(1, jasmine.any(ol.layer.Tile));
                expect(layers_mock.insertAt.calls.argsFor(0)[1].getSource()).toEqual(jasmine.any(ol.source.Stamen));
            });

            it("supports BingMaps layers", () => {
                widget.init();
                const layers_mock = mock_layers(widget);

                widget.addLayer({
                    type: "BingMaps",
                    imagerySet: "Road",
                    id: "LayerName"
                });

                expect(layers_mock.insertAt).toHaveBeenCalledWith(1, jasmine.any(ol.layer.Tile));
                expect(layers_mock.insertAt.calls.argsFor(0)[1].getSource()).toEqual(jasmine.any(ol.source.BingMaps));
            });

            it("supports CartoDB layers", () => {
                widget.init();
                const layers_mock = mock_layers(widget);

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

            it("supports WMTS layers", () => {
                widget.init();
                const layers_mock = mock_layers(widget);

                widget.addLayer({
                    type: "WMTS",
                    url: "https://www.example.com/MapServer/WMTS/",
                    id: "LayerName"
                });

                expect(layers_mock.insertAt).toHaveBeenCalledWith(1, jasmine.any(ol.layer.Tile));
                expect(layers_mock.insertAt.calls.argsFor(0)[1].getSource()).toEqual(jasmine.any(ol.source.WMTS));
            });

            it("supports Zoomify layers", () => {
                widget.init();
                const layers_mock = mock_layers(widget);

                widget.addLayer({
                    type: "Zoomify",
                    url: "http://vips.vtech.fr/cgi-bin/iipsrv.fcgi?zoomify=/mnt/MD1/AD00/plan_CHU-4HD-01/FOND.TIF/",
                    size: [9911, 6100],
                    id: "LayerName"
                });

                expect(layers_mock.insertAt).toHaveBeenCalledWith(1, jasmine.any(ol.layer.Tile));
                expect(layers_mock.insertAt.calls.argsFor(0)[1].getSource()).toEqual(jasmine.any(ol.source.Zoomify));
            });

            it("replaces layers with the same id", () => {
                widget.init();
                const layers_mock = mock_layers(widget);
                spyOn(widget.map, 'removeLayer');
                const layer_mock = jasmine.createSpy('layer_mock');
                widget.layers.LayerName = layer_mock;

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
                const layer_mock = jasmine.createSpy('layer_mock');
                widget.layers.LayerName = layer_mock;

                widget.removeLayer({
                    id: "LayerName"
                });

                expect(widget.map.removeLayer).toHaveBeenCalledWith(layer_mock);
                expect(widget.layers.LayerName).toBe(undefined);
            });

        });

        describe("updateLayer(options)", () => {

            it("throws an EndpointValueError if the new layer is not available", () => {
                widget.init();

                expect(() => {
                    widget.updateLayer({
                        id: 'inexistent'
                    });
                }).toThrowError(MashupPlatform.wiring.EndpointValueError);
            });

            it("updates general layers", () => {
                widget.init();
                const layer_mock = {
                    setOpacity: jasmine.createSpy("setOpacity"),
                    setVisible: jasmine.createSpy("setVisible"),
                    _layer_type: "BingMaps"
                };
                widget.layers.LayerName = layer_mock;

                widget.updateLayer({
                    id: "LayerName",
                    visible: true,
                    opacity: 0.5
                });

                expect(layer_mock.setOpacity).toHaveBeenCalledWith(0.5);
                expect(layer_mock.setVisible).toHaveBeenCalledWith(true);
            });

            it("updates existing XYZ layers", () => {
                widget.init();
                const source_mock = {
                    setUrl: jasmine.createSpy("setUrl")
                };
                const layer_mock = {
                    getSource: jasmine.createSpy("getSource").and.returnValue(source_mock),
                    _layer_type: "XYZ"
                };
                widget.layers.LayerName = layer_mock;

                const newurl = "https://newserver.example.com";
                widget.updateLayer({
                    id: "LayerName",
                    url: newurl
                });

                expect(source_mock.setUrl).toHaveBeenCalledWith(newurl);
            });

            it("support empty XYZ layer updates", () => {
                widget.init();
                const source_mock = {};
                const layer_mock = {
                    getSource: jasmine.createSpy("getSource").and.returnValue(source_mock),
                    _layer_type: "XYZ"
                };
                widget.layers.LayerName = layer_mock;

                widget.updateLayer({
                    id: "LayerName"
                });
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

                const initial_base_layer = widget.base_layer;
                widget.setBaseLayer({
                    id: 'CARTODB_LIGHT'
                });

                expect(widget.base_layer).not.toBe(initial_base_layer);
            });

        });

        describe("build marker with Font Awesome icon", () => {

            it("build default marker", () => {
                widget.init();
                spyOn(widget.vector_source, 'addFeature');
                spyOn(widget, 'get_styleSheets').and.returnValue([
                    {cssRules: [{selectorText: '.fa-star::before', style: {content: '\uf005'}}]},
                    {cssRules: [{selectorText: '', style: {content: ''}}]}
                ]);
                widget.registerPoI(deepFreeze({
                    id: '1',
                    data: {},
                    location: {
                        type: 'Point',
                        coordinates: [0, 0]
                    },
                    icon: {
                        'fontawesome': ''
                    }
                }));
                expect(widget.vector_source.addFeature).toHaveBeenCalledTimes(1);
                expect(widget.vector_source.addFeature).toHaveBeenCalledWith(jasmine.any(ol.Feature));
            });

            it("build marker with icon form", () => {
                widget.init();
                spyOn(widget.vector_source, 'addFeature');
                spyOn(widget, 'get_styleSheets').and.returnValue([
                    {cssRules: [{selectorText: '.fa-star::before', style: {content: '\uf005'}}]}
                ]);
                widget.registerPoI(deepFreeze({
                    id: '1',
                    data: {},
                    location: {
                        type: 'Point',
                        coordinates: [0, 0]
                    },
                    icon: {
                        'fontawesome': {
                            'glyph': 'fa-star',
                            'form': 'icon'
                        }
                    }
                }));
                expect(widget.vector_source.addFeature).toHaveBeenCalledTimes(1);
                expect(widget.vector_source.addFeature).toHaveBeenCalledWith(jasmine.any(ol.Feature));
            });

            it("build red marker with icon form", () => {
                widget.init();
                spyOn(widget.vector_source, 'addFeature');
                spyOn(widget, 'get_styleSheets').and.returnValue([
                    {cssRules: [{selectorText: '.fa-star::before', style: {content: '\uf005'}}]}
                ]);
                widget.registerPoI(deepFreeze({
                    id: '1',
                    data: {},
                    location: {
                        type: 'Point',
                        coordinates: [0, 0]
                    },
                    icon: {
                        'fontawesome': {
                            'glyph': 'fa-star',
                            'form': 'icon',
                            'color': 'red'
                        }
                    }
                }));
                expect(widget.vector_source.addFeature).toHaveBeenCalledTimes(1);
                expect(widget.vector_source.addFeature).toHaveBeenCalledWith(jasmine.any(ol.Feature));
            });

            it("build marker with circle form", () => {
                widget.init();
                spyOn(widget.vector_source, 'addFeature');
                spyOn(widget, 'get_styleSheets').and.returnValue([
                    {cssRules: [{selectorText: '.fa-star::before', style: {content: '\uf005'}}]}
                ]);
                widget.registerPoI(deepFreeze({
                    id: '1',
                    data: {},
                    location: {
                        type: 'Point',
                        coordinates: [0, 0]
                    },
                    icon: {
                        'fontawesome': {
                            'glyph': 'fa-star',
                            'form': 'circle'
                        }
                    }
                }));
                expect(widget.vector_source.addFeature).toHaveBeenCalledTimes(1);
                expect(widget.vector_source.addFeature).toHaveBeenCalledWith(jasmine.any(ol.Feature));
            });

            it("build marker with box form", () => {
                widget.init();
                spyOn(widget.vector_source, 'addFeature');
                spyOn(widget, 'get_styleSheets').and.returnValue([
                    {cssRules: [{selectorText: '.fa-star::before', style: {content: '\uf005'}}]}
                ]);
                widget.registerPoI(deepFreeze({
                    id: '1',
                    data: {},
                    location: {
                        type: 'Point',
                        coordinates: [0, 0]
                    },
                    icon: {
                        'fontawesome': {
                            'glyph': 'fa-star',
                            'form': 'box'
                        }
                    }
                }));
                expect(widget.vector_source.addFeature).toHaveBeenCalledTimes(1);
                expect(widget.vector_source.addFeature).toHaveBeenCalledWith(jasmine.any(ol.Feature));
            });

            it("should use icon cache", () => {
                widget.init();
                spyOn(widget.vector_source, 'addFeature');
                spyOn(widget, 'get_styleSheets').and.returnValue([
                    {cssRules: [{selectorText: '.fa-star::before', style: {content: '\uf005'}}]}
                ]);
                widget.registerPoI(deepFreeze({
                    id: '1',
                    data: {},
                    location: {
                        type: 'Point',
                        coordinates: [0, 0]
                    },
                    icon: {
                        fontawesome: 'fa-star'
                    }
                }));
                widget.registerPoI(deepFreeze({
                    id: '2',
                    data: {},
                    location: {
                        type: 'Point',
                        coordinates: [0, 0]
                    },
                    icon: {
                        fontawesome: 'fa-star'
                    }
                }));
                expect(widget.vector_source.addFeature).toHaveBeenCalledTimes(2);
                expect(widget.vector_source.addFeature).toHaveBeenCalledWith(jasmine.any(ol.Feature));
            });

            it("fallback when glyph not found", () => {
                widget.init();
                spyOn(widget.vector_source, 'addFeature');
                widget.registerPoI(deepFreeze({
                    id: '1',
                    data: {},
                    location: {
                        type: 'Point',
                        coordinates: [0, 0]
                    },
                    icon: {
                        'fontawesome': 'fa-star'
                    }
                }));
                expect(widget.vector_source.addFeature).toHaveBeenCalledTimes(1);
                expect(widget.vector_source.addFeature).toHaveBeenCalledWith(jasmine.any(ol.Feature));
            });
        });

    });

})();
