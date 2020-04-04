import React, { useState } from 'react';
import chroma from 'chroma-js';
import { GeoJSON } from 'geojson';
import formatDate from 'date-fns/format';
import parseDate from 'date-fns/parse';
import dateRuLocale from 'date-fns/locale/ru'

import { RussiaRegionIso3166, RussiaRegions, Report, ReportVersion, ReportRegions } from './Interfaces';
import RussiaMap from './RussiaMap';

export interface ReportProps {
    map: GeoJSON,
    regions: RussiaRegions,
    data: Report
}

type ReportRegionsArray = {
    region: RussiaRegionIso3166,
    count: number
}[];

interface AggregatedReport {
    total: number,
    byRegion: ReportRegions,
    byRegionSorted: ReportRegionsArray,
    lastDate: string,
    totalLastDate: number,
    byRegionLastDate: ReportRegions
    sources: string[]
}

export default function(props: ReportProps) {
    const casesAggregated = aggregateData(props.data.cases);
    const deathsAggregated = aggregateData(props.data.deaths);

    return <div className="Report">
        <p>Данные на {buildDate(props.data.updatedOn)}</p>

        <h2>Подтвержденные случаи</h2>

        <p>
            Всего случаев: {casesAggregated.total} {
                casesAggregated.lastDate ? (
                    casesAggregated.lastDate == props.data.updatedOn ? ' (+' + casesAggregated.totalLastDate + ' за предыдущие сутки)' : ' (новых случаев не зафиксировано)'
                ) : ''
            }
        </p>

        <h3>Карта</h3>

        <RussiaMap
            map={props.map}
            regions={props.regions}
            data={casesAggregated.byRegion}
            colors={getColorThresholds(
                [0, 1, 10, 20, 50, 100, 500, 1000], '#FFEDA0', '#800026'
            )}
            signValue={(value) => {
                return declension(value, ['случай', 'случая', 'случаев']);
            }}
        />

        <h3>Таблица</h3>

        <table>
            <thead>
                <tr>
                    <th></th>
                    <th>Регион</th>
                    <th>Случаев</th>
                </tr>
            </thead>
            <tbody>
                { buildTable(
                    props.regions,
                    casesAggregated.byRegionSorted,
                    casesAggregated.byRegionLastDate
                ) }
            </tbody>
            <tfoot>
                <tr>
                    <td colSpan={3}>Данные: { buildSources(casesAggregated.sources) }</td>
                </tr>
            </tfoot>
        </table>

        {/*  */}

        <h2>Смерти</h2>

        <p>
            Всего смертей: {deathsAggregated.total} {
                deathsAggregated.lastDate ? (
                    deathsAggregated.lastDate == props.data.updatedOn ? ' (+' + deathsAggregated.totalLastDate + ' за предыдущие сутки)' : ' (новых случаев не зафиксировано)'
                ) : ''
            }
        </p>

        <h3>Карта</h3>

        <RussiaMap
            map={props.map}
            regions={props.regions}
            data={deathsAggregated.byRegion}
            colors={getColorThresholds(
                [0, 1, 10, 20, 50, 100, 500, 1000], '#E6E6E6', '#000000'
            )}
            signValue={(value) => {
                return declension(value, ['смерть', 'смерти', 'смертей']);
            }}
        />

        <h3>Таблица</h3>

        <table>
            <thead>
                <tr>
                    <th></th>
                    <th>Регион</th>
                    <th>Смертей</th>
                </tr>
            </thead>
            <tbody>
                { buildTable(
                    props.regions,
                    deathsAggregated.byRegionSorted,
                    deathsAggregated.byRegionLastDate
                ) }
            </tbody>
            <tfoot>
                <tr>
                    <td colSpan={3}>Данные: { buildSources(deathsAggregated.sources) }</td>
                </tr>
            </tfoot>
        </table>
    </div>;
}

