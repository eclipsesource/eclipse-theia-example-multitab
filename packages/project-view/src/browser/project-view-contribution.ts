import { MenuModelRegistry, MessageService } from '@theia/core';
import { AbstractViewContribution, codicon } from '@theia/core/lib/browser';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { Command, CommandRegistry } from '@theia/core/lib/common/command';
import { inject, injectable } from '@theia/core/shared/inversify';
import { ContentWidget, ProjectViewWidget } from './project-view-widget';

export const ProjectViewCommand: Command = { id: 'project-view:command' };

export const ContentWidgetInfoCommand: Command = {
    id: 'contentwidget.info',
    iconClass: codicon('info')
};

@injectable()
export class ProjectViewContribution extends AbstractViewContribution<ProjectViewWidget> implements TabBarToolbarContribution {
    @inject(MessageService) protected readonly messageService: MessageService;

    /**
     * `AbstractViewContribution` handles the creation and registering
     *  of the widget including commands, menus, and keybindings.
     * 
     * We can pass `defaultWidgetOptions` which define widget properties such as 
     * its location `area` (`main`, `left`, `right`, `bottom`), `mode`, and `ref`.
     * 
     */
    constructor() {
        super({
            widgetId: ProjectViewWidget.ID,
            widgetName: ProjectViewWidget.LABEL,
            defaultWidgetOptions: { area: 'main' },
            toggleCommandId: ProjectViewCommand.id
        });
    }

    /**
     * Example command registration to open the widget from the menu, and quick-open.
     * For a simpler use case, it is possible to simply call:
     ```ts
        super.registerCommands(commands)
     ```
     *
     * For more flexibility, we can pass `OpenViewArguments` which define 
     * options on how to handle opening the widget:
     * 
     ```ts
        toggle?: boolean
        activate?: boolean;
        reveal?: boolean;
     ```
     *
     * @param commands
     */
    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(ProjectViewCommand, {
            execute: () => super.openView({ activate: false, reveal: true })
        });

        commands.registerCommand(ContentWidgetInfoCommand, {
            execute: widget => this.messageService.info((widget as ContentWidget).content),
            isEnabled: widget => widget instanceof ContentWidget,
            isVisible: widget => widget instanceof ContentWidget,
        });
    }

    /**
     * Example menu registration to contribute a menu item used to open the widget.
     * Default location when extending the `AbstractViewContribution` is the `View` main-menu item.
     * 
     * We can however define new menu path locations in the following way:
     ```ts
        menus.registerMenuAction(CommonMenus.HELP, {
            commandId: 'id',
            label: 'label'
        });
     ```
     * 
     * @param menus
     */
    registerMenus(menus: MenuModelRegistry): void {
        super.registerMenus(menus);
    }


    registerToolbarItems(registry: TabBarToolbarRegistry): void {
        registry.registerItem({
            id: ContentWidgetInfoCommand.id,
            command: ContentWidgetInfoCommand.id
        });
    }
}
