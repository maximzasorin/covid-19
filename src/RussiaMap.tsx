import React, { useRef, useEffect } from 'react';
import { GeoJSON, FeatureCollection } from 'geojson';
import L from 'leaflet';

import { RussiaRegions, ReportRegions } from './Interfaces';

interface ThresholdColor {
    threshold: number,
    color: string
}

export interface RussiaMapProps {
    map: GeoJSON,
    regions: RussiaRegions,
    data: ReportRegions,
    colors: ThresholdColor[],
    signValue?: (value: number) => string
}

export default function (props: RussiaMapProps) {
    const refMap = useRef(null);

    const signValue = props.signValue || ((value) => {
        return value + '';
    });

    useEffect(() => {
        const leafletMap = L.map(refMap.current, {
            zoomControl: true,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            maxBounds: [
                [82.7, 12.4],
                [35.2, 193.8]
            ]
        }).setView([69.5, 104.64], 3);

        L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
            minZoom: 3,
            maxZoom: 18,
            id: 'mapbox/light-v9',
            tileSize: 512,
            zoomOffset: -1,
            accessToken: 'pk.eyJ1IjoibWF4aW16YXNvcmluIiwiYSI6ImNrODh6dDlmbjAxaHUzaHBremp1YWQ5c2wifQ.36jme_fPdcDtD6PxwXXE-g'
        }).addTo(leafletMap)

        const russiaLayer = L.geoJSON(props.map, {
            style: (feature) => {
                const iso3166_2 = feature.properties['iso3166_2'];
                const value = props.data[iso3166_2] || 0;

                return {
                    fillColor: getFillColor(props.colors, value),
                    weight: 2,
                    opacity: 1,
                    color: 'white',
                    // dashArray: '3',
                    fillOpacity: 0.7
                };
            },
            onEachFeature: (feature, layer) => {
                const iso3166_2 = feature.properties['iso3166_2'];
                const regionName = props.regions[iso3166_2]
                    ? props.regions[iso3166_2].ru
                    : iso3166_2;
                const value = props.data[iso3166_2] || 0;

                layer.bindTooltip('<strong>'+regionName+'</strong>: ' + signValue(value), {
                    sticky: true,
                    direction: 'right'
                });

                layer.on({
                    mouseover: (e) => {
                        var layer = e.target;

                        layer.setStyle({
                            weight: 3,
                            color: '#666',
                            dashArray: '',
                            fillOpacity: 0.7
                        });

                        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                            layer.bringToFront();
                        }
                    },
                    mouseout: (e) => {
                        russiaLayer.resetStyle(e.target);
                    },
                    click: (e) => {
                        leafletMap.fitBounds(e.target.getBounds());
                    }
                })
            }
        });
        russiaLayer.addTo(leafletMap);
    }, []);

    return <div className="Map">
        <div
            className="Map__Container"
            ref={refMap}
            style={{width: 1000, height: 650 }}
        />
    </div>;
}

function getFillColor(colors: ThresholdColor[], value: number) {
    let color = '';
    for (const thresholdColor of colors) {
        if (thresholdColor.threshold <= value) {
            color = thresholdColor.color;
        }
    }
    return color;
}

// https://stackoverflow.com/a/45621483/6734959
function antimeridian(elem) {
    if (Array.isArray(elem)) {
        for (var i = 0; i < elem.length; i++) {
            if (Array.isArray(elem[i][0])) {
                antimeridian(elem[i]);
            } else {
                if (elem[i][0] < 0) {
                    elem[i][0] = 180 + (180 + elem[i][0]);
                }
            }
        }
    }
}

export function fixChukotka(map: FeatureCollection) {
    for (let feature of map.features) {
        if (feature.properties['iso3166_2'] == 'RU-CHU') {
            antimeridian(feature.geometry.coordinates);
            joinPolygons(feature);
            break;
        }
    }
}

