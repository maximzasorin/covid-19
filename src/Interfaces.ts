export type RussiaRegionIso3166 = 'RU-AD'
    | 'RU-AL'
    | 'RU-ALT'
    | 'RU-AMU'
    | 'RU-ARK'
    | 'RU-AST'
    | 'RU-BA'
    | 'RU-BEL'
    | 'RU-BRY'
    | 'RU-BU'
    | 'RU-CE'
    | 'RU-CHE'
    | 'RU-CHU'
    | 'RU-CU'
    | 'RU-DA'
    | 'RU-YEV'
    | 'RU-KHA'
    | 'RU-KK'
    | 'RU-KHM'
    | 'RU-IN'
    | 'RU-IRK'
    | 'RU-IVA'
    | 'RU-YAN'
    | 'RU-YAR'
    | 'RU-KB'
    | 'RU-KGD'
    | 'RU-KL'
    | 'RU-KLU'
    | 'RU-KAM'
    | 'RU-KC'
    | 'RU-KR'
    | 'RU-KEM'
    | 'RU-KIR'
    | 'RU-KO'
    | 'RU-KOS'
    | 'RU-KDA'
    | 'RU-KYA'
    | 'RU-KGN'
    | 'RU-KRS'
    | 'RU-LEN'
    | 'RU-LIP'
    | 'RU-MAG'
    | 'RU-ME'
    | 'RU-MO'
    | 'RU-MOS'
    | 'RU-MOW'
    | 'RU-MUR'
    | 'RU-NEN'
    | 'RU-NIZ'
    | 'RU-NGR'
    | 'RU-NVS'
    | 'RU-OMS'
    | 'RU-ORE'
    | 'RU-ORL'
    | 'RU-PNZ'
    | 'RU-PER'
    | 'RU-PRI'
    | 'RU-PSK'
    | 'RU-RYA'
    | 'RU-ROS'
    | 'RU-SA'
    | 'RU-SAK'
    | 'RU-SAM'
    | 'RU-SPE'
    | 'RU-SAR'
    | 'RU-SE'
    | 'RU-SMO'
    | 'RU-STA'
    | 'RU-SVE'
    | 'RU-TAM'
    | 'RU-TA'
    | 'RU-TYU'
    | 'RU-TOM'
    | 'RU-TUL'
    | 'RU-TVE'
    | 'RU-TY'
    | 'RU-UD'
    | 'RU-ULY'
    | 'RU-VLA'
    | 'RU-VGG'
    | 'RU-VLG'
    | 'RU-VOR'
    | 'RU-ZAB'
    | 'UA-40'
    | 'UA-43';

export type RussiaRegions = {
    [key in RussiaRegionIso3166]: {
        ru: string
    }
};

export type ReportRegions = {
    [key in RussiaRegionIso3166]?: number
};

export type ReportRegionsArray = {
    region: RussiaRegionIso3166,
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

export type ReportVersion = {
    [key in string]: {
        sourceUrls: string[],
        regions: ReportRegions
    }
};

export interface Report {
    updatedOn: string,
    cases: ReportVersion,
    deaths: ReportVersion
}