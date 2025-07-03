interface ModalButtonConfig {
  back?: (() => void) | null;
  next?: (() => void) | null;
  cancel?: (() => void) | null;
  insertMode?: boolean;
}

let _handler: EventListener | null = null;

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
    JSON.stringify({
      subject: "lti.showButtons",
      show,
      labels,
    }),
    "*"
  );

  console.log("[LTI] Sent button config:", { show, labels });

  if (_handler) {
    window.removeEventListener("message", _handler);
  }

  _handler = (e: Event) => {
    const event = e as MessageEvent;

    let message;
    try {
      message =
        typeof event.data === "string" ? JSON.parse(event.data) : event.data;
    } catch {
      return;
    }
    console.log("[LTI] Received message:", message);

    if (!message || typeof message.subject !== "string") return;

    switch (message.subject) {
      case "lti.back":
        back?.();
        break;
      case "lti.next":
        next?.();
        break;
      case "lti.cancel":
        cancel?.();
        break;
    }
  };

  window.addEventListener("message", _handler);
}
