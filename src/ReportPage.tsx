import React, { useState, useEffect } from 'react';
import { AxiosInstance } from 'axios';
import { Link } from 'react-router-dom';
import { GeoJSON } from 'geojson';
import { fix180 } from './Map';
import {
    Meta,
    Region,
    Regions,
    ReportData,
    ReportFilter,
    MapFilter
} from './Interfaces';
import Report from './Report';
import Spinner from './Spinner';

interface ReportPageProps {
    axios: AxiosInstance,
    meta: Meta,
    path: string[],
    mapAccessToken: string
}

type ReportPageState = 'active' | 'loading' | 'loadingError' | 'unknownRegion';

interface RegionArrayItem {
    id: string,
    region: Region
}

type ReportPageData = {
    report: ReportData,
    reportFilter: ReportFilter
    map: GeoJSON,
    mapFilter: MapFilter,
    regionId: string,
    region: Region,
    subregions?: Regions,
    subregionsSorted?: RegionArrayItem[],
    breadcrumbs: RegionArrayItem[]
};

export default function(props: ReportPageProps) {
    const [ state, setState ] = useState<ReportPageState>('loading');
    const [ showSubregions, setShowSubregions ] = useState<boolean>(false);
    const [ data, setData ] = useState<ReportPageData>({
        report: null,
        reportFilter: {},
        map: null,
        mapFilter: {},
        regionId: null,
        region: null,
        subregions: null,
        subregionsSorted: null,
        breadcrumbs: []
    });

    useEffect(() => {
        setState('loading');
        setShowSubregions(false);

        // check regions by meta
        const parentPaths = props.path.slice(0, -1);
        for (let region of parentPaths) {
            if (!props.meta.regions.includes(region)) {
                setState('unknownRegion');
                return;
            }
        }

        const region = props.path[props.path.length - 1];
        const regionPath = region.toLowerCase();
        let filterReportSubregion = !props.meta.reports.includes(region);
        let filterMapSubregion = !props.meta.maps.includes(region);

        Promise.all(
                parentPaths
                    .map((region) => {
                        return props.axios.get(`/data/regions/${region.toLowerCase()}.json`);
                    })
            )
            .then((responses) => {
                return responses.map((res) => {
                    return res.data;
                });
            })
            .then((regionsArray) => {
                // check region by nesting
                let validPath = true;
                for (let i = 1; i < props.path.length; i++) {
                    if (!regionsArray[i - 1][props.path[i]]) {
                        validPath = false;
                    }
                }
                if (!validPath) {
                    setState('unknownRegion');
                    return;
                }

                // prepare requests
                const requests = [];

                // world
                if (props.path.length == 1) {
                    requests.push(
                        `/data/reports/${regionPath}.json`,
                        `/data/maps/${regionPath}.geojson`,
                        `/data/regions/${regionPath}.json`
                    );

                // ru
                // ru-bel
                // ...
                } else {
                    const parentRegionPath = props.path[props.path.length - 2].toLowerCase();

                    if (!filterReportSubregion) {
                        requests.push(`/data/reports/${regionPath}.json`);
                    } else {
                        requests.push(`/data/reports/${parentRegionPath}.json`);
                    }

                    if (!filterMapSubregion) {
                        requests.push(`/data/maps/${regionPath}.geojson`);
                    } else {
                        requests.push(`/data/maps/${parentRegionPath}.geojson`);
                    }

                    if (props.meta.regions.includes(region)) {
                        requests.push(`/data/regions/${regionPath}.json`);
                    }
                }

                // make requests
                return Promise.all(
                        requests.map((url) => props.axios.get(url))
                    )
                    .then((responses) => {
                        return [
                            // pass parent regions
                            regionsArray,
                            ...responses.map((res) => {
                                return res.data;
                            })
                        ];
                    })
                    .then(([parentRegions, report, map, subregions]) => {
                        fix180(map, ['RU-CHU']);

                        let subregionsSorted: RegionArrayItem[] = null;
                        if (subregions) {
                            subregionsSorted = Object.entries(subregions)
                                .map(([id, region]: [string, Region]) => {
                                    return {
                                        id,
                                        region
                                    };
                                });
                            subregionsSorted.sort((a, b) => {
                                if (a.region.ruSortable == b.region.ruSortable) {
                                    return 0;
                                }
                                return a.region.ruSortable > b.region.ruSortable ? 1 : -1;
                            });
                        }

                        setData({
                            report,
                            reportFilter: {
                                subregion: filterReportSubregion && region
                            },
                            map,
                            mapFilter: {
                                subregion: filterMapSubregion && region
                            },
                            regionId: region,
                            region: parentRegions[parentRegions.length - 1][region],
                            subregions,
                            subregionsSorted,
                            breadcrumbs: parentRegions.slice(0, -1).map((regions: Regions, index: number) => {
                                const id = props.path.slice(1)[index];
                                return {
                                    id,
                                    region: regions[id]
                                };
                            })
                        });
                        setState('active');
                    });
            })
            .catch((err) => {
                setState('loadingError');
            });
    }, [
        props.path
    ]);

    return <React.Fragment>
        { state == 'active'
            ? (
                <div className="ReportPage">
                    <header className="ReportPage__Header">
                        <div className="ReportPage__Breadcrumbs">{data.breadcrumbs.map((breadcrumb, index) => {
                            return <Link
                                key={index}
                                className="ReportPage__Breadcrumb"
                                to={'/' + breadcrumb.id.toLowerCase()}
                            >← {breadcrumb.region.ru}</Link>;
                        })}</div>

                        <h1>
                            COVID-19 в {data.region.ru6}
                        </h1>
                    </header>

                    {data.subregionsSorted && props.path.length <= 2 && <div className={'RegionsList' + (showSubregions ? ' RegionsList_Open' : '')}>
                        <div className="RegionsList__TriggerBlock">
                            <div className="RegionsList__Trigger">
                                <button
                                    type="button"
                                    className="TextButton"
                                    onClick={() => {
                                        setShowSubregions(!showSubregions);
                                    }}
                                >
                                    Регионы{/* ↓ */}
                                </button>
                            </div>
                        </div>
                        <div className="RegionsList__Body">
                            {data.subregionsSorted.map(({id, region}, index) => {
                                return <div
                                    key={index}
                                    className={'RegionsList__Item' + (props.meta.reports.includes(id) ? ' RegionsList__Item_Selected' : '')}
                                >
                                    <Link to={'/' + props.path[props.path.length - 1].toLowerCase() + '/' + id.toLowerCase()}>{region.ru}</Link>
                                </div>;
                            })}
                        </div>
                    </div>}

                    <Report
                        report={data.report}
                        reportFilter={data.reportFilter}
                        map={data.map}
                        mapAccessToken={props.mapAccessToken}
                        mapFilter={data.mapFilter}
                        region={data.region}
                        subregions={data.subregions}
                        thresholds={props.meta.thresholds[data.regionId] || {
                                cases: [1, 10, 100, 500, 1000, 2500, 5000, 10000, 50000],
                                deaths: [1, 10, 20, 50, 100, 500, 1000]
                        }}
                        note={props.meta.notes[data.regionId]
                            ? props.meta.notes[data.regionId].ru
                            : null}
                    />
                </div>
            ) : (
                <div className="LoadingScreen">
                    <div className="LoadingScreen__Item">
                        {
                            state == 'loading'
                                ? <Spinner />
                                : (
                                    state == 'unknownRegion'
                                        ? <React.Fragment>Нет данных по этому региону, <Link to="/">посмотреть что есть</Link></React.Fragment>
                                        : <React.Fragment>Не удалось загрузить данные (</React.Fragment>
                                )
                        }
                    </div>
                </div>
            )
        }
    </React.Fragment>;
}