function buildDate(date: string) {
    try {
        const parsed = parseDate(date, 'yyyy-MM-dd', new Date);
        return formatDate(parsed, 'd MMMM yyyy', {locale: dateRuLocale}) + ' года';
    } catch (exception) {
        return date;
    }
}

function declension(value: number, array: string[]) {
    let res = array[0];

    if (value == 0) {
        res = array[2];
    } else if (value >= 10 && value <= 20) {
        res = array[2];
    } else {
        if (value % 10 == 1) {
            res = array[0];
        } else if (value % 10 <= 4) {
            res = array[1];
        } else {
            res = array[2];
        }
    }
    return value + ' ' + res;
}

function getColorThresholds(thresholds: number[], beginColor: string, endColor: string) {
    return chroma.scale([beginColor, endColor]).mode('lch').colors(thresholds.length)
        .map((color, index) => {
            return {
                threshold: thresholds[index],
                color
            };
        });
}

function extractSource(sourceUrl: string): string {
    const url = (new URL(sourceUrl));
    return url.origin;
}

function aggregateData(data: ReportVersion): AggregatedReport {
    const sourceMap: {
        [key in string]: number
    } = {};
    const byRegion: ReportRegions = {};
    let total = 0;
    let lastDate: string = null;

    for (let date in data) {
        if (!lastDate) {
            lastDate = date;
        } else if (date > lastDate) {
            lastDate = date;
        }

        data[date].sourceUrls.forEach((sourceUrl) => {
            try {
                const source = extractSource(sourceUrl);
                if (!sourceMap[source]) {
                    sourceMap[source] = 0;
                }
                sourceMap[source]++;
            } catch (exception) {
                // Пропускаем невалидные URL
            }
        });

        for (let region in data[date].regions) {
            if (!byRegion[region]) {
                byRegion[region] = 0;
            }
            const regionCasesAtDate = data[date].regions[region];
            byRegion[region] += regionCasesAtDate;
            total += regionCasesAtDate;
        }
    }

    let totalLastDate = 0;
    if (lastDate) {
        for (let region in data[lastDate].regions) {
            totalLastDate += data[lastDate].regions[region];
        }
    }

    const byRegionSorted: ReportRegionsArray = [];
    for (const region in byRegion) {
        byRegionSorted.push({
            region: region,
            count: byRegion[region]
        });
    }

    const byRegionLastDate: ReportRegions = lastDate ? data[lastDate].regions : null;

    byRegionSorted.sort((a, b) => {
        if (b.count == a.count) {
            if (!byRegionLastDate) {
                return 0;
            } else if (!byRegionLastDate[a.region] && byRegionLastDate[b.region]) {
                return -1;
            } else if (byRegionLastDate[a.region] && !byRegionLastDate[b.region]) {
                return 1;
            } else {
                return byRegionLastDate[a.region] - byRegionLastDate[b.region];
            }
        }
        return b.count - a.count;
    });

    const sources: string[] = Object.entries(sourceMap)
        .sort((a, b) => {
            return b[1] - a[1];
        })
        .map(([source, count]) => {
            return source;
        })

    return {
        total,
        byRegion,
        byRegionSorted,
        lastDate,
        totalLastDate,
        byRegionLastDate,
        sources
    };
}

function buildTable(regions: RussiaRegions, regionsArray: ReportRegionsArray, lastDateRegions?: ReportRegions) {
    return regionsArray.map(({region, count}, index) => {
        return <tr key={index}>
            <td>{index + 1}</td>
            <td>{regions[region] ? regions[region].ru : region}</td>
            <td>{count} {
                    lastDateRegions && lastDateRegions[region] ? ' (+' + lastDateRegions[region] + ')' : ''
            }</td>
        </tr>;
    });
}

function buildSources(sources: string[]) {
    return sources.map((source, index) => {
            const url = new URL(source);
            return <React.Fragment key={index}>
                {index > 0 && ', '}<a
                    href={source}
                    target="_blank"
                >
                    {url.host}
                </a>
            </React.Fragment>;
    });
}