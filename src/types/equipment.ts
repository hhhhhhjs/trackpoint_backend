interface equip {
    userid: string;
    os: string;
    browser: string;
    device_type: string;
    browser_language: string;
}


interface table_equip extends equip {
    eid?: number;
}

interface Instert_equip {
    fieldCount: number;
    affectedRows: number;
    insertId: number;
    info: string;
    serverStatus: number;
    warningStatus: number;
    changedRows: number;
}

export {
    equip,
    table_equip,
    Instert_equip
}