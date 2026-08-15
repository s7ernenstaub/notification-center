import { inject, injectable } from '@theia/core/shared/inversify';
import { CommandContribution, CommandRegistry, MenuModelRegistry } from '@theia/core';
import { AbstractViewContribution } from '@theia/core/lib/browser';
import { Command } from '@theia/core/lib/common/command';
import { NotificationExtensionWidget } from './notification-extension-widget';
import { NotificationManager } from './notification-manager';

export const NotificationExtensionCommand: Command = {
    id: 'notification-extension:command',
    label: 'Toggle Notifications Panel'
};

export namespace NotificationDemoCommands {
    export const SEND_INFO: Command = {
        id: 'notification-center:send-info',
        label: 'Notification Center: Send Info Notification',
        category: 'Notification Center'
    };
    export const SEND_WARNING: Command = {
        id: 'notification-center:send-warning',
        label: 'Notification Center: Send Warning Notification',
        category: 'Notification Center'
    };
    export const SEND_ERROR: Command = {
        id: 'notification-center:send-error',
        label: 'Notification Center: Send Error Notification (with actions)',
        category: 'Notification Center'
    };
}

@injectable()
export class NotificationExtensionContribution
    extends AbstractViewContribution<NotificationExtensionWidget> 
    implements CommandContribution {

    @inject(NotificationManager)
    protected readonly notificationManager: NotificationManager;

    constructor() {
        super({
            widgetId: NotificationExtensionWidget.ID,
            widgetName: NotificationExtensionWidget.LABEL,
            defaultWidgetOptions: { area: 'left' },
            toggleCommandId: NotificationExtensionCommand.id
        });
    }

    registerCommands(commands: CommandRegistry): void {
        super.registerCommands(commands);

        commands.registerCommand(NotificationDemoCommands.SEND_INFO, {
            execute: () => this.notificationManager.push({
                severity: 'info',
                title: 'Info title',
                message: 'Info message'
            })
        });
        commands.registerCommand(NotificationDemoCommands.SEND_WARNING, {
            execute: () => this.notificationManager.push({
                severity: 'warning',
                title: 'Warning title',
                message: 'Warning message'
            })
        });
        commands.registerCommand(NotificationDemoCommands.SEND_ERROR, {
            execute: () => this.notificationManager.push({
                severity: 'error',
                title: 'Error title',
                message: 'Error message',
                actions: [
                    { id: 'action1', label: 'Action 1' },
                    { id: 'action2', label: 'Action 2' }
                ]
            })
        });
    }

    registerMenus(menus: MenuModelRegistry): void {
        super.registerMenus(menus);
    }
}
