type EventData = {
    userid: string;
    eventType: string;
    timestamp: number;
    event_data: {
        elementText: string;
        elementTag: string;
    };
    page_url: string;
    count?: number;
};

function consolidateEvents(events: EventData[]): EventData[] {
    const result: EventData[] = [];
    const eventMap = new Map<string, EventData>();

    events.forEach(event => {
        const key = `${event.userid}-${event.eventType}-${event.event_data.elementText}-${event.event_data.elementTag}-${event.page_url}`;

        if (eventMap.has(key)) {
            const existingEvent = eventMap.get(key)!;
            existingEvent.timestamp = Math.max(existingEvent.timestamp, event.timestamp); // 保留最新的时间戳
            // existingEvent.event_data = event.event_data; // 更新事件数据
            existingEvent.count = (existingEvent.count || 1) + 1; // 增加计数
        } else {
            eventMap.set(key, { ...event, count: 1 }); // 新元素加入，并初始化计数为1
        }
    });

    // 将map中的值转化为数组并返回
    eventMap.forEach(value => result.push(value));
    return result;
}

export {
    consolidateEvents
}