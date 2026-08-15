import * as React from '@theia/core/shared/react';
import { createRoot, Root } from '@theia/core/shared/react-dom/client';
import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import { NotificationManager } from '../notification-manager';
import { NotificationToastsOverlay } from './notification-toasts-overlay';

@injectable()
export class NotificationToastsRenderer implements FrontendApplicationContribution {

    @inject(NotificationManager)
    protected readonly manager: NotificationManager;

    protected container: HTMLDivElement;
    protected containerRoot: Root;

    @postConstruct()
    protected init(): void {
        this.container = document.createElement('div');
        this.container.className = 'nc-toasts-overlay-root';
        document.body.appendChild(this.container);
        this.containerRoot = createRoot(this.container);
        this.containerRoot.render(React.createElement(NotificationToastsOverlay, { manager: this.manager }));
    }

    onStop(): void {
        this.containerRoot.unmount();
        this.container.remove();
    }

}
