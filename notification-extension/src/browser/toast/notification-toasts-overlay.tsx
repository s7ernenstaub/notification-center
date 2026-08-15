import * as React from '@theia/core/shared/react';
import { DisposableCollection } from '@theia/core/lib/common/disposable';
import { Notification } from '../../common/notification-protocol';
import { NotificationManager } from '../notification-manager';
import { NotificationToast } from './notification-toast';

export interface NotificationToastsOverlayProps {
    readonly manager: NotificationManager;
}

interface ToastEntry {
    readonly notification: Notification;
    closing: boolean;
}

const AUTO_DISMISS_MS = 5000;
const CLOSE_ANIMATION_MS = 250;
const MAX_VISIBLE_TOASTS = 4;

export class NotificationToastsOverlay extends React.Component<NotificationToastsOverlayProps, { toasts: ToastEntry[] }> {

    protected readonly toDispose = new DisposableCollection();
    protected readonly autoDismissTimers = new Map<string, ReturnType<typeof setTimeout>>();
    protected readonly removalTimers = new Map<string, ReturnType<typeof setTimeout>>();

    constructor(props: NotificationToastsOverlayProps) {
        super(props);
        this.state = { toasts: [] };
    }

    override componentDidMount(): void {
        this.toDispose.push(this.props.manager.onNewNotification(notification => this.show(notification)));
    }

    override componentWillUnmount(): void {
        this.toDispose.dispose();

        for (const timer of this.autoDismissTimers.values()) {
            clearTimeout(timer);
        }

        for (const timer of this.removalTimers.values()) {
            clearTimeout(timer);
        }
    }

    protected show(notification: Notification): void {
        this.setState(state => ({
            toasts: [...state.toasts, { notification, closing: false }].slice(-MAX_VISIBLE_TOASTS)
        }));

        if (notification.severity !== 'error') {
            const timer = setTimeout(() => this.dismiss(notification.id), AUTO_DISMISS_MS);
            this.autoDismissTimers.set(notification.id, timer);
        }
    }

    protected dismiss = (id: string): void => {
        const autoTimer = this.autoDismissTimers.get(id);
        if (autoTimer) {
            clearTimeout(autoTimer);
            this.autoDismissTimers.delete(id);
        }
        this.setState(state => ({
            toasts: state.toasts.map(toast => toast.notification.id === id ? { ...toast, closing: true } : toast)
        }));
        const removalTimer = setTimeout(() => {
            this.removalTimers.delete(id);
            this.setState(state => ({
                toasts: state.toasts.filter(toast => toast.notification.id !== id)
            }));
        }, CLOSE_ANIMATION_MS);
        this.removalTimers.set(id, removalTimer);
    };

    protected onAction = (notificationId: string, actionId: string): void => {
        this.props.manager.invokeAction(notificationId, actionId);
        this.dismiss(notificationId);
    };

    override render(): React.ReactNode {
        return (
            <div className='nc-toasts-container'>
                {this.state.toasts.map(toast => (
                    <NotificationToast
                        key={toast.notification.id}
                        notification={toast.notification}
                        closing={toast.closing}
                        onClose={this.dismiss}
                        onAction={this.onAction}
                    />
                ))}
            </div>
        );
    }

}
