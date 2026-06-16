import { useEffect, useRef, useState } from 'react';
import PolaroidPostcard from './PolaroidPostcard.jsx';
import PolaroidBackNote from './PolaroidBackNote.jsx';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const CREATOR = { name: 'Sienna', handle: '@rmtfka' };
const SELFIE = 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&q=80&auto=format&fit=crop';
const STARTERS = [
  { chip: 'thank you 💛', text: 'thank you for having me 💛 i had the best time bringing this one to life.' },
  { chip: 'obsessed', text: 'obsessed with how this turned out — and i genuinely love the product.' },
  { chip: 'round two?', text: 'this was so much fun — i’d jump on a round two in a heartbeat.' },
];

const Confetti = () => (
  <span className="r-burst" aria-hidden="true">
    {[...Array(8)].map((_, i) => <span key={i} className={`r-cp r-cp--${i + 1}`} />)}
  </span>
);

/**
 * The full thank-you ritual. Three beats:
 *   Receive · savor — open the envelope, read the front, flip to the private note
 *   Reply · write   — offered "send one back?", write the note
 *   Send            — off it goes, the two cards land together as an exchange
 *
 * onReply(reply) persists the creator's thank-you; onDismiss() closes + marks seen.
 */
export default function ThankYouRitual({ collab, onReply, onDismiss }) {
  const reduced = prefersReducedMotion();
  // sealed → opening → card → compose → sending → exchange
  const [phase, setPhase] = useState(reduced ? 'card' : 'sealed');
  const [flipped, setFlipped] = useState(false);
  const [offerShown, setOfferShown] = useState(false);
  const [activeStarter, setActiveStarter] = useState(0);
  const [note, setNote] = useState(STARTERS[0].text);
  const [withSelfie, setWithSelfie] = useState(true);
  const [wantsCollab, setWantsCollab] = useState(false);
  const [out, setOut] = useState(false);
  const timers = useRef([]);

  const addT = (fn, ms) => { const id = window.setTimeout(fn, ms); timers.current.push(id); return id; };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const brand = collab.brandName;
  const hasNote = !!collab.privateNote;
  const { postcard, post, privateNote } = collab;

  function openEnvelope() {
    if (phase !== 'sealed') return;
    setPhase('opening');
    addT(() => setPhase('card'), 720);
  }

  // Offer the reply only after the gift has landed: once they flip to the
  // note, or — as a fallback so nobody gets stuck — after a short dwell.
  useEffect(() => {
    if (phase !== 'card') return;
    const id = addT(() => setOfferShown(true), hasNote ? 6500 : 2500);
    return () => clearTimeout(id);
  }, [phase, hasNote]);

  function flipCard() {
    if (phase !== 'card' || !hasNote) return;
    setFlipped((f) => {
      if (!f) setOfferShown(true); // they've now seen the back
      return !f;
    });
  }
  function chooseStarter(i) { setActiveStarter(i); setNote(STARTERS[i].text); }
  function toCompose() { setFlipped(false); setPhase('compose'); }

  function send() {
    if (!note.trim()) return;
    onReply?.({
      message: note.trim(),
      withSelfie,
      wantsCollab,
      sentAt: new Date().toISOString(),
    });
    setPhase('sending');
    addT(() => setPhase('exchange'), 1750);
  }

  function dismiss() { setOut(true); addT(onDismiss, 320); }

  function onScrimClick(e) {
    // In the savor scene, a backdrop tap once the offer is up = put it on the wall.
    if (phase === 'card' && offerShown && !e.target.closest('button')) dismiss();
  }

  const replyCard = (
    <PolaroidPostcard
      photos={withSelfie ? [SELFIE] : []}
      brandName=""
      message={note.trim() || 'thank you 💛'}
      signoff={`— ${CREATOR.name} · ${CREATOR.handle}`}
    />
  );

  return (
    <div
      className={'tyt-scrim' + (out ? ' tyt-scrim--out' : '')}
      role="dialog"
      aria-modal="true"
      onClick={onScrimClick}
    >
      {/* RECEIVE — envelope (reuses takeover.css) */}
      {(phase === 'sealed' || phase === 'opening') && (
        <div className={'tyt-stage tyt--' + phase}>
          <button
            type="button"
            className="tyt-envelope"
            onClick={openEnvelope}
            aria-label={`Open the thank-you from ${brand}`}
          >
            <span className="tyt-env-back" aria-hidden="true" />
            <span className="tyt-env-front" aria-hidden="true" />
            <span className="tyt-env-flap" aria-hidden="true" />
            <span className="tyt-seal" aria-hidden="true">♥</span>
          </button>
          <p className="tyt-caption">{phase === 'sealed' ? `${brand} sent you a thank-you` : ' '}</p>
          {phase === 'sealed' && (
            <button type="button" className="tyt-skip" onClick={dismiss}>maybe later</button>
          )}
        </div>
      )}

      {/* SAVOR — read the front, flip to the back, then the offer rises */}
      {phase === 'card' && (
        <div className="r-stage">
          <p className="r-cap">{flipped ? `a private note from ${brand}` : `from ${brand}`}</p>
          <button
            type="button"
            className="r-card"
            onClick={flipCard}
            aria-label={hasNote ? (flipped ? 'Flip back to the photo' : `Read the private note from ${brand}`) : `Thank-you from ${brand}`}
          >
            <span className={'r-flip' + (flipped ? ' is-flipped' : '')}>
              <span className="r-face r-face--front">
                <PolaroidPostcard
                  thumbnailUrl={post.thumbnailUrl}
                  photos={post.photos}
                  platform={post.platform}
                  brandName={brand}
                  message={postcard.message}
                  signoff={postcard.signoff}
                  signerAvatar={postcard.signerAvatar}
                />
              </span>
              <span className="r-face r-face--back">
                {hasNote && (
                  <PolaroidBackNote brandName={brand} message={privateNote.message} signoff={privateNote.signoff} />
                )}
              </span>
            </span>
            {!reduced && <Confetti />}
          </button>
          <p className="r-hint">
            {hasNote && !flipped && !offerShown ? 'tap the card to read their note'
              : flipped ? 'tap to flip back' : ' '}
          </p>
          <div className={'r-offer' + (offerShown ? ' is-in' : '')}>
            <div className="r-offer__t">loved it? send one back 💌</div>
            <button type="button" className="r-btn r-btn--p" onClick={toCompose}>Write a thank-you</button>
            <button type="button" className="r-btn r-btn--g" onClick={dismiss}>put it on my wall</button>
          </div>
        </div>
      )}

      {/* WRITE — compose the reply */}
      {phase === 'compose' && (
        <div className="r-compose">
          <div className="r-compose__top">
            <button type="button" className="r-back" onClick={() => setPhase('card')} aria-label="Back">‹</button>
            <span className="r-compose__to">To {brand}</span>
          </div>
          <div className="r-lbl">a little starter</div>
          <div className="r-starters">
            {STARTERS.map((s, i) => (
              <button key={i} type="button" className={'r-st' + (i === activeStarter ? ' on' : '')} onClick={() => chooseStarter(i)}>{s.chip}</button>
            ))}
          </div>
          <textarea
            className="r-write"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            aria-label="Your thank-you note"
          />
          <div className="r-optrow">
            <button type="button" className={'r-opt' + (withSelfie ? ' on' : '')} onClick={() => setWithSelfie((v) => !v)}>
              📷 {withSelfie ? 'Selfie added' : 'Add a selfie'}
            </button>
            <button type="button" className={'r-opt' + (wantsCollab ? ' on' : '')} onClick={() => setWantsCollab((v) => !v)}>
              💛 I’d collab again
            </button>
          </div>
          <button type="button" className="r-btn r-btn--p r-send" disabled={!note.trim()} onClick={send}>Send to {brand}</button>
        </div>
      )}

      {/* SEND */}
      {phase === 'sending' && (
        <div className="r-sending">
          <div className="r-fly">💌</div>
          <p>sending to {brand}…</p>
        </div>
      )}

      {/* EXCHANGE — the two cards land together */}
      {phase === 'exchange' && (
        <div className="r-exchange">
          <div className="r-exchange__cap">on its way to {brand} 💌</div>
          <div className="r-exchange__cards">
            <span className="r-ex" style={{ '--exrot': '-5deg' }}>
              <PolaroidPostcard
                photos={post.photos} thumbnailUrl={post.thumbnailUrl} platform={post.platform}
                brandName={brand} message={postcard.message} signoff={postcard.signoff} signerAvatar={postcard.signerAvatar}
              />
            </span>
            <span className="r-ex" style={{ '--exrot': '5deg' }}>{replyCard}</span>
          </div>
          <div className="r-exchange__sub">your thank-yous now live together</div>
          <button type="button" className="r-btn r-btn--p" onClick={dismiss}>Done</button>
          {!reduced && <Confetti />}
        </div>
      )}
    </div>
  );
}
