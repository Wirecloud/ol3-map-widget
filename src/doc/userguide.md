## Introduction

Map viewer widget using OpenLayers. It can receive Layers or Point of Interest data and display them
 on the map.

## Settings


- **Initial Location**: Decimal coordinates where map will be centered on load (e.g. `52, 5`). Leave this setting empty if you don't want to center the map at init. Remember to change the initial zoom level if you provide an initial location. This setting can be configured using the <i class="fas fa-crosshairs"></i> button that is displayed inside the widget when in editing mode.
- **Initial Zoom Level**: Initial zoom level. From 1 to 22, where '1' represents the furthest level and '22' the maximum zoom level.
- **Min Zoom**: Minimal zoom level.
- **Layers Widget**: Widget to use for allowing user to switch between layers.
- **Use Clustering**: Mark this option to use clustering for displaying map features.


## Wiring

### Input Endpoints


- **Layer Info**: Add or remove layers to the map, in addition to changing its
  base layer.
  The Layer Info endpoint receives a JSON with two fields: `action` and `data`
  - `action`: This field indicates the action to be executed with a layer. There
    are four available actions:
    - `addLayer`: Adds a layer to the map. This action requires the `id` data
      field to be set.
    - `removeLayer`: Removes a layer from the map. This action requires the `id`
      data field to be set.
    - `setBaseLayer`: Change the base layer of the map. This action requires the
      `id` data field to be set.
    - `updateLayer`: Updates a layer from the map. This action requires the `id`
      data field to be set. Current options available for updating are:
      `opacity`, `visible` and `url`.
  - `data`: This field contains all the data needed to identify to which layer
    the action will be performed, and, in the case of the addLayer action, to
    define and configure the layer.

  In order to create the layer, a layer type must be defined, aside from the
  desired settings for the layer source. E.g.:

  ```json
  {
      "action": "addLayer",
      "data": {
          "id": "My Layer",
          "type": "ImageWMS",
          "url": "UrlToMyWMSService"
      }
  }
  ```

  Refer to the [OpenLayers Documentation](http://openlayers.org/en/latest/apidoc/) to check available types and options

- **Insert/Update PoI**: Insert or update a Point of Interest. This endpoint
  supports sending just a PoI or severals through an array. Each PoI is composed
  of the following fields:
    - **`id`** (required): id used for identifying this PoI. Used in the update
      and delete operations for locating the associated PoI.
    - `currentLocation` (deprecated, required if `location` not used):
        - `longitude` (required):
		- `latitude` (required):
        - `system`: geodetic datum system (usually WGS84, it can be UTM)
    - `data`: Data associated with the point of interest, used by the **PoI
      selected** output endpoint.
    - `icon`: URL of the icon to use for the marker or an object describing the
        icon to use. Available options:
        - `anchor`: Anchor position. Default value is `[0.5, 0.5]` (icon
          center).
        - `anchorXUnits`: Units in which the anchor x value is specified. A
          value of `"fraction"` indicates the x value is a fraction of the
          icon. A value of `"pixels"` indicates the x value in pixels. Default
          is `"fraction"`.
        - `anchorYUnits`: Units in which the anchor y value is specified. A
          value of `"fraction"` indicates the y value is a fraction of the
          icon. A value of `"pixels"` indicates the y value in pixels. Default
          is `"fraction"`.
        - `opacity`: Opacity of the icon (range from 0 to 1). Default is `1`.
        - `scale`: Scale. Default is `1`.
        - `src`: Image source URI.
        - `fontawesome`: Options of the Font Awesome icon to use for the marker.
          Supported options:
            - `glyph`: a glyph of the icon. Default is `fa-star`.
            - `form`: icon form (icon, circle, box, marker). Default is
              `marker`.
            - `size`: pixel size of the icon. Default is `16` px.
            - `color`: icon color. Default is same as the stroke color. CSS3
              color, that is, an hexadecimal, `rgb` or `rgba` color. Default is
              `white`.
            - `fill`: fill color. CSS3 color, that is, an hexadecimal, `rgb` or
            `rgba` color. Default is `blue`.
            - `stroke`: stroke color. CSS3 color, that is, an hexadecimal, `rgb`
              or `rgba` color. Default is `white`.
            - `strokeWidth`: width of stroke. Default is `3`.
            - `radius`: radius of marker.
            - `margin`: margin between icon and marker.
    - `iconHighlighted`: icon configuration to use when the PoI is selected.
        Works in the same way than the `icon` field.
    - `infoWindow`: content (using HTML) associated with the PoI.
    - `location` (required if `currentLocation` not used): a GeoJSON geometry.
      e.g. `{"type": "Point", "coordinates": [125.6, 10.1]}`
    - `minzoom` (integer): Minimum zoom level to display this PoI.
    - `maxzoom` (integer): Maximum zoom level to display this PoI.
    - `selectable` (boolean): `true` if the user should be able to select this
      PoI (default behaviour).
    - `style`: Style to use for rendering. Supported options:
        - `fill`:
            - `color`: fill color. CSS3 color, that is, an hexadecimal, `rgb` or
            `rgba` color.
        - `stroke`:
            - `color`: stroke color. CSS3 color, that is, an hexadecimal, `rgb`
            or `rgba` color.
            - `width`: stroke width in pixels.
    - `iconHighlighted`: Style to use for rendering the PoI when it is selected.
        Works in the same way than the `style` field. The configuration from
        `style` will be used if not provided.
    - `subtitle`: subtitle associated to the PoI
    - `title`: title associated to the PoI
    - `tooltip`: text to be displayed as tooltip when the mouse is over the PoI.
- **Center PoI**: Updates the viewport to make visible the provided list of
    PoIs. If the viewport is already displaying the provide list of PoIs, the
    viewport is not modified. This endpoint can also be used to update or to insert
    new PoIs by providing PoI information using the same format used in the
    **Insert/Update PoI** endpoint.

    Examples:

    - `null`: Clears current selection.
    - `["vehicle-1", "vehicle-2"]`: Ensures `vehicle-1` and `vehicle-2` are
        visible.
    - ```json
      [{
          "id": "vehicle-1",
          "location": {
              "type": "Point",
              "coordinates": [
                  -8.51,
                  41.11
              ]
          },
          "infoWindow": "test1",
          "icon": {
              "fontawesome": {
                  "glyph": "fa-motorcycle"
              }
          }
      }]
      ```

        Updates `vehicle-1` and makes it visible on the map. If `vehicle-1` is
        not the current selecte PoI, selection will be udpated to make it the
        selected PoI.

- **Delete PoI**: Removes a point or more point of interests from the map.
- **Replace PoIs**: Replace all the rendered PoIs by the ones provided in the
  event. Uses the same format used by the **Insert/Update PoI**
  endpoint.


### Output Endpoints

- **PoI selected**: A PoI has been selected on the map.

## Usage

This widget can be used standalone in order to display a map. The widget can be fed Point of Interest data via other Wirecloud components such as the [ngsi-entity2poi-operator](https://github.com/wirecloud-fiware/ngsi-entity2poi-operator) to show them on the map.

## Reference

- [FIWARE Mashup](https://mashup.lab.fiware.org/)

## Copyright and License

Apache2
