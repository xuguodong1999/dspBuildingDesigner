import * as Cfg from "./graphConfig.js";
import { Message } from "element-ui";

/**
 * 校验图谱序列化数据结构
 * @param graphData 图谱序列化数据 { header, data:{nodes,lines} }
 * @param isThrow 是否抛出异常
 * @param popupMessage 是否弹出提示
 * @return {Boolean} 是否正常
 */
export function checkGraphData(graphData, isThrow, popupMessage) {
  try {
    if (graphData == null) throw "图谱数据为null！";
    if (!(graphData.header instanceof Object)) throw "header数据异常！";
    if (!(graphData.header.boundingBox instanceof Object)) throw "header.boundingBox数据异常！";
    if (!(graphData.data instanceof Object)) throw "data数据异常！";
    if (!(graphData.data.nodes instanceof Array)) throw "data.nodes数据异常！";
    if (!(graphData.data.lines instanceof Array)) throw "data.lines数据异常！";
  } catch (e) {
    if (popupMessage) {
      Message({
        message: "图谱数据校验失败：" + e,
        type: "warning",
      });
    }
    if (isThrow) throw e;
    return false;
  }
  return true;
}

/**
 * 相对画布svg坐标，转换画布内坐标
 * @param offset 相对画布坐标 [ox, oy]
 * @param transform 转换参数 {x, y, k}
 * @return 画布内坐标 [cx, cx]
 */
export function offsetToCoord([ox, oy], { x, y, k }) {
  return [(ox - x) / k, (oy - y) / k];
}

/**
 * 画布内坐标，转换相对画布svg坐标
 * @param coord 画布内坐标 [cx, cy]
 * @param transform 转换参数 {x, y, k}
 * @return 相对画布坐标 [ox, oy]
 */
export function coordToOffset([cx, cy], { x, y, k }) {
  return [cx * k + x, cy * k + y];
}

/**
 * 获取文本行数(至少一行)
 */
export function getLineNum(text) {
  if (!(text?.length > 0)) return 1;
  return text
    .split("\n") // 解析换行符
    .reduce((a, b) => {
      return a + (b.length == 0 ? 1 : Math.ceil(b.length / Cfg.lineWordsNum));
    }, 0);
}

/**
 * 获取固定大小（随着视图缩小变大，以保持相对窗口大小不变）
 * @param size 未缩放的数值
 * @param scale 缩放量
 * @param minSize 最小数值(默认size)
 * @param maxSize 最大数值(默认Number.MAX_VALUE)
 */
export function fixedSize(size, scale, minSize = size, maxSize = Number.MAX_VALUE) {
  return Math.min(Math.max(size / scale, minSize), maxSize);
}

/**
 * 获取网格对齐坐标偏移量
 * @param x
 * @param y
 * @return 对齐坐标偏移量 [dtX, dtY]
 */
export function getGridAlignmentOffset(x, y) {
  let dtX, dtY;
  let modX = x % Cfg.gridStep;
  // 向最近的对齐线偏移
  if (modX >= Cfg.gridStep / 2) {
    dtX = Cfg.gridStep - modX;
  } else {
    dtX = -modX;
  }
  let modY = y % Cfg.gridStep;
  if (modY >= Cfg.gridStep / 2) {
    dtY = Cfg.gridStep - modY;
  } else {
    dtY = -modY;
  }
  return [dtX, dtY];
}

/**
 * 网格对齐坐标
 * @param x
 * @param y
 * @return 对齐后坐标 [x, y]
 */
export function gridAlignment(x, y) {
  let [dtX, dtY] = getGridAlignmentOffset(x, y);
  return [x + dtX, y + dtY];
}

/**
 * 计算节点包围盒边界
 * @description 节点集为空 或 长度为0 时，返回null
 * @param nodes 节点集 [{x, y, w, h},...]
 * @return 包围盒边界信息 {minX, minY, maxX, maxY, w, h}
 */
export function calcuBoundingBox(nodes) {
  if (!(nodes.length > 0)) return null;
  let minX, minY, maxX, maxY, w, h;
  nodes.forEach((n) => {
    const x1 = n.x - n.w / 2;
    const y1 = n.y - n.h / 2;
    const x2 = n.x + n.w / 2;
    const y2 = n.y + n.h / 2;
    minX = Math.min(minX ?? x1, x1);
    minY = Math.min(minY ?? y1, y1);
    maxX = Math.max(maxX ?? x2, x2);
    maxY = Math.max(maxY ?? y2, y2);
  });
  w = maxX - minX;
  h = maxY - minY;
  return { minX, minY, maxX, maxY, w, h };
}

/**
 * 通过节点集合获取边集（排除节点集合外的边）
 * @param nodes 节点对象集合
 * @return edges 连接线对象集合
 */
export function getEdgesByNodes(nodes) {
  const nodeMap = new Map();
  nodes.forEach((n) => {
    nodeMap.set(n.id, n);
  });
  return getEdgesByNodeMap(nodeMap);
}

/**
 * 通过节点映射获取边集（排除节点映射外的边）
 * @param nodeMap 节点对象映射
 * @return edges 连接线对象集合
 */
export function getEdgesByNodeMap(nodeMap) {
  const edges = [];
  nodeMap.forEach((n) => {
    n.slots.forEach((s) => {
      // 排除节点映射外的边
      if (s.edge && nodeMap.has(s.edge.source) && nodeMap.has(s.edge.target)) {
        edges.push(s.edge);
      }
    });
  });
  return edges;
}
