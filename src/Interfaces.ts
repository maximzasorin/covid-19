// Meta
export type Thresholds = {
    cases: number[],
    deaths: number[]
};

export interface Meta {
    maps: string[],
    reports: string[],
    regions: string[],
    thresholds: {
        [key in string]: Thresholds
    },
    notes: {
        [key in string]: {
            ru: string
        }
    }
}

// Region
export interface Region {
    ru: string,
    ru6: string,
    ruSortable: string
}

export type Regions = {
    [key in string]: Region
};

// Report
export type ReportRegions = {
    [key in string]?: number
};

export type ReportVersion = {
    [key in string]: {
        sourceUrls: string[],
        regions: ReportRegions
    }
};

export interface ReportData {
    updatedOn: string,
    cases: ReportVersion,
    deaths: ReportVersion
}

// Aggregated
export type ReportRegionsArray = {
    region: string,
    count: number
}[];

export type ReportDate = {
    date: string,
    sources: string[],
    countAcc: number,
    count: number
};

export type ReportDateArray = ReportDate[];

export type ReportDateMap = {
    [key in string]: ReportDate
};

export interface AggregatedByRegion {
    map: ReportRegions,
    lastDateMap?: ReportRegions,
    sorted: ReportRegionsArray,
    sources: string[]
}

export interface AggregatedByDate {
    sorted: ReportDateArray
}

export interface AggregatedReport {
    total: number,
    totalLastDate: number,
    countRegions: number,
    countRegionsLastDate: number,
    byRegion: AggregatedByRegion,
    byDate: AggregatedByDate
}

// Shared props
export interface MapFilter {
    subregion?: string
}

export interface ReportFilter {
    subregion?: string,
    date?: string
}