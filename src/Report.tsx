import React, { useState } from 'react';
import chroma from 'chroma-js';
import { GeoJSON } from 'geojson';
import formatDate from 'date-fns/format';
import parseDate from 'date-fns/parse';
import addDays from 'date-fns/addDays';
import dateRuLocale from 'date-fns/locale/ru';

import {
    RussiaRegions,
    Report,
    ReportVersion,
    ReportRegions,
    ReportRegionsArray,
    ReportDateArray,
    ReportDate,
    ReportDateMap
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
    byDateSorted: ReportDateArray,
    lastDate: string,
    totalLastDate: number,
    byRegionLastDate: ReportRegions
    sources: string[]
}

export default function(props: ReportProps) {
    const casesAggregated = aggregateData(props.data.updatedOn, props.data.cases);
    const deathsAggregated = aggregateData(props.data.updatedOn, props.data.deaths);

    return <div className="Report">
        <header className="Report__Header">
            <h1>
                COVID-19 в России
            </h1>
        </header>
        <div className="Report__Block">
            <p>Данные на {buildDate(props.data.updatedOn)}</p>

            <h2>Подтвержденные случаи</h2>

            { casesAggregated.total > 0
                ? (
                    <React.Fragment>
                        <p>
                            Всего случаев: {formatNumber(casesAggregated.total)} {
                                casesAggregated.lastDate ? (
                                    casesAggregated.lastDate == props.data.updatedOn ? ' (+' + formatNumber(casesAggregated.totalLastDate) + ' за предыдущие сутки)' : ' (новых случаев не зафиксировано)'
                                ) : ''
                            }
                        </p>

                        <p>
                            { casesAggregated.byRegionSorted.length == Object.entries(props.regions).length
                                ? 'Случаи зафиксированы во всех регионах'
                                : 'Случаи зафиксированы в ' + casesAggregated.byRegionSorted.length + ' из ' + Object.entries(props.regions).length + ' регионов' }
                        </p>
                    </React.Fragment>
                ) : (
                    <p>Случаев не зафиксировано</p>
                ) }

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
                name="casesTable"
                valueColumn="Случаев"
                regions={props.regions}
                byRegionLastDate={casesAggregated.lastDate && casesAggregated.lastDate == props.data.updatedOn
                    ? casesAggregated.byRegionLastDate
                    : null}
                byRegionSorted={casesAggregated.byRegionSorted}
                byDateSorted={casesAggregated.byDateSorted}
                sources={casesAggregated.sources}
            />
        </div>

        {/*  */}

        <div className="Report__Block">
            <h2>Смерти</h2>

            { casesAggregated.total > 0
                ? (
                    <React.Fragment>
                        <p>
                            Всего смертей: {formatNumber(deathsAggregated.total)} {
                                deathsAggregated.lastDate ? (
                                    deathsAggregated.lastDate == props.data.updatedOn ? ' (+' + formatNumber(deathsAggregated.totalLastDate) + ' за предыдущие сутки)' : ' (новых смертей не зафиксировано)'
                                ) : ''
                            }
                        </p>

                        <p>
                            { deathsAggregated.byRegionSorted.length == Object.entries(props.regions).length
                                ? 'Смерти зафиксированы во всех регионах России'
                                : 'Смерти зафиксированы в ' + deathsAggregated.byRegionSorted.length + ' из ' + Object.entries(props.regions).length + ' регионов' }
                        </p>
                    </React.Fragment>
                ) : (
                    <p>Смертей нет</p>
                ) }

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
                name="deathsTable"
                valueColumn="Смертей"
                regions={props.regions}
                byRegionLastDate={deathsAggregated.lastDate && deathsAggregated.lastDate == props.data.updatedOn
                    ? deathsAggregated.byRegionLastDate
                    : null}
                byRegionSorted={deathsAggregated.byRegionSorted}
                byDateSorted={deathsAggregated.byDateSorted}
                sources={deathsAggregated.sources}
            />
        </div>
    </div>;
}

interface ReportTableProps {
    name: string
    caption?: string
    valueColumn?: string
    regions: RussiaRegions,
    byRegionSorted: ReportRegionsArray,
    byRegionLastDate: ReportRegions,
    byDateSorted: ReportDateArray,
    sources: string[]
}

