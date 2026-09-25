import { useState, type MouseEvent as ReactMouseEvent } from "react";
import { createPortal } from "react-dom";
import { NavIcon } from "./icons";
import { useShell } from "./shell";

interface ShareButtonProps {
  title: string;
  text: string;
  link: string;
  label?: string;
  wrapClassName?: string;
  buttonClassName?: string;
}

// A centered modal card rather than an anchored popover — anchoring to the
// trigger's bounding rect kept breaking across different cards/pages
// (clipped by scroll containers, interleaved when two instances raced open
// at once). A fixed, centered card sidesteps all of that: it always renders
// as one solid card regardless of where the trigger button lives.
export function ShareButton({ title, text, link, label, wrapClassName, buttonClassName }: ShareButtonProps) {
  const { setToast } = useShell();
  const [open, setOpen] = useState(false);

  function openMenu(e: ReactMouseEvent) {
    e.stopPropagation();
    setOpen(true);
  }

  function close() {
    setOpen(false);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setToast("Link copied to clipboard");
    } catch {
      setToast("Couldn't copy — try again");
    }
    close();
  }

  return (
    <span className={`share-btn-wrap ${wrapClassName ?? ""}`}>
      <button className={buttonClassName} aria-label="Share" onClick={openMenu}>
        <NavIcon.share /> {label}
      </button>
      {open &&
        createPortal(
          <div className="share-card-overlay" onClick={close}>
            <div className="share-card" onClick={(e) => e.stopPropagation()}>
              <button className="share-card-close" aria-label="Close" onClick={close}><NavIcon.close /></button>
              <p className="dash-share-title">Share</p>
              <div className="dash-share-link-row">
                <input readOnly value={link} onFocus={(e) => e.target.select()} />
                <button type="button" aria-label="Copy link" onClick={copyLink}><NavIcon.copy /></button>
              </div>
              <div className="dash-share-platforms">
                <a className="dash-share-platform whatsapp" href={`https://wa.me/?text=${encodeURIComponent(`${text} ${link}`)}`} target="_blank" rel="noreferrer" onClick={close}>
                  <NavIcon.chat /> WhatsApp
                </a>
                <a className="dash-share-platform facebook" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`} target="_blank" rel="noreferrer" onClick={close}>
                  <NavIcon.globe /> Facebook
                </a>
                <a className="dash-share-platform x" href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`} target="_blank" rel="noreferrer" onClick={close}>
                  <NavIcon.send /> X
                </a>
                <a className="dash-share-platform email" href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n\n${link}`)}`} onClick={close}>
                  <NavIcon.paperclip /> Email
                </a>
              </div>
            </div>
          </div>,
          document.body
        )}
    </span>
  );
}
