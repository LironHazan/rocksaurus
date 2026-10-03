import { useEffect, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import { downloadBlob } from '../../engine/recorder';
import { Button, ui } from '../../ui';
import { BANNER, drawBanner, drawProfile, renderArtBackgrounds, type BannerText } from './channelArt';
import styles from './Brand.module.css';

type Backgrounds = Awaited<ReturnType<typeof renderArtBackgrounds>>;

const saveCanvas = (canvas: HTMLCanvasElement, filename: string) =>
  canvas.toBlob(blob => blob && downloadBlob(blob, filename), 'image/png');

/** Channel art: YouTube profile picture + banner, rendered from the same 3D Rory as the videos. */
export function BrandPage() {
  const [text, setText] = useState<BannerText>({
    name: 'ROCKSAURUS',
    tagline: 'tiny arms · BIG riffs 🤘',
    showSafeArea: false,
  });
  const [backgrounds, setBackgrounds] = useState<Backgrounds | null>(null);
  const profileRef = useRef<HTMLCanvasElement>(null);
  const bannerRef = useRef<HTMLCanvasElement>(null);

  // Render the slow 3D backgrounds once, after the art fonts have loaded.
  useEffect(() => {
    let cancelled = false;
    void Promise.all([document.fonts.load('100px Bungee'), document.fonts.load('700 50px Fredoka')])
      .then(() => renderArtBackgrounds())
      .then(art => {
        if (!cancelled) setBackgrounds(art);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Redraw text on top whenever it changes (cheap).
  useEffect(() => {
    if (!backgrounds || !profileRef.current || !bannerRef.current) return;
    drawProfile(profileRef.current, backgrounds.profile);
    drawBanner(bannerRef.current, backgrounds.banner, text);
  }, [backgrounds, text]);

  function downloadBanner() {
    if (!backgrounds) return;
    const clean = document.createElement('canvas'); // never export the guide lines
    drawBanner(clean, backgrounds.banner, { ...text, showSafeArea: false });
    saveCanvas(clean, 'channel-banner.png');
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Channel art</h1>
          <p className={styles.subtitle}>Profile picture and banner, rendered from the same 3D Rory as the videos.</p>
        </div>
      </header>

      <section className={`${ui.card} ${styles.settings}`} aria-label="Banner text">
        <label className={ui.field}>
          Channel name
          <input className={ui.input} value={text.name} onChange={e => setText({ ...text, name: e.target.value })} />
        </label>
        <label className={ui.field}>
          Tagline
          <input
            className={ui.input}
            value={text.tagline}
            onChange={e => setText({ ...text, tagline: e.target.value })}
          />
        </label>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={text.showSafeArea}
            onChange={e => setText({ ...text, showSafeArea: e.target.checked })}
          />
          Show banner safe area
        </label>
      </section>

      <div className={styles.grid}>
        <section className={`${ui.card} ${styles.panel}`} aria-labelledby="profile-heading">
          <div className={styles.panelHeader}>
            <div>
              <h2 id="profile-heading" className={styles.panelTitle}>
                Profile picture
              </h2>
              <p className={styles.panelMeta}>800×800 · shown as a circle</p>
            </div>
            <Button
              variant="primary"
              disabled={!backgrounds}
              onClick={() => profileRef.current && saveCanvas(profileRef.current, 'channel-profile.png')}
            >
              <Download size={16} aria-hidden /> PNG
            </Button>
          </div>
          <div className={styles.profileWrap}>
            <canvas ref={profileRef} className={styles.profile} aria-label="Profile picture preview" />
          </div>
        </section>

        <section className={`${ui.card} ${styles.panel}`} aria-labelledby="banner-heading">
          <div className={styles.panelHeader}>
            <div>
              <h2 id="banner-heading" className={styles.panelTitle}>
                Channel banner
              </h2>
              <p className={styles.panelMeta}>
                {BANNER.width}×{BANNER.height} · middle {BANNER.safeWidth}×{BANNER.safeHeight} visible on every device
              </p>
            </div>
            <Button variant="primary" disabled={!backgrounds} onClick={downloadBanner}>
              <Download size={16} aria-hidden /> PNG
            </Button>
          </div>
          <canvas ref={bannerRef} className={styles.banner} aria-label="Banner preview" />
        </section>
      </div>
      {!backgrounds && (
        <p className={styles.panelMeta} role="status">
          Rendering…
        </p>
      )}
    </div>
  );
}