function ReportTable(props: ReportTableProps) {
    const [groupedBy, setGroupedBy] = useState('byRegion');

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
                            return <sup key={index}>
                                <a href={source} target="_blank">{tableSourceIndex++}</a>
                            </sup>;
                        })
                    }
                </React.Fragment>
            }]
        };
    }

    const byDateSortedItems: TableItem[] = [];
    let sameQuantity = 0;

    props.byDateSorted.forEach((byDateSorted, index) => {
        if (byDateSorted.count == 0) {
            sameQuantity++
        } else {
            if (sameQuantity >= 2) {
                if (sameQuantity > 2) {
                    byDateSortedItems.push('---');
                }
                byDateSortedItems.push(buildDateItem(props.byDateSorted[index - 1]));
            }
            sameQuantity = 0;
        }

        if (sameQuantity < 2) {
            byDateSortedItems.push(buildDateItem(byDateSorted));
        }
    });

    return <div className="ReportTable">
        <h3 className="ReportTable__Header">{props.caption || 'Таблица'}</h3>

        <div className="ReportTable__Body">
            <div className="ReportTable__Grouped">
                <div className="ReportTable__GroupedItem">
                    <TextRadio
                        checked={groupedBy == 'byRegion'}
                        name={props.name + '_groupedBy'}
                        caption="по регионам"
                        value="byRegion"
                        onSelect={() => {
                            setGroupedBy('byRegion');
                        }}
                    />
                </div>
                <div className="ReportTable__GroupedItem">
                    <TextRadio
                        checked={groupedBy == 'byDate'}
                        name={props.name + '_groupedBy'}
                        caption="по дате"
                        value="byDate"
                        onSelect={() => {
                            setGroupedBy('byDate');
                        }}
                    />
                </div>
            </div>

            {groupedBy == 'byRegion' ? (
                <Table
                    header={[props.valueColumn]}
                    items={props.byRegionSorted.map((byRegion) => {
                        const { region, count } = byRegion;
                        return {
                            label: props.regions[region] ? props.regions[region].ru : region,
                            values: [
                                {
                                    quantityDesc: formatNumber(count) + ' '
                                        + (
                                            props.byRegionLastDate && props.byRegionLastDate[region] ? ' (+' + formatNumber(props.byRegionLastDate[region]) + ')' : ''
                                        ),
                                    quantity: count
                                }
                            ]
                        };
                    })}
                    footer={<React.Fragment>
                        Данные: {props.sources.map((source, index) => {
                            const url = new URL(source);
                            return <React.Fragment key={index}>
                                {index > 0 && ', '}<a
                                    href={source}
                                    target="_blank"
                                >
                                    {url.host}
                                </a>
                            </React.Fragment>;
                        })}
                    </React.Fragment>}
                />
            ) : (
                <Table
                    header={[props.valueColumn]}
                    items={byDateSortedItems}
                />
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

function extractSource(sourceUrl: string): string {
    const url = (new URL(sourceUrl));
    return url.origin;
}

type StringMap = {
    [key in string]: number
};

function aggregateData(updatedOn: string, data: ReportVersion): AggregatedReport {
    const sourceMap: StringMap = {};
    const byRegion: ReportRegions = {};
    const byDateSorted: ReportDateArray = [];
    const byDateMap: ReportDateMap = {};
    let total = 0;
    let lastDate: string = null;
    let earlerDate: string = null;

    for (let date in data) {
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

        let dateTotal = 0;

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
            dateTotal += regionCasesAtDate;
        }

        byDateMap[date] = {
            date,
            countAcc: 0,
            count: dateTotal,
            sources: [...data[date].sourceUrls]
        };

        // byDateSorted.push({
        //     date,
        //     countAcc: dateTotal,
        //     count: dateTotal,
        //     sources: [...data[date].sourceUrls]
        // });
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


    // byDateSorted.sort((a, b) => {
    //     return a.date > b.date ? -1 : 1;
    // });

    byDateSorted.reverse();

    // for (let i = byDateSorted.length - 2; i >= 0; i--) {
    //     byDateSorted[i].countAcc += byDateSorted[i + 1].countAcc;
    // }

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
        byDateSorted,
        lastDate,
        totalLastDate,
        byRegionLastDate,
        sources
    };
}