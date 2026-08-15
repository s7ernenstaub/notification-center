import { NotificationSeverity } from '../common/notification-protocol';

export function severityIconName(severity: NotificationSeverity): string {
    switch (severity) {
        case 'error':
            return 'error';
        case 'warning':
            return 'warning';
        case 'info':
        default:
            return 'info';
    }
}
