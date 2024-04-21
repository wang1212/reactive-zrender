import * as RZRender from '../../build/bundle.esm.js';
import Group from './component/Group.js';
import Rect from './component/Rect.js';

export default () => [
  {
    elementSpec: RZRender.Root(
      {
        opts: {
          x: 10,
          y: 100,
          scaleX: 2,
        },
        animation1: {
          when: [
            {
              time: 300,
              zoom: [2.5, true],
            },
            {
              time: 5e2,
              zoom: [0.8, true],
            },
          ],
        },
      },
      [
        {
          type: 'text',
          props: {
            opts: {
              style: {
                text: 'Hello',
              },
            },
          },
        },
        Rect({
          backgroundColor: 'red',
          animation: {
            when: [
              {
                time: 300,
                value: {
                  x: 25,
                },
              },
              {
                time: 1e3,
                value: {
                  x: 75,
                },
              },
            ],
          },
        }),
        Group(
          {
            x: 40,
            y: 40,
          },
          [
            // * 组件的子元素可以是其它组件，也可以是原生 zrender 元素
            // 原生 zenrder 元素
            {
              type: 'rect',
              props: {
                opts: {
                  shape: {
                    width: 10,
                    height: 10,
                  },
                  style: {
                    fill: 'pink',
                  },
                  x: 100,
                },
              },
            },
            // 其它组件
            Rect({
              width: 30,
              height: 10,
              backgroundColor: 'orange',
            }),
          ],
        ),
        Rect({
          width: 30,
          height: 10,
          x: 100,
          y: 0,
          scaleX: 3,
        }),
      ],
    ),
  },
  {
    elementSpec: RZRender.Root(
      {
        opts: {
          x: 10,
          y: 100,
          scaleX: 2,
        },
      },
      [
        Rect({
          height: 100,
          backgroundColor: 'purple',
          animation: {
            when: [
              {
                time: 300,
                value: {
                  x: 50,
                },
              },
              {
                time: 1e3,
                value: {
                  x: 100,
                },
              },
            ],
          },
        }),
      ],
    ),
  },
];
