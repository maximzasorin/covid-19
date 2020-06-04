import React, { useState, useEffect } from 'react';
import chroma from 'chroma-js';
import { GeoJSON } from 'geojson';
import formatDate from 'date-fns/format';
import parseDate from 'date-fns/parse';
import addDays from 'date-fns/addDays';
import dateRuLocale from 'date-fns/locale/ru';
import punycode from 'punycode';

import Map from './Map';
import {
    AggregatedReport,
    Region,
    Regions,
    ReportRegions,
    ReportRegionsArray,
    ReportDateArray,
    ReportDate,
    ReportDateMap,
    ReportFilter,
    ReportData,
    ReportVersion,
    MapFilter,
    Thresholds
} from './Interfaces';

export interface ReportProps {
    map: GeoJSON,
    mapAccessToken: string,
    mapFilter: MapFilter,
    region: Region,
    subregions?: Regions,
    report: ReportData,
    reportFilter: ReportFilter,
    thresholds: Thresholds,
    note?: string
}

export default function(props: ReportProps) {
    const cases = aggregateData(
        props.report.updatedOn,
        props.report.cases,
        props.reportFilter.subregion
    );

    const deaths = aggregateData(
        props.report.updatedOn,
        props.report.deaths,
        props.reportFilter.subregion
    );

    return <div className="Report">
        <div className="Report__Block">
            <p>Данные на {buildDate(props.report.updatedOn)}</p>

            {props.note && <p className="Report__Note">{props.note}</p>}

            <h2>Подтвержденные случаи</h2>

            { cases.total > 0
                ? (
                    <React.Fragment>
                        <p>
                            Всего случаев: {formatNumber(cases.total)} {
                                cases.totalLastDate > 0 ? ' (+' + formatNumber(cases.totalLastDate) + ' за предыдущие сутки)' : ' (новых случаев не зафиксировано)'
                            }
                        </p>

                        {
                            !props.reportFilter.subregion && (
                                <React.Fragment>
                                    { cases.countRegionsLastDate > 0 && <p>
                                        Новые случаи зафиксированы в { cases.countRegionsLastDate + ' '
                                            + declension(cases.countRegionsLastDate, [
                                                'регионе', 'регионах', 'регионах'
                                            ]) }
                                    </p> }

                                    <p>
                                        { props.subregions && (
                                            cases.countRegions >= Object.entries(props.subregions).length
                                                ? 'За все время случаи зафиксированы во всех регионах'
                                                : 'За все время случаи зафиксированы в ' + cases.countRegions + ' из ' + Object.entries(props.subregions).length + ' регионов' 
                                        ) }
                                    </p>
                                </React.Fragment>
                            )
                        }
                    </React.Fragment>
                ) : (
                    <p>Случаев не зафиксировано</p>
                ) }

            { <h3>Карта</h3> }
        </div>

        { <Map
            geojson={props.map}
            accessToken={props.mapAccessToken}
            regions={props.mapFilter.subregion
                ? { [props.mapFilter.subregion]: props.region }
                : props.subregions
            }
            zoomRegion={props.mapFilter.subregion}
            data={props.mapFilter.subregion
                ? { [props.mapFilter.subregion]: cases.total }
                : cases.byRegion.map
            }
            colors={[{
                    threshold: 0,
                    color: '#e6e6e6'
                },
                ...getColorThresholds(props.thresholds.cases, '#ecda9a', '#ee4d5a'
                )
            ]}
            signValue={(value) => {
                return formatNumber(value) + ' ' + declension(value, ['случай', 'случая', 'случаев']);
            }}
        /> }

        <div className="Report__Block">
            <ReportTable
                name="casesTable"
                valueColumn="Случаев"
                regions={props.subregions}
                byRegion={!props.reportFilter.subregion && props.subregions && cases.byRegion}
                byDate={cases.byDate}
            />
        </div>

        {/*  */}

        <div className="Report__Block">
            <h2>Смерти</h2>

            { deaths.total > 0
                ? (
                    <React.Fragment>
                        <p>
                            Всего смертей: {formatNumber(deaths.total)} {
                                deaths.totalLastDate > 0 ? ' (+' + formatNumber(deaths.totalLastDate) + ' за предыдущие сутки)' : ' (новых смертей не зафиксировано)'
                            }
                        </p>

                        {
                            !props.reportFilter.subregion && (
                                <React.Fragment>
                                    { deaths.countRegionsLastDate > 0 && <p>
                                        Новые смерти зафиксированы в { deaths.countRegionsLastDate + ' '
                                            + declension(deaths.countRegionsLastDate, [
                                                'регионе', 'регионах', 'регионах'
                                            ]) } 
                                    </p> }

                                    <p>
                                        { props.subregions && (
                                            deaths.countRegions >= Object.entries(props.subregions).length
                                                ? 'За все время смерти зафиксированы во всех регионах'
                                                : 'За все время смерти зафиксированы в ' + deaths.countRegions + ' из ' + Object.entries(props.subregions).length + ' регионов'
                                        ) }
                                    </p>
                                </React.Fragment>
                            )
                        }
                    </React.Fragment>
                ) : (
                    <p>Смертей нет</p>
                ) }

            { <h3>Карта</h3> }
        </div>

        { <Map
            geojson={props.map}
            accessToken={props.mapAccessToken}
            regions={props.mapFilter.subregion
                ? { [props.mapFilter.subregion]: props.region }
                : props.subregions
            }
            zoomRegion={props.mapFilter.subregion}
            data={props.mapFilter.subregion
                ? { [props.mapFilter.subregion]: deaths.total }
                : deaths.byRegion.map
            }
            colors={[{
                    threshold: 0,
                    color: '#e6e6e6'
                },
                ...getColorThresholds(props.thresholds.deaths, '#ffc6c4', '#672044')
            ]}
            signValue={(value) => {
                return formatNumber(value) + ' ' + declension(value, ['смерть', 'смерти', 'смертей']);
            }}
        /> }

        <div className="Report__Block">
            <ReportTable
                name="deathsTable"
                valueColumn="Смертей"
                regions={props.subregions}
                byRegion={!props.reportFilter.subregion && props.subregions && deaths.byRegion}
                byDate={deaths.byDate}
            />
        </div>
    </div>;
}

