interface ModalButtonConfig {
  back?: (() => void) | null;
  next?: (() => void) | null;
  cancel?: (() => void) | null;
  insertMode?: boolean;
}

let _backHandler: EventListener | null = null;
let _nextHandler: EventListener | null = null;
let _cancelHandler: EventListener | null = null;

export function configureModal({
  back,
  next,
  cancel,
  insertMode = false,
}: ModalButtonConfig) {
  const show = {
    back: !!back,
    next: !!next,
    cancel: !!cancel,
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
    _backHandler = (e) => {
      const event = e as MessageEvent;
      if (event.data?.subject === "lti.back") back();
    };
    window.addEventListener("message", _backHandler);
  } else {
    _backHandler = null;
  }

  if (next) {
    _nextHandler = (e) => {
      const event = e as MessageEvent;
      if (event.data?.subject === "lti.next") next();
    };
    window.addEventListener("message", _nextHandler);
  } else {
    _nextHandler = null;
  }

  if (cancel) {
    _cancelHandler = (e) => {
      const event = e as MessageEvent;
      if (event.data?.subject === "lti.cancel") cancel();
    };
    window.addEventListener("message", _cancelHandler);
  } else {
    _cancelHandler = null;
  }
}
