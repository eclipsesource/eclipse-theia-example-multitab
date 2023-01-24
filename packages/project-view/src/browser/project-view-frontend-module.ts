/*
 * Copyright (c) 2022-2023 EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0, or the MIT License which is
 * available at https://opensource.org/licenses/MIT.
 *
 * SPDX-License-Identifier: EPL-2.0 OR MIT
 */
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