function extractSource(sourceUrl: string): string {
    return (new URL(sourceUrl)).origin;
}

type StringMap = {
    [key in string]: number
};

function aggregateData(updatedOn: string, data: ReportVersion, subregion?: string): AggregatedReport {
    const sourceMap: StringMap = {};
    const byRegion: ReportRegions = {};
    const byDateSorted: ReportDateArray = [];
    const byDateMap: ReportDateMap = {};
    let total = 0;
    let lastDate: string = null;
    let earlerDate: string = null;

    for (let date in data) {
        if (subregion && !data[date].regions[subregion]) {
            continue;
        }

        if (!lastDate) {
            lastDate = date;
        } else if (date > lastDate) {
            lastDate = date;
        }

        if (!earlerDate) {
            earlerDate = date;
        } else if (date < earlerDate) {
            earlerDate = date;
        }

        data[date].sourceUrls.forEach((sourceUrl) => {
            try {
                const source = extractSource(sourceUrl);
                if (!sourceMap[source]) {
                    sourceMap[source] = 0;
                }
                sourceMap[source]++;
            } catch (exception) {
                // skip invalid URLs
            }
        });

        let dateTotal = 0;
        for (let region in data[date].regions) {
            if (subregion && region != subregion) {
                continue;
            }

            if (!byRegion[region]) {
                byRegion[region] = 0;
            }
            const regionCasesAtDate = data[date].regions[region];
            byRegion[region] += regionCasesAtDate;
            total += regionCasesAtDate;
            dateTotal += regionCasesAtDate;
        }

        byDateMap[date] = {
            date,
            countAcc: 0,
            count: dateTotal,
            sources: [...data[date].sourceUrls]
        };
    }

    const byRegionSorted: ReportRegionsArray = [];
    for (const region in byRegion) {
        byRegionSorted.push({
            region: region,
            count: byRegion[region]
        });
    }

    let byRegionLastDate: ReportRegions = null;
    if (lastDate && lastDate == updatedOn) {
        if (!subregion) {
            byRegionLastDate = data[lastDate].regions;
        } else {
            byRegionLastDate = !data[lastDate].regions[subregion]
                ? {}
                : {
                    [subregion]: data[lastDate].regions[subregion]
                };
        }
    }

    let totalLastDate = 0;
    if (byRegionLastDate) {
        for (let region in byRegionLastDate) {
            totalLastDate += byRegionLastDate[region];
        }
    }

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

    let date = earlerDate;
    let prevDate = null;
    while (date <= updatedOn) {
        try {
            let parsed = parseDate(date, 'yyyy-MM-dd', new Date);
            if (byDateMap[date]) {
                byDateSorted.push(byDateMap[date]);
                prevDate = date;
            } else if (prevDate) {
                byDateSorted.push({
                    ...byDateMap[prevDate],
                    date: date,
                    count: 0,
                    sources: []
                });
            }
            date = formatDate(addDays(parsed, 1), 'yyyy-MM-dd');
        } catch {
            break;
        }
    }

    if (byDateSorted.length > 0) {
        byDateSorted[0].countAcc = byDateSorted[0].count;
        for (let i = 1; i < byDateSorted.length; i++) {
            byDateSorted[i].countAcc += byDateSorted[i].count + byDateSorted[i - 1].countAcc;
        }
    }

    byDateSorted.reverse();

    const byRegionSources: string[] = Object.entries(sourceMap)
        .sort((a, b) => {
            return b[1] - a[1];
        })
        .map(([source]) => {
            return source;
        });

    return {
        total,
        totalLastDate,
        countRegionsLastDate: byRegionLastDate ? Object.entries(byRegionLastDate).length : 0,
        countRegions: Object.entries(byRegion).length,
        byRegion: {
            map: byRegion,
            lastDateMap: byRegionLastDate,
            sorted: byRegionSorted,
            sources: byRegionSources
        },
        byDate: {
            sorted: byDateSorted
        }
    };
}

