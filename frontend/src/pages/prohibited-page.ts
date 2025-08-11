import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import axios from "axios";
import { getLtik } from "../utils/helper";
import "../components/loader-spinner";

@customElement("prohibited-page")
export class ProhibitedPage extends LitElement {
  @state()
  private allowedRoles: string[] = [];
  @state() private isLoading = false;
  @state() private ltik: string = "";

  static styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      padding: 2rem;
    }
    .main-container {
      height: 100%;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      overflow: hidden;
    }
    .icon {
      font-size: 3rem;
    }
    h1 {
      color: #333;
      margin-bottom: 1rem;
    }
    p {
      color: #666;
    }
    .allowed-roles {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      background-color: var(--d2l-color-regolith);
      border: 1px solid var(--d2l-color-sylvite);
      padding: 0.5rem;
      border-radius: 5px;
      margin-bottom: 1rem;
      width: 80%;
    }
    .role-item {
      font-weight: bold;
    }
  `;

  async connectedCallback() {
    super.connectedCallback();
    this.ltik = getLtik();
    await this.loadAllowedRoles();
  }

  private async loadAllowedRoles() {
    this.isLoading = true;
    try {
      const response = await axios.get("/roles", {
        headers: { Authorization: `Bearer ${this.ltik}` },
      });
      const allowedRoles = response.data.allowedRoles || [];
      console.log(allowedRoles);

      this.allowedRoles = allowedRoles.map((role: string) => {
        const parts = role.split("#");
        const roleName = parts[parts.length - 1].toLowerCase();
        return roleName.charAt(0).toUpperCase() + roleName.slice(1);
      });
    } catch (error) {
      console.error("Failed to fetch allowed roles:", error);
      this.allowedRoles = [];
    } finally {
      this.isLoading = false;
    }
  }

  render() {
    if (this.isLoading) {
      return html`<loader-spinner></loader-spinner>`;
    }
    return html`
      <main class="main-container" role="main" aria-label="Prohibited Page">
        <div class="icon">🚫</div>
        <h1>Access Restricted</h1>
        <p>This application is only available to specific roles given below:</p>
        <div class="allowed-roles">
          <ul>
            ${this.allowedRoles.map(
              (role: string) => html` <li class="role-item">${role}</li> `
            )}
          </ul>
        </div>
        <em> Please contact your administrator for access to MAM tool. </em>
      </main>
    `;
  }
}
