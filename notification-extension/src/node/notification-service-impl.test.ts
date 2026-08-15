import 'reflect-metadata';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Container, ContainerModule } from '@theia/core/shared/inversify';
import { ILogger } from '@theia/core/lib/common/logger';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import { NotificationClient, NotificationInput } from '../common/notification-protocol';
import { NotificationServiceImpl } from './notification-service-impl';

async function createService(configDir: string): Promise<NotificationServiceImpl> {
    const container = new Container();
    container.load(new ContainerModule(bind => {
        bind(EnvVariablesServer).toConstantValue({
            getConfigDirUri: async () => `file://${configDir}`
        } as unknown as EnvVariablesServer);
        bind(ILogger).toConstantValue({ warn: () => { }, info: () => { }, error: () => { } } as unknown as ILogger);
        bind(NotificationServiceImpl).toSelf().inSingletonScope();
    }));

    const service = container.get(NotificationServiceImpl);
    // postConstruct запускает loadHistory(), не дожидаясь её. Делаем тик, чтобы она успела отработать
    await new Promise(resolve => setTimeout(resolve, 0));
    return service;
}

const sample: NotificationInput = { severity: 'info', title: 'Build', message: 'Build finished' };

describe('NotificationServiceImpl', () => {
    let tmpDir: string;
    let service: NotificationServiceImpl;

    beforeEach(async () => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'notification-center-test-'));
        service = await createService(tmpDir);
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('assigns an id and timestamp when pushing a notification', async () => {
        const notification = await service.push(sample);
        expect(notification.id).toBeTruthy();
        expect(typeof notification.timestamp).toBe('number');
        expect(notification.title).toBe('Build');
    });

    it('broadcasts pushed notifications to every registered client', async () => {
        const received: unknown[] = [];
        service.addClient({ onNotification: n => received.push(n), onHistoryCleared: () => { } });

        const notification = await service.push(sample);

        expect(received).toEqual([notification]);
    });

    it('does not notify a removed client', async () => {
        const received: unknown[] = [];
        const client: NotificationClient = { onNotification: n => received.push(n), onHistoryCleared: () => { } };
        service.addClient(client);
        service.removeClient(client);

        await service.push(sample);

        expect(received).toHaveLength(0);
    });

    it('returns history in chronological order', async () => {
        const first = await service.push({ ...sample, title: 'First' });
        const second = await service.push({ ...sample, title: 'Second' });

        const history = await service.getHistory();

        expect(history.map(n => n.id)).toEqual([first.id, second.id]);
    });

    it('evicts the oldest entries once the history exceeds 100 notifications', async () => {
        for (let i = 0; i < 105; i++) {
            await service.push({ ...sample, title: `Notification ${i}` });
        }

        const history = await service.getHistory();

        expect(history).toHaveLength(100);
        expect(history[0].title).toBe('Notification 5');
        expect(history[99].title).toBe('Notification 104');
    });

    it('clears the history and notifies clients', async () => {
        await service.push(sample);
        let cleared = false;
        service.addClient({ onNotification: () => { }, onHistoryCleared: () => { cleared = true; } });

        await service.clearHistory();

        expect(await service.getHistory()).toHaveLength(0);
        expect(cleared).toBe(true);
    });

    it('saves the history to disk and reloads it on the next start', async () => {
        await service.push(sample);

        const restarted = await createService(tmpDir);
        const history = await restarted.getHistory();

        expect(history).toHaveLength(1);
        expect(history[0].title).toBe('Build');
    });

    it('resolves actionInvoked without throwing for any notification/action id', async () => {
        await expect(service.actionInvoked('some-id', 'retry')).resolves.toBeUndefined();
    });
});
