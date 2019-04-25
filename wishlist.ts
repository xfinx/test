declare var lc: any;

lc.wishlist = (function(doc) {
    'use strict';

    class WishlistItem {
        private _objectId: string;
        private _objectType: string;
        private _currentTime: number;
        private _clickTime: number;

        get objectId(): string {
            return this._objectId;
        }

        set objectId(value: string) {
            this._objectId = value;
        }

        get objectType(): string {
            return this._objectType;
        }

        set objectType(value: string) {
            this._objectType = value;
        }

        get currentTime():number {
            return this._currentTime || 0;
        }

        set currentTime(value: number) {
            this._currentTime = value;
        }

        get clickTime(): number {
            return this._clickTime || 0;
        }

        set clickTime(value: number) {
            this._clickTime = value;
        }

        constructor() {
            this.listeners();
        }

        static getWishlistTarget(): HTMLElement {
            return doc.querySelector('.js-wishlist-target') as HTMLElement;
        }

        /* since ES6 [a,b] = [b,a] is possible, but it is much slower */
        static switchIcon(el: HTMLImageElement): void {
            if (!el) return;
            let currentIcon = el.src;
            el.src = el.dataset.altSrc;
            el.dataset.altSrc = currentIcon;
        }

        static switchClassName(el: HTMLElement): void {
            if (el.classList.contains('js-remove-wishlist-item')) {
                el.classList.remove('js-remove-wishlist-item');
                el.classList.add('js-lc-list');
            } else {
                el.classList.remove('js-lc-list');
                el.classList.add('js-remove-wishlist-item');
            }
        }

        /**
         * To prevent too much requests
         */
        private checkForGoodTimings(): boolean {
            this.currentTime = (+(new Date()));
            if (this.currentTime - this.clickTime < 1000) {
                return false;
            }

            this.clickTime = this.currentTime;
            return true;
        }

        private fillObjectVars(el: HTMLElement): void {
            this.objectId = el.dataset.lcListObjectId;
            this.objectType = el.dataset.lcListObjectType;
        }

        private listeners(): void {
            let wishlistActions = doc.getElementsByClassName('js--wishlist-button');

            if (typeof wishlistActions === 'undefined') {
                return;
            }

            [].forEach.call(wishlistActions, (el: HTMLElement) => {
                el.addEventListener('click', () => {
                    if (el.classList.contains('js-lc-list')) {
                        this.add(el);
                    } else if (el.classList.contains('js-remove-wishlist-item')) {
                        this.remove(el);
                    }
                });
            });
        }

        add(el: HTMLElement): void {
            if (!this.checkForGoodTimings()) {
                return;
            }
            this.fillObjectVars(el);

            this.save('add-to-list', (xhrResponse: XMLHttpRequest) => {
                this.addToHTML(xhrResponse.response)
            });
        }

        addToHTML(xhrData: string): void {
            WishlistItem.getWishlistTarget().innerHTML = xhrData;

            let buttons = doc.querySelectorAll('.js--wishlist-button');
            [].forEach.call(buttons, (button: HTMLElement) => {
                WishlistItem.switchIcon(button.querySelector('.js--wishlist-icon'));
                WishlistItem.switchClassName(button);

                let label = button.querySelector('.sub--label');
                if (label) {
                    label.innerHTML = button.dataset.lcListCompletedText;
                }
            });
            this.animate();
        }

        remove(el: HTMLElement): void {
            if (!this.checkForGoodTimings()) {
                return;
            }
            this.fillObjectVars(el);

            this.save('remove-from-list', (xhrResponse: XMLHttpRequest) => {
                this.removeFromHTML(xhrResponse.response);
            });
        }

        removeFromHTML(xhrData: string): void {
            const item = doc.querySelector('.js--wishlist-'+this.objectType+'-'+this.objectId);

            if (item) {
                item.classList.add('_inactive');
                setTimeout(() => {
                    item.parentNode.removeChild(item);
                    WishlistItem.getWishlistTarget().innerHTML = xhrData;
                }, 500);
            }

            let buttons = doc.querySelectorAll('.js--wishlist-button');
            [].forEach.call(buttons, (button: HTMLElement) => {
                WishlistItem.switchIcon(button.querySelector('.js--wishlist-icon'));
                WishlistItem.switchClassName(button);

                let label = button.querySelector('.sub--label');
                if (label) {
                    label.innerHTML = button.dataset.lcListUncompletedText;
                }
            });
            this.animate();
        }

        save(action: String, callback: Function): void {
            let queryString = lc.common.buildQueryString({
                objectType : this.objectType,
                objectId : this.objectId,
                action: action
            });

            lc.common.xhr({
                method: 'GET',
                action: '/ajax.php?'+queryString,
                responseType: 'html',
                callback: callback,
            })
        }

        animate(): void {
            const elMenuButton = doc.querySelector('.js--svg-menu') as HTMLElement;
            if (elMenuButton.getAttribute('aria-pressed') === 'false') {
                elMenuButton.click();
            }

            const elWishlistExpander = WishlistItem.getWishlistTarget().querySelector('.js-expand') as HTMLElement;

            setTimeout(() => {
                if (elWishlistExpander) {
                    elWishlistExpander.click
                    ();
                }
            }, 500);
        }
    }

    if (!lc.wishlist) {
        return new WishlistItem();
    }

})(document);
