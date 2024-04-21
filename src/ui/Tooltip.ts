import type ReactiveZRender from '../core/ReactiveZRender';

export type ActionDefinition = {
  showTooltip: (params: { x: number; y: number; content: string }) => void;
  hideTooltip: () => void;
};

export default class Tooltip {
  private __dom: HTMLElement;

  constructor(container: HTMLElement, api: ReactiveZRender) {
    this.__dom = document.createElement('div');
    this.__dom.classList.add('_js-tooltip-container');
    container.appendChild(this.__dom);

    this._initialize(api);
  }

  protected _initialize(api: ReactiveZRender) {
    const self = this;

    self.__dom.style.cssText =
      'background-color: #4C4C4C; box-shadow: 0px 3px 8px 0px rgba(0,0,0,0.16); border-radius: 2px; padding: 4px 8px; position: absolute; top: 0; left: 0; z-index: 1000; transition: transform .4s linear, opacity .4s linear; transform: translate(0,0); opacity: 0; color: #fff; font-size: 12px; font-family: MicrosoftYaHei, THSJinRongTi-Regular; pointer-events: none;';
    self.__dom.innerHTML =
      '<main></main><div style="position: absolute; top: 100%; left: 50%; transform: translate(-50%, 0); border: 6px solid; border-color: #4C4C4C transparent transparent transparent;"></div>';

    api.registerAction({ type: 'showTooltip' }, ({ x, y, content }) => {
      if (typeof content !== 'string' || !content) {
        return;
      }

      self.__dom.querySelector('main').innerHTML = content;
      const bBox = self.__dom.getBoundingClientRect();
      self.__dom.style.left = `${x - bBox.width / 2}px`;
      self.__dom.style.top = `${y - bBox.height - 4}px`;
      self.__dom.style.opacity = '1';
      self.__dom.style.transform = 'translate(0, -4px)';
    });

    api.registerAction({ type: 'hideTooltip' }, () => {
      this.__dom.style.opacity = '0';
      self.__dom.style.transform = 'translate(0, 0)';
    });
  }

  destroy() {
    this.__dom.parentElement.removeChild(this.__dom);
    this.__dom = null;
  }
}
