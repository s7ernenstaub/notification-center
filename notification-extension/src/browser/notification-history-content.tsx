import * as React from '@theia/core/shared/react';
import { codicon } from '@theia/core/lib/browser/widgets/widget';
import { Notification, NotificationSeverity } from '../common/notification-protocol';
import { NotificationManager } from './notification-manager';
import { severityIconName } from './notification-icons';
import { DATE_GROUP_LABELS, formatTime, groupByDate } from './notification-utils';

export interface NotificationHistoryContentProps {
    readonly manager: NotificationManager;
}

type SeverityFilter = Record<NotificationSeverity, boolean>;

const SEVERITIES: NotificationSeverity[] = ['info', 'warning', 'error'];
const SEVERITY_LABELS: Record<NotificationSeverity, string> = {
    info: 'Info',
    warning: 'Warning',
    error: 'Error'
};

export function NotificationHistoryContent(props: NotificationHistoryContentProps): React.ReactElement {
    const { manager } = props;
    const [history, setHistory] = React.useState<ReadonlyArray<Notification>>(manager.history);
    const [filters, setFilters] = React.useState<SeverityFilter>({ info: true, warning: true, error: true });
    const [expandedId, setExpandedId] = React.useState<string | undefined>(undefined);

    React.useEffect(() => {
        const disposable = manager.onDidChangeHistory(next => setHistory(next));
        return () => disposable.dispose();
    }, [manager]);

    const toggleFilter = (severity: NotificationSeverity): void => {
        setFilters(current => ({ ...current, [severity]: !current[severity] }));
    };

    const toggleExpanded = (id: string): void => {
        setExpandedId(current => current === id ? undefined : id);
    };

    const onAction = (notificationId: string, actionId: string): void => {
        manager.invokeAction(notificationId, actionId);
    };

    const filtered = history.filter(n => filters[n.severity]);
    // Сначала самые новые
    const displayed = [...filtered].reverse();
    const groups = groupByDate(displayed);

    return (
        <div className='nc-panel'>
            <div className='nc-toolbar'>
                <div className='nc-filters'>
                    {SEVERITIES.map(severity => (
                        <label key={severity} className={`nc-filter nc-filter-${severity}`}>
                            <input
                                type='checkbox'
                                checked={filters[severity]}
                                onChange={() => toggleFilter(severity)}
                            />
                            <span className={`nc-filter-icon ${codicon(severityIconName(severity))}`} />
                            {SEVERITY_LABELS[severity]}
                        </label>
                    ))}
                </div>
                <button
                    className='theia-button secondary nc-clear-all'
                    disabled={history.length === 0}
                    onClick={() => manager.clearHistory()}
                >
                    Clear all
                </button>
            </div>
            <div className='nc-list'>
                {groups.length === 0 && (
                    <div className='nc-empty'>No notifications</div>
                )}
                {groups.map(({ group, notifications }) => (
                    <div key={group} className='nc-group'>
                        <div className='nc-group-header'>{DATE_GROUP_LABELS[group]}</div>
                        {notifications.map(notification => (
                            <NotificationListItem
                                key={notification.id}
                                notification={notification}
                                expanded={expandedId === notification.id}
                                onToggle={() => toggleExpanded(notification.id)}
                                onAction={actionId => onAction(notification.id, actionId)}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

interface NotificationListItemProps {
    readonly notification: Notification;
    readonly expanded: boolean;
    readonly onToggle: () => void;
    readonly onAction: (actionId: string) => void;
}

function NotificationListItem(props: NotificationListItemProps): React.ReactElement {
    const { notification, expanded, onToggle, onAction } = props;
    const hasActions = !!notification.actions?.length;

    return (
        <div
            className={`nc-item nc-severity-${notification.severity} ${hasActions ? 'nc-item-clickable' : ''}`}
            onClick={hasActions ? onToggle : undefined}
        >
            <div className='nc-item-row'>
                <div className={`nc-item-icon ${codicon(severityIconName(notification.severity))}`} />
                <div className='nc-item-main'>
                    <div className='nc-item-title'>{notification.title}</div>
                    <div className='nc-item-message'>{notification.message}</div>
                </div>
                <div className='nc-item-time'>{formatTime(notification.timestamp)}</div>
                {hasActions && (
                    <div className={`nc-item-expand ${codicon(expanded ? 'chevron-up' : 'chevron-down')}`} />
                )}
            </div>
            {hasActions && expanded && (
                <div className='nc-item-actions'>
                    {notification.actions!.map(action => (
                        <button
                            key={action.id}
                            className='theia-button secondary'
                            onClick={event => { event.stopPropagation(); onAction(action.id); }}
                        >
                            {action.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
