import { NgModule, Component, ElementRef, Input, Output, EventEmitter, ContentChildren, ViewContainerRef, ChangeDetectorRef, ChangeDetectionStrategy, ViewEncapsulation, ViewChild, forwardRef, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';
import { SharedModule, PrimeTemplate } from 'primeng/api';
import { DomHandler } from 'primeng/dom';
let idx = 0;
export class TabPanel {
    constructor(tabView, viewContainer, cd) {
        this.viewContainer = viewContainer;
        this.cd = cd;
        this.cache = true;
        this.tooltipPosition = 'top';
        this.tooltipPositionStyle = 'absolute';
        this.id = `p-tabpanel-${idx++}`;
        this.tabView = tabView;
    }
    ngAfterContentInit() {
        this.templates.forEach((item) => {
            switch (item.getType()) {
                case 'header':
                    this.headerTemplate = item.template;
                    break;
                case 'content':
                    this.contentTemplate = item.template;
                    break;
                default:
                    this.contentTemplate = item.template;
                    break;
            }
        });
    }
    get selected() {
        return this._selected;
    }
    set selected(val) {
        this._selected = val;
        if (!this.loaded) {
            this.cd.detectChanges();
        }
        if (val)
            this.loaded = true;
    }
    get disabled() {
        return this._disabled;
    }
    ;
    set disabled(disabled) {
        this._disabled = disabled;
        this.tabView.cd.markForCheck();
    }
    get header() {
        return this._header;
    }
    set header(header) {
        this._header = header;
        this.tabView.cd.markForCheck();
    }
    ngOnDestroy() {
        this.view = null;
    }
}
TabPanel.decorators = [
    { type: Component, args: [{
                selector: 'p-tabPanel',
                template: `
        <div [attr.id]="id" class="p-tabview-panel" [hidden]="!selected"
            role="tabpanel" [attr.aria-hidden]="!selected" [attr.aria-labelledby]="id + '-label'" *ngIf="!closed">
            <ng-content></ng-content>
            <ng-container *ngIf="contentTemplate && (cache ? loaded : selected)">
                <ng-container *ngTemplateOutlet="contentTemplate"></ng-container>
            </ng-container>
        </div>
    `
            },] }
];
TabPanel.ctorParameters = () => [
    { type: undefined, decorators: [{ type: Inject, args: [forwardRef(() => TabView),] }] },
    { type: ViewContainerRef },
    { type: ChangeDetectorRef }
];
TabPanel.propDecorators = {
    closable: [{ type: Input }],
    headerStyle: [{ type: Input }],
    headerStyleClass: [{ type: Input }],
    leftIcon: [{ type: Input }],
    rightIcon: [{ type: Input }],
    cache: [{ type: Input }],
    tooltip: [{ type: Input }],
    tooltipPosition: [{ type: Input }],
    tooltipPositionStyle: [{ type: Input }],
    tooltipStyleClass: [{ type: Input }],
    templates: [{ type: ContentChildren, args: [PrimeTemplate,] }],
    selected: [{ type: Input }],
    disabled: [{ type: Input }],
    header: [{ type: Input }]
};
export class TabView {
    constructor(el, cd) {
        this.el = el;
        this.cd = cd;
        this.orientation = 'top';
        this.onChange = new EventEmitter();
        this.onClose = new EventEmitter();
        this.activeIndexChange = new EventEmitter();
    }
    ngAfterContentInit() {
        this.initTabs();
        this.tabPanels.changes.subscribe(_ => {
            this.initTabs();
        });
    }
    ngAfterViewChecked() {
        if (this.tabChanged) {
            this.updateInkBar();
            this.tabChanged = false;
        }
    }
    initTabs() {
        this.tabs = this.tabPanels.toArray();
        let selectedTab = this.findSelectedTab();
        if (!selectedTab && this.tabs.length) {
            if (this.activeIndex != null && this.tabs.length > this.activeIndex)
                this.tabs[this.activeIndex].selected = true;
            else
                this.tabs[0].selected = true;
            this.tabChanged = true;
        }
        this.cd.markForCheck();
    }
    open(event, tab) {
        if (tab.disabled) {
            if (event) {
                event.preventDefault();
            }
            return;
        }
        if (!tab.selected) {
            let selectedTab = this.findSelectedTab();
            if (selectedTab) {
                selectedTab.selected = false;
            }
            this.tabChanged = true;
            tab.selected = true;
            let selectedTabIndex = this.findTabIndex(tab);
            this.preventActiveIndexPropagation = true;
            this.activeIndexChange.emit(selectedTabIndex);
            this.onChange.emit({ originalEvent: event, index: selectedTabIndex });
        }
        if (event) {
            event.preventDefault();
        }
    }
    close(event, tab) {
        if (this.controlClose) {
            this.onClose.emit({
                originalEvent: event,
                index: this.findTabIndex(tab),
                close: () => {
                    this.closeTab(tab);
                }
            });
        }
        else {
            this.closeTab(tab);
            this.onClose.emit({
                originalEvent: event,
                index: this.findTabIndex(tab)
            });
        }
        event.stopPropagation();
    }
    closeTab(tab) {
        if (tab.disabled) {
            return;
        }
        if (tab.selected) {
            this.tabChanged = true;
            tab.selected = false;
            for (let i = 0; i < this.tabs.length; i++) {
                let tabPanel = this.tabs[i];
                if (!tabPanel.closed && !tab.disabled) {
                    tabPanel.selected = true;
                    break;
                }
            }
        }
        tab.closed = true;
    }
    findSelectedTab() {
        for (let i = 0; i < this.tabs.length; i++) {
            if (this.tabs[i].selected) {
                return this.tabs[i];
            }
        }
        return null;
    }
    findTabIndex(tab) {
        let index = -1;
        for (let i = 0; i < this.tabs.length; i++) {
            if (this.tabs[i] == tab) {
                index = i;
                break;
            }
        }
        return index;
    }
    getBlockableElement() {
        return this.el.nativeElement.children[0];
    }
    get activeIndex() {
        return this._activeIndex;
    }
    set activeIndex(val) {
        this._activeIndex = val;
        if (this.preventActiveIndexPropagation) {
            this.preventActiveIndexPropagation = false;
            return;
        }
        if (this.tabs && this.tabs.length && this._activeIndex != null && this.tabs.length > this._activeIndex) {
            this.findSelectedTab().selected = false;
            this.tabs[this._activeIndex].selected = true;
        }
    }
    updateInkBar() {
        let tabHeader = DomHandler.findSingle(this.navbar.nativeElement, 'li.p-highlight');
        this.inkbar.nativeElement.style.width = DomHandler.getWidth(tabHeader) + 'px';
        this.inkbar.nativeElement.style.left = DomHandler.getOffset(tabHeader).left - DomHandler.getOffset(this.navbar.nativeElement).left + 'px';
    }
}
TabView.decorators = [
    { type: Component, args: [{
                selector: 'p-tabView',
                template: `
        <div [ngClass]="'p-tabview p-component'" [ngStyle]="style" [class]="styleClass">
            <ul #navbar class="p-tabview-nav" role="tablist">
                <ng-template ngFor let-tab [ngForOf]="tabs">
                    <li role="presentation" [ngClass]="{'p-highlight': tab.selected, 'p-disabled': tab.disabled}" [ngStyle]="tab.headerStyle" [class]="tab.headerStyleClass" *ngIf="!tab.closed">
                        <a role="tab" class="p-tabview-nav-link" [attr.id]="tab.id + '-label'" [attr.aria-selected]="tab.selected" [attr.aria-controls]="tab.id" [pTooltip]="tab.tooltip" [tooltipPosition]="tab.tooltipPosition"
                            [attr.aria-selected]="tab.selected" [positionStyle]="tab.tooltipPositionStyle" [tooltipStyleClass]="tab.tooltipStyleClass"
                            (click)="open($event,tab)" (keydown.enter)="open($event,tab)" pRipple [attr.tabindex]="tab.disabled ? null : '0'">
                            <ng-container *ngIf="!tab.headerTemplate">
                                <span class="p-tabview-left-icon" [ngClass]="tab.leftIcon" *ngIf="tab.leftIcon"></span>
                                <span class="p-tabview-title">{{tab.header}}</span>
                                <span class="p-tabview-right-icon" [ngClass]="tab.rightIcon" *ngIf="tab.rightIcon"></span>
                            </ng-container>
                            <ng-container *ngTemplateOutlet="tab.headerTemplate"></ng-container>
                            <span *ngIf="tab.closable" class="p-tabview-close pi pi-times" (click)="close($event,tab)"></span>
                        </a>
                    </li>
                </ng-template>
                <li #inkbar class="p-tabview-ink-bar"></li>
            </ul>
            <div class="p-tabview-panels">
                <ng-content></ng-content>
            </div>
        </div>
    `,
                changeDetection: ChangeDetectionStrategy.OnPush,
                encapsulation: ViewEncapsulation.None,
                styles: [".p-tabview-nav{display:flex;flex-wrap:wrap;list-style-type:none;margin:0;padding:0}.p-tabview-nav-link{-ms-user-select:none;-webkit-user-select:none;align-items:center;cursor:pointer;display:flex;overflow:hidden;position:relative;text-decoration:none;user-select:none}.p-tabview-ink-bar{display:none;z-index:1}.p-tabview-nav-link:focus{z-index:1}.p-tabview-title{line-height:1}.p-tabview-close{z-index:1}"]
            },] }
];
TabView.ctorParameters = () => [
    { type: ElementRef },
    { type: ChangeDetectorRef }
];
TabView.propDecorators = {
    orientation: [{ type: Input }],
    style: [{ type: Input }],
    styleClass: [{ type: Input }],
    controlClose: [{ type: Input }],
    navbar: [{ type: ViewChild, args: ['navbar',] }],
    inkbar: [{ type: ViewChild, args: ['inkbar',] }],
    tabPanels: [{ type: ContentChildren, args: [TabPanel,] }],
    onChange: [{ type: Output }],
    onClose: [{ type: Output }],
    activeIndexChange: [{ type: Output }],
    activeIndex: [{ type: Input }]
};
export class TabViewModule {
}
TabViewModule.decorators = [
    { type: NgModule, args: [{
                imports: [CommonModule, SharedModule, TooltipModule, RippleModule],
                exports: [TabView, TabPanel, SharedModule],
                declarations: [TabView, TabPanel]
            },] }
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFidmlldy5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi8uLi9zcmMvYXBwL2NvbXBvbmVudHMvdGFidmlldy8iLCJzb3VyY2VzIjpbInRhYnZpZXcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFDLFFBQVEsRUFBQyxTQUFTLEVBQUMsVUFBVSxFQUFXLEtBQUssRUFBQyxNQUFNLEVBQUMsWUFBWSxFQUNqRSxlQUFlLEVBQXVDLGdCQUFnQixFQUFDLGlCQUFpQixFQUFDLHVCQUF1QixFQUFFLGlCQUFpQixFQUFFLFNBQVMsRUFBb0IsVUFBVSxFQUFFLE1BQU0sRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUNuTixPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDN0MsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQzlDLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUM1QyxPQUFPLEVBQUMsWUFBWSxFQUFDLGFBQWEsRUFBQyxNQUFNLGFBQWEsQ0FBQztBQUV2RCxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sYUFBYSxDQUFDO0FBRXZDLElBQUksR0FBRyxHQUFXLENBQUMsQ0FBQztBQWNwQixNQUFNLE9BQU8sUUFBUTtJQTRDakIsWUFBK0MsT0FBTyxFQUFTLGFBQStCLEVBQVMsRUFBcUI7UUFBN0Qsa0JBQWEsR0FBYixhQUFhLENBQWtCO1FBQVMsT0FBRSxHQUFGLEVBQUUsQ0FBbUI7UUFoQ25ILFVBQUssR0FBWSxJQUFJLENBQUM7UUFJdEIsb0JBQWUsR0FBVyxLQUFLLENBQUM7UUFFaEMseUJBQW9CLEdBQVcsVUFBVSxDQUFDO1FBa0JuRCxPQUFFLEdBQVcsY0FBYyxHQUFHLEVBQUUsRUFBRSxDQUFDO1FBUy9CLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBa0IsQ0FBQztJQUN0QyxDQUFDO0lBRUQsa0JBQWtCO1FBQ2QsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMs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QU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0lBQy9JLENBQUM7OztZQS9NSixTQUFTLFNBQUM7Z0JBQ1AsUUFBUSxFQUFFLFdBQVc7Z0JBQ3JCLFFBQVEsRUFBRTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0tBd0JUO2dCQUNGLGVBQWUsRUFBRSx1QkFBdUIsQ0FBQyxNQUFNO2dCQUMvQyxhQUFhLEVBQUUsaUJBQWlCLENBQUMsSUFBSTs7YUFFdkM7OztZQTdKMEIsVUFBVTtZQUMwQyxpQkFBaUI7OzswQkErSjNGLEtBQUs7b0JBRUwsS0FBSzt5QkFFTCxLQUFLOzJCQUVMLEtBQUs7cUJBRUwsU0FBUyxTQUFDLFFBQVE7cUJBRWxCLFNBQVMsU0FBQyxRQUFRO3dCQUVsQixlQUFlLFNBQUMsUUFBUTt1QkFFeEIsTUFBTTtzQkFFTixNQUFNO2dDQUVOLE1BQU07MEJBdUlOLEtBQUs7O0FBOEJWLE1BQU0sT0FBTyxhQUFhOzs7WUFMekIsUUFBUSxTQUFDO2dCQUNOLE9BQU8sRUFBRSxDQUFDLFlBQVksRUFBQyxZQUFZLEVBQUMsYUFBYSxFQUFDLFlBQVksQ0FBQztnQkFDL0QsT0FBTyxFQUFFLENBQUMsT0FBTyxFQUFDLFFBQVEsRUFBQyxZQUFZLENBQUM7Z0JBQ3hDLFlBQVksRUFBRSxDQUFDLE9BQU8sRUFBQyxRQUFRLENBQUM7YUFDbkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge05nTW9kdWxlLENvbXBvbmVudCxFbGVtZW50UmVmLE9uRGVzdHJveSxJbnB1dCxPdXRwdXQsRXZlbnRFbWl0dGVyLEFmdGVyQ29udGVudEluaXQsXG4gICAgICAgIENvbnRlbnRDaGlsZHJlbixRdWVyeUxpc3QsVGVtcGxhdGVSZWYsRW1iZWRkZWRWaWV3UmVmLFZpZXdDb250YWluZXJSZWYsQ2hhbmdlRGV0ZWN0b3JSZWYsQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3ksIFZpZXdFbmNhcHN1bGF0aW9uLCBWaWV3Q2hpbGQsIEFmdGVyVmlld0NoZWNrZWQsIGZvcndhcmRSZWYsIEluamVjdH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge0NvbW1vbk1vZHVsZX0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7VG9vbHRpcE1vZHVsZX0gZnJvbSAncHJpbWVuZy90b29sdGlwJztcbmltcG9ydCB7UmlwcGxlTW9kdWxlfSBmcm9tICdwcmltZW5nL3JpcHBsZSc7XG5pbXBvcnQge1NoYXJlZE1vZHVsZSxQcmltZVRlbXBsYXRlfSBmcm9tICdwcmltZW5nL2FwaSc7XG5pbXBvcnQge0Jsb2NrYWJsZVVJfSBmcm9tICdwcmltZW5nL2FwaSc7XG5pbXBvcnQge0RvbUhhbmRsZXJ9IGZyb20gJ3ByaW1lbmcvZG9tJztcblxubGV0IGlkeDogbnVtYmVyID0gMDtcblxuQENvbXBvbmVudCh7XG4gICAgc2VsZWN0b3I6ICdwLXRhYlBhbmVsJyxcbiAgICB0ZW1wbGF0ZTogYFxuICAgICAgICA8ZGl2IFthdHRyLmlkXT1cImlkXCIgY2xhc3M9XCJwLXRhYnZpZXctcGFuZWxcIiBbaGlkZGVuXT1cIiFzZWxlY3RlZFwiXG4gICAgICAgICAgICByb2xlPVwidGFicGFuZWxcIiBbYXR0ci5hcmlhLWhpZGRlbl09XCIhc2VsZWN0ZWRcIiBbYXR0ci5hcmlhLWxhYmVsbGVkYnldPVwiaWQgKyAnLWxhYmVsJ1wiICpuZ0lmPVwiIWNsb3NlZFwiPlxuICAgICAgICAgICAgPG5nLWNvbnRlbnQ+PC9uZy1jb250ZW50PlxuICAgICAgICAgICAgPG5nLWNvbnRhaW5lciAqbmdJZj1cImNvbnRlbnRUZW1wbGF0ZSAmJiAoY2FjaGUgPyBsb2FkZWQgOiBzZWxlY3RlZClcIj5cbiAgICAgICAgICAgICAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwiY29udGVudFRlbXBsYXRlXCI+PC9uZy1jb250YWluZXI+XG4gICAgICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgICAgPC9kaXY+XG4gICAgYFxufSlcbmV4cG9ydCBjbGFzcyBUYWJQYW5lbCBpbXBsZW1lbnRzIEFmdGVyQ29udGVudEluaXQsT25EZXN0cm95IHtcbiAgICBcbiAgICBASW5wdXQoKSBjbG9zYWJsZTogYm9vbGVhbjtcbiAgICBcbiAgICBASW5wdXQoKSBoZWFkZXJTdHlsZTogYW55O1xuICAgIFxuICAgIEBJbnB1dCgpIGhlYWRlclN0eWxlQ2xhc3M6IHN0cmluZztcbiAgICBcbiAgICBASW5wdXQoKSBsZWZ0SWNvbjogc3RyaW5nO1xuICAgIFxuICAgIEBJbnB1dCgpIHJpZ2h0SWNvbjogc3RyaW5nO1xuICAgIFxuICAgIEBJbnB1dCgpIGNhY2hlOiBib29sZWFuID0gdHJ1ZTtcblxuICAgIEBJbnB1dCgpIHRvb2x0aXA6IGFueTtcbiAgICBcbiAgICBASW5wdXQoKSB0b29sdGlwUG9zaXRpb246IHN0cmluZyA9ICd0b3AnO1xuXG4gICAgQElucHV0KCkgdG9vbHRpcFBvc2l0aW9uU3R5bGU6IHN0cmluZyA9ICdhYnNvbHV0ZSc7XG5cbiAgICBASW5wdXQoKSB0b29sdGlwU3R5bGVDbGFzczogc3RyaW5nO1xuXG4gICAgQENvbnRlbnRDaGlsZHJlbihQcmltZVRlbXBsYXRlKSB0ZW1wbGF0ZXM6IFF1ZXJ5TGlzdDxhbnk+O1xuICAgIFxuICAgIGNsb3NlZDogYm9vbGVhbjtcbiAgICBcbiAgICB2aWV3OiBFbWJlZGRlZFZpZXdSZWY8YW55PjtcbiAgICBcbiAgICBfc2VsZWN0ZWQ6IGJvb2xlYW47XG5cbiAgICBfZGlzYWJsZWQ6IGJvb2xlYW47XG4gICAgXG4gICAgX2hlYWRlcjogc3RyaW5nO1xuICAgIFxuICAgIGxvYWRlZDogYm9vbGVhbjtcbiAgICBcbiAgICBpZDogc3RyaW5nID0gYHAtdGFicGFuZWwtJHtpZHgrK31gO1xuICAgIFxuICAgIGNvbnRlbnRUZW1wbGF0ZTogVGVtcGxhdGVSZWY8YW55PjtcblxuICAgIGhlYWRlclRlbXBsYXRlOiBUZW1wbGF0ZVJlZjxhbnk+O1xuXG4gICAgdGFiVmlldzogVGFiVmlldztcblxuICAgIGNvbnN0cnVjdG9yKEBJbmplY3QoZm9yd2FyZFJlZigoKSA9PiBUYWJWaWV3KSkgdGFiVmlldywgcHVibGljIHZpZXdDb250YWluZXI6IFZpZXdDb250YWluZXJSZWYsIHB1YmxpYyBjZDogQ2hhbmdlRGV0ZWN0b3JSZWYpIHtcbiAgICAgICAgdGhpcy50YWJWaWV3ID0gdGFiVmlldyBhcyBUYWJWaWV3O1xuICAgIH1cblxuICAgIG5nQWZ0ZXJDb250ZW50SW5pdCgpIHtcbiAgICAgICAgdGhpcy50ZW1wbGF0ZXMuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgc3dpdGNoKGl0ZW0uZ2V0VHlwZSgpKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAnaGVhZGVyJzpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oZWFkZXJUZW1wbGF0ZSA9IGl0ZW0udGVtcGxhdGU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlICdjb250ZW50JzpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb250ZW50VGVtcGxhdGUgPSBpdGVtLnRlbXBsYXRlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29udGVudFRlbXBsYXRlID0gaXRlbS50ZW1wbGF0ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIEBJbnB1dCgpIGdldCBzZWxlY3RlZCgpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NlbGVjdGVkO1xuICAgIH1cblxuICAgIHNldCBzZWxlY3RlZCh2YWw6IGJvb2xlYW4pIHtcbiAgICAgICAgdGhpcy5fc2VsZWN0ZWQgPSB2YWw7XG4gICAgICAgIFxuICAgICAgICBpZiAoIXRoaXMubG9hZGVkKSB7XG4gICAgICAgICAgICB0aGlzLmNkLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh2YWwpXG4gICAgICAgICAgICB0aGlzLmxvYWRlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgQElucHV0KCkgZ2V0IGRpc2FibGVkKCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fZGlzYWJsZWQ7XG4gICAgfTtcblxuICAgIHNldCBkaXNhYmxlZChkaXNhYmxlZDogYm9vbGVhbikge1xuICAgICAgICB0aGlzLl9kaXNhYmxlZCA9IGRpc2FibGVkO1xuICAgICAgICB0aGlzLnRhYlZpZXcuY2QubWFya0ZvckNoZWNrKCk7XG4gICAgfVxuICAgIFxuICAgIEBJbnB1dCgpIGdldCBoZWFkZXIoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2hlYWRlcjtcbiAgICB9XG4gICAgXG4gICAgc2V0IGhlYWRlcihoZWFkZXI6IHN0cmluZykge1xuICAgICAgICB0aGlzLl9oZWFkZXIgPSBoZWFkZXI7XG4gICAgICAgIHRoaXMudGFiVmlldy5jZC5tYXJrRm9yQ2hlY2soKTtcbiAgICB9XG4gICAgXG4gICAgbmdPbkRlc3Ryb3koKSB7XG4gICAgICAgIHRoaXMudmlldyA9IG51bGw7XG4gICAgfVxufVxuXG5AQ29tcG9uZW50KHtcbiAgICBzZWxlY3RvcjogJ3AtdGFiVmlldycsXG4gICAgdGVtcGxhdGU6IGBcbiAgICAgICAgPGRpdiBbbmdDbGFzc109XCIncC10YWJ2aWV3IHAtY29tcG9uZW50J1wiIFtuZ1N0eWxlXT1cInN0eWxlXCIgW2NsYXNzXT1cInN0eWxlQ2xhc3NcIj5cbiAgICAgICAgICAgIDx1bCAjbmF2YmFyIGNsYXNzPVwicC10YWJ2aWV3LW5hdlwiIHJvbGU9XCJ0YWJsaXN0XCI+XG4gICAgICAgICAgICAgICAgPG5nLXRlbXBsYXRlIG5nRm9yIGxldC10YWIgW25nRm9yT2ZdPVwidGFic1wiPlxuICAgICAgICAgICAgICAgICAgICA8bGkgcm9sZT1cInByZXNlbnRhdGlvblwiIFtuZ0NsYXNzXT1cInsncC1oaWdobGlnaHQnOiB0YWIuc2VsZWN0ZWQsICdwLWRpc2FibGVkJzogdGFiLmRpc2FibGVkfVwiIFtuZ1N0eWxlXT1cInRhYi5oZWFkZXJTdHlsZVwiIFtjbGFzc109XCJ0YWIuaGVhZGVyU3R5bGVDbGFzc1wiICpuZ0lmPVwiIXRhYi5jbG9zZWRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxhIHJvbGU9XCJ0YWJcIiBjbGFzcz1cInAtdGFidmlldy1uYXYtbGlua1wiIFthdHRyLmlkXT1cInRhYi5pZCArICctbGFiZWwnXCIgW2F0dHIuYXJpYS1zZWxlY3RlZF09XCJ0YWIuc2VsZWN0ZWRcIiBbYXR0ci5hcmlhLWNvbnRyb2xzXT1cInRhYi5pZFwiIFtwVG9vbHRpcF09XCJ0YWIudG9vbHRpcFwiIFt0b29sdGlwUG9zaXRpb25dPVwidGFiLnRvb2x0aXBQb3NpdGlvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgW2F0dHIuYXJpYS1zZWxlY3RlZF09XCJ0YWIuc2VsZWN0ZWRcIiBbcG9zaXRpb25TdHlsZV09XCJ0YWIudG9vbHRpcFBvc2l0aW9uU3R5bGVcIiBbdG9vbHRpcFN0eWxlQ2xhc3NdPVwidGFiLnRvb2x0aXBTdHlsZUNsYXNzXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoY2xpY2spPVwib3BlbigkZXZlbnQsdGFiKVwiIChrZXlkb3duLmVudGVyKT1cIm9wZW4oJGV2ZW50LHRhYilcIiBwUmlwcGxlIFthdHRyLnRhYmluZGV4XT1cInRhYi5kaXNhYmxlZCA/IG51bGwgOiAnMCdcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bmctY29udGFpbmVyICpuZ0lmPVwiIXRhYi5oZWFkZXJUZW1wbGF0ZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cInAtdGFidmlldy1sZWZ0LWljb25cIiBbbmdDbGFzc109XCJ0YWIubGVmdEljb25cIiAqbmdJZj1cInRhYi5sZWZ0SWNvblwiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJwLXRhYnZpZXctdGl0bGVcIj57e3RhYi5oZWFkZXJ9fTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJwLXRhYnZpZXctcmlnaHQtaWNvblwiIFtuZ0NsYXNzXT1cInRhYi5yaWdodEljb25cIiAqbmdJZj1cInRhYi5yaWdodEljb25cIj48L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cInRhYi5oZWFkZXJUZW1wbGF0ZVwiPjwvbmctY29udGFpbmVyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuICpuZ0lmPVwidGFiLmNsb3NhYmxlXCIgY2xhc3M9XCJwLXRhYnZpZXctY2xvc2UgcGkgcGktdGltZXNcIiAoY2xpY2spPVwiY2xvc2UoJGV2ZW50LHRhYilcIj48L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2E+XG4gICAgICAgICAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgICAgICAgICAgICA8bGkgI2lua2JhciBjbGFzcz1cInAtdGFidmlldy1pbmstYmFyXCI+PC9saT5cbiAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwicC10YWJ2aWV3LXBhbmVsc1wiPlxuICAgICAgICAgICAgICAgIDxuZy1jb250ZW50PjwvbmctY29udGVudD5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICBgLFxuICAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2gsXG4gICBlbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbi5Ob25lLFxuICAgc3R5bGVVcmxzOiBbJy4vdGFidmlldy5jc3MnXVxufSlcbmV4cG9ydCBjbGFzcyBUYWJWaWV3IGltcGxlbWVudHMgQWZ0ZXJDb250ZW50SW5pdCxBZnRlclZpZXdDaGVja2VkLEJsb2NrYWJsZVVJIHtcblxuICAgIEBJbnB1dCgpIG9yaWVudGF0aW9uOiBzdHJpbmcgPSAndG9wJztcbiAgICBcbiAgICBASW5wdXQoKSBzdHlsZTogYW55O1xuICAgIFxuICAgIEBJbnB1dCgpIHN0eWxlQ2xhc3M6IHN0cmluZztcbiAgICBcbiAgICBASW5wdXQoKSBjb250cm9sQ2xvc2U6IGJvb2xlYW47XG5cbiAgICBAVmlld0NoaWxkKCduYXZiYXInKSBuYXZiYXI6IEVsZW1lbnRSZWY7XG5cbiAgICBAVmlld0NoaWxkKCdpbmtiYXInKSBpbmtiYXI6IEVsZW1lbnRSZWY7XG4gICAgXG4gICAgQENvbnRlbnRDaGlsZHJlbihUYWJQYW5lbCkgdGFiUGFuZWxzOiBRdWVyeUxpc3Q8VGFiUGFuZWw+O1xuXG4gICAgQE91dHB1dCgpIG9uQ2hhbmdlOiBFdmVudEVtaXR0ZXI8YW55PiA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcblxuICAgIEBPdXRwdXQoKSBvbkNsb3NlOiBFdmVudEVtaXR0ZXI8YW55PiA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcblxuICAgIEBPdXRwdXQoKSBhY3RpdmVJbmRleENoYW5nZTogRXZlbnRFbWl0dGVyPG51bWJlcj4gPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gICAgXG4gICAgaW5pdGlhbGl6ZWQ6IGJvb2xlYW47XG4gICAgXG4gICAgdGFiczogVGFiUGFuZWxbXTtcbiAgICBcbiAgICBfYWN0aXZlSW5kZXg6IG51bWJlcjtcbiAgICBcbiAgICBwcmV2ZW50QWN0aXZlSW5kZXhQcm9wYWdhdGlvbjogYm9vbGVhbjtcblxuICAgIHRhYkNoYW5nZWQ6IGJvb2xlYW47XG5cbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgZWw6IEVsZW1lbnRSZWYsIHB1YmxpYyBjZDogQ2hhbmdlRGV0ZWN0b3JSZWYpIHt9XG4gICAgICBcbiAgICBuZ0FmdGVyQ29udGVudEluaXQoKSB7XG4gICAgICAgIHRoaXMuaW5pdFRhYnMoKTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMudGFiUGFuZWxzLmNoYW5nZXMuc3Vic2NyaWJlKF8gPT4ge1xuICAgICAgICAgICAgdGhpcy5pbml0VGFicygpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBuZ0FmdGVyVmlld0NoZWNrZWQoKSB7XG4gICAgICAgIGlmICh0aGlzLnRhYkNoYW5nZWQpIHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlSW5rQmFyKCk7XG4gICAgICAgICAgICB0aGlzLnRhYkNoYW5nZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBpbml0VGFicygpOiB2b2lkIHtcbiAgICAgICAgdGhpcy50YWJzID0gdGhpcy50YWJQYW5lbHMudG9BcnJheSgpO1xuICAgICAgICBsZXQgc2VsZWN0ZWRUYWI6IFRhYlBhbmVsID0gdGhpcy5maW5kU2VsZWN0ZWRUYWIoKTtcbiAgICAgICAgaWYgKCFzZWxlY3RlZFRhYiAmJiB0aGlzLnRhYnMubGVuZ3RoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5hY3RpdmVJbmRleCAhPSBudWxsICYmIHRoaXMudGFicy5sZW5ndGggPiB0aGlzLmFjdGl2ZUluZGV4KVxuICAgICAgICAgICAgICAgIHRoaXMudGFic1t0aGlzLmFjdGl2ZUluZGV4XS5zZWxlY3RlZCA9IHRydWU7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgdGhpcy50YWJzWzBdLnNlbGVjdGVkID0gdHJ1ZTtcblxuICAgICAgICAgICAgdGhpcy50YWJDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY2QubWFya0ZvckNoZWNrKCk7XG4gICAgfVxuICAgIFxuICAgIG9wZW4oZXZlbnQ6IEV2ZW50LCB0YWI6IFRhYlBhbmVsKSB7XG4gICAgICAgIGlmICh0YWIuZGlzYWJsZWQpIHtcbiAgICAgICAgICAgIGlmIChldmVudCkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICghdGFiLnNlbGVjdGVkKSB7XG4gICAgICAgICAgICBsZXQgc2VsZWN0ZWRUYWI6IFRhYlBhbmVsID0gdGhpcy5maW5kU2VsZWN0ZWRUYWIoKTtcbiAgICAgICAgICAgIGlmIChzZWxlY3RlZFRhYikge1xuICAgICAgICAgICAgICAgIHNlbGVjdGVkVGFiLnNlbGVjdGVkID0gZmFsc2VcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy50YWJDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgICAgIHRhYi5zZWxlY3RlZCA9IHRydWU7XG4gICAgICAgICAgICBsZXQgc2VsZWN0ZWRUYWJJbmRleCA9IHRoaXMuZmluZFRhYkluZGV4KHRhYik7XG4gICAgICAgICAgICB0aGlzLnByZXZlbnRBY3RpdmVJbmRleFByb3BhZ2F0aW9uID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlSW5kZXhDaGFuZ2UuZW1pdChzZWxlY3RlZFRhYkluZGV4KTtcbiAgICAgICAgICAgIHRoaXMub25DaGFuZ2UuZW1pdCh7b3JpZ2luYWxFdmVudDogZXZlbnQsIGluZGV4OiBzZWxlY3RlZFRhYkluZGV4fSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChldmVudCkge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBjbG9zZShldmVudDogRXZlbnQsIHRhYjogVGFiUGFuZWwpIHtcbiAgICAgICAgaWYgKHRoaXMuY29udHJvbENsb3NlKSB7XG4gICAgICAgICAgICB0aGlzLm9uQ2xvc2UuZW1pdCh7XG4gICAgICAgICAgICAgICAgb3JpZ2luYWxFdmVudDogZXZlbnQsXG4gICAgICAgICAgICAgICAgaW5kZXg6IHRoaXMuZmluZFRhYkluZGV4KHRhYiksXG4gICAgICAgICAgICAgICAgY2xvc2U6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jbG9zZVRhYih0YWIpO1xuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5jbG9zZVRhYih0YWIpO1xuICAgICAgICAgICAgdGhpcy5vbkNsb3NlLmVtaXQoe1xuICAgICAgICAgICAgICAgIG9yaWdpbmFsRXZlbnQ6IGV2ZW50LFxuICAgICAgICAgICAgICAgIGluZGV4OiB0aGlzLmZpbmRUYWJJbmRleCh0YWIpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfVxuICAgIFxuICAgIGNsb3NlVGFiKHRhYjogVGFiUGFuZWwpIHtcbiAgICAgICAgaWYgKHRhYi5kaXNhYmxlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0YWIuc2VsZWN0ZWQpIHtcbiAgICAgICAgICAgIHRoaXMudGFiQ2hhbmdlZCA9IHRydWU7XG4gICAgICAgICAgICB0YWIuc2VsZWN0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCB0aGlzLnRhYnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBsZXQgdGFiUGFuZWwgPSB0aGlzLnRhYnNbaV07XG4gICAgICAgICAgICAgICAgaWYgKCF0YWJQYW5lbC5jbG9zZWQmJiF0YWIuZGlzYWJsZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGFiUGFuZWwuc2VsZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRhYi5jbG9zZWQgPSB0cnVlO1xuICAgIH1cbiAgICBcbiAgICBmaW5kU2VsZWN0ZWRUYWIoKSB7XG4gICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCB0aGlzLnRhYnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnRhYnNbaV0uc2VsZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy50YWJzW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBcbiAgICBmaW5kVGFiSW5kZXgodGFiOiBUYWJQYW5lbCkge1xuICAgICAgICBsZXQgaW5kZXggPSAtMTtcbiAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IHRoaXMudGFicy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHRoaXMudGFic1tpXSA9PSB0YWIpIHtcbiAgICAgICAgICAgICAgICBpbmRleCA9IGk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGluZGV4O1xuICAgIH1cbiAgICBcbiAgICBnZXRCbG9ja2FibGVFbGVtZW50KCk6IEhUTUxFbGVtZW50wqB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsLm5hdGl2ZUVsZW1lbnQuY2hpbGRyZW5bMF07XG4gICAgfVxuICAgIFxuICAgIEBJbnB1dCgpIGdldCBhY3RpdmVJbmRleCgpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5fYWN0aXZlSW5kZXg7XG4gICAgfVxuXG4gICAgc2V0IGFjdGl2ZUluZGV4KHZhbDpudW1iZXIpIHtcbiAgICAgICAgdGhpcy5fYWN0aXZlSW5kZXggPSB2YWw7XG4gICAgICAgIGlmICh0aGlzLnByZXZlbnRBY3RpdmVJbmRleFByb3BhZ2F0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLnByZXZlbnRBY3RpdmVJbmRleFByb3BhZ2F0aW9uID0gZmFsc2U7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy50YWJzICYmIHRoaXMudGFicy5sZW5ndGggJiYgdGhpcy5fYWN0aXZlSW5kZXggIT0gbnVsbCAmJiB0aGlzLnRhYnMubGVuZ3RoID4gdGhpcy5fYWN0aXZlSW5kZXgpIHtcbiAgICAgICAgICAgIHRoaXMuZmluZFNlbGVjdGVkVGFiKCkuc2VsZWN0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMudGFic1t0aGlzLl9hY3RpdmVJbmRleF0uc2VsZWN0ZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdXBkYXRlSW5rQmFyKCkge1xuICAgICAgICBsZXQgdGFiSGVhZGVyID0gRG9tSGFuZGxlci5maW5kU2luZ2xlKHRoaXMubmF2YmFyLm5hdGl2ZUVsZW1lbnQsICdsaS5wLWhpZ2hsaWdodCcpO1xuICAgICAgICB0aGlzLmlua2Jhci5uYXRpdmVFbGVtZW50LnN0eWxlLndpZHRoID0gRG9tSGFuZGxlci5nZXRXaWR0aCh0YWJIZWFkZXIpICsgJ3B4JztcbiAgICAgICAgdGhpcy5pbmtiYXIubmF0aXZlRWxlbWVudC5zdHlsZS5sZWZ0ID0gIERvbUhhbmRsZXIuZ2V0T2Zmc2V0KHRhYkhlYWRlcikubGVmdCAtIERvbUhhbmRsZXIuZ2V0T2Zmc2V0KHRoaXMubmF2YmFyLm5hdGl2ZUVsZW1lbnQpLmxlZnQgKyAncHgnO1xuICAgIH1cbn1cblxuXG5ATmdNb2R1bGUoe1xuICAgIGltcG9ydHM6IFtDb21tb25Nb2R1bGUsU2hhcmVkTW9kdWxlLFRvb2x0aXBNb2R1bGUsUmlwcGxlTW9kdWxlXSxcbiAgICBleHBvcnRzOiBbVGFiVmlldyxUYWJQYW5lbCxTaGFyZWRNb2R1bGVdLFxuICAgIGRlY2xhcmF0aW9uczogW1RhYlZpZXcsVGFiUGFuZWxdXG59KVxuZXhwb3J0IGNsYXNzIFRhYlZpZXdNb2R1bGUgeyB9XG4iXX0=