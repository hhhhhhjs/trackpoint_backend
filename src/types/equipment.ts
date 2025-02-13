interface equip {
    userid: string;
    os: string;
    browser: string;
    device_type: string;
    browser_language: string;
}


interface table_equip extends equip {
    eid?: number;
    create_at?: Date;
}

export {
    equip,
    table_equip,
}