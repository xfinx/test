declare var lc: any

lc.wishlist = (doc => {
  'use strict'

  class WishlistItem {
    public static getWishlistTarget(): HTMLElement {
      return doc.querySelector('.js-wishlist-target') as HTMLElement
    }

    /* since ES6 [a,b] = [b,a] is possible, but it is much slower */
    public static switchIcon(el: HTMLImageElement): void {
      if (!el) return
      const currentIcon = el.src
      el.src = el.dataset.altSrc || ''
      el.dataset.altSrc = currentIcon
    }

    public static switchClassName(el: HTMLElement): void {
      if (el.classList.contains('js-remove-wishlist-item')) {
        el.classList.remove('js-remove-wishlist-item')
        el.classList.add('js-lc-list')
      } else {
        el.classList.remove('js-lc-list')
        el.classList.add('js-remove-wishlist-item')
      }
    }

    public _objectId: string
    public _objectType: string
    public _currentTime: number
    public _clickTime: number

    constructor() {
      this._objectId = ''
      this._objectType = ''
      this._currentTime = 0
      this._clickTime = 0
      this.listeners()
    }

    /**
     * To prevent too much requests
     */
    private checkForGoodTimings(): boolean {
      this._currentTime = +new Date()
      if (this._currentTime - this._clickTime < 1000) {
        return false
      }

      this._clickTime = this._currentTime
      return true
    }

    private fillObjectVars(el: HTMLElement) {
      this._objectId = el.dataset.lcListObjectId || ''
      this._objectType = el.dataset.lcListObjectType || ''
    }

    private listeners() {
      const wishlistActions = Array.from(
        doc.getElementsByClassName('js--wishlist-button')
      ) as HTMLButtonElement[]

      if (wishlistActions.length === 0) {
        return
      }

      wishlistActions.forEach((el: HTMLButtonElement) => {
        el.addEventListener('click', () => {
          if (el.classList.contains('js-lc-list')) {
            this.add(el)
          } else if (el.classList.contains('js-remove-wishlist-item')) {
            this.remove(el)
          }
        })
      })
    }

    private add(el: HTMLButtonElement): void {
      if (!this.checkForGoodTimings()) {
        return
      }
      this.fillObjectVars(el)

      this.save('add-to-list', (xhr: XMLHttpRequest) => {
        this.addToHTML(xhr.response)
      })
    }

    private addToHTML(xhrData: string): void {
      WishlistItem.getWishlistTarget().innerHTML = xhrData

      const buttons: HTMLButtonElement[] = Array.from(
        doc.querySelectorAll('.js--wishlist-button')
      )
      buttons.forEach((button: HTMLButtonElement) => {
        const icon = button.querySelector(
          '.js--wishlist-icon'
        ) as HTMLImageElement
        icon && WishlistItem.switchIcon(icon)
        WishlistItem.switchClassName(button)

        const label = button.querySelector('.sub--label') as HTMLElement
        if (label && button.dataset.lcListCompletedText) {
          label.innerHTML = button.dataset.lcListCompletedText
        }
      })
      this.animate()
    }

    private remove(el: HTMLElement): void {
      if (!this.checkForGoodTimings()) {
        return
      }
      this.fillObjectVars(el)

      this.save('remove-from-list', (xhr: XMLHttpRequest) => {
        this.removeFromHTML(xhr.response)
      })
    }

    private removeFromHTML(xhrData: string): void {
      const item = doc.querySelector(
        '.js--wishlist-' + this._objectType + '-' + this._objectId
      ) as HTMLElement

      if (item) {
        item.classList.add('_inactive')
        setTimeout(() => {
          item.parentNode && item.parentNode.removeChild(item)
          WishlistItem.getWishlistTarget().innerHTML = xhrData
        }, 500)
      }

      const buttons: HTMLButtonElement[] = Array.from(
        doc.querySelectorAll('.js--wishlist-button')
      )
      buttons.forEach(button => {
        const icon = button.querySelector(
          '.js--wishlist-icon'
        ) as HTMLImageElement
        icon && WishlistItem.switchIcon(icon)
        WishlistItem.switchClassName(button)

        const label = button.querySelector('.sub--label') as HTMLElement
        if (label && button.dataset.lcListUncompletedText) {
          label.innerHTML = button.dataset.lcListUncompletedText
        }
      })

      this.animate()
    }

    private save(action: string, callback: (xhr: XMLHttpRequest) => void) {
      const queryString = lc.common.buildQueryString({
        objectType: this._objectType,
        objectId: this._objectId,
        action
      })

      lc.common.xhr({
        method: 'GET',
        action: '/ajax.php?' + queryString,
        responseType: 'html',
        callback
      })
    }

    private animate(): void {
      const el = doc.querySelector('.js--svg-menu') as HTMLElement
      if (el.getAttribute('aria-pressed') === 'false') {
        el.click()
      }

      const elWishlistExpander = WishlistItem.getWishlistTarget().querySelector(
        '.js-expand'
      ) as HTMLElement

      if (elWishlistExpander) {
        setTimeout(() => {
          elWishlistExpander.click()
        }, 500)
      }
    }
  }

  if (!lc.wishlist) {
    return new WishlistItem()
  }
})(document)
