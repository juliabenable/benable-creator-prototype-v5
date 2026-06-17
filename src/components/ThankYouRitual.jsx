import { useEffect, useRef, useState } from 'react';
import PolaroidPostcard from './PolaroidPostcard.jsx';
import PolaroidBackNote from './PolaroidBackNote.jsx';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const CREATOR = { name: 'Sienna', handle: '@rmtfka' };
const SELFIE = 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&q=80&auto=format&fit=crop';
const STARTERS = [
  { chip: 'Thank you', text: 'Thank you for having me — I had the best time bringing this one to life.' },
  { chip: 'Obsessed', text: 'Obsessed with how this turned out, and I genuinely love the product.' },
  { chip: 'Round two?', text: 'This was so much fun — I’d jump on a round two in a heartbeat.' },
];

/* line icons (16–26px, currentColor) */
const IconHeart = () => <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21s-7.5-4.6-10-9.1C.4 8.8 2 5.5 5.3 5.5c2 0 3.3 1.1 4.2 2.3.4.5 1.4.5 1.8 0 .9-1.2 2.2-2.3 4.2-2.3 3.3 0 4.9 3.3 3.3 6.4C19.5 16.4 12 21 12 21z" /></svg>;
const IconNote = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 5h16M4 10h16M4 15h10" /></svg>;
const IconRotate = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7M3 4v4h4" /></svg>;
const IconCamera = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 8h3l2-2.5h8L18 8h3v12H3z" /><circle cx="12" cy="13.5" r="3.5" /></svg>;
const IconCheck = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 13l4 4L19 7" /></svg>;

/**
 * The thank-you ritual, styled to Benable's mobile identity. Three beats:
 *   Receive · savor — open the envelope, read the front, flip to the note
 *   Reply · write   — offered "send one back?", write the note
 *   Send            — off it goes; the two cards land together
 * onReply(reply) persists the creator's thank-you; onDismiss() closes + marks seen.
 */
