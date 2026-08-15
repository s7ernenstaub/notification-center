import { Notification } from '../common/notification-protocol';

export function formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    const pad = (value: number): string => value.toString().padStart(2, '0');
    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export type DateGroup = 'today' | 'yesterday' | 'earlier';

export const DATE_GROUP_LABELS: Record<DateGroup, string> = {
    today: 'Today',
    yesterday: 'Yesterday',
    earlier: 'Earlier'
};

export function getDateGroup(timestamp: number, now: Date = new Date()): DateGroup {
    const date = new Date(timestamp);
    const startOfDay = (d: Date): number => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

    const dayStart = startOfDay(date);
    const todayStart = startOfDay(now);
    const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;

    if (dayStart === todayStart) {
        return 'today';
    }
    if (dayStart === yesterdayStart) {
        return 'yesterday';
    }
    return 'earlier';
}

export interface NotificationGroup {
    readonly group: DateGroup;
    readonly notifications: Notification[];
}

/**
 * Группирует уведомления по дате (Сегодня / Вчера / Раньше), сохраняя
 * порядок от новых к старым внутри групп и между ними
 */
export function groupByDate(notifications: ReadonlyArray<Notification>, now: Date = new Date()): NotificationGroup[] {
    const order: DateGroup[] = ['today', 'yesterday', 'earlier'];
    const buckets = new Map<DateGroup, Notification[]>();

    for (const notification of notifications) {
        const group = getDateGroup(notification.timestamp, now);
        const bucket = buckets.get(group);

        if (bucket) {
            bucket.push(notification);
        } else {
            buckets.set(group, [notification]);
        }
    }

    return order
        .filter(group => buckets.has(group))
        .map(group => ({ group, notifications: buckets.get(group)! }));
}
