import { ContainerModule } from '@theia/core/shared/inversify';
import { ConnectionHandler, RpcConnectionHandler } from '@theia/core/lib/common';
import { NotificationClient, NotificationService, notificationServicePath } from '../common/notification-protocol';
import { NotificationServiceImpl } from './notification-service-impl';

export default new ContainerModule(bind => {
    bind(NotificationServiceImpl).toSelf().inSingletonScope();
    bind(NotificationService).toService(NotificationServiceImpl);
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler<NotificationClient>(notificationServicePath, client => {
            const service = ctx.container.get(NotificationServiceImpl);
            service.addClient(client);
            client.onDidCloseConnection(() => service.removeClient(client));
            return service;
        })
    ).inSingletonScope();
});
