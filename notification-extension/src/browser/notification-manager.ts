import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import { Emitter, Event } from '@theia/core/lib/common/event';
import { Notification, NotificationInput, NotificationService } from '../common/notification-protocol';
import { NotificationWatcher } from './notification-watcher';

export const HISTORY_LIMIT = 100;

/**
 * Фронтенд-фасад над RPC-прокси `NotificationService`.
 * Хранит актуальную копию истории уведомлений и
 * предоставляет события, на которые подписываются toast-overlay и виджет панели истории.
 */
@injectable()
export class NotificationManager {

    @inject(NotificationService)
    protected readonly notificationService: NotificationService;

    @inject(NotificationWatcher)
    protected readonly watcher: NotificationWatcher;

    protected readonly onNewNotificationEmitter = new Emitter<Notification>();
    /** Срабатывает для каждого уведомления сразу по прибытии — используется для показа toast'ов */
    readonly onNewNotification: Event<Notification> = this.onNewNotificationEmitter.event;

    protected readonly onDidChangeHistoryEmitter = new Emitter<ReadonlyArray<Notification>>();
    /** Срабатывает при любом изменении истории (новое уведомление или её очистка) */
    readonly onDidChangeHistory: Event<ReadonlyArray<Notification>> = this.onDidChangeHistoryEmitter.event;

    protected _history: Notification[] = [];
    get history(): ReadonlyArray<Notification> {
        return this._history;
    }

    @postConstruct()
    protected init(): void {
        this.watcher.onNotification(notification => this.handleNotification(notification));
        this.watcher.onHistoryCleared(() => this.handleHistoryCleared());
        this.notificationService.getHistory().then(history => {
            this._history = history;
            this.onDidChangeHistoryEmitter.fire(this._history);
        }).catch(() => {});
    }

    protected handleNotification(notification: Notification): void {
        this._history = [...this._history, notification].slice(-HISTORY_LIMIT);
        this.onDidChangeHistoryEmitter.fire(this._history);
        this.onNewNotificationEmitter.fire(notification);
    }

    protected handleHistoryCleared(): void {
        this._history = [];
        this.onDidChangeHistoryEmitter.fire(this._history);
    }

    push(notification: NotificationInput): Promise<Notification> {
        return this.notificationService.push(notification);
    }

    invokeAction(notificationId: string, actionId: string): Promise<void> {
        return this.notificationService.actionInvoked(notificationId, actionId);
    }

    clearHistory(): Promise<void> {
        return this.notificationService.clearHistory();
    }
}