function joinPolygons(elem) {
    function isNear180(point) {
        return Math.abs(point[0] - 180) < 0.0000001;
    }

    function distance(a, b) {
        return Math.sqrt((a[0]-b[0]) * (a[0]-b[0]) + (a[1]-b[1]) * (a[1]-b[1]));
    }

    const geometry = elem.geometry;
    if (geometry.type != 'MultiPolygon') {
        return;
    }

    const polygons = geometry.coordinates;
    const polygonsToJoin = [];
    for (let i in polygons) {
        const polygon = polygons[i];

        // polygon with holes
        if (polygon.length > 1) {
            continue;
        }

        let countNear180 = 0;
        for (const point of polygon[0]) {
            if (isNear180(point)) {
                countNear180++;
            }
        }

        if (countNear180 > 1) {
            polygonsToJoin.push(i);
        }
    }

    // remove extra points
    for (const polygonIndex of polygonsToJoin) {
        let i = 0;
        let countNear = 0;
        while (i < polygons[polygonIndex][0].length) {
            if (isNear180(polygons[polygonIndex][0][i])) {
                countNear++;

                if (countNear > 2) {
                    polygons[polygonIndex][0].splice(i - 1, 1);
                    countNear--;
                } else {
                    i++;
                }
            } else {
                countNear = 0;
                i++;
            }
        }
    }

    // drop polygons with more than two points to join
    let i = 0;
    while (i < polygonsToJoin.length) {
        let totalNear180 = 0;
        let countNear180 = 0;
        let hasLessThanTwoArcs = false;
        for (const point of polygons[polygonsToJoin[i]][0]) {
            if (isNear180(point)) {
                totalNear180++;
                countNear180++;
            } else {
                if (countNear180 == 1) {
                    hasLessThanTwoArcs = true;
                }
                countNear180 = 0;
            }
        }
        if (totalNear180 != 2 || hasLessThanTwoArcs) {
            polygonsToJoin.splice(i, 1);
        } else {
            i++;
        }
    }

    if (polygonsToJoin.length % 2 != 0) {
        return;
    }

    // join poligons
    const polygonsToRemove = [];
    i = 0;
    while (i < polygonsToJoin.length) {
        // Break, if there is only one polygon
        if (i + 1 >= polygonsToJoin.length) {
            break;
        }

        // 1. Find two points near 180 point for first polygon
        let firstPointIndex = -1;
        let secondPointIndex = -1;

        for (let j = 0; j < polygons[polygonsToJoin[i]][0].length; j++) {
            if (isNear180(polygons[polygonsToJoin[i]][0][j])) {
                firstPointIndex = j;
                secondPointIndex = j + 1;
                break;
            }
        }

        // 2. Find nearest point from another polygons for first point
        const firstPoint = polygons[polygonsToJoin[i]][0][firstPointIndex];

        let nearestPointToFirstPolygonIndex = -1;
        let nearestPointToFirstIndex = -1;
        let nearestPointDistance = Infinity;

        for (let j = i + 1; j < polygonsToJoin.length; j++) {
            for (let k = 0; k < polygons[polygonsToJoin[j]][0].length; k++) {
                const point = polygons[polygonsToJoin[j]][0][k];
                if (isNear180(point)) {
                    if (nearestPointToFirstIndex == -1) {
                        nearestPointToFirstPolygonIndex = j;
                        nearestPointToFirstIndex = k;
                        nearestPointDistance = distance(firstPoint, point);
                    } else {
                        const newDistance = distance(firstPoint, point);
                        if (newDistance < nearestPointDistance) {
                            nearestPointToFirstPolygonIndex = j;
                            nearestPointToFirstIndex = k;
                            nearestPointDistance = newDistance;
                        }
                    }
                }
            }
        }

        // 3. Find nearest point from same polygons for second point
        const secondPoint = polygons[polygonsToJoin[i]][0][secondPointIndex];

        let nearestPointToSecondIndex = -1;
        nearestPointDistance = Infinity;

        for (let k = 0; k < polygons[polygonsToJoin[nearestPointToFirstPolygonIndex]][0].length; k++) {
            const point = polygons[polygonsToJoin[nearestPointToFirstPolygonIndex]][0][k];
            if (isNear180(point)) {
                if (nearestPointToSecondIndex == -1) {
                    nearestPointToSecondIndex = k;
                    nearestPointDistance = distance(secondPoint, point);
                } else {
                    const newDistance = distance(secondPoint, point);
                    if (newDistance < nearestPointDistance) {
                        nearestPointToSecondIndex = k;
                        nearestPointDistance = newDistance;
                    }
                }
            }
        }

        // 4. Copy points to first polygon
        if (firstPointIndex > secondPointIndex) {
            let t = firstPointIndex;
            firstPointIndex = secondPointIndex;
            secondPointIndex = t;
            let t2 = nearestPointToFirstIndex;
            nearestPointToFirstIndex = nearestPointToSecondIndex;
            nearestPointToSecondIndex = t2;
        }

        const newPolygon = [];
        for (let k = 0; k <= firstPointIndex; k++) {
            newPolygon.push(polygons[polygonsToJoin[i]][0][k]);
        }

        if (nearestPointToFirstIndex < nearestPointToSecondIndex) {
            for (let k = nearestPointToFirstIndex - 1; k >= 0; k--) {
                newPolygon.push(polygons[polygonsToJoin[nearestPointToFirstPolygonIndex]][0][k]);
            }
            for (let k = polygons[polygonsToJoin[nearestPointToFirstPolygonIndex]][0].length - 1; k > nearestPointToSecondIndex; k--) {
                newPolygon.push(polygons[polygonsToJoin[nearestPointToFirstPolygonIndex]][0][k]);
            }
        } else {
            for (let k = nearestPointToFirstIndex + 1; k < polygons[polygonsToJoin[nearestPointToFirstPolygonIndex]][0].length; k++) {
                newPolygon.push(polygons[polygonsToJoin[nearestPointToFirstPolygonIndex]][0][k]);
            }
            for (let k = 0; k < nearestPointToSecondIndex; k++) {
                newPolygon.push(polygons[polygonsToJoin[nearestPointToFirstPolygonIndex]][0][k]);
            }
        }
        for (let k = secondPointIndex; k < polygons[polygonsToJoin[i]][0].length; k++) {
            newPolygon.push(polygons[polygonsToJoin[i]][0][k]);
        }
        polygons[polygonsToJoin[i]][0] = newPolygon;

        // 5. Remove second polygon
        polygonsToRemove.push(polygonsToJoin[nearestPointToFirstPolygonIndex]);
        polygonsToJoin.splice(nearestPointToFirstPolygonIndex, 1);
        polygonsToJoin.splice(i, 1);
    }

    let removed = 0;
    for (let polygonIndex of polygonsToRemove) {
        polygons.splice(polygonIndex - removed, 1);
        removed++;
    }
}