/**
 * 🔘 Klicker Button Card for Home Assistant
 * Version: 1.0.1
 * Author: Adromir (https://github.com/adromir)
 * License: MIT
 *
 * A tactile momentary action push-button card compliant with the native
 * Home Assistant design language, featuring springy click bounce-back physics.
 */

(function () {
  'use strict';

  // Helper to fire standard HA custom events
  function fireEvent(node, type, detail) {
    detail = detail === null || detail === undefined ? {} : detail;
    const event = new CustomEvent(type, {
      detail,
      bubbles: true,
      composed: true
    });
    node.dispatchEvent(event);
    return event;
  }

  // Trigger mobile / browser haptic feedback
  function triggerHaptic(type = 'light') {
    try {
      if (window.navigator && window.navigator.vibrate) {
        if (type === 'light') window.navigator.vibrate(12);
        else if (type === 'medium') window.navigator.vibrate(22);
        else if (type === 'heavy') window.navigator.vibrate([30, 40, 30]);
      }
    } catch (e) {}
  }

  /* -------------------------------------------------------------
   * Main Card Component: <klicker-button-card>
   * ----------------------------------------------------------- */
  class KlickerButtonCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._config = {};
      this._hass = null;
      this._resetTimer = null;
    }

    static get stubConfig() {
      return {
        name: 'Klicker Button',
        icon: 'mdi:gesture-tap-button',
        tap_action: {
          action: 'perform-action',
          perform_action: 'homeassistant.toggle',
          target: {}
        },
        bounce_duration: 350,
        layout: 'default'
      };
    }

    static async getConfigElement() {
      return document.createElement('klicker-button-card-editor');
    }

    setConfig(config) {
      if (!config) {
        throw new Error('Invalid configuration.');
      }
      this._config = {
        name: config.name || '',
        icon: config.icon || '',
        icon_color: config.icon_color || '',
        color: config.color || config.active_color || '',
        bounce_duration: config.bounce_duration !== undefined ? Number(config.bounce_duration) : 350,
        layout: config.layout || 'default', // 'default' | 'horizontal' | 'icon' | 'chip'
        size: config.size || 'normal', // 'small' | 'normal' | 'large'
        haptic: config.haptic !== false,
        entity: config.entity || '',
        subtext: config.subtext || '',
        tap_action: config.tap_action || (config.service || config.perform_action ? {
          action: config.perform_action ? 'perform-action' : 'call-service',
          service: config.service,
          perform_action: config.perform_action,
          target: config.target,
          data: config.service_data || config.data
        } : { action: 'none' }),
        hold_action: config.hold_action || { action: 'none' },
        double_tap_action: config.double_tap_action || { action: 'none' },
        ...config
      };

      this._render();
    }

    set hass(hass) {
      this._hass = hass;
      this._updateEntityState();
    }

    getCardSize() {
      return this._config.layout === 'chip' ? 1 : 2;
    }

    _updateEntityState() {
      if (!this._hass || !this._config.entity) return;
      const stateObj = this._hass.states[this._config.entity];
      if (!stateObj) return;

      const subLabelEl = this.shadowRoot.querySelector('.klicker-subtext');
      if (subLabelEl && !this._config.subtext) {
        subLabelEl.textContent = stateObj.state;
      }

      // If icon is not set in config, inherit from entity
      const iconEl = this.shadowRoot.querySelector('ha-icon, ha-state-icon');
      if (iconEl && !this._config.icon && stateObj.attributes.icon) {
        iconEl.setAttribute('icon', stateObj.attributes.icon);
      }
    }

    _handleTap(e) {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }

      if (this._config.haptic) {
        triggerHaptic('medium');
        fireEvent(this, 'haptic', 'light');
      }

      // Trigger Visual Klicker Bounce
      this._triggerBounce();

      // Execute Action
      this._executeAction(this._config.tap_action);
    }

    _triggerBounce() {
      const card = this.shadowRoot.querySelector('ha-card');
      if (!card) return;

      if (this._resetTimer) {
        clearTimeout(this._resetTimer);
      }

      card.classList.add('is-active');

      const duration = Math.max(150, this._config.bounce_duration || 350);
      this._resetTimer = setTimeout(() => {
        card.classList.remove('is-active');
        card.classList.add('is-rebounding');
        setTimeout(() => {
          card.classList.remove('is-rebounding');
        }, 280);
      }, duration);
    }

    _executeAction(actionConfig) {
      if (!actionConfig || actionConfig.action === 'none') {
        // Fallback: If entity is defined and tap_action is none, toggle entity
        if (this._config.entity && this._hass) {
          const domain = this._config.entity.split('.')[0];
          this._hass.callService(domain, 'toggle', { entity_id: this._config.entity });
        }
        return;
      }

      const action = actionConfig.action;

      if (action === 'call-service' || action === 'perform-action') {
        const fullAction = actionConfig.perform_action || actionConfig.service;
        if (!fullAction) return;
        const [domain, service] = fullAction.split('.');
        const serviceData = {
          ...(actionConfig.data || actionConfig.service_data || {}),
          ...(actionConfig.target ? { target: actionConfig.target } : {})
        };
        if (this._hass) {
          this._hass.callService(domain, service, serviceData);
        }
        return;
      }

      if (action === 'toggle' && this._config.entity && this._hass) {
        const domain = this._config.entity.split('.')[0];
        this._hass.callService(domain, 'toggle', { entity_id: this._config.entity });
        return;
      }

      if (action === 'more-info') {
        const entityId = actionConfig.entity || this._config.entity;
        if (entityId) {
          fireEvent(this, 'hass-more-info', { entityId });
        }
        return;
      }

      if (action === 'navigate' && actionConfig.navigation_path) {
        window.history.pushState(null, '', actionConfig.navigation_path);
        fireEvent(window, 'location-changed', { replace: false });
        return;
      }

      if (action === 'url' && actionConfig.url_path) {
        window.open(actionConfig.url_path, actionConfig.url_target || '_blank');
        return;
      }

      // Generic fallback through Home Assistant action engine
      fireEvent(this, 'hass-action', {
        config: this._config,
        action: 'tap'
      });
    }

    _render() {
      if (!this.shadowRoot) return;

      const { name, icon, icon_color, color, layout, size, subtext } = this._config;

      // Icon determination
      const displayIcon = icon || (this._config.entity ? '' : 'mdi:gesture-tap-button');
      const displayName = name || (this._config.entity ? '' : 'Klicker');

      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            --klicker-accent: ${color ? color : 'var(--primary-color, #03a9f4)'};
            --klicker-icon-color: ${icon_color ? icon_color : (color ? color : 'var(--state-icon-color, var(--primary-color, #03a9f4))')};
            box-sizing: border-box;
          }

          /* Home Assistant Standard Card Styling */
          ha-card {
            position: relative;
            user-select: none;
            -webkit-user-select: none;
            cursor: pointer;
            box-sizing: border-box;
            outline: none;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: inherit;
            overflow: hidden;

            /* Native Home Assistant Theme Variables */
            background: var(--ha-card-background, var(--card-background-color, #ffffff));
            border-radius: var(--ha-card-border-radius, 12px);
            border-width: var(--ha-card-border-width, 1px);
            border-style: solid;
            border-color: var(--ha-card-border-color, var(--divider-color, #e0e0e0));
            box-shadow: var(--ha-card-box-shadow, none);
            color: var(--primary-text-color, #212121);

            transition:
              transform 0.28s cubic-bezier(0.175, 0.885, 0.32, 1.275),
              box-shadow 0.2s ease,
              border-color 0.2s ease,
              background-color 0.2s ease;
          }

          /* Hover State */
          ha-card:hover {
            border-color: var(--klicker-accent);
            transform: translateY(-1px);
          }

          /* Pressed / Active State (Click Bounce Physics) */
          ha-card.is-active {
            transform: translateY(2px) scale(0.95) !important;
            border-color: var(--klicker-accent) !important;
            box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.16), 0 0 10px rgba(0, 0, 0, 0.05) !important;
            transition: transform 0.08s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.08s ease !important;
          }

          /* Rebounding spring overshoot */
          ha-card.is-rebounding {
            transform: scale(1.02);
            transition: transform 0.28s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          }

          /* Layout Variants */
          /* Default: Vertical stacked (Icon top, Label bottom) */
          .layout-default {
            flex-direction: column;
            gap: 8px;
            padding: 16px 14px;
            min-height: 96px;
          }

          /* Horizontal: Icon left, Text right (standard HA tile format) */
          .layout-horizontal {
            flex-direction: row;
            gap: 12px;
            padding: 12px 16px;
            justify-content: flex-start;
            min-height: 56px;
          }

          /* Icon Only: Compact square button */
          .layout-icon {
            padding: 12px;
            aspect-ratio: 1;
            width: fit-content;
            min-width: 56px;
            min-height: 56px;
            margin: 0 auto;
          }

          /* Chip / Pill: Compact pill format */
          .layout-chip {
            flex-direction: row;
            gap: 8px;
            padding: 6px 14px;
            border-radius: 9999px;
            width: fit-content;
            min-height: 36px;
          }

          /* Size modifiers */
          .size-small {
            padding: 8px 10px;
            min-height: 44px;
          }
          .size-small .klicker-icon-box {
            width: 32px;
            height: 32px;
          }
          .size-small .klicker-name {
            font-size: 12.5px;
          }

          .size-large {
            padding: 20px 18px;
            min-height: 116px;
          }
          .size-large .klicker-icon-box {
            width: 52px;
            height: 52px;
          }
          .size-large .klicker-name {
            font-size: 15.5px;
            font-weight: 600;
          }

          /* Icon Wrapper (Native HA Tile / Bubble circle style) */
          .klicker-icon-box {
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: var(--secondary-background-color, rgba(0, 0, 0, 0.04));
            color: var(--klicker-icon-color);
            flex-shrink: 0;
            transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), color 0.2s ease, background-color 0.2s ease;
          }

          ha-card:hover .klicker-icon-box {
            transform: scale(1.06);
          }

          ha-card.is-active .klicker-icon-box {
            transform: scale(0.90);
            background: var(--klicker-accent);
            color: var(--text-primary-color, #ffffff) !important;
          }

          ha-icon, ha-state-icon {
            --mdc-icon-size: 22px;
            width: 22px;
            height: 22px;
          }

          /* Text Elements (Native HA typography) */
          .klicker-text-col {
            display: flex;
            flex-direction: column;
            align-items: ${layout === 'horizontal' ? 'flex-start' : 'center'};
            justify-content: center;
            min-width: 0;
          }

          .klicker-name {
            font-weight: 500;
            font-size: 13.5px;
            line-height: 1.25;
            color: var(--primary-text-color, #212121);
            text-align: ${layout === 'horizontal' ? 'left' : 'center'};
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
          }

          .klicker-subtext {
            font-size: 11.5px;
            line-height: 1.3;
            color: var(--secondary-text-color, #727272);
            margin-top: 2px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
          }
        </style>

        <ha-card
          class="layout-${layout} size-${size}"
          id="klickerButton"
          role="button"
          tabindex="0"
          aria-label="${displayName}"
        >
          ${displayIcon ? `
            <div class="klicker-icon-box">
              ${this._config.entity ? `<ha-state-icon .hass="${this._hass}" .stateObj="${this._hass?.states[this._config.entity]}"></ha-state-icon>` : `<ha-icon icon="${displayIcon}"></ha-icon>`}
            </div>
          ` : ''}

          ${layout !== 'icon' && (displayName || subtext || this._config.entity) ? `
            <div class="klicker-text-col">
              <span class="klicker-name">${displayName}</span>
              ${subtext || this._config.entity ? `<span class="klicker-subtext">${subtext || ''}</span>` : ''}
            </div>
          ` : ''}
        </ha-card>
      `;

      const card = this.shadowRoot.getElementById('klickerButton');
      if (card) {
        card.addEventListener('click', (e) => this._handleTap(e));
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this._handleTap(e);
          }
        });
      }

      this._updateEntityState();
    }
  }

  /* -------------------------------------------------------------
   * Visual Card Editor Component: <klicker-button-card-editor>
   * ----------------------------------------------------------- */
  class KlickerButtonCardEditor extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._config = {};
      this._hass = null;
    }

    setConfig(config) {
      this._config = config || {};
      this._render();
    }

    set hass(hass) {
      this._hass = hass;
    }

    _valueChanged(ev) {
      if (!this._config || !this._hass) return;
      const target = ev.target;
      const field = target.configValue;
      if (!field) return;

      let value = target.value;
      if (target.type === 'checkbox') {
        value = target.checked;
      } else if (target.type === 'number') {
        value = Number(target.value);
      }

      const newConfig = {
        ...this._config,
        [field]: value
      };

      fireEvent(this, 'config-changed', { config: newConfig });
    }

    _render() {
      if (!this.shadowRoot) return;

      this.shadowRoot.innerHTML = `
        <style>
          .form-row {
            display: flex;
            flex-direction: column;
            gap: 6px;
            margin-bottom: 14px;
          }
          label {
            font-size: 12.5px;
            font-weight: 500;
            color: var(--secondary-text-color, #727272);
          }
          input, select {
            padding: 8px 12px;
            border-radius: 4px;
            border: 1px solid var(--divider-color, #e0e0e0);
            background: var(--card-background-color, #ffffff);
            color: var(--primary-text-color, #212121);
            font-family: inherit;
            font-size: 13.5px;
          }
          .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }
        </style>

        <div class="form-row">
          <label>Titel / Name</label>
          <input type="text" .value="${this._config.name || ''}" .configValue="${'name'}" placeholder="z. B. Türklingel, Garagentor" />
        </div>

        <div class="grid-2">
          <div class="form-row">
            <label>Icon (MDI)</label>
            <input type="text" .value="${this._config.icon || ''}" .configValue="${'icon'}" placeholder="mdi:gesture-tap-button" />
          </div>
          <div class="form-row">
            <label>Akzentfarbe (optional)</label>
            <input type="text" .value="${this._config.color || ''}" .configValue="${'color'}" placeholder="z. B. #03a9f4 oder var(--primary-color)" />
          </div>
        </div>

        <div class="grid-2">
          <div class="form-row">
            <label>Layout</label>
            <select .configValue="${'layout'}">
              <option value="default" ${this._config.layout === 'default' ? 'selected' : ''}>Standard (Vertikal)</option>
              <option value="horizontal" ${this._config.layout === 'horizontal' ? 'selected' : ''}>Horizontal (Kachel / Zeile)</option>
              <option value="icon" ${this._config.layout === 'icon' ? 'selected' : ''}>Nur Icon (Quadratisch)</option>
              <option value="chip" ${this._config.layout === 'chip' ? 'selected' : ''}>Kompakter Chip (Pille)</option>
            </select>
          </div>
          <div class="form-row">
            <label>Klick-Rückprall Dauer (ms)</label>
            <input type="number" .value="${this._config.bounce_duration !== undefined ? this._config.bounce_duration : 350}" .configValue="${'bounce_duration'}" min="100" max="2000" step="50" />
          </div>
        </div>

        <div class="form-row">
          <label>Dienst / Action Shortcut (optional)</label>
          <input type="text" .value="${this._config.service || this._config.perform_action || ''}" .configValue="${'service'}" placeholder="z. B. script.turklingel oder switch.toggle" />
        </div>
      `;

      this.shadowRoot.querySelectorAll('input, select').forEach((el) => {
        el.addEventListener('change', (ev) => this._valueChanged(ev));
      });
    }
  }

  // Register Elements
  if (!customElements.get('klicker-button-card')) {
    customElements.define('klicker-button-card', KlickerButtonCard);
  }
  if (!customElements.get('klicker-button-card-editor')) {
    customElements.define('klicker-button-card-editor', KlickerButtonCardEditor);
  }

  // Register in Lovelace Card Picker
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: 'klicker-button-card',
    name: 'Klicker Button Card',
    description: 'Taktiler Momentary-Aktions-Taster im nativen Home Assistant Design mit kinetischem Klick-Rückprall.',
    preview: true,
    documentationURL: 'https://github.com/adromir/ha-klicker-button-card'
  });

  console.info(
    '%c 🔘 KLICKER-BUTTON-CARD %c v1.0.1 %c',
    'background:#03a9f4;color:#fff;font-weight:700;padding:2px 6px;border-radius:4px 0 0 4px;',
    'background:#e0e0e0;color:#212121;font-weight:700;padding:2px 6px;border-radius:0 4px 4px 0;',
    'background:transparent;'
  );
})();
