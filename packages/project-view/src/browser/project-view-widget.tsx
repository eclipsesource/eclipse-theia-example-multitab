import { DisposableCollection, Emitter } from '@theia/core';
import { ApplicationShell, codicon, CorePreferences, DockPanel, DockPanelRenderer, DockPanelRendererFactory, Message, TabBar, Widget } from '@theia/core/lib/browser';
import { TheiaDockPanel } from '@theia/core/lib/browser/shell/theia-dock-panel';
import { AlertMessage } from '@theia/core/lib/browser/widgets/alert-message';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { toArray } from '@theia/core/shared/@phosphor/algorithm';
import { Drag, IDragEvent } from '@theia/core/shared/@phosphor/dragdrop';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { v4 as uuidv4 } from 'uuid';

import * as React from 'react';

const DOCK_PANEL_MIME_TYPE = 'application/vnd.phosphor.widget-factory';

export class ContainerDockPanel extends TheiaDockPanel {
    protected internalMimeType: string;

    constructor(options?: DockPanel.IOptions,
        protected readonly preferences?: CorePreferences
    ) {
        super(options, preferences);
        this.internalMimeType = DOCK_PANEL_MIME_TYPE + uuidv4();
        this.renderer.createTabBar = () => this.createTabBar();
    }

    createTabBar(): TabBar<Widget> {
        const tabBar = this['_createTabBar']() as TabBar<Widget>;
        tabBar['tabDetachRequested'].disconnect(this['_onTabDetachRequested'], this);
        tabBar['tabDetachRequested'].connect(this.onTabDetachRequested, this);
        return tabBar;
    }

    onTabDetachRequested(sender: TabBar<Widget>, args: TabBar.ITabDetachRequestedArgs<Widget>): void {
        this['_onTabDetachRequested'](sender, args);
        const drag = this['_drag'] as Drag;
        drag.mimeData.setData(this.internalMimeType, drag.mimeData.getData(DOCK_PANEL_MIME_TYPE));
        drag.mimeData.clearData(DOCK_PANEL_MIME_TYPE);
    }

    handleEvent(event: Event): void {
        switch (event.type) {
            case 'p-dragenter': {
                this.dragEnter(event as IDragEvent);
                break;
            }
            case 'p-dragover': {
                this.dragOver(event as IDragEvent);
                break;
            }
            case 'p-drop': {
                this.drop(event as IDragEvent);
                break;
            }
            default:
                super.handleEvent(event);
        }
    }

    dragEnter(event: IDragEvent): void {
        if (event.mimeData.hasData(this.internalMimeType)) {
            event.mimeData.setData(DOCK_PANEL_MIME_TYPE, event.mimeData.getData(this.internalMimeType));
            super.handleEvent(event);
            event.mimeData.clearData(DOCK_PANEL_MIME_TYPE);
        }
    }

    dragOver(event: IDragEvent) {
        if (event.mimeData.hasData(this.internalMimeType)) {
            event.mimeData.setData(DOCK_PANEL_MIME_TYPE, event.mimeData.getData(this.internalMimeType));
            super.handleEvent(event);
            event.mimeData.clearData(DOCK_PANEL_MIME_TYPE);
        } else {
            event.preventDefault();
            event.stopPropagation();
            event.dropAction = 'none';
        }
    }

    drop(event: IDragEvent) {
        if (event.mimeData.hasData(this.internalMimeType)) {
            event.mimeData.setData(DOCK_PANEL_MIME_TYPE, event.mimeData.getData(this.internalMimeType));
            super.handleEvent(event);
            event.mimeData.clearData(DOCK_PANEL_MIME_TYPE);
        }
    }
}

@injectable()
export class ProjectViewWidget extends ContainerDockPanel implements ApplicationShell.TrackableWidgetProvider {

    static readonly ID = 'project-view:widget';
    static readonly LABEL = 'Project View';

    private onDidChangeTrackableWidgetsEmitter = new Emitter<Widget[]>();
    onDidChangeTrackableWidgets = this.onDidChangeTrackableWidgetsEmitter.event;

    private toDispose = new DisposableCollection(this.onDidChangeTrackableWidgetsEmitter);

    @inject(ApplicationShell) protected shell: ApplicationShell;

    constructor(@inject(DockPanelRendererFactory) rendererFactory: DockPanelRendererFactory,
        @inject(CorePreferences) preferences: CorePreferences,
    ) {
        super({ renderer: ProjectViewWidget.createRenderer(rendererFactory) }, preferences);
    }

    @postConstruct()
    protected async init(): Promise<void> {
        this.id = ProjectViewWidget.ID;
        this.title.label = ProjectViewWidget.LABEL;
        this.title.caption = ProjectViewWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = codicon('project');

        this.widgetAdded.connect(() => this.onDidChangeTrackableWidgetsEmitter.fire(this.getTrackableWidgets()));
        this.widgetRemoved.connect(() => this.onDidChangeTrackableWidgetsEmitter.fire(this.getTrackableWidgets()));
        this.toDispose.push(this.shell.onDidChangeActiveWidget(event => this.syncActiveWidget(event.newValue)));

        this.initializeWidgets();

        this.onDidChangeCurrent

        this.update();
    }

    protected initializeWidgets() {
        ['Overview', 'Settings', 'Export'].forEach(content => this.addWidget(new ContentWidget(content)));
    }

    protected override onActivateRequest(msg: Message): void {
        const currentWidget = this.currentTabBar?.currentTitle?.owner;
        if (currentWidget) {
            currentWidget.activate();
        } else {
            // Only happens if you remove all widgets, then close the view.
            this.node.tabIndex = -1;
            this.node.focus();
        }
        super.onActivateRequest(msg);
    }

    protected override onCloseRequest(msg: Message): void {
        super.onCloseRequest(msg);
        this.dispose();
    }

    override dispose(): void {
        this.toDispose.dispose();
        super.dispose();
    }

    protected syncActiveWidget(widget: Widget | null): void {
        if (widget && !!this.findTabBar(widget.title)) {
            this.activateWidget(widget);
        }
    }

    protected findWidget(id: string): Widget | undefined {
        return this.getTrackableWidgets().find(widget => widget.id === id);
    }

    getTrackableWidgets(): Widget[] {
        return toArray(this.widgets());
    }

    activateWidget(idOrWidget?: string | Widget): Widget | undefined {
        if (!idOrWidget) {
            return;
        }
        if (typeof idOrWidget === 'string') {
            const widget = this.findWidget(idOrWidget);
            this.activateWidget(widget);
        } else {
            super.activateWidget(idOrWidget);
            return idOrWidget;
        }
    }

    revealWidget(id: string): Widget | undefined {
        return this.activateWidget(id);
    }

    static createRenderer(factory: DockPanelRendererFactory): DockPanelRenderer {
        const renderer = factory();
        renderer.tabBarClasses.push('theia-app-centers');
        return renderer;
    }
}

export class ContentWidget extends ReactWidget {
    static readonly ID = 'project-view:content';

    constructor(public readonly content: string) {
        super();
        this.id = ContentWidget.ID + ':' + this.content;
        this.title.label = this.content;
        this.title.caption = this.content;
        this.title.closable = true;
        this.title.iconClass = codicon('settings-gear');

        this.node.tabIndex = 0;
        this.update();
    }

    protected override onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        this.node.focus();
    }

    render(): React.ReactElement {
        return <AlertMessage type='INFO' header={this.content} />
    }

}
