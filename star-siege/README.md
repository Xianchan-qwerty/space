# Star Siege - 2D Arcade Space Shooter

**Project:** Game Development Final Project  
**Version:** v1.10.0  
**Build:** v1.10.0-drag-control-placement-2026-05-10-1

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Game Features](#game-features)
3. [Controls](#controls)
4. [Technical Stack](#technical-stack)
5. [File Structure](#file-structure)
6. [Installation & Setup](#installation--setup)
7. [Credits](#credits)

---

## Project Overview

Star Siege is a fully browser-based 2D arcade space shooter developed as a final project for the Game Development course. It demonstrates core game development concepts — game loops, collision detection, state management, and responsive UI — built from scratch without a game engine.

The goal is to pilot a spaceship, destroy alien enemy waves across 10 escalating levels, and earn coins to purchase persistent upgrades in the Black Market, all while achieving the highest possible score.

---

## Game Features

### Core Gameplay
- **10 Levels** with unique speed, spawn rates, enemy types, and boss configurations
- **Layered Boss Battles** with multi-phase health bars and dedicated boss music
- **Persistent Progression** — coins, high scores, pilot name, and ship upgrades saved via localStorage

### Power-Ups
| Icon | Name | Effect |
|------|------|--------|
| 🛡 | Shield | Deflects attacks for 3 seconds |
| ⚡ | Rapid Fire | 2x fire rate |
| 💠 | Triple Shot | Fires 3 bullets at once |
| ✨ | Cleanse | Removes all active debuffs |
| M | Magnet | Pulls power-ups toward the player |
| ❤ | +1 Life | Gain an extra life |
| 💣 | Bomb | Instantly clears all enemies on screen |

### Debuffs
| Icon | Name | Effect |
|------|------|--------|
| 🐢 | Slow | Movement speed halved |
| 🔄 | Reversed | Controls flipped |
| 🚫 | Jammed | Cannot shoot |
| ⬛ | Oversized | Hitbox doubled |
| 👁 | Blind | Partial screen blackout |
| 💢 | Enraged | Enemies move 2x faster |

### Enemy Types
- **Scout** — Basic enemy (Levels 1-10)
- **Fighter** — Faster variant (Level 2+)
- **Alien** — Orbital movement, shoots at player (Level 2+)
- **Zigzag** — Serpentine pattern (Level 4+)
- **Shooter** — Fires projectiles (Level 5+)
- **Gunship** — Tri-shot pattern (Level 5+)
- **Swoop** — Diving attack pattern (Level 6+)
- **Crawler** — Moves side-to-side (Level 7+)
- **Burst** — Radial bullet spread (Level 8+)
- **Mine** — Stationary hazard (Level 9+)

### Upgrades (Black Market)
- **Thruster Engine** — Increases movement speed
- **Overclock Blaster** — Reduces weapon cooldown
- **Titanium Hull** — +1 Starting Life

---

## Controls

### Desktop
| Key | Action |
|-----|--------|
| WASD / Arrow Keys | Move |
| Space | Shoot |
| P | Pause |

### Mobile
- **Joystick Mode** — Drag virtual joystick to move (default)
- **Button Mode** — D-pad buttons for movement
- Fire button on right side

Mobile controls feature adjustable sensitivity, joystick size, and button size. Control positions can be saved and restored.

---

## Technical Stack

| Technology | Purpose |
|------------|---------|
| HTML5 Canvas | Game rendering |
| JavaScript | Game logic, input handling |
| CSS3 | Styling, animations, dark theme |
| Bootstrap 5 | Responsive layout |
| PHP | Server-side leaderboard |
| MySQL | Online leaderboard database |
| Web Audio API | Procedural sound effects and music |
| localStorage | Persistent high score, coins, upgrades |

---

## File Structure

```
star-siege/
├── star-siege-deploy/
│   ├── index.html           # Main game page
│   ├── game.js              # Core game logic
│   ├── style.css            # Custom styling
│   ├── db_config.php        # Database connection
│   ├── save_score.php       # Submit score endpoint
│   ├── get_leaderboard.php # Retrieve leaderboard
│   ├── assets/
│   │   ├── js/
│   │   │   └── game.js      # Game engine
│   │   ├── css/
│   │   │   └── style.css   # Visual styles
│   │   └── img/
│   │       ├── star_siege_bezel.png
│   │       └── bezel.png
│   └── assets/
│       └── asset.zip
└── README.md                # This file
```

---

## Installation & Setup

### Local Development (XAMPP)
1. Install XAMPP or a similar PHP development environment
2. Copy `star-siege-deploy/` to your XAMPP htdocs folder (e.g., `htdocs/star-siege`)
3. Configure `db_config.php` with your MySQL database credentials
4. Create the `leaderboard` table:
   ```sql
   CREATE TABLE leaderboard (
       id INT AUTO_INCREMENT PRIMARY KEY,
       name VARCHAR(10) NOT NULL,
       score INT NOT NULL,
       date_saved TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```
5. Open `http://localhost/star-siege` in your browser

### Online Deployment
1. Upload files to any web hosting with PHP support
2. Set up a MySQL database and configure `db_config.php`
3. Deploy and share your game URL

---

## Credits

- **Developer:** Student Project
- **Course:** Game Development Final Project
- **Libraries:** Bootstrap 5, Font Awesome, Google Fonts (Orbitron, Rajdhani)
- **Audio:** Procedural Web Audio API (no external audio files)

---

*Star Siege — Defend the galaxy!*