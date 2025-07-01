interface ModalButtonConfig {
  back?: (() => void) | null;
  next?: (() => void) | null;
  cancel?: (() => void) | null;
  insertMode?: boolean;
}

let _backHandler: EventListenerOrEventListenerObject | null = null;
let _nextHandler: EventListenerOrEventListenerObject | null = null;
let _cancelHandler: EventListenerOrEventListenerObject | null = null;

export function configureModal({
  back,
  next,
  cancel,
  insertMode = false,
}: ModalButtonConfig) {
  const show = {
    back: Boolean(back),
    next: Boolean(next),
    cancel: Boolean(cancel),
  };

  const labels = {
    next: insertMode ? "Insert" : "Next",
  };

  window.parent.postMessage(
    {
      subject: "lti.showButtons",
      show,
      labels,
    },
    "*"
  );

  if (_backHandler) window.removeEventListener("message", _backHandler);
  if (_nextHandler) window.removeEventListener("message", _nextHandler);
  if (_cancelHandler) window.removeEventListener("message", _cancelHandler);

  if (back) {
    _backHandler = (e: Event) => {
      const event = e as MessageEvent;
      if (event.data?.subject === "lti.back") back();
    };
    window.addEventListener("message", _backHandler);
  }

  if (next) {
    _nextHandler = (e: Event) => {
      const event = e as MessageEvent;
      if (event.data?.subject === "lti.next") next();
    };
    window.addEventListener("message", _nextHandler);
  }

  if (cancel) {
    _cancelHandler = (e: Event) => {
      const event = e as MessageEvent;
      if (event.data?.subject === "lti.cancel") cancel();
    };
    window.addEventListener("message", _cancelHandler);
  }
}
