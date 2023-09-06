import React from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { BsDownload } from 'react-icons/bs';

import styles from './Render.module.scss';
import { mainStore } from '../stores/main';

export const Render: React.FC = observer(() => {
  if (!mainStore.loaded) {
    return (
      <div className={styles.loading}>
        <span>FFmpeg is loading... please wait!</span>
        <progress value={mainStore.loadProgress} max={1} />
      </div>
    );
  }

  const video = mainStore.video;

  if (!video) {
    return (
      <div>
        <span>No video selected.</span>
      </div>
    );
  }

  const x = mainStore.area[0];
  const y = mainStore.area[1];

  const w = mainStore.area[2] - x;
  const h = mainStore.area[3] - y;

  const crop = async () => {
    await mainStore.ffmpeg.writeFile(
      'input',
      new Uint8Array(await mainStore.file!.arrayBuffer()),
    );

    const args: string[] = [];
    const filters: string[] = [];

    if (mainStore.flipH) {
      filters.push('hflip');
    }

    if (mainStore.flipV) {
      filters.push('vflip');
    }

    if (
      mainStore.area[0] !== 0 ||
      mainStore.area[1] !== 0 ||
      mainStore.area[2] !== 1 ||
      mainStore.area[3] !== 1
    ) {
      filters.push(`crop=in_w*${w}:in_h*${h}:in_w*${x}:in_h*${y}`);
    }

    // Add filters
    args.push('-vf', filters.join(', '));

    let start = 0;
    if (mainStore.time[0] !== 0) {
      start = mainStore.time[0] * video.duration;
      args.push('-ss', `${start}`);
    }

    if (mainStore.time[1] !== 1) {
      args.push('-t', `${mainStore.time[1] * video.duration - start}`);
    }

    args.push('-c:v', 'libx264');
    args.push('-preset', 'veryfast');

    if (mainStore.mute) {
      args.push('-an');
    } else {
      args.push('-c:a', 'copy');
    }

    mainStore.exec(args);
  };

  return (
    <div className={styles.step}>
      {mainStore.running ? (
        <div className={styles.info}>
          <span>Running</span>
          <progress value={mainStore.execProgress} max={1} />
          <pre>{mainStore.output}</pre>
        </div>
      ) : (
        <div className={styles.actions}>
          <button onClick={crop}>
            <span>Render MP4</span>
          </button>
          {mainStore.outputUrl && (
            <a
              href={mainStore.outputUrl}
              download="cropped.mp4"
              className={clsx('button', styles.download)}
            >
              <BsDownload />
              <span>Download</span>
            </a>
          )}
        </div>
      )}
      {mainStore.outputUrl && !mainStore.running && (
        <div>
          <video src={mainStore.outputUrl} controls />
        </div>
      )}
    </div>
  );
});
