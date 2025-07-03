export function startBridgeToBrightspace() {
  window.addEventListener("message", (event) => {
    let data;
    try {
      data =
        typeof event.data === "string" ? JSON.parse(event.data) : event.data;
    } catch {
      return;
    }

    if (!data || data.subject !== "lti.showButtons") return;

    console.group("[Bridge] 📩 Received lti.showButtons");
    console.log("Show:", data.show);
    console.log("Labels:", data.labels);
    console.groupEnd();

    const dialog = (window as any).D2L?.Dialog?.GetParent?.();
    if (!dialog) {
      console.warn("[Bridge] D2L.Dialog.GetParent() not found.");
      return;
    }

    const btnNext = dialog.GetButton?.("BTN_next");
    const btnBack = dialog.GetButton?.("BTN_back");
    const btnCancel = dialog.GetButton?.("BTN_cancel");

    // Set visibility
    if (data.show?.next !== undefined && btnNext)
      btnNext.SetIsDisplayed(data.show.next);
    if (data.show?.back !== undefined && btnBack)
      btnBack.SetIsDisplayed(data.show.back);
    if (data.show?.cancel !== undefined && btnCancel)
      btnCancel.SetIsDisplayed(data.show.cancel);

    // Set label
    if (data.labels?.next && btnNext?.SetText) {
      btnNext.SetText(
        new (window as any).D2L.LP.Text.PlainText(data.labels.next)
      );
    }

    // Attach handler once
    if ((window as any).__modalBridgeAttached) return;
    (window as any).__modalBridgeAttached = true;

    dialog.SetResponseHandler?.((response: any) => {
      const type = response.GetResponseType?.();
      const param = response.GetParam?.();

      console.log("[Bridge] 🔁 Response Type:", type, "Param:", param);

      if (param === "back") {
        window.postMessage({ subject: "lti.back" }, "*");
      } else if (param === "next") {
        window.postMessage({ subject: "lti.next" }, "*");
      } else if (type === 2) {
        window.postMessage({ subject: "lti.cancel" }, "*");
      }
    });
  });
}
