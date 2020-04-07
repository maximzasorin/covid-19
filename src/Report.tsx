import React, { useState } from 'react';
import chroma from 'chroma-js';
import { GeoJSON } from 'geojson';
import formatDate from 'date-fns/format';
import parseDate from 'date-fns/parse';
import dateRuLocale from 'date-fns/locale/ru';

import {
    RussiaRegions,
    Report,
    ReportVersion,
    ReportRegions,
    ReportRegionsArray
} from './Interfaces';
import RussiaMap from './RussiaMap';

export interface ReportProps {
    map: GeoJSON,
    regions: RussiaRegions,
    data: Report
}

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
        <header className="Report__Header">
            <h1>
                COVID-19 в России
            </h1>
        </header>
        <div className="Report__Block">
            <p>Данные на {buildDate(props.data.updatedOn)}</p>

            <h2>Подтвержденные случаи</h2>

            <p>
                Всего случаев: {formatNumber(casesAggregated.total)} {
                    casesAggregated.lastDate ? (
                        casesAggregated.lastDate == props.data.updatedOn ? ' (+' + formatNumber(casesAggregated.totalLastDate) + ' за предыдущие сутки)' : ' (новых случаев не зафиксировано)'
                    ) : ''
                }
            </p>

            <h3>Карта</h3>
        </div>

        <RussiaMap
            map={props.map}
            regions={props.regions}
            data={casesAggregated.byRegion}
            colors={[{
                    threshold: 0,
                    color: '#e6e6e6'
                },
                ...getColorThresholds(
                    [1, 10, 20, 50, 100, 500, 1000], '#ecda9a', '#ee4d5a'
                )
            ]}
            signValue={(value) => {
                return formatNumber(value) + ' ' + declension(value, ['случай', 'случая', 'случаев']);
            }}
        />

        <div className="Report__Block">
            <ReportTable
                valueColumn="Случаев"
                regions={props.regions}
                byRegionLastDate={casesAggregated.lastDate && casesAggregated.lastDate == props.data.updatedOn
                    ? casesAggregated.byRegionLastDate
                    : null}
                byRegionSorted={casesAggregated.byRegionSorted}
                sources={casesAggregated.sources}
            />
        </div>

        {/*  */}

        <div className="Report__Block">
            <h2>Смерти</h2>

            <p>
            Всего смертей: {formatNumber(deathsAggregated.total)} {
                deathsAggregated.lastDate ? (
                    deathsAggregated.lastDate == props.data.updatedOn ? ' (+' + formatNumber(deathsAggregated.totalLastDate) + ' за предыдущие сутки)' : ' (новых смертей не зафиксировано)'
                ) : ''
            }
        </p>

            <h3>Карта</h3>
        </div>

        <RussiaMap
            map={props.map}
            regions={props.regions}
            data={deathsAggregated.byRegion}
            colors={[
                {
                    threshold: 0,
                    color: '#e6e6e6'
                },
                ...getColorThresholds(
                    [1, 10, 20, 50, 100, 500, 1000], '#ffc6c4', '#672044'
                )
            ]}
            signValue={(value) => {
                return formatNumber(value) + ' ' + declension(value, ['смерть', 'смерти', 'смертей']);
            }}
        />
    
        <div className="Report__Block">
            <ReportTable
                valueColumn="Смертей"
                regions={props.regions}
                byRegionLastDate={deathsAggregated.lastDate && deathsAggregated.lastDate == props.data.updatedOn
                    ? deathsAggregated.byRegionLastDate
                    : null}
                byRegionSorted={deathsAggregated.byRegionSorted}
                sources={deathsAggregated.sources}
            />
        </div>
    </div>;
}

interface ReportTableProps {
    caption?: string
    valueColumn?: string
    regions: RussiaRegions,
    byRegionSorted: ReportRegionsArray,
    byRegionLastDate: ReportRegions,
    sources: string[]
}

function ReportTable(props: ReportTableProps) {
    const [isExpanded, setExpanded] = useState(false);

    const regionsArray = isExpanded
        ? props.byRegionSorted
        : props.byRegionSorted.slice(0, 10);

    return <div className="ReportTable">
        <h3 className="ReportTable__Header">{props.caption || 'Таблица'}</h3>

        <table className="ReportTable__Container">
            <thead>
                <tr>
                    <th style={{width: '75%'}}></th>
                    <th>{props.valueColumn}</th>
                </tr>
            </thead>
            <tbody>
                { regionsArray.map(({region, count}, index) => {
                    return <tr key={index}>
                        <td>{props.regions[region] ? props.regions[region].ru : region}</td>
                        <td>{formatNumber(count)} {
                                props.byRegionLastDate && props.byRegionLastDate[region] ? ' (+' + formatNumber(props.byRegionLastDate[region]) + ')' : ''
                        }</td>
                    </tr>;
                }) }
                { props.byRegionSorted.length > 10 && (
                    <tr className="ReportTable__ActionsRow">
                        <td colSpan={2}>
                            <button
                                type="button"
                                className="TextButton"
                                onClick={() => {
                                    setExpanded(!isExpanded);
                                }}
                            >
                                { !isExpanded ? 'Показать все' : 'Скрыть'}
                            </button>
                        </td>
                    </tr>
                ) }
            </tbody>
            <tfoot>
                <tr>
                    <td colSpan={2}>Данные: { props.sources.map((source, index) => {
                            const url = new URL(source);
                            return <React.Fragment key={index}>
                                {index > 0 && ', '}<a
                                    href={source}
                                    target="_blank"
                                >
                                    {url.host}
                                </a>
                            </React.Fragment>;
                    }) }</td>
                </tr>
            </tfoot>
        </table>
    </div>;
}

function formatNumber(value: number) {
    const valueString = value.toFixed();
    const res = [];
    for (let i = valueString.length - 1, j = 1; i >=0; i--, j++) {
        res.push(valueString[i]);
        if (j % 3 == 0 && i != 0) {
            res.push(' ');
        }
    }
    return res.reverse().join('');
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
    return res;
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
                return 1;
            } else if (byRegionLastDate[a.region] && !byRegionLastDate[b.region]) {
                return -1;
            } else {
                return byRegionLastDate[b.region] - byRegionLastDate[a.region];
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