import { css } from "lit";

export const sharedStyles = css`
  d2l-breadcrumb {
    cursor: pointer;
  }
  .main-container {
    width: 100%;
    height: 100%;
    display: flex;
    gap: 2rem;
  }
  d2l-button {
    --d2l-button-padding-inline-end: 2rem;
    --d2l-button-padding-inline-start: 2rem;
  }
  d2l-button button {
    border-radius: 5px;
  }
  d2l-button[primary] {
    --d2l-color-celestine: #006fbf;
    --d2l-color-celestine-minus-1: rgba(5, 84, 173, 1);
  }
  d2l-button[secondary] {
    --d2l-color-gypsum: #e3e9f1;
    --d2l-color-mica: #d8dee6ff;
  }
  .ml-1 {
    margin-left: 1rem;
  }
  .mt-1 {
    margin-top: 1rem;
  }
  .mb-1 {
    margin-bottom: 1rem;
  }
`;
