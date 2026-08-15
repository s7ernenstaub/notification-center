export const notificationServicePath = '/services/notification-center';

export type NotificationSeverity = 'info' | 'warning' | 'error';

export interface NotificationAction {
    readonly id: string;
    readonly label: string;
}

export interface Notification {
    readonly id: string;
    readonly severity: NotificationSeverity;
    readonly title: string;
    readonly message: string;
    readonly timestamp: number;
    readonly actions?: NotificationAction[];
}

export type NotificationInput = Omit<Notification, 'id' | 'timestamp'>;

export const NotificationClient = Symbol('NotificationClient');
export interface NotificationClient {
    /**
     * Вызывается backend'ом при публикации нового уведомления
     */
    onNotification(notification: Notification): void;
    /**
     * Вызывается backend'ом при очистке истории
     */
    onHistoryCleared(): void;
}

export const NotificationService = Symbol('NotificationService');
export interface NotificationService {
    /**
     * Публикует новое уведомление
     */
    push(notification: NotificationInput): Promise<Notification>;
    /**
     * Возвращает последние 100 уведомлений в хронологическом порядке
     */
    getHistory(): Promise<Notification[]>;
    /**
     * Очищает историю уведомлений
     */
    clearHistory(): Promise<void>;
    /**
     * Сообщает, что пользователь вызвал действие на уведомлении
     */
    actionInvoked(notificationId: string, actionId: string): Promise<void>;
}
