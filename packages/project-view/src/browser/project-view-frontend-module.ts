import { bindViewContribution, FrontendApplicationContribution, WidgetFactory } from '@theia/core/lib/browser';
import { ContainerModule } from '@theia/core/shared/inversify';
import { ProjectViewContribution } from './project-view-contribution';
import { ProjectViewWidget } from './project-view-widget';

import { TabBarToolbarContribution } from '@theia/core/lib/browser/shell/tab-bar-toolbar';

export default new ContainerModule(bind => {
    bindViewContribution(bind, ProjectViewContribution);
    bind(FrontendApplicationContribution).toService(ProjectViewContribution);
    bind(TabBarToolbarContribution).toService(ProjectViewContribution);
    bind(ProjectViewWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: ProjectViewWidget.ID,
        createWidget: () => ctx.container.get<ProjectViewWidget>(ProjectViewWidget)
    })).inSingletonScope();
});
