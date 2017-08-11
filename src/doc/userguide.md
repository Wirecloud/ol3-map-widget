## Introduction

Map viewer widget using OpenLayers. It can receive Layers or Point of Interest data and display them
 on the map.

## Settings


- **Initial Location**: Decimal coordinates where map will be centered on load (e.g. `52, 5`). Leave this setting empty if you don't want to center the map at init. Remember to change the initial zoom level if you provide an initial location. 
- **Initial Zoom Level**: Initial zoom level. From 1 to 22, where '1' represents the furthest level and '22' the maximum zoom level. 
- **Min Zoom**: Minimal zoom level.


## Wiring

### Input Endpoints


- **Layer Info**: Add or remove layers to the map, in addition to changing its base layer. Currently only ImageWMS layers are supported.
  The Layer Info endpoint receives a JSON with two fields: `action` and `data`
  - `action`: This field indicates the action to be executed with a layer. There are three available actions:
    - `addLayer`: Adds a layer to the map. This action uses the following data fields:
      - **`name`** (required)
      - **`url`** (required)
      - `version` (optional)
      - `extent` (optional)
      - `projection` (optional)
    - `removeLayer`: Removes a layer from the map. This action uses the following data fields: 
      - **`name`** (required)
      - **`url`** (required)
    - `setBaseLayer`: Change the base layer of the map. This action uses the following data fields:
      - **`id`** (required)
  - `data`: This field defines the layer the action should be applied to.
    - `name`: The name of the layer.
    - `version`: The version of the layer.
    - `url`: The URL of the WMS service.
    - `extent`: The bounding extent for layer rendering.
    - `projection`: 
    - `id`: The name of the new base layer. e.g. `"WIKIMEDIA"`

- **Insert/Update PoI**: Insert or update a Point of Interest. This endpoint
  supports sending just a PoI or severals through an array. Each PoI is composed
  of the following fields:
    - `id` (required): id used for identifying this PoI. Used in the update and
        delete operators for locating the associated PoI.
    - `location` (required if `currentLocation` not used): a GeoJSON geometry.
      e.g. `{"type": "Point", "coordinates": [125.6, 10.1]}`
    - `currentLocation` (deprecated, required if `location` not used):
        - `longitude` (required):
		- `latitude` (required):
        - `system`: geodetic datum system (usually WGS84, it can be UTM)
	- `title`: title associated to the PoI
    - `subtitle`: subtitle associated to the PoI
    - `infoWindow`: content (using HTML) associated with the PoI.
    - `tooltip`: 
    - `data`: Data associated with the point of interest, used by the **PoI
      selected** output endpoint.
    - `icon`: URL of the icon to use for the marker
- **Replace PoIs**: Replace all the rendered PoIs by the ones provided in the
  event.

### Output Endpoints

- This widget has no outputs

## Usage

This widget can be used standalone in order to display a map. The widget can be fed Point of Interest data via other Wirecloud components such as the [ngsi-entity2poi-operator](https://github.com/wirecloud-fiware/ngsi-entity2poi-operator) to show them on the map.

## Reference

- [FIWARE Mashup](https://mashup.lab.fiware.org/)

## Copyright and License

Apache2
