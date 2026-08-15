import { ContainerModule } from '@theia/core/shared/inversify';
import { NotificationExtensionWidget } from './notification-extension-widget';
import { NotificationExtensionContribution } from './notification-extension-contribution';
import { bindViewContribution, FrontendApplicationContribution, WebSocketConnectionProvider, WidgetFactory } from '@theia/core/lib/browser';
import { NotificationService, notificationServicePath } from '../common/notification-protocol';
import { NotificationWatcher } from './notification-watcher';
import { NotificationManager } from './notification-manager';
import { NotificationToastsRenderer } from './toast/notification-toasts-renderer';

import '../../src/browser/style/vars.css';
import '../../src/browser/style/panel.css';
import '../../src/browser/style/toast.css';

export default new ContainerModule(bind => {
    bind(NotificationWatcher).toSelf().inSingletonScope();
    bind(NotificationService).toDynamicValue(ctx => {
        const watcher = ctx.container.get(NotificationWatcher);
        const connection = ctx.container.get(WebSocketConnectionProvider);
        return connection.createProxy<NotificationService>(notificationServicePath, watcher.getNotificationClient());
    }).inSingletonScope();
    bind(NotificationManager).toSelf().inSingletonScope();

    bind(NotificationToastsRenderer).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(NotificationToastsRenderer);

    bindViewContribution(bind, NotificationExtensionContribution);
    bind(FrontendApplicationContribution).toService(NotificationExtensionContribution);
    bind(NotificationExtensionWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: NotificationExtensionWidget.ID,
        createWidget: () => ctx.container.get<NotificationExtensionWidget>(NotificationExtensionWidget)
    })).inSingletonScope();
});
