import { NgModule, Component, ElementRef, Input, Output, Renderer2, Inject, forwardRef, ViewChild, NgZone, EventEmitter, ChangeDetectionStrategy, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomHandler } from 'primeng/dom';
import { ContextMenuService } from 'primeng/api';
import { RippleModule } from 'primeng/ripple';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
export class ContextMenuSub {
    constructor(contextMenu) {
        this.leafClick = new EventEmitter();
        this.contextMenu = contextMenu;
    }
    ngOnInit() {
        this.activeItemKeyChangeSubscription = this.contextMenu.contextMenuService.activeItemKeyChange$.pipe(takeUntil(this.contextMenu.ngDestroy$)).subscribe((activeItemKey) => {
            this.activeItemKey = activeItemKey;
            if (this.isActive(this.parentItemKey) && DomHandler.hasClass(this.sublistViewChild.nativeElement, 'p-submenu-list-active')) {
                this.contextMenu.positionSubmenu(this.sublistViewChild.nativeElement);
            }
            this.contextMenu.cd.markForCheck();
        });
    }
    onItemMouseEnter(event, item, key) {
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }
        if (item.disabled) {
            return;
        }
        if (item.items) {
            let childSublist = DomHandler.findSingle(event.currentTarget, '.p-submenu-list');
            DomHandler.addClass(childSublist, 'p-submenu-list-active');
        }
        this.contextMenu.contextMenuService.changeKey(key);
    }
    onItemMouseLeave(event, item) {
        if (item.disabled) {
            return;
        }
        if (this.contextMenu.el.nativeElement.contains(event.toElement)) {
            if (item.items) {
                this.contextMenu.removeActiveFromSubLists(event.currentTarget);
            }
            if (!this.root) {
                this.contextMenu.contextMenuService.changeKey(this.parentItemKey);
            }
        }
    }
    onItemClick(event, item, menuitem, key) {
        if (item.disabled) {
            event.preventDefault();
            return;
        }
        if (!item.url && !item.routerLink) {
            event.preventDefault();
        }
        if (item.command) {
            item.command({
                originalEvent: event,
                item: item
            });
        }
        if (item.items) {
            let childSublist = DomHandler.findSingle(menuitem, '.p-submenu-list');
            if (childSublist) {
                if (this.isActive(key) && DomHandler.hasClass(childSublist, 'p-submenu-list-active')) {
                    this.contextMenu.removeActiveFromSubLists(menuitem);
                }
                else {
                    DomHandler.addClass(childSublist, 'p-submenu-list-active');
                }
                this.contextMenu.contextMenuService.changeKey(key);
            }
        }
        if (!item.items) {
            this.onLeafClick();
        }
    }
    onLeafClick() {
        if (this.root) {
            this.contextMenu.hide();
        }
        this.leafClick.emit();
    }
    getKey(index) {
        return this.root ? String(index) : this.parentItemKey + '_' + index;
    }
    isActive(key) {
        return (this.activeItemKey && this.activeItemKey.startsWith(key));
    }
}
ContextMenuSub.decorators = [
    { type: Component, args: [{
                selector: 'p-contextMenuSub',
                template: `
        <ul #sublist [ngClass]="{'p-submenu-list':!root}">
            <ng-template ngFor let-child let-index="index" [ngForOf]="(root ? item : item.items)">
                <li *ngIf="child.separator" #menuitem class="p-menu-separator" [ngClass]="{'p-hidden': child.visible === false}" role="separator">
                <li *ngIf="!child.separator" #menuitem [ngClass]="{'p-menuitem':true,'p-menuitem-active': isActive(getKey(index)),'p-hidden': child.visible === false}"
                    (mouseenter)="onItemMouseEnter($event,child,getKey(index))" (mouseleave)="onItemMouseLeave($event,child)" role="none" [attr.data-ik]="getKey(index)">
                    <a *ngIf="!child.routerLink" [attr.href]="child.url ? child.url : null" [attr.target]="child.target" [attr.title]="child.title" [attr.id]="child.id" [attr.tabindex]="child.disabled ? null : '0'" (click)="onItemClick($event, child, menuitem, getKey(index))"
                        [ngClass]="{'p-menuitem-link':true,'p-disabled':child.disabled}" [ngStyle]="child.style" [class]="child.styleClass" pRipple
                        [attr.aria-haspopup]="item.items != null" [attr.aria-expanded]="isActive(getKey(index))">
                        <span class="p-menuitem-icon" *ngIf="child.icon" [ngClass]="child.icon"></span>
                        <span class="p-menuitem-text" *ngIf="child.escape !== false; else htmlLabel">{{child.label}}</span>
                        <ng-template #htmlLabel><span class="p-menuitem-text" [innerHTML]="child.label"></span></ng-template>
                        <span class="p-submenu-icon pi pi-angle-right" *ngIf="child.items"></span>
                    </a>
                    <a *ngIf="child.routerLink" [routerLink]="child.routerLink" [queryParams]="child.queryParams" [routerLinkActive]="'p-menuitem-link-active'" role="menuitem"
                        [routerLinkActiveOptions]="child.routerLinkActiveOptions||{exact:false}" [attr.target]="child.target" [attr.title]="child.title" [attr.id]="child.id" [attr.tabindex]="child.disabled ? null : '0'"
                        (click)="onItemClick($event, child, menuitem, getKey(index))" [ngClass]="{'p-menuitem-link':true,'p-disabled':child.disabled}"
                        [ngStyle]="child.style" [class]="child.styleClass" pRipple
                        [fragment]="child.fragment" [queryParamsHandling]="child.queryParamsHandling" [preserveFragment]="child.preserveFragment" [skipLocationChange]="child.skipLocationChange" [replaceUrl]="child.replaceUrl" [state]="child.state">
                        <span class="p-menuitem-icon" *ngIf="child.icon" [ngClass]="child.icon"></span>
                        <span class="p-menuitem-text" *ngIf="child.escape !== false; else htmlRouteLabel">{{child.label}}</span>
                        <ng-template #htmlRouteLabel><span class="p-menuitem-text" [innerHTML]="child.label"></span></ng-template>
                        <span class="p-submenu-icon pi pi-angle-right" *ngIf="child.items"></span>
                    </a>
                    <p-contextMenuSub [parentItemKey]="getKey(index)" [item]="child" *ngIf="child.items" (leafClick)="onLeafClick()"></p-contextMenuSub>
                </li>
            </ng-template>
        </ul>
    `,
                encapsulation: ViewEncapsulation.None
            },] }
];
ContextMenuSub.ctorParameters = () => [
    { type: undefined, decorators: [{ type: Inject, args: [forwardRef(() => ContextMenu),] }] }
];
ContextMenuSub.propDecorators = {
    item: [{ type: Input }],
    root: [{ type: Input }],
    parentItemKey: [{ type: Input }],
    leafClick: [{ type: Output }],
    sublistViewChild: [{ type: ViewChild, args: ['sublist',] }],
    menuitemViewChild: [{ type: ViewChild, args: ['menuitem',] }]
};
export class ContextMenu {
    constructor(el, renderer, cd, zone, contextMenuService) {
        this.el = el;
        this.renderer = renderer;
        this.cd = cd;
        this.zone = zone;
        this.contextMenuService = contextMenuService;
        this.autoZIndex = true;
        this.baseZIndex = 0;
        this.triggerEvent = 'contextmenu';
        this.onShow = new EventEmitter();
        this.onHide = new EventEmitter();
        this.ngDestroy$ = new Subject();
    }
    ngAfterViewInit() {
        if (this.global) {
            const documentTarget = this.el ? this.el.nativeElement.ownerDocument : 'document';
            this.triggerEventListener = this.renderer.listen(documentTarget, this.triggerEvent, (event) => {
                this.show(event);
                event.preventDefault();
            });
        }
        else if (this.target) {
            this.triggerEventListener = this.renderer.listen(this.target, this.triggerEvent, (event) => {
                this.show(event);
                event.preventDefault();
                event.stopPropagation();
            });
        }
        if (this.appendTo) {
            if (this.appendTo === 'body')
                document.body.appendChild(this.containerViewChild.nativeElement);
            else
                DomHandler.appendChild(this.containerViewChild.nativeElement, this.appendTo);
        }
    }
    show(event) {
        this.clearActiveItem();
        this.position(event);
        this.moveOnTop();
        this.containerViewChild.nativeElement.style.display = 'block';
        DomHandler.fadeIn(this.containerViewChild.nativeElement, 250);
        this.bindGlobalListeners();
        if (event) {
            event.preventDefault();
        }
        this.onShow.emit();
    }
    hide() {
        this.containerViewChild.nativeElement.style.display = 'none';
        this.unbindGlobalListeners();
        this.onHide.emit();
    }
    moveOnTop() {
        if (this.autoZIndex) {
            this.containerViewChild.nativeElement.style.zIndex = String(this.baseZIndex + (++DomHandler.zindex));
        }
    }
    toggle(event) {
        if (this.containerViewChild.nativeElement.offsetParent)
            this.hide();
        else
            this.show(event);
    }
    position(event) {
        if (event) {
            let left = event.pageX + 1;
            let top = event.pageY + 1;
            let width = this.containerViewChild.nativeElement.offsetParent ? this.containerViewChild.nativeElement.offsetWidth : DomHandler.getHiddenElementOuterWidth(this.containerViewChild.nativeElement);
            let height = this.containerViewChild.nativeElement.offsetParent ? this.containerViewChild.nativeElement.offsetHeight : DomHandler.getHiddenElementOuterHeight(this.containerViewChild.nativeElement);
            let viewport = DomHandler.getViewport();
            //flip
            if (left + width - document.body.scrollLeft > viewport.width) {
                left -= width;
            }
            //flip
            if (top + height - document.body.scrollTop > viewport.height) {
                top -= height;
            }
            //fit
            if (left < document.body.scrollLeft) {
                left = document.body.scrollLeft;
            }
            //fit
            if (top < document.body.scrollTop) {
                top = document.body.scrollTop;
            }
            this.containerViewChild.nativeElement.style.left = left + 'px';
            this.containerViewChild.nativeElement.style.top = top + 'px';
        }
    }
    positionSubmenu(sublist) {
        let parentMenuItem = sublist.parentElement.parentElement;
        let viewport = DomHandler.getViewport();
        let sublistWidth = sublist.offsetParent ? sublist.offsetWidth : DomHandler.getHiddenElementOuterWidth(sublist);
        let sublistHeight = sublist.offsetHeight ? sublist.offsetHeight : DomHandler.getHiddenElementOuterHeight(sublist);
        let itemOuterWidth = DomHandler.getOuterWidth(parentMenuItem.children[0]);
        let itemOuterHeight = DomHandler.getOuterHeight(parentMenuItem.children[0]);
        let containerOffset = DomHandler.getOffset(parentMenuItem.parentElement);
        sublist.style.zIndex = ++DomHandler.zindex;
        if ((parseInt(containerOffset.top) + itemOuterHeight + sublistHeight) > (viewport.height - DomHandler.calculateScrollbarHeight())) {
            sublist.style.removeProperty('top');
            sublist.style.bottom = '0px';
        }
        else {
            sublist.style.removeProperty('bottom');
            sublist.style.top = '0px';
        }
        if ((parseInt(containerOffset.left) + itemOuterWidth + sublistWidth) > (viewport.width - DomHandler.calculateScrollbarWidth())) {
            sublist.style.left = -sublistWidth + 'px';
        }
        else {
            sublist.style.left = itemOuterWidth + 'px';
        }
    }
    isItemMatched(menuitem) {
        return DomHandler.hasClass(menuitem, 'p-menuitem') && !DomHandler.hasClass(menuitem.children[0], 'p-disabled');
    }
    findNextItem(menuitem, isRepeated) {
        let nextMenuitem = menuitem.nextElementSibling;
        if (nextMenuitem) {
            return this.isItemMatched(nextMenuitem) ? nextMenuitem : this.findNextItem(nextMenuitem, isRepeated);
        }
        else {
            let firstItem = menuitem.parentElement.children[0];
            return this.isItemMatched(firstItem) ? firstItem : (!isRepeated ? this.findNextItem(firstItem, true) : null);
        }
    }
    findPrevItem(menuitem, isRepeated) {
        let prevMenuitem = menuitem.previousElementSibling;
        if (prevMenuitem) {
            return this.isItemMatched(prevMenuitem) ? prevMenuitem : this.findPrevItem(prevMenuitem, isRepeated);
        }
        else {
            let lastItem = menuitem.parentElement.children[menuitem.parentElement.children.length - 1];
            return this.isItemMatched(lastItem) ? lastItem : (!isRepeated ? this.findPrevItem(lastItem, true) : null);
        }
    }
    getActiveItem() {
        let activeItemKey = this.contextMenuService.activeItemKey;
        return activeItemKey == null ? null : DomHandler.findSingle(this.containerViewChild.nativeElement, '.p-menuitem[data-ik="' + activeItemKey + '"]');
    }
    clearActiveItem() {
        if (this.contextMenuService.activeItemKey) {
            this.removeActiveFromSubLists(this.containerViewChild.nativeElement);
            this.contextMenuService.reset();
        }
    }
    removeActiveFromSubLists(el) {
        let sublists = DomHandler.find(el, '.p-submenu-list-active');
        for (let sublist of sublists) {
            DomHandler.removeClass(sublist, 'p-submenu-list-active');
        }
    }
    removeActiveFromSublist(menuitem) {
        if (menuitem) {
            let sublist = DomHandler.findSingle(menuitem, '.p-submenu-list');
            if (sublist && DomHandler.hasClass(menuitem, 'p-submenu-list-active')) {
                DomHandler.removeClass(menuitem, 'p-submenu-list-active');
            }
        }
    }
    bindGlobalListeners() {
        if (!this.documentClickListener) {
            const documentTarget = this.el ? this.el.nativeElement.ownerDocument : 'document';
            this.documentClickListener = this.renderer.listen(documentTarget, 'click', (event) => {
                if (this.containerViewChild.nativeElement.offsetParent && this.isOutsideClicked(event) && event.button !== 2) {
                    this.hide();
                }
            });
        }
        this.zone.runOutsideAngular(() => {
            if (!this.windowResizeListener) {
                this.windowResizeListener = this.onWindowResize.bind(this);
                window.addEventListener('resize', this.windowResizeListener);
            }
        });
        if (!this.documentKeydownListener) {
            const documentTarget = this.el ? this.el.nativeElement.ownerDocument : 'document';
            this.documentKeydownListener = this.renderer.listen(documentTarget, 'keydown', (event) => {
                let activeItem = this.getActiveItem();
                switch (event.key) {
                    case 'ArrowDown':
                        if (activeItem) {
                            this.removeActiveFromSublist(activeItem);
                            activeItem = this.findNextItem(activeItem);
                        }
                        else {
                            let firstItem = DomHandler.findSingle(this.containerViewChild.nativeElement, '.p-menuitem-link').parentElement;
                            activeItem = this.isItemMatched(firstItem) ? firstItem : this.findNextItem(firstItem);
                        }
                        if (activeItem) {
                            this.contextMenuService.changeKey(activeItem.getAttribute('data-ik'));
                        }
                        event.preventDefault();
                        break;
                    case 'ArrowUp':
                        if (activeItem) {
                            this.removeActiveFromSublist(activeItem);
                            activeItem = this.findPrevItem(activeItem);
                        }
                        else {
                            let sublist = DomHandler.findSingle(this.containerViewChild.nativeElement, 'ul');
                            let lastItem = sublist.children[sublist.children.length - 1];
                            activeItem = this.isItemMatched(lastItem) ? lastItem : this.findPrevItem(lastItem);
                        }
                        if (activeItem) {
                            this.contextMenuService.changeKey(activeItem.getAttribute('data-ik'));
                        }
                        event.preventDefault();
                        break;
                    case 'ArrowRight':
                        if (activeItem) {
                            let sublist = DomHandler.findSingle(activeItem, '.p-submenu-list');
                            if (sublist) {
                                DomHandler.addClass(sublist, 'p-submenu-list-active');
                                activeItem = DomHandler.findSingle(sublist, '.p-menuitem-link:not(.p-disabled)').parentElement;
                                if (activeItem) {
                                    this.contextMenuService.changeKey(activeItem.getAttribute('data-ik'));
                                }
                            }
                        }
                        event.preventDefault();
                        break;
                    case 'ArrowLeft':
                        if (activeItem) {
                            let sublist = activeItem.parentElement;
                            if (sublist && DomHandler.hasClass(sublist, 'p-submenu-list-active')) {
                                DomHandler.removeClass(sublist, 'p-submenu-list-active');
                                activeItem = sublist.parentElement.parentElement;
                                if (activeItem) {
                                    this.contextMenuService.changeKey(activeItem.getAttribute('data-ik'));
                                }
                            }
                        }
                        event.preventDefault();
                        break;
                    case 'Escape':
                        this.hide();
                        event.preventDefault();
                        break;
                    case 'Enter':
                        if (activeItem) {
                            this.handleItemClick(event, this.findModelItemFromKey(this.contextMenuService.activeItemKey), activeItem);
                        }
                        event.preventDefault();
                        break;
                    default:
                        break;
                }
            });
        }
    }
    findModelItemFromKey(key) {
        if (key == null || !this.model) {
            return null;
        }
        let indexes = key.split('_');
        return indexes.reduce((item, currentIndex) => {
            return item ? item.items[currentIndex] : this.model[currentIndex];
        }, null);
    }
    handleItemClick(event, item, menuitem) {
        if (!item || item.disabled) {
            return;
        }
        if (item.command) {
            item.command({
                originalEvent: event,
                item: item
            });
        }
        if (item.items) {
            let childSublist = DomHandler.findSingle(menuitem, '.p-submenu-list');
            if (childSublist) {
                if (DomHandler.hasClass(childSublist, 'p-submenu-list-active')) {
                    this.removeActiveFromSubLists(menuitem);
                }
                else {
                    DomHandler.addClass(childSublist, 'p-submenu-list-active');
                    this.positionSubmenu(childSublist);
                }
            }
        }
        if (!item.items) {
            this.hide();
        }
    }
    unbindGlobalListeners() {
        if (this.documentClickListener) {
            this.documentClickListener();
            this.documentClickListener = null;
        }
        if (this.windowResizeListener) {
            window.removeEventListener('resize', this.windowResizeListener);
            this.windowResizeListener = null;
        }
        if (this.documentKeydownListener) {
            this.documentKeydownListener();
            this.documentKeydownListener = null;
        }
    }
    onWindowResize(event) {
        if (this.containerViewChild.nativeElement.offsetParent) {
            this.hide();
        }
    }
    isOutsideClicked(event) {
        return !(this.containerViewChild.nativeElement.isSameNode(event.target) || this.containerViewChild.nativeElement.contains(event.target));
    }
    ngOnDestroy() {
        this.unbindGlobalListeners();
        if (this.triggerEventListener) {
            this.triggerEventListener();
        }
        if (this.appendTo) {
            this.el.nativeElement.appendChild(this.containerViewChild.nativeElement);
        }
        this.ngDestroy$.next(true);
        this.ngDestroy$.complete();
    }
}
ContextMenu.decorators = [
    { type: Component, args: [{
                selector: 'p-contextMenu',
                template: `
        <div #container [ngClass]="'p-contextmenu p-component'" [class]="styleClass" [ngStyle]="style">
            <p-contextMenuSub [item]="model" [root]="true"></p-contextMenuSub>
        </div>
    `,
                changeDetection: ChangeDetectionStrategy.OnPush,
                encapsulation: ViewEncapsulation.None,
                styles: [".p-contextmenu{display:none;position:absolute}.p-contextmenu ul{list-style:none;margin:0;padding:0}.p-contextmenu .p-submenu-list{display:none;min-width:100%;position:absolute;z-index:1}.p-contextmenu .p-menuitem-link{align-items:center;cursor:pointer;display:flex;overflow:hidden;position:relative;text-decoration:none}.p-contextmenu .p-menuitem-text{line-height:1}.p-contextmenu .p-menuitem{position:relative}.p-contextmenu .p-menuitem-link .p-submenu-icon{margin-left:auto}.p-contextmenu .p-menuitem-active>p-contextmenusub>.p-submenu-list.p-submenu-list-active{display:block!important}"]
            },] }
];
ContextMenu.ctorParameters = () => [
    { type: ElementRef },
    { type: Renderer2 },
    { type: ChangeDetectorRef },
    { type: NgZone },
    { type: ContextMenuService }
];
ContextMenu.propDecorators = {
    model: [{ type: Input }],
    global: [{ type: Input }],
    target: [{ type: Input }],
    style: [{ type: Input }],
    styleClass: [{ type: Input }],
    appendTo: [{ type: Input }],
    autoZIndex: [{ type: Input }],
    baseZIndex: [{ type: Input }],
    triggerEvent: [{ type: Input }],
    onShow: [{ type: Output }],
    onHide: [{ type: Output }],
    containerViewChild: [{ type: ViewChild, args: ['container',] }]
};
export class ContextMenuModule {
}
ContextMenuModule.decorators = [
    { type: NgModule, args: [{
                imports: [CommonModule, RouterModule, RippleModule],
                exports: [ContextMenu, RouterModule],
                declarations: [ContextMenu, ContextMenuSub],
                providers: [ContextMenuService]
            },] }
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dG1lbnUuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vLi4vc3JjL2FwcC9jb21wb25lbnRzL2NvbnRleHRtZW51LyIsInNvdXJjZXMiOlsiY29udGV4dG1lbnUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFFBQVEsRUFBQyxTQUFTLEVBQUMsVUFBVSxFQUF5QixLQUFLLEVBQUMsTUFBTSxFQUFDLFNBQVMsRUFBQyxNQUFNLEVBQUMsVUFBVSxFQUFDLFNBQVMsRUFBQyxNQUFNLEVBQUMsWUFBWSxFQUFDLHVCQUF1QixFQUFFLGlCQUFpQixFQUFFLGlCQUFpQixFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQzNOLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUMvQyxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sYUFBYSxDQUFDO0FBQ3pDLE9BQU8sRUFBWSxrQkFBa0IsRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUMzRCxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFDOUMsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBQy9DLE9BQU8sRUFBRSxPQUFPLEVBQWdCLE1BQU0sTUFBTSxDQUFDO0FBQzdDLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQW1DM0MsTUFBTSxPQUFPLGNBQWM7SUFzQnZCLFlBQW1ELFdBQVc7UUFkcEQsY0FBUyxHQUFzQixJQUFJLFlBQVksRUFBRSxDQUFDO1FBZXhELElBQUksQ0FBQyxXQUFXLEdBQUcsV0FBMEIsQ0FBQztJQUNsRCxDQUFDO0lBRUQsUUFBUTtRQUNKLElBQUksQ0FBQywrQkFBK0IsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLGtCQUFrQixDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFD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bGUsQ29tcG9uZW50LEVsZW1lbnRSZWYsQWZ0ZXJWaWV3SW5pdCxPbkRlc3Ryb3ksSW5wdXQsT3V0cHV0LFJlbmRlcmVyMixJbmplY3QsZm9yd2FyZFJlZixWaWV3Q2hpbGQsTmdab25lLEV2ZW50RW1pdHRlcixDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSwgVmlld0VuY2Fwc3VsYXRpb24sIENoYW5nZURldGVjdG9yUmVmIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBDb21tb25Nb2R1bGUgfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHsgRG9tSGFuZGxlciB9IGZyb20gJ3ByaW1lbmcvZG9tJztcbmltcG9ydCB7IE1lbnVJdGVtLCBDb250ZXh0TWVudVNlcnZpY2UgfSBmcm9tICdwcmltZW5nL2FwaSc7XG5pbXBvcnQgeyBSaXBwbGVNb2R1bGUgfSBmcm9tICdwcmltZW5nL3JpcHBsZSc7XG5pbXBvcnQgeyBSb3V0ZXJNb2R1bGUgfSBmcm9tICdAYW5ndWxhci9yb3V0ZXInO1xuaW1wb3J0IHsgU3ViamVjdCwgU3Vic2NyaXB0aW9uIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyB0YWtlVW50aWwgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5cbkBDb21wb25lbnQoe1xuICAgIHNlbGVjdG9yOiAncC1jb250ZXh0TWVudVN1YicsXG4gICAgdGVtcGxhdGU6IGBcbiAgICAgICAgPHVsICNzdWJsaXN0IFtuZ0NsYXNzXT1cInsncC1zdWJtZW51LWxpc3QnOiFyb290fVwiPlxuICAgICAgICAgICAgPG5nLXRlbXBsYXRlIG5nRm9yIGxldC1jaGlsZCBsZXQtaW5kZXg9XCJpbmRleFwiIFtuZ0Zvck9mXT1cIihyb290ID8gaXRlbSA6IGl0ZW0uaXRlbXMpXCI+XG4gICAgICAgICAgICAgICAgPGxpICpuZ0lmPVwiY2hpbGQuc2VwYXJhdG9yXCIgI21lbnVpdGVtIGNsYXNzPVwicC1tZW51LXNlcGFyYXRvclwiIFtuZ0NsYXNzXT1cInsncC1oaWRkZW4nOiBjaGlsZC52aXNpYmxlID09PSBmYWxzZX1cIiByb2xlPVwic2VwYXJhdG9yXCI+XG4gICAgICAgICAgICAgICAgPGxpICpuZ0lmPVwiIWNoaWxkLnNlcGFyYXRvclwiICNtZW51aXRlbSBbbmdDbGFzc109XCJ7J3AtbWVudWl0ZW0nOnRydWUsJ3AtbWVudWl0ZW0tYWN0aXZlJzogaXNBY3RpdmUoZ2V0S2V5KGluZGV4KSksJ3AtaGlkZGVuJzogY2hpbGQudmlzaWJsZSA9PT0gZmFsc2V9XCJcbiAgICAgICAgICAgICAgICAgICAgKG1vdXNlZW50ZXIpPVwib25JdGVtTW91c2VFbnRlcigkZXZlbnQsY2hpbGQsZ2V0S2V5KGluZGV4KSlcIiAobW91c2VsZWF2ZSk9XCJvbkl0ZW1Nb3VzZUxlYXZlKCRldmVudCxjaGlsZClcIiByb2xlPVwibm9uZVwiIFthdHRyLmRhdGEtaWtdPVwiZ2V0S2V5KGluZGV4KVwiPlxuICAgICAgICAgICAgICAgICAgICA8YSAqbmdJZj1cIiFjaGlsZC5yb3V0ZXJMaW5rXCIgW2F0dHIuaHJlZl09XCJjaGlsZC51cmwgPyBjaGlsZC51cmwgOiBudWxsXCIgW2F0dHIudGFyZ2V0XT1cImNoaWxkLnRhcmdldFwiIFthdHRyLnRpdGxlXT1cImNoaWxkLnRpdGxlXCIgW2F0dHIuaWRdPVwiY2hpbGQuaWRcIiBbYXR0ci50YWJpbmRleF09XCJjaGlsZC5kaXNhYmxlZCA/IG51bGwgOiAnMCdcIiAoY2xpY2spPVwib25JdGVtQ2xpY2soJGV2ZW50LCBjaGlsZCwgbWVudWl0ZW0sIGdldEtleShpbmRleCkpXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIFtuZ0NsYXNzXT1cInsncC1tZW51aXRlbS1saW5rJzp0cnVlLCdwLWRpc2FibGVkJzpjaGlsZC5kaXNhYmxlZH1cIiBbbmdTdHlsZV09XCJjaGlsZC5zdHlsZVwiIFtjbGFzc109XCJjaGlsZC5zdHlsZUNsYXNzXCIgcFJpcHBsZVxuICAgICAgICAgICAgICAgICAgICAgICAgW2F0dHIuYXJpYS1oYXNwb3B1cF09XCJpdGVtLml0ZW1zICE9IG51bGxcIiBbYXR0ci5hcmlhLWV4cGFuZGVkXT1cImlzQWN0aXZlKGdldEtleShpbmRleCkpXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cInAtbWVudWl0ZW0taWNvblwiICpuZ0lmPVwiY2hpbGQuaWNvblwiIFtuZ0NsYXNzXT1cImNoaWxkLmljb25cIj48L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cInAtbWVudWl0ZW0tdGV4dFwiICpuZ0lmPVwiY2hpbGQuZXNjYXBlICE9PSBmYWxzZTsgZWxzZSBodG1sTGFiZWxcIj57e2NoaWxkLmxhYmVsfX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8bmctdGVtcGxhdGUgI2h0bWxMYWJlbD48c3BhbiBjbGFzcz1cInAtbWVudWl0ZW0tdGV4dFwiIFtpbm5lckhUTUxdPVwiY2hpbGQubGFiZWxcIj48L3NwYW4+PC9uZy10ZW1wbGF0ZT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwicC1zdWJtZW51LWljb24gcGkgcGktYW5nbGUtcmlnaHRcIiAqbmdJZj1cImNoaWxkLml0ZW1zXCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L2E+XG4gICAgICAgICAgICAgICAgICAgIDxhICpuZ0lmPVwiY2hpbGQucm91dGVyTGlua1wiIFtyb3V0ZXJMaW5rXT1cImNoaWxkLnJvdXRlckxpbmtcIiBbcXVlcnlQYXJhbXNdPVwiY2hpbGQucXVlcnlQYXJhbXNcIiBbcm91dGVyTGlua0FjdGl2ZV09XCIncC1tZW51aXRlbS1saW5rLWFjdGl2ZSdcIiByb2xlPVwibWVudWl0ZW1cIlxuICAgICAgICAgICAgICAgICAgICAgICAgW3JvdXRlckxpbmtBY3RpdmVPcHRpb25zXT1cImNoaWxkLnJvdXRlckxpbmtBY3RpdmVPcHRpb25zfHx7ZXhhY3Q6ZmFsc2V9XCIgW2F0dHIudGFyZ2V0XT1cImNoaWxkLnRhcmdldFwiIFthdHRyLnRpdGxlXT1cImNoaWxkLnRpdGxlXCIgW2F0dHIuaWRdPVwiY2hpbGQuaWRcIiBbYXR0ci50YWJpbmRleF09XCJjaGlsZC5kaXNhYmxlZCA/IG51bGwgOiAnMCdcIlxuICAgICAgICAgICAgICAgICAgICAgICAgKGNsaWNrKT1cIm9uSXRlbUNsaWNrKCRldmVudCwgY2hpbGQsIG1lbnVpdGVtLCBnZXRLZXkoaW5kZXgpKVwiIFtuZ0NsYXNzXT1cInsncC1tZW51aXRlbS1saW5rJzp0cnVlLCdwLWRpc2FibGVkJzpjaGlsZC5kaXNhYmxlZH1cIlxuICAgICAgICAgICAgICAgICAgICAgICAgW25nU3R5bGVdPVwiY2hpbGQuc3R5bGVcIiBbY2xhc3NdPVwiY2hpbGQuc3R5bGVDbGFzc1wiIHBSaXBwbGVcbiAgICAgICAgICAgICAgICAgICAgICAgIFtmcmFnbWVudF09XCJjaGlsZC5mcmFnbWVudFwiIFtxdWVyeVBhcmFtc0hhbmRsaW5nXT1cImNoaWxkLnF1ZXJ5UGFyYW1zSGFuZGxpbmdcIiBbcHJlc2VydmVGcmFnbWVudF09XCJjaGlsZC5wcmVzZXJ2ZUZyYWdtZW50XCIgW3NraXBMb2NhdGlvbkNoYW5nZV09XCJjaGlsZC5za2lwTG9jYXRpb25DaGFuZ2VcIiBbcmVwbGFjZVVybF09XCJjaGlsZC5yZXBsYWNlVXJsXCIgW3N0YXRlXT1cImNoaWxkLnN0YXRlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cInAtbWVudWl0ZW0taWNvblwiICpuZ0lmPVwiY2hpbGQuaWNvblwiIFtuZ0NsYXNzXT1cImNoaWxkLmljb25cIj48L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cInAtbWVudWl0ZW0tdGV4dFwiICpuZ0lmPVwiY2hpbGQuZXNjYXBlICE9PSBmYWxzZTsgZWxzZSBodG1sUm91dGVMYWJlbFwiPnt7Y2hpbGQubGFiZWx9fTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxuZy10ZW1wbGF0ZSAjaHRtbFJvdXRlTGFiZWw+PHNwYW4gY2xhc3M9XCJwLW1lbnVpdGVtLXRleHRcIiBbaW5uZXJIVE1MXT1cImNoaWxkLmxhYmVsXCI+PC9zcGFuPjwvbmctdGVtcGxhdGU+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cInAtc3VibWVudS1pY29uIHBpIHBpLWFuZ2xlLXJpZ2h0XCIgKm5nSWY9XCJjaGlsZC5pdGVtc1wiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPC9hPlxuICAgICAgICAgICAgICAgICAgICA8cC1jb250ZXh0TWVudVN1YiBbcGFyZW50SXRlbUtleV09XCJnZXRLZXkoaW5kZXgpXCIgW2l0ZW1dPVwiY2hpbGRcIiAqbmdJZj1cImNoaWxkLml0ZW1zXCIgKGxlYWZDbGljayk9XCJvbkxlYWZDbGljaygpXCI+PC9wLWNvbnRleHRNZW51U3ViPlxuICAgICAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgICA8L3VsPlxuICAgIGAsXG4gICAgZW5jYXBzdWxhdGlvbjogVmlld0VuY2Fwc3VsYXRpb24uTm9uZVxufSlcbmV4cG9ydCBjbGFzcyBDb250ZXh0TWVudVN1YiB7XG5cbiAgICBASW5wdXQoKSBpdGVtOiBNZW51SXRlbTtcblxuICAgIEBJbnB1dCgpIHJvb3Q6IGJvb2xlYW47XG5cbiAgICBASW5wdXQoKSBwYXJlbnRJdGVtS2V5OiBhbnk7XG5cbiAgICBAT3V0cHV0KCkgbGVhZkNsaWNrOiBFdmVudEVtaXR0ZXI8YW55PiA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcblxuICAgIEBWaWV3Q2hpbGQoJ3N1Ymxpc3QnKSBzdWJsaXN0Vmlld0NoaWxkOiBFbGVtZW50UmVmO1xuXG4gICAgQFZpZXdDaGlsZCgnbWVudWl0ZW0nKSBtZW51aXRlbVZpZXdDaGlsZDogRWxlbWVudFJlZjtcblxuICAgIGNvbnRleHRNZW51OiBDb250ZXh0TWVudTtcblxuICAgIGFjdGl2ZUl0ZW1LZXk6IHN0cmluZztcblxuICAgIGhpZGVUaW1lb3V0OiBhbnk7XG5cbiAgICBhY3RpdmVJdGVtS2V5Q2hhbmdlU3Vic2NyaXB0aW9uOiBTdWJzY3JpcHRpb247XG5cbiAgICBjb25zdHJ1Y3RvcihASW5qZWN0KGZvcndhcmRSZWYoKCkgPT4gQ29udGV4dE1lbnUpKSBjb250ZXh0TWVudSkge1xuICAgICAgICB0aGlzLmNvbnRleHRNZW51ID0gY29udGV4dE1lbnUgYXMgQ29udGV4dE1lbnU7XG4gICAgfVxuXG4gICAgbmdPbkluaXQoKSB7XG4gICAgICAgIHRoaXMuYWN0aXZlSXRlbUtleUNoYW5nZVN1YnNjcmlwdGlvbiA9IHRoaXMuY29udGV4dE1lbnUuY29udGV4dE1lbnVTZXJ2aWNlLmFjdGl2ZUl0ZW1LZXlDaGFuZ2UkLnBpcGUodGFrZVVudGlsKHRoaXMuY29udGV4dE1lbnUubmdEZXN0cm95JCkpLnN1YnNjcmliZSgoYWN0aXZlSXRlbUtleSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5hY3RpdmVJdGVtS2V5ID0gYWN0aXZlSXRlbUtleTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuaXNBY3RpdmUodGhpcy5wYXJlbnRJdGVtS2V5KSAmJiBEb21IYW5kbGVyLmhhc0NsYXNzKHRoaXMuc3VibGlzdFZpZXdDaGlsZC5uYXRpdmVFbGVtZW50LCAncC1zdWJtZW51LWxpc3QtYWN0aXZlJykpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRleHRNZW51LnBvc2l0aW9uU3VibWVudSh0aGlzLnN1Ymxpc3RWaWV3Q2hpbGQubmF0aXZlRWxlbWVudCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuY29udGV4dE1lbnUuY2QubWFya0ZvckNoZWNrKCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIG9uSXRlbU1vdXNlRW50ZXIoZXZlbnQsIGl0ZW0sIGtleSkge1xuICAgICAgICBpZiAodGhpcy5oaWRlVGltZW91dCkge1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuaGlkZVRpbWVvdXQpO1xuICAgICAgICAgICAgdGhpcy5oaWRlVGltZW91dCA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaXRlbS5kaXNhYmxlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGl0ZW0uaXRlbXMpIHtcbiAgICAgICAgICAgIGxldCBjaGlsZFN1Ymxpc3QgPSBEb21IYW5kbGVyLmZpbmRTaW5nbGUoZXZlbnQuY3VycmVudFRhcmdldCwgJy5wLXN1Ym1lbnUtbGlzdCcpO1xuICAgICAgICAgICAgRG9tSGFuZGxlci5hZGRDbGFzcyhjaGlsZFN1Ymxpc3QsICdwLXN1Ym1lbnUtbGlzdC1hY3RpdmUnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY29udGV4dE1lbnUuY29udGV4dE1lbnVTZXJ2aWNlLmNoYW5nZUtleShrZXkpO1xuICAgIH1cblxuICAgIG9uSXRlbU1vdXNlTGVhdmUoZXZlbnQsIGl0ZW0pIHtcbiAgICAgICAgaWYgKGl0ZW0uZGlzYWJsZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmNvbnRleHRNZW51LmVsLm5hdGl2ZUVsZW1lbnQuY29udGFpbnMoPE5vZGU+IGV2ZW50LnRvRWxlbWVudCkpIHtcbiAgICAgICAgICAgIGlmIChpdGVtLml0ZW1zKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb250ZXh0TWVudS5yZW1vdmVBY3RpdmVGcm9tU3ViTGlzdHMoZXZlbnQuY3VycmVudFRhcmdldCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghdGhpcy5yb290KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb250ZXh0TWVudS5jb250ZXh0TWVudVNlcnZpY2UuY2hhbmdlS2V5KHRoaXMucGFyZW50SXRlbUtleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBvbkl0ZW1DbGljayhldmVudCwgaXRlbSwgbWVudWl0ZW0sIGtleSkge1xuICAgICAgICBpZiAoaXRlbS5kaXNhYmxlZCkge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghaXRlbS51cmwgJiYgIWl0ZW0ucm91dGVyTGluaykge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpdGVtLmNvbW1hbmQpIHtcbiAgICAgICAgICAgIGl0ZW0uY29tbWFuZCh7XG4gICAgICAgICAgICAgICAgb3JpZ2luYWxFdmVudDogZXZlbnQsXG4gICAgICAgICAgICAgICAgaXRlbTogaXRlbVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaXRlbS5pdGVtcykge1xuICAgICAgICAgICAgbGV0IGNoaWxkU3VibGlzdCA9IERvbUhhbmRsZXIuZmluZFNpbmdsZShtZW51aXRlbSwgJy5wLXN1Ym1lbnUtbGlzdCcpO1xuXG4gICAgICAgICAgICBpZiAoY2hpbGRTdWJsaXN0KSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaXNBY3RpdmUoa2V5KSAmJiBEb21IYW5kbGVyLmhhc0NsYXNzKGNoaWxkU3VibGlzdCwgJ3Atc3VibWVudS1saXN0LWFjdGl2ZScpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29udGV4dE1lbnUucmVtb3ZlQWN0aXZlRnJvbVN1Ykxpc3RzKG1lbnVpdGVtKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIERvbUhhbmRsZXIuYWRkQ2xhc3MoY2hpbGRTdWJsaXN0LCAncC1zdWJtZW51LWxpc3QtYWN0aXZlJyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5jb250ZXh0TWVudS5jb250ZXh0TWVudVNlcnZpY2UuY2hhbmdlS2V5KGtleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWl0ZW0uaXRlbXMpIHtcbiAgICAgICAgICAgIHRoaXMub25MZWFmQ2xpY2soKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG9uTGVhZkNsaWNrKCkge1xuICAgICAgICBpZiAodGhpcy5yb290KSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHRNZW51LmhpZGUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMubGVhZkNsaWNrLmVtaXQoKTtcbiAgICB9XG5cbiAgICBnZXRLZXkoaW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucm9vdCA/IFN0cmluZyhpbmRleCkgOiB0aGlzLnBhcmVudEl0ZW1LZXkgKyAnXycgKyBpbmRleDtcbiAgICB9XG5cbiAgICBpc0FjdGl2ZShrZXkpIHtcbiAgICAgICAgcmV0dXJuICh0aGlzLmFjdGl2ZUl0ZW1LZXkgJiYgdGhpcy5hY3RpdmVJdGVtS2V5LnN0YXJ0c1dpdGgoa2V5KSk7XG4gICAgfVxufVxuXG5AQ29tcG9uZW50KHtcbiAgICBzZWxlY3RvcjogJ3AtY29udGV4dE1lbnUnLFxuICAgIHRlbXBsYXRlOiBgXG4gICAgICAgIDxkaXYgI2NvbnRhaW5lciBbbmdDbGFzc109XCIncC1jb250ZXh0bWVudSBwLWNvbXBvbmVudCdcIiBbY2xhc3NdPVwic3R5bGVDbGFzc1wiIFtuZ1N0eWxlXT1cInN0eWxlXCI+XG4gICAgICAgICAgICA8cC1jb250ZXh0TWVudVN1YiBbaXRlbV09XCJtb2RlbFwiIFtyb290XT1cInRydWVcIj48L3AtY29udGV4dE1lbnVTdWI+XG4gICAgICAgIDwvZGl2PlxuICAgIGAsXG4gICAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2gsXG4gICAgZW5jYXBzdWxhdGlvbjogVmlld0VuY2Fwc3VsYXRpb24uTm9uZSxcbiAgICBzdHlsZVVybHM6IFsnLi9jb250ZXh0bWVudS5jc3MnXVxufSlcbmV4cG9ydCBjbGFzcyBDb250ZXh0TWVudSBpbXBsZW1lbnRzIEFmdGVyVmlld0luaXQsIE9uRGVzdHJveSB7XG5cbiAgICBASW5wdXQoKSBtb2RlbDogTWVudUl0ZW1bXTtcblxuICAgIEBJbnB1dCgpIGdsb2JhbDogYm9vbGVhbjtcblxuICAgIEBJbnB1dCgpIHRhcmdldDogYW55O1xuXG4gICAgQElucHV0KCkgc3R5bGU6IGFueTtcblxuICAgIEBJbnB1dCgpIHN0eWxlQ2xhc3M6IHN0cmluZztcblxuICAgIEBJbnB1dCgpIGFwcGVuZFRvOiBhbnk7XG5cbiAgICBASW5wdXQoKSBhdXRvWkluZGV4OiBib29sZWFuID0gdHJ1ZTtcblxuICAgIEBJbnB1dCgpIGJhc2VaSW5kZXg6IG51bWJlciA9IDA7XG5cbiAgICBASW5wdXQoKSB0cmlnZ2VyRXZlbnQ6IHN0cmluZyA9ICdjb250ZXh0bWVudSc7XG5cbiAgICBAT3V0cHV0KCkgb25TaG93OiBFdmVudEVtaXR0ZXI8YW55PiA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcblxuICAgIEBPdXRwdXQoKSBvbkhpZGU6IEV2ZW50RW1pdHRlcjxhbnk+ID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuXG4gICAgQFZpZXdDaGlsZCgnY29udGFpbmVyJykgY29udGFpbmVyVmlld0NoaWxkOiBFbGVtZW50UmVmO1xuXG4gICAgZG9jdW1lbnRDbGlja0xpc3RlbmVyOiBhbnk7XG5cbiAgICBkb2N1bWVudEtleWRvd25MaXN0ZW5lcjogYW55O1xuXG4gICAgd2luZG93UmVzaXplTGlzdGVuZXI6IGFueTtcblxuICAgIHRyaWdnZXJFdmVudExpc3RlbmVyOiBhbnk7XG5cbiAgICBuZ0Rlc3Ryb3kkID0gbmV3IFN1YmplY3QoKTtcblxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBlbDogRWxlbWVudFJlZiwgcHVibGljIHJlbmRlcmVyOiBSZW5kZXJlcjIsIHB1YmxpYyBjZDogQ2hhbmdlRGV0ZWN0b3JSZWYsIHB1YmxpYyB6b25lOiBOZ1pvbmUsIHB1YmxpYyBjb250ZXh0TWVudVNlcnZpY2U6IENvbnRleHRNZW51U2VydmljZSkgeyB9XG5cbiAgICBuZ0FmdGVyVmlld0luaXQoKSB7XG4gICAgICAgIGlmICh0aGlzLmdsb2JhbCkge1xuICAgICAgICAgICAgY29uc3QgZG9jdW1lbnRUYXJnZXQ6IGFueSA9IHRoaXMuZWwgPyB0aGlzLmVsLm5hdGl2ZUVsZW1lbnQub3duZXJEb2N1bWVudCA6ICdkb2N1bWVudCc7XG5cbiAgICAgICAgICAgIHRoaXMudHJpZ2dlckV2ZW50TGlzdGVuZXIgPSB0aGlzLnJlbmRlcmVyLmxpc3Rlbihkb2N1bWVudFRhcmdldCwgdGhpcy50cmlnZ2VyRXZlbnQsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuc2hvdyhldmVudCk7XG4gICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHRoaXMudGFyZ2V0KSB7XG4gICAgICAgICAgICB0aGlzLnRyaWdnZXJFdmVudExpc3RlbmVyID0gdGhpcy5yZW5kZXJlci5saXN0ZW4odGhpcy50YXJnZXQsIHRoaXMudHJpZ2dlckV2ZW50LCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLnNob3coZXZlbnQpO1xuICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmFwcGVuZFRvKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5hcHBlbmRUbyA9PT0gJ2JvZHknKVxuICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5jb250YWluZXJWaWV3Q2hpbGQubmF0aXZlRWxlbWVudCk7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgRG9tSGFuZGxlci5hcHBlbmRDaGlsZCh0aGlzLmNvbnRhaW5lclZpZXdDaGlsZC5uYXRpdmVFbGVtZW50LCB0aGlzLmFwcGVuZFRvKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHNob3coZXZlbnQ/OiBNb3VzZUV2ZW50KSB7XG4gICAgICAgIHRoaXMuY2xlYXJBY3RpdmVJdGVtKCk7XG4gICAgICAgIHRoaXMucG9zaXRpb24oZXZlbnQpO1xuICAgICAgICB0aGlzLm1vdmVPblRvcCgpO1xuICAgICAgICB0aGlzLmNvbnRhaW5lclZpZXdDaGlsZC5uYXRpdmVFbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgICBEb21IYW5kbGVyLmZhZGVJbih0aGlzLmNvbnRhaW5lclZpZXdDaGlsZC5uYXRpdmVFbGVtZW50LCAyNTApO1xuICAgICAgICB0aGlzLmJpbmRHbG9iYWxMaXN0ZW5lcnMoKTtcblxuICAgICAgICBpZiAoZXZlbnQpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLm9uU2hvdy5lbWl0KCk7XG4gICAgfVxuXG4gICAgaGlkZSgpIHtcbiAgICAgICAgdGhpcy5jb250YWluZXJWaWV3Q2hpbGQubmF0aXZlRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICB0aGlzLnVuYmluZEdsb2JhbExpc3RlbmVycygpO1xuICAgICAgICB0aGlzLm9uSGlkZS5lbWl0KCk7XG4gICAgfVxuXG4gICAgbW92ZU9uVG9wKCkge1xuICAgICAgICBpZiAodGhpcy5hdXRvWkluZGV4KSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRhaW5lclZpZXdDaGlsZC5uYXRpdmVFbGVtZW50LnN0eWxlLnpJbmRleCA9IFN0cmluZyh0aGlzLmJhc2VaSW5kZXggKyAoKytEb21IYW5kbGVyLnppbmRleCkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdG9nZ2xlKGV2ZW50PzogTW91c2VFdmVudCkge1xuICAgICAgICBpZiAodGhpcy5jb250YWluZXJWaWV3Q2hpbGQubmF0aXZlRWxlbWVudC5vZmZzZXRQYXJlbnQpXG4gICAgICAgICAgICB0aGlzLmhpZGUoKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgdGhpcy5zaG93KGV2ZW50KTtcbiAgICB9XG5cbiAgICBwb3NpdGlvbihldmVudD86IE1vdXNlRXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50KSB7XG4gICAgICAgICAgICBsZXQgbGVmdCA9IGV2ZW50LnBhZ2VYICsgMTtcbiAgICAgICAgICAgIGxldCB0b3AgPSBldmVudC5wYWdlWSArIDE7XG4gICAgICAgICAgICBsZXQgd2lkdGggPSB0aGlzLmNvbnRhaW5lclZpZXdDaGlsZC5uYXRpdmVFbGVtZW50Lm9mZnNldFBhcmVudCA/IHRoaXMuY29udGFpbmVyVmlld0NoaWxkLm5hdGl2ZUVsZW1lbnQub2Zmc2V0V2lkdGggOiBEb21IYW5kbGVyLmdldEhpZGRlbkVsZW1lbnRPdXRlcldpZHRoKHRoaXMuY29udGFpbmVyVmlld0NoaWxkLm5hdGl2ZUVsZW1lbnQpO1xuICAgICAgICAgICAgbGV0IGhlaWdodCA9IHRoaXMuY29udGFpbmVyVmlld0NoaWxkLm5hdGl2ZUVsZW1lbnQub2Zmc2V0UGFyZW50ID8gdGhpcy5jb250YWluZXJWaWV3Q2hpbGQubmF0aXZlRWxlbWVudC5vZmZzZXRIZWlnaHQgOiBEb21IYW5kbGVyLmdldEhpZGRlbkVsZW1lbnRPdXRlckhlaWdodCh0aGlzLmNvbnRhaW5lclZpZXdDaGlsZC5uYXRpdmVFbGVtZW50KTtcbiAgICAgICAgICAgIGxldCB2aWV3cG9ydCA9IERvbUhhbmRsZXIuZ2V0Vmlld3BvcnQoKTtcblxuICAgICAgICAgICAgLy9mbGlwXG4gICAgICAgICAgICBpZiAobGVmdCArIHdpZHRoIC0gZG9jdW1lbnQuYm9keS5zY3JvbGxMZWZ0ID4gdmlld3BvcnQud2lkdGgpIHtcbiAgICAgICAgICAgICAgICBsZWZ0IC09IHdpZHRoO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvL2ZsaXBcbiAgICAgICAgICAgIGlmICh0b3AgKyBoZWlnaHQgLSBkb2N1bWVudC5ib2R5LnNjcm9sbFRvcCA+IHZpZXdwb3J0LmhlaWdodCkge1xuICAgICAgICAgICAgICAgIHRvcCAtPSBoZWlnaHQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vZml0XG4gICAgICAgICAgICBpZiAobGVmdCA8IGRvY3VtZW50LmJvZHkuc2Nyb2xsTGVmdCkge1xuICAgICAgICAgICAgICAgIGxlZnQgPSBkb2N1bWVudC5ib2R5LnNjcm9sbExlZnQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vZml0XG4gICAgICAgICAgICBpZiAodG9wIDwgZG9jdW1lbnQuYm9keS5zY3JvbGxUb3ApIHtcbiAgICAgICAgICAgICAgICB0b3AgPSBkb2N1bWVudC5ib2R5LnNjcm9sbFRvcDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5jb250YWluZXJWaWV3Q2hpbGQubmF0aXZlRWxlbWVudC5zdHlsZS5sZWZ0ID0gbGVmdCArICdweCc7XG4gICAgICAgICAgICB0aGlzLmNvbnRhaW5lclZpZXdDaGlsZC5uYXRpdmVFbGVtZW50LnN0eWxlLnRvcCA9IHRvcCArICdweCc7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwb3NpdGlvblN1Ym1lbnUoc3VibGlzdCkge1xuICAgICAgICBsZXQgcGFyZW50TWVudUl0ZW0gPSBzdWJsaXN0LnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudDtcbiAgICAgICAgbGV0IHZpZXdwb3J0ID0gRG9tSGFuZGxlci5nZXRWaWV3cG9ydCgpO1xuICAgICAgICBsZXQgc3VibGlzdFdpZHRoID0gc3VibGlzdC5vZmZzZXRQYXJlbnQgPyBzdWJsaXN0Lm9mZnNldFdpZHRoIDogRG9tSGFuZGxlci5nZXRIaWRkZW5FbGVtZW50T3V0ZXJXaWR0aChzdWJsaXN0KTtcbiAgICAgICAgbGV0IHN1Ymxpc3RIZWlnaHQgPSBzdWJsaXN0Lm9mZnNldEhlaWdodCA/IHN1Ymxpc3Qub2Zmc2V0SGVpZ2h0IDogRG9tSGFuZGxlci5nZXRIaWRkZW5FbGVtZW50T3V0ZXJIZWlnaHQoc3VibGlzdCk7XG4gICAgICAgIGxldCBpdGVtT3V0ZXJXaWR0aCA9IERvbUhhbmRsZXIuZ2V0T3V0ZXJXaWR0aChwYXJlbnRNZW51SXRlbS5jaGlsZHJlblswXSk7XG4gICAgICAgIGxldCBpdGVtT3V0ZXJIZWlnaHQgPSBEb21IYW5kbGVyLmdldE91dGVySGVpZ2h0KHBhcmVudE1lbnVJdGVtLmNoaWxkcmVuWzBdKTtcbiAgICAgICAgbGV0IGNvbnRhaW5lck9mZnNldCA9IERvbUhhbmRsZXIuZ2V0T2Zmc2V0KHBhcmVudE1lbnVJdGVtLnBhcmVudEVsZW1lbnQpO1xuXG4gICAgICAgIHN1Ymxpc3Quc3R5bGUuekluZGV4ID0gKytEb21IYW5kbGVyLnppbmRleDtcblxuICAgICAgICBpZiAoKHBhcnNlSW50KGNvbnRhaW5lck9mZnNldC50b3ApICsgaXRlbU91dGVySGVpZ2h0ICsgc3VibGlzdEhlaWdodCkgPiAodmlld3BvcnQuaGVpZ2h0IC0gRG9tSGFuZGxlci5jYWxjdWxhdGVTY3JvbGxiYXJIZWlnaHQoKSkpIHtcbiAgICAgICAgICAgIHN1Ymxpc3Quc3R5bGUucmVtb3ZlUHJvcGVydHkoJ3RvcCcpO1xuICAgICAgICAgICAgc3VibGlzdC5zdHlsZS5ib3R0b20gPSAnMHB4JztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHN1Ymxpc3Quc3R5bGUucmVtb3ZlUHJvcGVydHkoJ2JvdHRvbScpO1xuICAgICAgICAgICAgc3VibGlzdC5zdHlsZS50b3AgPSAnMHB4JztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgocGFyc2VJbnQoY29udGFpbmVyT2Zmc2V0LmxlZnQpICsgaXRlbU91dGVyV2lkdGggKyBzdWJsaXN0V2lkdGgpID4gKHZpZXdwb3J0LndpZHRoIC0gRG9tSGFuZGxlci5jYWxjdWxhdGVTY3JvbGxiYXJXaWR0aCgpKSkge1xuICAgICAgICAgICAgc3VibGlzdC5zdHlsZS5sZWZ0ID0gLXN1Ymxpc3RXaWR0aCArICdweCc7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBzdWJsaXN0LnN0eWxlLmxlZnQgPSBpdGVtT3V0ZXJXaWR0aCArICdweCc7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpc0l0ZW1NYXRjaGVkKG1lbnVpdGVtKSB7XG4gICAgICAgIHJldHVybiBEb21IYW5kbGVyLmhhc0NsYXNzKG1lbnVpdGVtLCAncC1tZW51aXRlbScpICYmICFEb21IYW5kbGVyLmhhc0NsYXNzKG1lbnVpdGVtLmNoaWxkcmVuWzBdLCAncC1kaXNhYmxlZCcpO1xuICAgIH1cblxuICAgIGZpbmROZXh0SXRlbShtZW51aXRlbSwgaXNSZXBlYXRlZD8pIHtcbiAgICAgICAgbGV0IG5leHRNZW51aXRlbSA9IG1lbnVpdGVtLm5leHRFbGVtZW50U2libGluZztcblxuICAgICAgICBpZiAobmV4dE1lbnVpdGVtKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5pc0l0ZW1NYXRjaGVkKG5leHRNZW51aXRlbSkgPyBuZXh0TWVudWl0ZW0gOiB0aGlzLmZpbmROZXh0SXRlbShuZXh0TWVudWl0ZW0sIGlzUmVwZWF0ZWQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgbGV0IGZpcnN0SXRlbSA9IG1lbnVpdGVtLnBhcmVudEVsZW1lbnQuY2hpbGRyZW5bMF07XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLmlzSXRlbU1hdGNoZWQoZmlyc3RJdGVtKSA/IGZpcnN0SXRlbSA6ICghaXNSZXBlYXRlZCA/IHRoaXMuZmluZE5leHRJdGVtKGZpcnN0SXRlbSwgdHJ1ZSkgOiBudWxsKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZpbmRQcmV2SXRlbShtZW51aXRlbSwgaXNSZXBlYXRlZD8pIHtcbiAgICAgICAgbGV0IHByZXZNZW51aXRlbSA9IG1lbnVpdGVtLnByZXZpb3VzRWxlbWVudFNpYmxpbmc7XG5cbiAgICAgICAgaWYgKHByZXZNZW51aXRlbSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaXNJdGVtTWF0Y2hlZChwcmV2TWVudWl0ZW0pID8gcHJldk1lbnVpdGVtIDogdGhpcy5maW5kUHJldkl0ZW0ocHJldk1lbnVpdGVtLCBpc1JlcGVhdGVkKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGxldCBsYXN0SXRlbSA9IG1lbnVpdGVtLnBhcmVudEVsZW1lbnQuY2hpbGRyZW5bbWVudWl0ZW0ucGFyZW50RWxlbWVudC5jaGlsZHJlbi5sZW5ndGggLSAxXTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaXNJdGVtTWF0Y2hlZChsYXN0SXRlbSkgPyBsYXN0SXRlbSA6ICghaXNSZXBlYXRlZCA/IHRoaXMuZmluZFByZXZJdGVtKGxhc3RJdGVtLCB0cnVlKSA6IG51bGwpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0QWN0aXZlSXRlbSgpIHtcbiAgICAgICAgbGV0IGFjdGl2ZUl0ZW1LZXkgPSB0aGlzLmNvbnRleHRNZW51U2VydmljZS5hY3RpdmVJdGVtS2V5O1xuXG4gICAgICAgIHJldHVybiBhY3RpdmVJdGVtS2V5ID09IG51bGwgPyBudWxsIDogRG9tSGFuZGxlci5maW5kU2luZ2xlKHRoaXMuY29udGFpbmVyVmlld0NoaWxkLm5hdGl2ZUVsZW1lbnQsICcucC1tZW51aXRlbVtkYXRhLWlrPVwiJyArIGFjdGl2ZUl0ZW1LZXkgKyAnXCJdJyk7XG4gICAgfVxuXG4gICAgY2xlYXJBY3RpdmVJdGVtKCkge1xuICAgICAgICBpZiAodGhpcy5jb250ZXh0TWVudVNlcnZpY2UuYWN0aXZlSXRlbUtleSkge1xuICAgICAgICAgICAgdGhpcy5yZW1vdmVBY3RpdmVGcm9tU3ViTGlzdHModGhpcy5jb250YWluZXJWaWV3Q2hpbGQubmF0aXZlRWxlbWVudCk7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHRNZW51U2VydmljZS5yZXNldCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmVtb3ZlQWN0aXZlRnJvbVN1Ykxpc3RzKGVsKSB7XG4gICAgICAgIGxldCBzdWJsaXN0cyA9IERvbUhhbmRsZXIuZmluZChlbCwgJy5wLXN1Ym1lbnUtbGlzdC1hY3RpdmUnKTtcblxuICAgICAgICBmb3IgKGxldCBzdWJsaXN0IG9mIHN1Ymxpc3RzKSB7XG4gICAgICAgICAgICBEb21IYW5kbGVyLnJlbW92ZUNsYXNzKHN1Ymxpc3QsICdwLXN1Ym1lbnUtbGlzdC1hY3RpdmUnKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJlbW92ZUFjdGl2ZUZyb21TdWJsaXN0KG1lbnVpdGVtKSB7XG4gICAgICAgIGlmIChtZW51aXRlbSkge1xuICAgICAgICAgICAgbGV0IHN1Ymxpc3QgPSBEb21IYW5kbGVyLmZpbmRTaW5nbGUobWVudWl0ZW0sICcucC1zdWJtZW51LWxpc3QnKTtcblxuICAgICAgICAgICAgaWYgKHN1Ymxpc3QgJiYgRG9tSGFuZGxlci5oYXNDbGFzcyhtZW51aXRlbSwgJ3Atc3VibWVudS1saXN0LWFjdGl2ZScpKSB7XG4gICAgICAgICAgICAgICAgRG9tSGFuZGxlci5yZW1vdmVDbGFzcyhtZW51aXRlbSwgJ3Atc3VibWVudS1saXN0LWFjdGl2ZScpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgYmluZEdsb2JhbExpc3RlbmVycygpIHtcbiAgICAgICAgaWYgKCF0aGlzLmRvY3VtZW50Q2xpY2tMaXN0ZW5lcikge1xuICAgICAgICAgICAgY29uc3QgZG9jdW1lbnRUYXJnZXQ6IGFueSA9IHRoaXMuZWwgPyB0aGlzLmVsLm5hdGl2ZUVsZW1lbnQub3duZXJEb2N1bWVudCA6ICdkb2N1bWVudCc7XG5cbiAgICAgICAgICAgIHRoaXMuZG9jdW1lbnRDbGlja0xpc3RlbmVyID0gdGhpcy5yZW5kZXJlci5saXN0ZW4oZG9jdW1lbnRUYXJnZXQsICdjbGljaycsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmNvbnRhaW5lclZpZXdDaGlsZC5uYXRpdmVFbGVtZW50Lm9mZnNldFBhcmVudCAmJiB0aGlzLmlzT3V0c2lkZUNsaWNrZWQoZXZlbnQpICYmIGV2ZW50LmJ1dHRvbiAhPT0gMikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmhpZGUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuem9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXRoaXMud2luZG93UmVzaXplTGlzdGVuZXIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLndpbmRvd1Jlc2l6ZUxpc3RlbmVyID0gdGhpcy5vbldpbmRvd1Jlc2l6ZS5iaW5kKHRoaXMpO1xuICAgICAgICAgICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCB0aGlzLndpbmRvd1Jlc2l6ZUxpc3RlbmVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKCF0aGlzLmRvY3VtZW50S2V5ZG93bkxpc3RlbmVyKSB7XG4gICAgICAgICAgICBjb25zdCBkb2N1bWVudFRhcmdldDogYW55ID0gdGhpcy5lbCA/IHRoaXMuZWwubmF0aXZlRWxlbWVudC5vd25lckRvY3VtZW50IDogJ2RvY3VtZW50JztcblxuICAgICAgICAgICAgdGhpcy5kb2N1bWVudEtleWRvd25MaXN0ZW5lciA9IHRoaXMucmVuZGVyZXIubGlzdGVuKGRvY3VtZW50VGFyZ2V0LCAna2V5ZG93bicsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgICAgIGxldCBhY3RpdmVJdGVtID0gdGhpcy5nZXRBY3RpdmVJdGVtKCk7XG5cbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGV2ZW50LmtleSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdBcnJvd0Rvd24nOlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFjdGl2ZUl0ZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUFjdGl2ZUZyb21TdWJsaXN0KGFjdGl2ZUl0ZW0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2ZUl0ZW0gPSB0aGlzLmZpbmROZXh0SXRlbShhY3RpdmVJdGVtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBmaXJzdEl0ZW0gPSBEb21IYW5kbGVyLmZpbmRTaW5nbGUodGhpcy5jb250YWluZXJWaWV3Q2hpbGQubmF0aXZlRWxlbWVudCwgJy5wLW1lbnVpdGVtLWxpbmsnKS5wYXJlbnRFbGVtZW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2ZUl0ZW0gPSB0aGlzLmlzSXRlbU1hdGNoZWQoZmlyc3RJdGVtKSA/IGZpcnN0SXRlbSA6IHRoaXMuZmluZE5leHRJdGVtKGZpcnN0SXRlbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhY3RpdmVJdGVtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jb250ZXh0TWVudVNlcnZpY2UuY2hhbmdlS2V5KGFjdGl2ZUl0ZW0uZ2V0QXR0cmlidXRlKCdkYXRhLWlrJykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnQXJyb3dVcCc6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWN0aXZlSXRlbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlQWN0aXZlRnJvbVN1Ymxpc3QoYWN0aXZlSXRlbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZlSXRlbSA9IHRoaXMuZmluZFByZXZJdGVtKGFjdGl2ZUl0ZW0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHN1Ymxpc3QgPSBEb21IYW5kbGVyLmZpbmRTaW5nbGUodGhpcy5jb250YWluZXJWaWV3Q2hpbGQubmF0aXZlRWxlbWVudCwgJ3VsJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGxhc3RJdGVtID0gc3VibGlzdC5jaGlsZHJlbltzdWJsaXN0LmNoaWxkcmVuLmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2ZUl0ZW0gPSB0aGlzLmlzSXRlbU1hdGNoZWQobGFzdEl0ZW0pID8gbGFzdEl0ZW0gOiB0aGlzLmZpbmRQcmV2SXRlbShsYXN0SXRlbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhY3RpdmVJdGVtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jb250ZXh0TWVudVNlcnZpY2UuY2hhbmdlS2V5KGFjdGl2ZUl0ZW0uZ2V0QXR0cmlidXRlKCdkYXRhLWlrJykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnQXJyb3dSaWdodCc6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWN0aXZlSXRlbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBzdWJsaXN0ID0gRG9tSGFuZGxlci5maW5kU2luZ2xlKGFjdGl2ZUl0ZW0sICcucC1zdWJtZW51LWxpc3QnKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdWJsaXN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIERvbUhhbmRsZXIuYWRkQ2xhc3Moc3VibGlzdCwgJ3Atc3VibWVudS1saXN0LWFjdGl2ZScpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2ZUl0ZW0gPSBEb21IYW5kbGVyLmZpbmRTaW5nbGUoc3VibGlzdCwgJy5wLW1lbnVpdGVtLWxpbms6bm90KC5wLWRpc2FibGVkKScpLnBhcmVudEVsZW1lbnQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFjdGl2ZUl0ZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29udGV4dE1lbnVTZXJ2aWNlLmNoYW5nZUtleShhY3RpdmVJdGVtLmdldEF0dHJpYnV0ZSgnZGF0YS1paycpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ0Fycm93TGVmdCc6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWN0aXZlSXRlbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBzdWJsaXN0ID0gYWN0aXZlSXRlbS5wYXJlbnRFbGVtZW50O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN1Ymxpc3QgJiYgRG9tSGFuZGxlci5oYXNDbGFzcyhzdWJsaXN0LCAncC1zdWJtZW51LWxpc3QtYWN0aXZlJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRG9tSGFuZGxlci5yZW1vdmVDbGFzcyhzdWJsaXN0LCAncC1zdWJtZW51LWxpc3QtYWN0aXZlJyk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZlSXRlbSA9IHN1Ymxpc3QucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhY3RpdmVJdGVtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbnRleHRNZW51U2VydmljZS5jaGFuZ2VLZXkoYWN0aXZlSXRlbS5nZXRBdHRyaWJ1dGUoJ2RhdGEtaWsnKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICBjYXNlICdFc2NhcGUnOlxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5oaWRlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICBjYXNlICdFbnRlcic6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWN0aXZlSXRlbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaGFuZGxlSXRlbUNsaWNrKGV2ZW50LCB0aGlzLmZpbmRNb2RlbEl0ZW1Gcm9tS2V5KHRoaXMuY29udGV4dE1lbnVTZXJ2aWNlLmFjdGl2ZUl0ZW1LZXkpLCBhY3RpdmVJdGVtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZpbmRNb2RlbEl0ZW1Gcm9tS2V5KGtleSkge1xuICAgICAgICBpZiAoa2V5ID09IG51bGwgfHwgIXRoaXMubW9kZWwpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGluZGV4ZXMgPSBrZXkuc3BsaXQoJ18nKTtcbiAgICAgICAgcmV0dXJuIGluZGV4ZXMucmVkdWNlKChpdGVtLCBjdXJyZW50SW5kZXgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBpdGVtID8gaXRlbS5pdGVtc1tjdXJyZW50SW5kZXhdIDogdGhpcy5tb2RlbFtjdXJyZW50SW5kZXhdO1xuICAgICAgICB9LCBudWxsKTtcbiAgICB9XG5cbiAgICBoYW5kbGVJdGVtQ2xpY2soZXZlbnQsIGl0ZW0sIG1lbnVpdGVtKSB7XG4gICAgICAgIGlmICghaXRlbSB8fCBpdGVtLmRpc2FibGVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaXRlbS5jb21tYW5kKSB7XG4gICAgICAgICAgICBpdGVtLmNvbW1hbmQoe1xuICAgICAgICAgICAgICAgIG9yaWdpbmFsRXZlbnQ6IGV2ZW50LFxuICAgICAgICAgICAgICAgIGl0ZW06IGl0ZW1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGl0ZW0uaXRlbXMpIHtcbiAgICAgICAgICAgIGxldCBjaGlsZFN1Ymxpc3QgPSBEb21IYW5kbGVyLmZpbmRTaW5nbGUobWVudWl0ZW0sICcucC1zdWJtZW51LWxpc3QnKTtcblxuICAgICAgICAgICAgaWYgKGNoaWxkU3VibGlzdCkge1xuICAgICAgICAgICAgICAgIGlmIChEb21IYW5kbGVyLmhhc0NsYXNzKGNoaWxkU3VibGlzdCwgJ3Atc3VibWVudS1saXN0LWFjdGl2ZScpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlQWN0aXZlRnJvbVN1Ykxpc3RzKG1lbnVpdGVtKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIERvbUhhbmRsZXIuYWRkQ2xhc3MoY2hpbGRTdWJsaXN0LCAncC1zdWJtZW51LWxpc3QtYWN0aXZlJyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucG9zaXRpb25TdWJtZW51KGNoaWxkU3VibGlzdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFpdGVtLml0ZW1zKSB7XG4gICAgICAgICAgICB0aGlzLmhpZGUoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHVuYmluZEdsb2JhbExpc3RlbmVycygpIHtcbiAgICAgICAgaWYgKHRoaXMuZG9jdW1lbnRDbGlja0xpc3RlbmVyKSB7XG4gICAgICAgICAgICB0aGlzLmRvY3VtZW50Q2xpY2tMaXN0ZW5lcigpO1xuICAgICAgICAgICAgdGhpcy5kb2N1bWVudENsaWNrTGlzdGVuZXIgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMud2luZG93UmVzaXplTGlzdGVuZXIpIHtcbiAgICAgICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdyZXNpemUnLCB0aGlzLndpbmRvd1Jlc2l6ZUxpc3RlbmVyKTtcbiAgICAgICAgICAgIHRoaXMud2luZG93UmVzaXplTGlzdGVuZXIgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuZG9jdW1lbnRLZXlkb3duTGlzdGVuZXIpIHtcbiAgICAgICAgICAgIHRoaXMuZG9jdW1lbnRLZXlkb3duTGlzdGVuZXIoKTtcbiAgICAgICAgICAgIHRoaXMuZG9jdW1lbnRLZXlkb3duTGlzdGVuZXIgPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgb25XaW5kb3dSZXNpemUoZXZlbnQpIHtcbiAgICAgICAgaWYgKHRoaXMuY29udGFpbmVyVmlld0NoaWxkLm5hdGl2ZUVsZW1lbnQub2Zmc2V0UGFyZW50KSB7XG4gICAgICAgICAgICB0aGlzLmhpZGUoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlzT3V0c2lkZUNsaWNrZWQoZXZlbnQ6IEV2ZW50KSB7XG4gICAgICAgIHJldHVybiAhKHRoaXMuY29udGFpbmVyVmlld0NoaWxkLm5hdGl2ZUVsZW1lbnQuaXNTYW1lTm9kZShldmVudC50YXJnZXQpIHx8IHRoaXMuY29udGFpbmVyVmlld0NoaWxkLm5hdGl2ZUVsZW1lbnQuY29udGFpbnMoZXZlbnQudGFyZ2V0KSk7XG4gICAgfVxuXG4gICAgbmdPbkRlc3Ryb3koKSB7XG4gICAgICAgIHRoaXMudW5iaW5kR2xvYmFsTGlzdGVuZXJzKCk7XG5cbiAgICAgICAgaWYgKHRoaXMudHJpZ2dlckV2ZW50TGlzdGVuZXIpIHtcbiAgICAgICAgICAgIHRoaXMudHJpZ2dlckV2ZW50TGlzdGVuZXIoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmFwcGVuZFRvKSB7XG4gICAgICAgICAgICB0aGlzLmVsLm5hdGl2ZUVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5jb250YWluZXJWaWV3Q2hpbGQubmF0aXZlRWxlbWVudCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLm5nRGVzdHJveSQubmV4dCh0cnVlKTtcbiAgICAgICAgdGhpcy5uZ0Rlc3Ryb3kkLmNvbXBsZXRlKCk7XG4gICAgfVxuXG59XG5cbkBOZ01vZHVsZSh7XG4gICAgaW1wb3J0czogW0NvbW1vbk1vZHVsZSxSb3V0ZXJNb2R1bGUsUmlwcGxlTW9kdWxlXSxcbiAgICBleHBvcnRzOiBbQ29udGV4dE1lbnUsUm91dGVyTW9kdWxlXSxcbiAgICBkZWNsYXJhdGlvbnM6IFtDb250ZXh0TWVudSxDb250ZXh0TWVudVN1Yl0sXG4gICAgcHJvdmlkZXJzOiBbQ29udGV4dE1lbnVTZXJ2aWNlXVxufSlcbmV4cG9ydCBjbGFzcyBDb250ZXh0TWVudU1vZHVsZSB7IH1cbiJdfQ==