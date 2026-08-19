import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import { ILogger } from '@theia/core/lib/common/logger';
import { generateUuid } from '@theia/core/lib/common/uuid';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import URI from '@theia/core/lib/common/uri';
import * as fs from 'fs';
import * as path from 'path';
import {
    HISTORY_LIMIT,
    Notification, NotificationClient, NotificationInput, NotificationService
} from '../common/notification-protocol';

const HISTORY_FILE_NAME = 'notification-center-history.json';

@injectable()
export class NotificationServiceImpl implements NotificationService {

    @inject(EnvVariablesServer)
    protected readonly envVariablesServer: EnvVariablesServer;

    @inject(ILogger)
    protected readonly logger: ILogger;

    protected readonly clients = new Set<NotificationClient>();
    protected history: Notification[] = [];
    protected storageFilePath: string | undefined;
    protected initialized: Promise<void>;

    @postConstruct()
    protected init(): void {
        this.initialized = this.loadHistory();
    }

    protected async loadHistory(): Promise<void> {
        try {
            const configDirUri = await this.envVariablesServer.getConfigDirUri();
            this.storageFilePath = path.join(new URI(configDirUri).path.fsPath(), HISTORY_FILE_NAME);
            const content = await fs.promises.readFile(this.storageFilePath, 'utf-8');
            const parsed: unknown = JSON.parse(content);

            if (Array.isArray(parsed)) {
                this.history = parsed.slice(-HISTORY_LIMIT);
            }
        } catch {
            this.history = [];
        }
    }

    protected async saveHistory(): Promise<void> {
        if (!this.storageFilePath) {
            return;
        }
        try {
            await fs.promises.mkdir(path.dirname(this.storageFilePath), { recursive: true });
            await fs.promises.writeFile(this.storageFilePath, JSON.stringify(this.history), 'utf-8');
        } catch (error) {
            this.logger.warn(`[notification-center] Failed to persist notification history: ${error}`);
        }
    }

    addClient(client: NotificationClient): void {
        this.clients.add(client);
    }

    removeClient(client: NotificationClient): void {
        this.clients.delete(client);
    }

    async push(input: NotificationInput): Promise<Notification> {
        await this.initialized;
        const notification: Notification = {
            ...input,
            id: generateUuid(),
            timestamp: Date.now()
        };
        this.history.push(notification);
        if (this.history.length > HISTORY_LIMIT) {
            this.history = this.history.slice(this.history.length - HISTORY_LIMIT);
        }
        this.broadcast(client => client.onNotification(notification));
        await this.saveHistory();
        return notification;
    }

    async getHistory(): Promise<Notification[]> {
        await this.initialized;
        return [...this.history];
    }

    async clearHistory(): Promise<void> {
        await this.initialized;
        this.history = [];
        this.broadcast(client => client.onHistoryCleared());
        await this.saveHistory();
    }

    async actionInvoked(notificationId: string, actionId: string): Promise<void> {
        this.logger.info(`[notification-center] Action '${actionId}' invoked on notification '${notificationId}'`);
    }

    protected broadcast(fn: (client: NotificationClient) => void): void {
        for (const client of this.clients) {
            try {
                fn(client);
            } catch (e) {
                this.logger.error(`[notification-center] Error while broadcasting: ${e}`);
            }
        }
    }
}
