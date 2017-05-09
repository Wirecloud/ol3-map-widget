## Introduction

The best project ever.

## Settings

## Wiring

### Input Endpoints

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
- **Replace PoI**: Replace all the rendered PoIs by the ones provided in the
  event.

### Output Endpoints

## Usage

## Reference

- [FIWARE Mashup](https://mashup.lab.fiware.org/)

## Copyright and License

Apache2
