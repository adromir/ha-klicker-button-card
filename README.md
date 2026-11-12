# 🔘 Klicker Button Card for Home Assistant

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=adromir&repository=ha-klicker-button-card&category=plugin)
[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg?style=for-the-badge)](https://github.com/hacs/default)
[![GitHub Release](https://img.shields.io/github/v/release/adromir/ha-klicker-button-card?style=for-the-badge&color=blue)](https://github.com/adromir/ha-klicker-button-card/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg?style=for-the-badge)](https://github.com/adromir/ha-klicker-button-card)

A sleek, tactile **Momentary Push-Button Card** with springy physics and visual click bounce-back animation for Home Assistant Lovelace dashboards.

Designed specifically for triggering actions, scripts, automations, door openers, buzzers, and momentary service calls with satisfying physical haptic and visual feedback.

---

## ✨ Key Features & Advantages

- 🎯 **Tactile Physics Engine**: Features authentic button depression (`translateY(3px)` + `scale(0.93)`), compression shadows, radial glow ripples, and springy overshoot return (`cubic-bezier(0.175, 0.885, 0.32, 1.275)`).
- ⏱️ **Configurable Bounce Duration**: Tune how long the button stays depressed before rebounding (default: `350ms`).
- ⚡ **Universal Action Execution**: Call any Home Assistant script, trigger an automation, toggle an entity, or fire arbitrary service calls (`perform-action` / `call-service`).
- 🏛️ **100% Home Assistant Native Design**: Strictly compliant with the official Home Assistant design system (`--ha-card-background`, `--ha-card-border-radius`, `--primary-text-color`). Zero forced glassmorphism; seamlessly matches default themes, Mushroom, and custom themes automatically.
- 🎛️ **4 Versatile Layouts**:
  - `default`: Vertical squircle card with icon on top and label below.
  - `horizontal`: Slim horizontal row with icon on left and text on right.
  - `icon`: Compact square or circular button displaying icon only.
  - `chip`: Rounded pill/chip format for status bars and compact toolbars.
- 📱 **Mobile & Haptic Feedback**: Integrates mobile haptic vibration pulses (`light`, `medium`, `heavy`).
- 🎨 **Visual UI Card Editor**: Built-in graphical editor in the Lovelace card picker for easy configuration.

---

## 📦 Installation via HACS

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=adromir&repository=ha-klicker-button-card&category=plugin)

1. Make sure [HACS](https://hacs.xyz/) is installed.
2. In Home Assistant, open **HACS** > **Frontend**.
3. Click the three dots in the top right corner and select **Custom repositories**.
4. Enter the repository URL:
   ```
   https://github.com/adromir/ha-klicker-button-card
   ```
5. Select category: **Dashboard** (or Lovelace Plugin).
6. Click **Add**, find **Klicker Button Card**, and click **Download**.

---

## 🚀 Usage & YAML Examples

### 1. Minimal Action Button (Trigger Script)

```yaml
type: custom:klicker-button-card
name: Türklingel
icon: mdi:bell-ring
color: '#0284c7'
tap_action:
  action: perform-action
  perform_action: script.turklingel_lauten
```

### 2. Door Opener / Buzzer (Horizontal Row)

```yaml
type: custom:klicker-button-card
name: Haustür öffnen
subtext: Summer 3 Sekunden
icon: mdi:door-open
layout: horizontal
color: '#10b981'
bounce_duration: 500
tap_action:
  action: perform-action
  perform_action: switch.turn_on
  target:
    entity_id: switch.tur_summer
```

### 3. Compact Icon-Only Klicker

```yaml
type: custom:klicker-button-card
icon: mdi:garage-open-variant
layout: icon
color: '#f59e0b'
bounce_duration: 300
tap_action:
  action: perform-action
  perform_action: cover.open_cover
  target:
    entity_id: cover.garagentor
```

### 4. Compact Status Chip (Pill)

```yaml
type: custom:klicker-button-card
name: Alles Aus
icon: mdi:power
layout: chip
color: '#ef4444'
tap_action:
  action: perform-action
  perform_action: script.gute_nacht_alles_ausschalten
```

---

## ⚙️ Configuration Reference

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `type` | string | **Required** | `custom:klicker-button-card` |
| `name` | string | `''` | Button title or label text. |
| `icon` | string | `mdi:gesture-tap-button` | Material Design Icon (`mdi:...`). |
| `icon_color` | string | `color` | Optional custom color for the icon. |
| `color` | string | `#0284c7` | Accent & glow color when pressed. |
| `layout` | string | `default` | Layout mode: `default`, `horizontal`, `icon`, `chip`. |
| `size` | string | `normal` | Button size: `small`, `normal`, `large`. |
| `bounce_duration` | number | `350` | Duration in milliseconds before the button springs back. |
| `haptic` | boolean | `true` | Enables mobile touch vibration feedback. |
| `subtext` | string | `''` | Secondary sub-label below the title. |
| `tap_action` | object | `{ action: 'none' }` | Standard Home Assistant action configuration. |

---

## 👤 Author

Developed with care by **Adromir**  
Website: [https://github.com/adromir](https://github.com/adromir)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