//

interface DateReportTableProps {
    valueColumn: string,
    sorted: ReportDateArray
}

function DateReportTable(props: DateReportTableProps) {
    let tableSourceIndex = 1;

    function buildDateItem(reportDate: ReportDate): TableItem {
        const parsedDate = parseDate(reportDate.date, 'yyyy-MM-dd', new Date);
            const dateString = parsedDate.getFullYear() == (new Date).getFullYear()
                ? formatDate(parsedDate, 'dd.MM')
                : formatDate(parsedDate, 'dd.MM.yyyy');

        return {
            label: dateString,
            values: [{
                quantity: reportDate.countAcc,
                quantityDesc: <React.Fragment>
                    {formatNumber(reportDate.countAcc)} {
                        reportDate.count > 0
                        ? ' (+' + formatNumber(reportDate.count) + ')'
                        : ''
                    } {
                        reportDate.sources.map((source, index) => {
                            return <sup key={index}><a href={source} target="_blank">{tableSourceIndex++}</a> </sup>;
                        })
                    }
                </React.Fragment>
            }]
        };
    }

    // hide same data
    const sortedItems: TableItem[] = [];
    let sameQuantity = 0;

    for (let i = props.sorted.length - 1; i >= 0; i--) {
        if (props.sorted[i].count == 0) {
            sameQuantity++
        } else {
            if (sameQuantity >= 2) {
                if (sameQuantity > 2) {
                    sortedItems.push('---');
                }
                sortedItems.push(buildDateItem(props.sorted[i + 1]));
            }
            sameQuantity = 0;
        }

        if (sameQuantity < 2) {
            sortedItems.push(buildDateItem(props.sorted[i]));
        }   
    }

    if (sameQuantity >= 2) {
        if (sameQuantity > 2) {
            sortedItems.push('---');
        }
        sortedItems.push(buildDateItem(props.sorted[0]));
    }

    sortedItems.reverse();

    return <Table
        header={[props.valueColumn]}
        items={sortedItems}
    />
}

