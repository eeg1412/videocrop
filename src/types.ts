export type Time = [start: number, end: number];
export type Area = [x: number, y: number, width: number, height: number];

export interface VideoTransform {
  time?: Time;
  area?: Area;
  mute?: boolean;
  flipH?: boolean;
  flipV?: boolean;
  scale?: number;
  outputFormat?: string;
  webpFrameRate?: number;
  // 质量
  webpQuality?: number;
}

/**
 * Width / height
 */
export type Ratio = number;
