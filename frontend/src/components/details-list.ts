import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import "@brightspace-ui/core/components/description-list/description-list-wrapper.js";
import { descriptionListStyles } from "@brightspace-ui/core/components/description-list/description-list-wrapper.js";

@customElement("details-list")
export class DetailsList extends LitElement {
  static styles = [
    descriptionListStyles,
    css`
      :host {
        flex: 1;
        min-width: 0;
      }
    `,
  ];

  @property({ type: Object }) image: any = {};
  render() {
    const img = this.image || {};
    const rightsRaw =
      img["MAY.Digital-Rights-Situation"] ?? img.MayoDigitalRightsSituation;
    const rights =
      typeof rightsRaw === "object" && rightsRaw
        ? rightsRaw.Value || rightsRaw.KeywordText || ""
        : rightsRaw || "";

    const cTypeRaw = img["MAY.Copyright-Type"] ?? img.MayoCopyrightType;
    const cType =
      typeof cTypeRaw === "object" && cTypeRaw
        ? cTypeRaw.Value || cTypeRaw.KeywordText || ""
        : cTypeRaw || "";

    const cHolder =
      img["MAY.Copyright-Holder"] || img.MayoCopyrightHolder || "";
    return html`
      <d2l-dl-wrapper>
        <dl>
          ${img.Title
            ? html`<dt>Title</dt>
                <dd>${img.Title}</dd>`
            : null}
          ${img.SystemIdentifier
            ? html`<dt>Unique Identifier</dt>
                <dd>${img.SystemIdentifier}</dd>`
            : null}
          ${img.mimetype
            ? html`<dt>Content Type</dt>
                <dd>${img.mimetype}</dd>`
            : null}
          ${img.DocSubType
            ? html`<dt>Collection</dt>
                <dd>${img.DocSubType}</dd>`
            : null}
          ${img.CreateDate
            ? html`<dt>Creation Date</dt>
                <dd>${img.CreateDate}</dd>`
            : null}
          ${img.Path_TR1?.Width && img.Path_TR1?.Height
            ? html`<dt>Image Size</dt>
                <dd>${img.Path_TR1.Width} x ${img.Path_TR1.Height}</dd>`
            : null}
          ${img.UsageDescription
            ? html`<dt>Usage Notes</dt>
                <dd>${img.UsageDescription}</dd>`
            : null}
          ${img.Keyword
            ? html`<dt>Keyword</dt>
                <dd>${img.Keyword}</dd>`
            : null}
          ${rights
            ? html`<dt>Digital Rights Situation</dt>
                <dd>${rights}</dd>`
            : null}
          ${cHolder
            ? html`<dt>Copyright Holder</dt>
                <dd>${cHolder}</dd>`
            : null}
          ${cType
            ? html`<dt>Copyright Type</dt>
                <dd>${cType}</dd>`
            : null}
        </dl>
      </d2l-dl-wrapper>
    `;
  }
}