interface RegionReportTableProps {
    valueColumn: string,
    regions: Regions,
    sorted: ReportRegionsArray,
    lastDateMap: ReportRegions,
    sources: string[],
}

function RegionReportTable(props: RegionReportTableProps) {
    return <Table
        header={[props.valueColumn]}
        items={props.sorted.map((byRegion) => {
            const { region, count } = byRegion;
            return {
                label: props.regions && props.regions[region]
                    ? props.regions[region].ru
                    : region,
                values: [
                    {
                        quantityDesc: formatNumber(count) + ' '
                            + (
                                props.lastDateMap && props.lastDateMap[region] ? ' (+' + formatNumber(props.lastDateMap[region]) + ')' : ''
                            ),
                        quantity: count
                    }
                ]
            };
        })}
        footer={props.sources.length > 0 && <React.Fragment>
            Данные: {props.sources.map((source, index) => {
                const url = new URL(source);
                return <React.Fragment key={index}>
                    {index > 0 && ', '}<a
                        href={source}
                        target="_blank"
                    >
                        {punycode.toUnicode(url.host)}
                    </a>
                </React.Fragment>;
            })}
        </React.Fragment>}
    />;
}

interface ReportTableProps {
    name: string
    valueColumn: string
    regions: Regions,
    byRegion?: {
        sorted: ReportRegionsArray,
        lastDateMap?: ReportRegions,
        sources: string[]
    }
    byDate?: {
        sorted: ReportDateArray,
    }
}

function ReportTable(props: ReportTableProps) {
    const [ dataGroups, setDataGroups ] = useState([]);
    const [ groupedBy, setGroupedBy ] = useState(null);

    useEffect(() => {
        const dataGroups: TextRadioGroupItem[] = [];

        if (props.byRegion) {
            dataGroups.push({
                caption: 'по регионам',
                value: 'byRegion'
            });
        }

        if (props.byDate) {
            dataGroups.push({
                caption: 'прогресс',
                value: 'byDate'
            });
        }

        setDataGroups(dataGroups);
        setGroupedBy(dataGroups.length > 0 ? dataGroups[0].value : null);
    }, [
        props.byRegion,
        props.byDate
    ]);

    return <div className="ReportTable">
        <h3 className="ReportTable__Header">
            {dataGroups.length != 1 ? 'Данные' : (
                dataGroups[0].value == 'byDate'
                    ? 'Прогресс'
                    : (
                        dataGroups[0].value == 'byRegion'
                            ? 'По регионам'
                            : 'Данные'
                    )
            )}
        </h3>

        <div className="ReportTable__Body">
            {dataGroups.length > 1 && <div className="ReportTable__Grouped">
                <TextRadioGroup
                    name={props.name + '_groupedBy'}
                    value={groupedBy}
                    items={dataGroups}
                    onChange={(value) => {
                        setGroupedBy(value);
                    }}
                />
            </div>}

            {groupedBy == 'byRegion' ? (
                <RegionReportTable
                    valueColumn={props.valueColumn}
                    lastDateMap={props.byRegion.lastDateMap}
                    sorted={props.byRegion.sorted}
                    regions={props.regions}
                    sources={props.byRegion.sources}
                />
            ) : (
                groupedBy == 'byDate' ? (
                    <DateReportTable
                        valueColumn={props.valueColumn}
                        sorted={props.byDate.sorted}

                    />
                ) : (
                    <Table
                        header={[props.valueColumn]}
                        items={[]}
                    />
                )
            )}
        </div>
    </div>;
}

