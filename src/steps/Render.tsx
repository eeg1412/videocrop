import React, { useState } from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { BsDownload } from 'react-icons/bs';
import { runInAction } from 'mobx';

import styles from './Render.module.scss';
import { mainStore } from '../stores/main';
import { Slider } from '../components/Slider';

export const Render: React.FC = observer(() => {
  const [outputUrl, setOutputUrl] = useState<string>();
  const [logVisible, setLogVisible] = useState(false);
  const [urlFormat, setUrlFormat] = useState<string>('mp4');

  const { ffmpeg, video } = mainStore;

  if (!ffmpeg.loaded) {
    return (
      <div className={styles.loading}>
        <span>FFmpeg is loading... please wait!</span>
        <progress value={ffmpeg.loadProgress} max={1} />
      </div>
    );
  }

  if (!video) {
    return (
      <div>
        <span>No video selected.</span>
      </div>
    );
  }

  const { area, scale = 1 } = mainStore.transform;
  const x = Math.trunc((scale * (area ? area[0] : 0)) / 2) * 2;
  const y = Math.trunc((scale * (area ? area[1] : 0)) / 2) * 2;
  const width =
    Math.trunc((scale * (area ? area[2] : video.videoWidth)) / 2) * 2;
  const height =
    Math.trunc((scale * (area ? area[3] : video.videoHeight)) / 2) * 2;

  const crop = async () => {
    setOutputUrl(undefined);

    const args: string[] = [];
    const filters: string[] = [];

    const { flipH, flipV, area, time, mute } = mainStore.transform;
    const { outputFormat, webpFrameRate, webpQuality } = mainStore.transform;

    if (flipH) {
      filters.push('hflip');
    }

    if (flipV) {
      filters.push('vflip');
    }

    if (scale !== 1) {
      filters.push(
        `scale=${Math.trunc((video.videoWidth * scale) / 2) * 2}:${
          Math.trunc((video.videoHeight * scale) / 2) * 2
        }`,
      );
    }

    if (
      area &&
      (area[0] !== 0 || area[1] !== 0 || area[2] !== 1 || area[3] !== 1)
    ) {
      filters.push(`crop=${width}:${height}:${x}:${y}`);
    }

    // Add filters
    if (filters.length > 0) {
      args.push('-vf', filters.join(', '));
    }

    if (time) {
      let start = 0;
      if (time[0] > 0) {
        start = time[0];
        args.push('-ss', `${start}`);
      }

      if (time[1] < video.duration) {
        args.push('-t', `${time[1] - start}`);
      }
    }

    if (outputFormat === 'webp') {
      args.push('-vcodec', 'libwebp');
      args.push('-lossless', '0');
      args.push('-q:v', webpQuality?.toString() ?? '80');
      args.push('-r', webpFrameRate?.toString() ?? '12');
      args.push('-loop', '0');
      args.push('-compression_level', '6'); // 使用更高的压缩级别
    } else {
      args.push('-c:v', 'libx264');
      args.push('-preset', 'veryfast');
    }

    if (mute) {
      args.push('-an');
    } else {
      args.push('-c:a', 'copy');
    }

    args.push('-f', outputFormat || 'mp4');

    console.log(args);

    const newFile = await ffmpeg.exec(mainStore.file!, args);
    setOutputUrl(URL.createObjectURL(newFile));
    // 设置urlFormat
    setUrlFormat(outputFormat || 'mp4');
  };

  return (
    <div className={styles.step}>
      {ffmpeg.running ? (
        <>
          <div className={styles.actions}>
            <button onClick={() => ffmpeg.cancel()}>
              <span>Cancel</span>
            </button>
          </div>
          <div className={styles.info}>
            <span>Running</span>
            <progress value={ffmpeg.execProgress} max={1} />
            <pre>{ffmpeg.output}</pre>
          </div>
        </>
      ) : (
        <>
          <div className={styles.settings}>
            <div>
              Resolution: {width}px x {height}px
            </div>
            <div>
              Scale: {Math.round(scale * 100) / 100}
              <Slider
                min={0.1}
                max={1}
                value={scale}
                onChange={value => {
                  runInAction(() => {
                    mainStore.transform.scale = value;
                  });
                }}
              />
            </div>
          </div>
          <div style={{ marginTop: '0.25rem', marginBottom: '0.25rem' }}>
            <div className="select">
              <select
                value={mainStore.transform.outputFormat}
                onChange={e => {
                  mainStore.transform = {
                    ...mainStore.transform,
                    outputFormat: e.target.value,
                  };
                }}
              >
                <option value="mp4">mp4</option>
                <option value="webp">webp</option>
              </select>
            </div>
            {mainStore.transform.outputFormat === 'webp' && (
              <>
                {/* 帧率 */}
                <div className="select">
                  <select
                    value={
                      mainStore.transform.webpFrameRate?.toString() ?? '12'
                    }
                    onChange={e => {
                      mainStore.transform = {
                        ...mainStore.transform,
                        webpFrameRate: Number(e.target.value),
                      };
                    }}
                  >
                    <option value="1">1 fps</option>
                    <option value="6">6 fps</option>
                    <option value="12">12 fps</option>
                    <option value="24">24 fps</option>
                    <option value="30">30 fps</option>
                  </select>
                </div>
                {/* 质量 */}
                <div className="select">
                  <select
                    value={mainStore.transform.webpQuality?.toString() ?? '80'}
                    onChange={e => {
                      mainStore.transform = {
                        ...mainStore.transform,
                        webpQuality: Number(e.target.value),
                      };
                    }}
                  >
                    <option value="10">10 Quality</option>
                    <option value="20">20 Quality</option>
                    <option value="30">30 Quality</option>
                    <option value="40">40 Quality</option>
                    <option value="50">50 Quality</option>
                    <option value="60">60 Quality</option>
                    <option value="70">70 Quality</option>
                    <option value="80">80 Quality</option>
                    <option value="90">90 Quality</option>
                    <option value="100">100 Quality</option>
                  </select>
                </div>
              </>
            )}
          </div>
          <div className={styles.actions}>
            <button onClick={crop}>
              <span>Render</span>
            </button>
            {outputUrl && (
              <a
                href={outputUrl}
                download={`cropped.${
                  mainStore.transform.outputFormat === 'webp' ? 'webp' : 'mp4'
                }`}
                className={clsx('button', styles.download)}
              >
                <BsDownload />
                <span>Download</span>
              </a>
            )}
          </div>
        </>
      )}
      {outputUrl && !ffmpeg.running && (
        <div>
          {urlFormat === 'webp' ? (
            <img src={outputUrl} alt="output" />
          ) : (
            <video src={outputUrl} controls />
          )}
        </div>
      )}
      {!!ffmpeg.log && (
        <div className={styles.info}>
          <button onClick={() => setLogVisible(value => !value)}>
            {logVisible ? 'Hide log' : 'Show log'}
          </button>
          {logVisible && <pre>{ffmpeg.log}</pre>}
        </div>
      )}
    </div>
  );
});
