import * as React from '@theia/core/shared/react';
import { injectable, postConstruct, inject } from '@theia/core/shared/inversify';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { codicon } from '@theia/core/lib/browser/widgets/widget';
import { NotificationManager } from './notification-manager';
import { NotificationHistoryContent } from './notification-history-content';

@injectable()
export class NotificationExtensionWidget extends ReactWidget {

    static readonly ID = 'notification-extension:widget';
    static readonly LABEL = 'Notifications';

    @inject(NotificationManager)
    protected readonly notificationManager: NotificationManager;

    @postConstruct()
    protected init(): void {
        this.id = NotificationExtensionWidget.ID;
        this.title.label = NotificationExtensionWidget.LABEL;
        this.title.caption = NotificationExtensionWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = codicon('bell');
        this.addClass('nc-widget');
        this.update();
    }

    render(): React.ReactElement {
        return <NotificationHistoryContent manager={this.notificationManager} />;
    }

}
