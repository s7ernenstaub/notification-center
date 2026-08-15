import { injectable } from '@theia/core/shared/inversify';
import { Emitter, Event } from '@theia/core/lib/common/event';
import { Notification, NotificationClient } from '../common/notification-protocol';

/**
 * Превращает RPC-колбэки NotificationClient, вызываемые backend'ом в локальные события Theia
 */
@injectable()
export class NotificationWatcher {

    protected readonly onNotificationEmitter = new Emitter<Notification>();
    protected readonly onHistoryClearedEmitter = new Emitter<void>();

    getNotificationClient(): NotificationClient {
        const onNotificationEmitter = this.onNotificationEmitter;
        const onHistoryClearedEmitter = this.onHistoryClearedEmitter;
        return {
            onNotification(notification: Notification): void {
                onNotificationEmitter.fire(notification);
            },
            onHistoryCleared(): void {
                onHistoryClearedEmitter.fire();
            }
        };
    }

    get onNotification(): Event<Notification> {
        return this.onNotificationEmitter.event;
    }

    get onHistoryCleared(): Event<void> {
        return this.onHistoryClearedEmitter.event;
    }

}
