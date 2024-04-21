import Eventful from 'zrender/lib/core/Eventful';
import { type ActionDefinition as TooltipActionDef } from '../ui/Tooltip';

/** 交互事件定义 */
export type ActionDefinition = TooltipActionDef & {
  //
};

/**
 * 交互管理
 */
export default class Action extends Eventful<ActionDefinition> {}
