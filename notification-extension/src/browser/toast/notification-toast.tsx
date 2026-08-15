import * as React from '@theia/core/shared/react';
import { codicon } from '@theia/core/lib/browser/widgets/widget';
import { Notification } from '../../common/notification-protocol';
import { severityIconName } from '../notification-icons';

export interface NotificationToastProps {
    readonly notification: Notification;
    readonly closing: boolean;
    readonly onClose: (id: string) => void;
    readonly onAction: (notificationId: string, actionId: string) => void;
}

export function NotificationToast(props: NotificationToastProps): React.ReactElement {
    const { notification, closing, onClose, onAction } = props;
    return (
        <div className={`nc-toast nc-severity-${notification.severity} ${closing ? 'nc-toast-closing' : 'nc-toast-open'}`}>
            <div className={`nc-toast-icon ${codicon(severityIconName(notification.severity))}`} />
            <div className='nc-toast-content'>
                <div className='nc-toast-title'>{notification.title}</div>
                <div className='nc-toast-message'>{notification.message}</div>
                {!!notification.actions?.length && (
                    <div className='nc-toast-actions'>
                        {notification.actions.map(action => (
                            <button
                                key={action.id}
                                className='theia-button secondary nc-toast-action'
                                onClick={() => onAction(notification.id, action.id)}
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <div
                className={`nc-toast-close ${codicon('close')}`}
                title='Dismiss'
                onClick={() => onClose(notification.id)}
            />
        </div>
    );
}
