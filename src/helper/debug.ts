import createDebug from 'debug';

type DebugLogger = (...args: unknown[]) => void;

/** 用来作为开关 */
const debugStackTraceSwitch: (...args: unknown[]) => void = createDebug('RelationGraphs:notrace');

function logWithStackTrace(logger: DebugLogger) {
  if (!debugStackTraceSwitch.enabled) {
    // ! 打印调用堆栈方便调试
    // eslint-disable-next-line
    logger.log = console.trace.bind(console);
  }

  return logger;
}

/** 调试 Node */
export const debugNode = logWithStackTrace(createDebug('RelationGraphs:Node'));

/** 调试 Edge */
export const debugEdge = logWithStackTrace(createDebug('RelationGraphs:Edge'));

/** 调试主程序 */
export const debug = logWithStackTrace(createDebug('RelationGraphs'));

export default debug;
