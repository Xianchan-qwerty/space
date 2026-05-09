<?php
// Star Siege - Main Entry File
// This file handles the HTML structure and links all assets.
$gameTitle = "Star Siege";
$gameVersion = "1.0.0";
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $gameTitle; ?> - 2D Space Shooter</title>

    <!-- Bootstrap 5 CDN -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">

    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;600;700&display=swap" rel="stylesheet">

    <!-- Font Awesome CDN -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">

    <!-- Custom CSS -->
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>

<!-- ===== HEADER ===== -->
<header class="game-header text-center py-3">
    <h1 class="game-title">
        <i class="fa-solid fa-space-shuttle"></i>
        <?php echo $gameTitle; ?>
        <i class="fa-solid fa-space-shuttle fa-flip-horizontal"></i>
    </h1>
    <p class="game-subtitle">2D ARCADE SPACE SHOOTER</p>
</header>

<!-- ===== MAIN LAYOUT ===== -->
<main class="container-fluid py-3">
    <div class="row justify-content-center align-items-start g-3">

        <!-- ===== GAME COLUMN ===== -->
        <div class="col-12 col-lg-7 col-xl-6">

            <!-- Game Wrapper Card -->
            <div class="card game-card position-relative">
                
                <!-- Global Fullscreen Button -->
                <button id="globalFullscreenBtn" class="btn btn-hud-action position-absolute top-0 end-0 m-2" style="z-index: 100;" title="Fullscreen">
                    <i class="fa-solid fa-expand"></i>
                </button>

                <div class="card-body p-2 p-md-3">

                    <!-- ===== START SCREEN ===== -->
                    <div id="startScreen" class="game-screen active">
                        <div class="screen-content text-center">
                            <div class="start-logo mb-3">
                                <span class="logo-icon"><i class="fa-solid fa-shuttle-space" style="color: var(--clr-accent);"></i></span>
                            </div>
                            <h2 class="screen-title">STAR SIEGE</h2>
                            <p class="screen-desc">
                                Defend the galaxy! Destroy waves of enemies, survive all levels,
                                and achieve the highest score possible.
                            </p>

                            <!-- Controls Info -->
                            <div class="controls-box mb-4">
                                <h5 class="controls-title"><i class="fa-solid fa-gamepad"></i> Controls</h5>
                                <div class="row g-2 text-start">
                                    <div class="col-6">
                                        <div class="ctrl-item">
                                            <kbd>← →</kbd> Move Ship
                                        </div>
                                        <div class="ctrl-item">
                                            <kbd>Space</kbd> Shoot
                                        </div>
                                        <div class="ctrl-item">
                                            <kbd>P</kbd> Pause
                                        </div>
                                    </div>
                                    <div class="col-6">
                                        <div class="ctrl-item"><i class="fa-solid fa-mobile-alt"></i> Mobile: On-screen buttons</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Stats Display -->
                            <div class="d-flex justify-content-center gap-3 mb-4">
                                <div class="highscore-display">
                                    <span class="hs-label">BEST:</span>
                                    <span class="hs-value" id="highScoreDisplay">0</span>
                                </div>
                                <div class="highscore-display" style="border-color: rgba(0, 212, 255, 0.25); background: rgba(0, 212, 255, 0.08);">
                                    <span class="hs-label text-info"><i class="fa-solid fa-coins me-1"></i>COINS:</span>
                                    <span class="hs-value text-info" style="text-shadow: 0 0 8px rgba(0,212,255,0.5);" id="coinsDisplay">0</span>
                                </div>
                            </div>

                            <div class="d-flex flex-column gap-2 align-items-center mt-3">
                                <button id="playBtn" class="btn btn-glow btn-lg px-5 w-75">
                                    <i class="fa-solid fa-play me-2"></i>INSERT COIN (PLAY)
                                </button>
                                <button id="upgradesBtn" class="btn btn-outline-glow btn-sm px-4 w-75 mt-2" data-bs-toggle="modal" data-bs-target="#upgradeModal">
                                    <i class="fa-solid fa-wrench me-2"></i>UPGRADES
                                </button>
                                <button id="resetHsBtn" class="btn btn-outline-danger btn-sm px-4 w-75 mt-1">
                                    <i class="fa-solid fa-skull me-2"></i>RESET HIGH SCORE
                                </button>
                            </div>

                            <p class="mt-3 text-muted small">v<?php echo $gameVersion; ?></p>
                        </div>
                    </div>

                    <!-- ===== GAME SCREEN ===== -->
                    <div id="gameScreen" class="game-screen">

                        <!-- HUD Bar -->
                        <div class="hud-bar d-flex justify-content-between align-items-center px-2 py-1">
                            <div class="hud-item hud-score">
                                <span class="hud-label">SCORE</span>
                                <span class="hud-value" id="scoreDisplay">0</span>
                            </div>
                            <div class="hud-item hud-level text-center">
                                <span class="hud-label">LEVEL</span>
                                <span class="hud-value" id="levelDisplay">1</span>
                            </div>
                            <div class="hud-item hud-lives text-end">
                                <span class="hud-label">LIVES</span>
                                <span class="hud-value" id="livesDisplay">♥ ♥ ♥</span>
                            </div>
                        </div>

                        <!-- Pause & Fullscreen Buttons -->
                        <div class="hud-controls d-flex gap-2 position-absolute" style="top: 6px; right: 8px; z-index: 10;">
                            <button id="pauseBtn" class="btn btn-hud-action" title="Pause (P)">
                                <i class="fa-solid fa-pause"></i>
                            </button>
                            <button id="fullscreenBtn" class="btn btn-hud-action" title="Fullscreen">
                                <i class="fa-solid fa-expand"></i>
                            </button>
                        </div>

                        <!-- Canvas -->
                        <div class="canvas-wrapper" id="canvasWrapper">
                            <canvas id="gameCanvas"></canvas>
                            <div class="crt-overlay"></div>

                            <!-- Level Up Flash Overlay -->
                            <div id="levelUpFlash" class="level-up-flash">
                                <span>LEVEL UP!</span>
                            </div>

                            <!-- Pause Overlay -->
                            <div id="pauseOverlay" class="pause-overlay">
                                <div class="pause-content">
                                    <i class="fa-solid fa-pause fa-3x mb-3"></i>
                                    <h3>PAUSED</h3>
                                    <button id="resumeBtn" class="btn btn-glow mt-3">
                                        <i class="fa-solid fa-play me-2"></i>RESUME
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Mobile Controls -->
                        <div class="mobile-controls d-flex justify-content-between align-items-center px-2 py-2">
                            <div class="d-flex gap-2">
                                <button id="btnLeft" class="btn btn-mobile" aria-label="Move Left">
                                    <i class="fa-solid fa-chevron-left"></i>
                                </button>
                                <button id="btnRight" class="btn btn-mobile" aria-label="Move Right">
                                    <i class="fa-solid fa-chevron-right"></i>
                                </button>
                            </div>
                            <button id="btnFire" class="btn btn-mobile btn-fire" aria-label="Fire">
                                <i class="fa-solid fa-burst me-1"></i> FIRE
                            </button>
                        </div>

                    </div><!-- /gameScreen -->

                    <!-- ===== GAME OVER SCREEN ===== -->
                    <div id="gameOverScreen" class="game-screen">
                        <div class="screen-content text-center">
                            <div class="gameover-icon mb-3">💥</div>
                            <h2 class="screen-title text-danger">GAME OVER</h2>
                            <div class="score-card my-4">
                                <div class="score-row">
                                    <span class="sc-label">FINAL SCORE</span>
                                    <span class="sc-value" id="finalScore">0</span>
                                </div>
                                <div class="score-row">
                                    <span class="sc-label">LEVEL REACHED</span>
                                    <span class="sc-value" id="finalLevel">1</span>
                                </div>
                                <div class="score-row highlight">
                                    <span class="sc-label">BEST SCORE</span>
                                    <span class="sc-value" id="finalHighScore">0</span>
                                </div>
                            </div>
                            <div id="newHighScore" class="new-hs-badge d-none">
                                🏆 NEW HIGH SCORE!
                            </div>
                            <div class="d-flex flex-column gap-2 align-items-center mt-4">
                                <button id="continueBtn" class="btn btn-glow btn-lg px-4 w-75">
                                    <i class="fa-solid fa-forward me-2"></i>CONTINUE <span style="font-size: 0.6em">(RESET SCORE)</span>
                                </button>
                                <div class="d-flex gap-2 w-75">
                                    <button id="restartBtn" class="btn btn-outline-glow btn-lg px-3 flex-fill">
                                        <i class="fa-solid fa-rotate-right me-2"></i>RESTART
                                    </button>
                                    <button id="menuBtn" class="btn btn-outline-glow btn-lg px-3 flex-fill">
                                        <i class="fa-solid fa-house me-2"></i>MENU
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div><!-- /card-body -->
            </div><!-- /card -->

        </div><!-- /game column -->

        <!-- ===== INFO COLUMN ===== -->
        <div class="col-12 col-lg-4 col-xl-3">

            <!-- Level Info Card -->
            <div class="card info-card mb-3">
                <div class="card-header info-card-header">
                    <i class="fa-solid fa-signal me-2"></i>Level Guide
                </div>
                <div class="card-body p-3">
                    <div class="level-entry">
                        <span class="lvl-badge lvl-1">LVL 1</span>
                        <div class="lvl-details">
                            <div>Slow enemies • 10 kills to advance</div>
                            <div class="lvl-pts">10 pts per kill</div>
                        </div>
                    </div>
                    <div class="level-entry">
                        <span class="lvl-badge lvl-2">LVL 2</span>
                        <div class="lvl-details">
                            <div>Medium enemies • 25 kills to advance</div>
                            <div class="lvl-pts">20 pts per kill</div>
                        </div>
                    </div>
                    <div class="level-entry">
                        <span class="lvl-badge lvl-3">LVL 3</span>
                        <div class="lvl-details">
                            <div>Fast enemies • Endless survival</div>
                            <div class="lvl-pts">30 pts per kill</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- About Card -->
            <div class="card info-card mb-3">
                <div class="card-header info-card-header">
                    <i class="fa-solid fa-circle-info me-2"></i>About the Game
                </div>
                <div class="card-body p-3">
                    <p class="about-text">
                        <strong>Star Siege</strong> is a 2D top-down arcade space shooter. Take control
                        of a starfighter and hold off relentless alien waves across 3 intense levels.
                    </p>
                    <p class="about-text">
                        Survive, score big, and etch your name onto the leaderboard. Only the best
                        commanders make it to Level 3!
                    </p>
                    <hr class="about-divider">
                    <ul class="about-list">
                        <li><i class="fa-solid fa-star text-warning me-2"></i>3 difficulty levels</li>
                        <li><i class="fa-solid fa-heart text-danger me-2"></i>3 lives system</li>
                        <li><i class="fa-solid fa-trophy text-warning me-2"></i>Local high score</li>
                        <li><i class="fa-solid fa-mobile me-2"></i>Mobile-friendly controls</li>
                    </ul>
                </div>
            </div>

            <!-- Powerups Card -->
            <div class="card info-card mb-3">
                <div class="card-header info-card-header">
                    <i class="fa-solid fa-bolt me-2"></i>Power-Ups
                </div>
                <div class="card-body p-3">
                    <ul class="pu-legend">
                        <li><span class="pu-icon">🛡</span><div><div class="pu-name" style="color:#00aaff">SHIELD</div><div style="font-size:0.78rem">Absorbs 1 hit for you</div></div></li>
                        <li><span class="pu-icon">⚡</span><div><div class="pu-name" style="color:#ffcc00">RAPID FIRE</div><div style="font-size:0.78rem">Doubles your fire rate</div></div></li>
                        <li><span class="pu-icon">💠</span><div><div class="pu-name" style="color:#ff44ff">TRIPLE SHOT</div><div style="font-size:0.78rem">Fires 3 bullets at once</div></div></li>
                        <li><span class="pu-icon">❤</span><div><div class="pu-name" style="color:#ff3c5a">+1 LIFE</div><div style="font-size:0.78rem">Gain an extra life</div></div></li>
                        <li><span class="pu-icon">💣</span><div><div class="pu-name" style="color:#ff8800">BOMB</div><div style="font-size:0.78rem">Clears all enemies instantly</div></div></li>
                    </ul>
                    <p class="mt-2 mb-0" style="font-size:0.75rem;color:var(--clr-muted)">Drops randomly from enemies &amp; guaranteed on boss defeat.</p>
                </div>
            </div>

            <!-- Tips Card -->
            <div class="card info-card">
                <div class="card-header info-card-header">
                    <i class="fa-solid fa-lightbulb me-2"></i>Tips
                </div>
                <div class="card-body p-3">
                    <ul class="tips-list">
                        <li>🛡️ Stack Shield + Rapid Fire before the boss fight!</li>
                        <li>💣 Save the Bomb for when enemies swarm you.</li>
                        <li>🎯 Stay centered and shoot rapidly in Level 3.</li>
                        <li>⚡ Enemies speed up — don't let them reach you!</li>
                    </ul>
                </div>
            </div>

        </div><!-- /info column -->

    </div><!-- /row -->
