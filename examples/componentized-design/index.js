/*!
 * Demo
 */
import * as RZRender from '../../build/bundle.esm.js';
console.log(RZRender);
import optionBuild from './defaultOption.js';
import datasetBuilder from './data.js';

const $dom = document.getElementById('app');
const chart = new RZRender.ReactiveZRender($dom.id, optionBuild());

console.log(chart);

chart.render(datasetBuilder()[0].elementSpec);

// * 播放动画
chart.extendStartAnimation({
  onDone: () => {
    chart.render(datasetBuilder()[1].elementSpec);
  },
});

// * ----------------------------------- 选中某个组件将其缩放到当前视图区域
// setTimeout(() => {
//   const el = RZRender.queryComponents(chart, 'Rect')[0].el;

//   chart.adapt(
//     {
//       bBox: el,
//     },
//     true,
//   );
// }, 1.5e3);

/** 鼠标指针效果 */

chart.on('mousemove', (event) => {
  // console.log('mousemove', event);
});

chart.on('mousedown', (event) => {
  console.log('mousedown', event);
});

chart.on('mouseup', (event) => {
  console.log('mouseup', event);
});

chart.on('click', (event) => {
  console.log('click', event);
});

// * 视图交互 --------------------------------------------------

window.adapt.addEventListener('click', () => {
  chart.adapt();
});
window.adaptAnimate.addEventListener('click', () => {
  chart.adapt(undefined, true);
});

// * 视图缩放 ----------------------------------------------------

window.zoomOut.addEventListener('click', () => {
  // chart.zoomTo(chart.getZoom() - 0.2);
  chart.zoomTo(chart.getZoom() - 0.2, true); // 动画
});
window.zoomIn.addEventListener('click', () => {
  // chart.zoomTo(chart.getZoom() + 0.2);
  chart.zoomTo(chart.getZoom() + 0.2, true); // 动画
});
window.resetView.addEventListener('click', () => {
  // chart.resetView(false);
  chart.resetView(true); // 动画
});

chart.on('zoom', (event) => {
  console.log(event);
  window['zoom'].textContent = Number(event.zoom).toFixed(2);
});