export default function ThankYouRitual({ collab, onReply, onDismiss }) {
  const reduced = prefersReducedMotion();
  const [phase, setPhase] = useState(reduced ? 'card' : 'sealed'); // sealed→opening→card→compose→sending→exchange
  const [flipped, setFlipped] = useState(false);
  const [offerShown, setOfferShown] = useState(false);
  const [activeStarter, setActiveStarter] = useState(0);
  const [note, setNote] = useState(STARTERS[0].text);
  const [withSelfie, setWithSelfie] = useState(true);
  const [wantsCollab, setWantsCollab] = useState(true);
  const [out, setOut] = useState(false);
  const timers = useRef([]);
  const addT = (fn, ms) => { const id = window.setTimeout(fn, ms); timers.current.push(id); return id; };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const brand = collab.brandName;
  const { postcard, post, privateNote, campaignTitle } = collab;
  const hasNote = !!privateNote;

  function openEnvelope() { if (phase !== 'sealed') return; setPhase('opening'); addT(() => setPhase('card'), 680); }

  useEffect(() => {
    if (phase !== 'card') return;
    const id = addT(() => setOfferShown(true), hasNote ? 6500 : 2200);
    return () => clearTimeout(id);
  }, [phase, hasNote]);

  function flipCard() {
    if (phase !== 'card' || !hasNote) return;
    setFlipped((f) => { if (!f) setOfferShown(true); return !f; });
  }
  function chooseStarter(i) { setActiveStarter(i); setNote(STARTERS[i].text); }
  function toCompose() { setFlipped(false); setPhase('compose'); }
  function send() {
    if (!note.trim()) return;
    onReply?.({ message: note.trim(), withSelfie, wantsCollab, sentAt: new Date().toISOString() });
    setPhase('sending');
    addT(() => setPhase('exchange'), 1600);
  }
  function dismiss() { setOut(true); addT(onDismiss, 300); }

  const Header = ({ onBack }) => (
    <div className="r-header">
      {onBack && <button type="button" className="r-header__back" onClick={onBack} aria-label="Back">‹</button>}
      <span className="r-header__av" aria-hidden="true">{brand[0]}</span>
      <span className="r-header__id">
        <span className="r-header__brand">{brand}</span>
        <span className="r-header__camp">{campaignTitle}</span>
      </span>
    </div>
  );

  const replyCard = (
    <PolaroidPostcard
      photos={withSelfie ? [SELFIE] : []}
      brandName=""
      message={note.trim() || 'Thank you!'}
      signoff={`— ${CREATOR.name} · ${CREATOR.handle}`}
    />
  );

  return (
    <div className={'ritual' + (out ? ' ritual--out' : '')} role="dialog" aria-modal="true">
      {/* RECEIVE */}
      {(phase === 'sealed' || phase === 'opening') && (
        <>
          <Header onBack={dismiss} />
          <div className="r-center">
            <button
              type="button"
              className={'r-env' + (phase === 'opening' ? ' is-open' : '')}
              onClick={openEnvelope}
              aria-label={`Open the thank-you from ${brand}`}
            >
              <span className="r-env__body" aria-hidden="true" />
              <span className="r-env__pocket" aria-hidden="true" />
              <span className="r-env__flap" aria-hidden="true" />
              <span className="r-env__seal" aria-hidden="true"><IconHeart /></span>
            </button>
            <h1 className="r-reveal__title">{brand} sent you a thank-you</h1>
            <p className="r-reveal__sub">A little note for your work on {campaignTitle}.</p>
          </div>
          <div className="r-footer"><button type="button" className="r-text" onClick={dismiss}>Maybe later</button></div>
        </>
      )}

      {/* SAVOR */}
      {phase === 'card' && (
        <>
          <Header onBack={dismiss} />
          <div className={'r-card-scene' + (offerShown ? ' offer-in' : '')}>
            <p className="r-card-scene__cap">{flipped ? `A private note from ${brand}` : `From ${brand}`}</p>
            <button type="button" className="r-card" onClick={flipCard} aria-label={hasNote ? (flipped ? 'Flip back to the photo' : `Read the private note from ${brand}`) : `Thank-you from ${brand}`}>
              <span className={'r-flip' + (flipped ? ' is-flipped' : '')}>
                <span className="r-face r-face--front">
                  <PolaroidPostcard
                    thumbnailUrl={post.thumbnailUrl} photos={post.photos} platform={post.platform}
                    brandName={brand} message={postcard.message} signoff={postcard.signoff} signerAvatar={postcard.signerAvatar}
                  />
                </span>
                <span className="r-face r-face--back">
                  {hasNote && <PolaroidBackNote brandName={brand} message={privateNote.message} signoff={privateNote.signoff} />}
                </span>
              </span>
            </button>
            {hasNote && (
              <button type="button" className={'r-flip-hint' + (flipped ? ' r-flip-hint--muted' : '')} onClick={flipCard}>
                {flipped ? <><IconRotate /> Back to the photo</> : <><IconNote /> Read their note</>}
              </button>
            )}
          </div>

          <div className={'r-offer' + (offerShown ? ' is-in' : '')}>
            <p className="r-offer__t">Send one back?</p>
            <p className="r-offer__s">Let {brand} know you’d love to work together again.</p>
            <button type="button" className="r-btn r-btn--primary" onClick={toCompose}>Write a thank-you</button>
            <button type="button" className="r-text" onClick={dismiss}>Add to your wall</button>
          </div>
        </>
      )}

      {/* WRITE */}
      {phase === 'compose' && (
        <>
          <Header onBack={() => setPhase('card')} />
          <div className="r-body">
            <h1 className="r-title">Write back to {brand}</h1>
            <p className="r-sub">A quick thank-you they’ll see alongside your work.</p>

            <div style={{ marginTop: 20 }}>
              <span className="r-overline r-field-label">Your note</span>
              <textarea className="r-field" value={note} onChange={(e) => setNote(e.target.value)} aria-label="Your thank-you note" />
              <div className="r-chips">
                {STARTERS.map((s, i) => (
                  <button key={i} type="button" className={'r-chip' + (i === activeStarter ? ' on' : '')} onClick={() => chooseStarter(i)}>{s.chip}</button>
                ))}
              </div>
            </div>

            <button type="button" className={'r-add' + (withSelfie ? ' on' : '')} onClick={() => setWithSelfie((v) => !v)}>
              {withSelfie ? <img className="r-add__thumb" src={SELFIE} alt="" /> : <IconCamera />}
              {withSelfie ? 'Selfie added · tap to remove' : 'Add a selfie'}
            </button>

            <div className="r-toggle-row">
              <span className="r-toggle-row__txt">
                <b>I’d love to work together again</b>
                <span>Lets {brand} know you’re open to another campaign</span>
              </span>
              <button type="button" role="switch" aria-checked={wantsCollab} aria-label="I'd love to work together again" className={'r-toggle' + (wantsCollab ? ' on' : '')} onClick={() => setWantsCollab((v) => !v)} />
            </div>
          </div>
          <div className="r-footer">
            <button type="button" className="r-btn r-btn--primary" disabled={!note.trim()} onClick={send}>Send to {brand}</button>
          </div>
        </>
      )}

      {/* SEND */}
      {phase === 'sending' && (
        <div className="r-sending">
          <span className="r-spinner" aria-hidden="true" />
          <p>Sending to {brand}…</p>
        </div>
      )}

      {/* EXCHANGE */}
      {phase === 'exchange' && (
        <div className="r-exchange">
          <span className="r-check" aria-hidden="true"><IconCheck /></span>
          <h1 className="r-exchange__title">Sent to {brand}</h1>
          <p className="r-exchange__sub">Your thank-yous now live together.</p>
          <div className="r-exchange__cards">
            <span className="r-ex" style={{ '--exrot': '-4deg' }}>
              <PolaroidPostcard
                photos={post.photos} thumbnailUrl={post.thumbnailUrl} platform={post.platform}
                brandName={brand} message={postcard.message} signoff={postcard.signoff} signerAvatar={postcard.signerAvatar}
              />
            </span>
            <span className="r-ex" style={{ '--exrot': '4deg' }}>{replyCard}</span>
          </div>
          <button type="button" className="r-btn r-btn--primary" style={{ maxWidth: 240 }} onClick={dismiss}>Done</button>
        </div>
      )}
    </div>
  );
}