</main>

<!-- ===== PROJECT DOCUMENTATION SECTION ===== -->
<section class="container py-4" id="documentation">
    <h2 class="doc-section-title text-center mb-4">
        <i class="fa-solid fa-file-lines me-2"></i>Project Documentation
    </h2>
    <div class="row g-3">

        <!-- Introduction -->
        <div class="col-12 col-md-6 col-xl-4">
            <div class="card doc-card h-100">
                <div class="card-header doc-card-header">
                    <i class="fa-solid fa-rocket me-2"></i>Introduction
                </div>
                <div class="card-body">
                    <p class="doc-text">
                        <strong>Star Siege</strong> is a fully browser-based 2D arcade space shooter developed
                        as a final project for the Game Development course. It demonstrates core game
                        development concepts — game loops, collision detection, state management, and
                        responsive UI — built from scratch without a game engine.
                    </p>
                    <p class="doc-text">
                        The goal is to pilot a spaceship, destroy alien enemy waves, and survive three
                        increasingly difficult levels while achieving the highest possible score.
                    </p>
                </div>
            </div>
        </div>

        <!-- Design -->
        <div class="col-12 col-md-6 col-xl-4">
            <div class="card doc-card h-100">
                <div class="card-header doc-card-header">
                    <i class="fa-solid fa-pencil-ruler me-2"></i>Design
                </div>
                <div class="card-body">
                    <p class="doc-text">The game follows a <strong>retro-minimalist cyber-space</strong> aesthetic using a dark palette with cyan and red accent glows.</p>
                    <ul class="doc-list">
                        <li>3 levels with unique speed and spawn configurations</li>
                        <li>HUD with score, level, and heart-based lives</li>
                        <li>Start, Game, Level-Up, and Game Over screens</li>
                        <li>Particle explosion effects and screen shake on hit</li>
                        <li>Animated background starfield</li>
                        <li>Mobile on-screen touch controls</li>
                    </ul>
                </div>
            </div>
        </div>

        <!-- Tools -->
        <div class="col-12 col-md-6 col-xl-4">
            <div class="card doc-card h-100">
                <div class="card-header doc-card-header">
                    <i class="fa-solid fa-wrench me-2"></i>Tools & Technologies
                </div>
                <div class="card-body">
                    <ul class="doc-list">
                        <li><strong>PHP</strong> — Main file structure &amp; dynamic variables</li>
                        <li><strong>JavaScript</strong> — Game logic, canvas rendering, input</li>
                        <li><strong>HTML5 Canvas</strong> — Game object drawing</li>
                        <li><strong>CSS3</strong> — Animations, dark theme, responsive layout</li>
                        <li><strong>Bootstrap 5</strong> — Page layout and UI components</li>
                        <li><strong>Web Audio API</strong> — Procedural sound effects</li>
                        <li><strong>localStorage</strong> — Persistent high score</li>
                        <li><strong>XAMPP</strong> — Local PHP server for development</li>
                    </ul>
                </div>
            </div>
        </div>

        <!-- Challenges -->
        <div class="col-12 col-md-6 col-xl-4">
            <div class="card doc-card h-100">
                <div class="card-header doc-card-header">
                    <i class="fa-solid fa-triangle-exclamation me-2"></i>Challenges
                </div>
                <div class="card-body">
                    <ul class="doc-list">
                        <li><strong>Game loop timing</strong> — Solved with delta-time accumulator for consistent spawn rates at any frame rate.</li>
                        <li><strong>Mobile touch controls</strong> — Used <code>touchstart</code>/<code>touchend</code> with <code>preventDefault()</code> and a reusable <code>holdButton()</code> helper.</li>
                        <li><strong>Invincibility feedback</strong> — Combined blink, pulsing red ring, and CSS screen shake for clear visual cues.</li>
                        <li><strong>Sounds without files</strong> — Used Web Audio API oscillators to generate shoot, explosion, and hit sounds in real time.</li>
                    </ul>
                </div>
            </div>
        </div>

        <!-- Testing -->
        <div class="col-12 col-md-6 col-xl-4">
            <div class="card doc-card h-100">
                <div class="card-header doc-card-header">
                    <i class="fa-solid fa-flask me-2"></i>Testing
                </div>
                <div class="card-body">
                    <p class="doc-text">All core features were manually tested across browsers and devices:</p>
                    <ul class="doc-list">
                        <li>✅ Player movement and shooting</li>
                        <li>✅ Bullet-enemy and enemy-player collisions</li>
                        <li>✅ Lives reduction and game over trigger</li>
                        <li>✅ Level progression and level-up flash</li>
                        <li>✅ Pause and resume</li>
                        <li>✅ High score save and load</li>
                        <li>✅ Mobile touch buttons (hold behavior)</li>
                        <li>✅ Responsive layout on desktop, tablet, and mobile</li>
                    </ul>
                </div>
            </div>
        </div>

        <!-- Conclusion -->
        <div class="col-12 col-md-6 col-xl-4">
            <div class="card doc-card h-100">
                <div class="card-header doc-card-header">
                    <i class="fa-solid fa-flag-checkered me-2"></i>Conclusion
                </div>
                <div class="card-body">
                    <p class="doc-text">
                        Star Siege successfully meets all project requirements: a playable game with mechanics,
                        progression, scoring, audio, mobile support, and a polished UI — built entirely
                        without a game engine.
                    </p>
                    <p class="doc-text"><strong>Future improvements:</strong></p>
                    <ul class="doc-list">
                        <li>Multiple enemy types and boss fights</li>
                        <li>Power-ups (shield, rapid fire, triple shot)</li>
                        <li>Sprite graphics and parallax background</li>
                        <li>Online leaderboard via PHP + MySQL</li>
                    </ul>
                </div>
            </div>
        </div>

    </div><!-- /row -->