//

type TableItemValue = {
    quantityDesc?: string | JSX.Element,
    quantity: number
};

type TableItem = {
    label: string | JSX.Element,
    values: TableItemValue[]
} | '---';

interface TableProps {
    labelHeader?: string,
    header?: string[],
    items: TableItem[],
    previewCount?: number
    footer?: JSX.Element
}

function Table(props: TableProps) {
    const [isExpanded, setExpanded] = useState(false);

    const itemsArray = isExpanded
        ? props.items
        : props.items.slice(0, 10);

    return <table className="Table">
        {props.header && <thead>
            <tr>
                <th className="Table__Label" key={0}>{props.labelHeader}</th>
                {props.header.map((headerCaption, index) => {
                    return <th className="Table__Value" key={index + 1}>{headerCaption}</th>;
                })}
            </tr>
        </thead> }

        <tbody>
            {props.items.length > 0 ? (
                <React.Fragment>
                    {itemsArray.map((item, index) => {
                        return item === '---' ? (
                            <tr key={index}>
                                <td colSpan={props.header.length + 1}>...</td>
                            </tr>
                        ) : <tr key={index}>
                            <td key={0}>{item.label}</td>
                            {item.values.map((value, index) => {
                                return <td key={index + 1}>
                                    {value.quantityDesc || value.quantity}
                                </td>;
                            })}
                        </tr>
                    })}

                    {props.items.length > 10 && <tr className="Table__ActionsRow">
                        <td colSpan={2} key={itemsArray.length}>
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
                    </tr>}
                </React.Fragment>
            ) : (
                <tr>
                    <td colSpan={props.header.length + 1}>Нет данных</td>
                </tr>
            )}
        </tbody>

        {props.footer && <tfoot>
            <tr>
                <td colSpan={props.header.length + 1}>
                    {props.footer}
                </td>
            </tr>
        </tfoot>}
    </table>;
}

//

interface TextRadioGroupItem {
    value: string,
    caption: string
}

interface TextRadioGroupProps {
    name: string,
    value: string,
    items: TextRadioGroupItem[],
    onChange?: (value: string) => void
}

function TextRadioGroup(props: TextRadioGroupProps) {
    return <div className="TextRadioGroup">
        {props.items.map((item, index) => {
            return <div
                key={index}
                className="TextRadioGroup__Item"
            >
                <TextRadio
                    checked={props.value == item.value}
                    name={props.name}
                    caption={item.caption}
                    value={item.value}
                    onSelect={() => {
                        props.onChange && props.onChange(props.items[index].value);
                    }}
                />
            </div>;
        })}
    </div>;
}

interface TextRadioProps {
    checked: boolean,
    caption: string,
    name: string,
    value: string,
    onSelect: () => void
}

let textRadioCounter = 0;

function TextRadio(props: TextRadioProps) {
    textRadioCounter++;
    const textRadioId = props.name + '_' + String(textRadioCounter);

    return <div className="TextRadio">
        <input
            checked={props.checked}
            className="TextRadio__Input"
            type="radio"
            id={textRadioId}
            name={props.name}
            value={props.value}
            onChange={props.onSelect}
        />
        <label
            htmlFor={textRadioId}
            className="TextRadio__Label"
        >{props.caption}</label>
    </div>;
}

function formatNumber(value: number) {
    const valueString = value.toFixed();
    const res = [];
    for (let i = valueString.length - 1, j = 1; i >=0; i--, j++) {
        res.push(valueString[i]);
        if (j % 3 == 0 && i != 0) {
            res.push(String.fromCharCode(8239));
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

    if (value >= 10 && value <= 20) {
        res = array[2];
    } else {
        if (value % 10 == 0) {
            res = array[2];
        } else if (value % 10 == 1) {
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