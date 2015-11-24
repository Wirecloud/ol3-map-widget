(function () {

    "use strict";

    window.ol = {
        layer: {
            Group: function () {},
            Image: function () {},
            Tile: function () {}
        },
        proj: {
            transform: function () {}
        },
        source: {
            MapQuest: function () {},
            OSM: function () {},
            ImageWMS: function () {}
        },
        Map: jasmine.createSpy('Map').and.callFake(function () {
            var layers = {
                _layers: [],
                insertAt: jasmine.createSpy('insertAt').and.callFake(function (index, layer) {
                    this._layers.splice(index, 0, layer);
                })
            };
            this.getLayers = jasmine.createSpy('getLayers').and.callFake(function () {return layers;});
            this.addLayer = jasmine.createSpy('addLayer');
            this.removeLayer = jasmine.createSpy('removeLayer');
        }),
        View: jasmine.createSpy('View')
    };

})();