</section>

<!-- ===== UPGRADES MODAL ===== -->
<div class="modal fade" id="upgradeModal" tabindex="-1" aria-labelledby="upgradeModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content custom-modal">
            <div class="modal-header border-bottom-0 pb-0">
                <h5 class="modal-title screen-title mx-auto fs-3" id="upgradeModalLabel">
                    <i class="fa-solid fa-wrench"></i> BLACK MARKET
                </h5>
                <button type="button" class="btn-close btn-close-white position-absolute end-0 top-0 m-3" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body text-center">
                <p class="text-muted small mb-4">Spend your Coins to permanently upgrade your ship stats. <br> <span class="text-info">Score is converted to Coins on Game Over!</span></p>
                <div class="highscore-display mb-4" style="border-color: rgba(0, 212, 255, 0.25); background: rgba(0, 212, 255, 0.08);">
                    <span class="hs-label text-info">AVAILABLE COINS:</span>
                    <span class="hs-value text-info" style="text-shadow: 0 0 8px rgba(0,212,255,0.5);" id="upgradeCoinsDisplay">0</span>
                </div>
                
                <div class="upgrade-list text-start">
                    <!-- Speed Upgrade -->
                    <div class="upgrade-item d-flex justify-content-between align-items-center mb-3 p-3 rounded" style="background: rgba(0,212,255,0.05); border: 1px solid rgba(0,212,255,0.2);">
                        <div>
                            <div class="fw-bold text-info"><i class="fa-solid fa-gauge-high"></i> Thruster Engine (Lv <span id="lvlSpeed">0</span>)</div>
                            <div class="small text-muted">Increases base movement speed.</div>
                            <div class="small text-warning mt-1">Cost: <span id="costSpeed">500</span> pts</div>
                        </div>
                        <button id="buySpeedBtn" class="btn btn-outline-info btn-sm px-3">BUY</button>
                    </div>
                    
                    <!-- Fire Rate Upgrade -->
                    <div class="upgrade-item d-flex justify-content-between align-items-center mb-3 p-3 rounded" style="background: rgba(255,204,0,0.05); border: 1px solid rgba(255,204,0,0.2);">
                        <div>
                            <div class="fw-bold text-warning"><i class="fa-solid fa-bolt"></i> Overclock Blaster (Lv <span id="lvlFire">0</span>)</div>
                            <div class="small text-muted">Reduces weapon cooldown.</div>
                            <div class="small text-warning mt-1">Cost: <span id="costFire">800</span> pts</div>
                        </div>
                        <button id="buyFireBtn" class="btn btn-outline-warning btn-sm px-3">BUY</button>
                    </div>
                    
                    <!-- Starting Lives Upgrade -->
                    <div class="upgrade-item d-flex justify-content-between align-items-center mb-1 p-3 rounded" style="background: rgba(255,60,90,0.05); border: 1px solid rgba(255,60,90,0.2);">
                        <div>
                            <div class="fw-bold text-danger"><i class="fa-solid fa-heart"></i> Titanium Hull (Lv <span id="lvlLives">0</span>)</div>
                            <div class="small text-muted">+1 Starting Life.</div>
                            <div class="small text-warning mt-1">Cost: <span id="costLives">2000</span> pts</div>
                        </div>
                        <button id="buyLivesBtn" class="btn btn-outline-danger btn-sm px-3">BUY</button>
                    </div>
                </div>
            </div>
            <div class="modal-footer border-top-0 pt-0 justify-content-center">
                <button type="button" class="btn btn-outline-glow px-4" data-bs-dismiss="modal">CLOSE</button>
            </div>
        </div>
    </div>
</div>

<!-- ===== FOOTER ===== -->
<footer class="game-footer text-center py-3 mt-2">
    <p class="mb-0">
        <i class="fa-solid fa-rocket me-1"></i>
        <?php echo $gameTitle; ?> &copy; <?php echo date('Y'); ?> — Student Project
        <i class="fa-solid fa-rocket fa-flip-horizontal ms-1"></i>
    </p>
</footer>

<!-- Bootstrap JS CDN -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>

<!-- Game Logic -->
<script src="assets/js/game.js"></script>

</body>
</html>