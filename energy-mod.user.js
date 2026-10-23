// ==UserScript==
// @name         Energy mod
// @namespace    http://tampermonkey.net/
// @version      5.7
// @description  Отображение процентов энергии игроков в боережиме
// @author       Пухляш [cat529464, cat1291946, cat1667922, cat1707976]
// @match        https://*.catwar.net/cw3*
// @match        https://*.catwar.su/cw3*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';

    const GRID_COLS = 10;
    const GRID_ROWS = 6;
    const MAX_CAGES = GRID_COLS * GRID_ROWS;

    const DEFAULTS = {
        showEnergy: true,
        darkTheme: false,
        glowIndication: true,
        customColors: false,
        bgColor: '#1e1e1e',
        textColor: '#ffffff',
        iconPos: { x: 20, y: 80 }
    };

    function loadSettings() {
        const saved = GM_getValue('puziha_mod_energy_settings', {});
        return { ...DEFAULTS, ...saved };
    }

    function saveSettings(settings) {
        GM_setValue('puziha_mod_energy_settings', settings);
    }

    const settings = loadSettings();

    GM_addStyle(`
        td.cage { position: relative !important; }

        .lunnaya-energy-display {
            position: absolute;
            bottom: 5px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255, 255, 255, 0.95);
            color: #111;
            border: 1px solid rgba(0, 0, 0, 0.5);
            padding: 1px 6px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
            z-index: 10;
            user-select: none;
            pointer-events: none;
            white-space: nowrap;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.35);
            transition: background 0.15s, color 0.15s, border-color 0.15s, box-shadow 0.2s;
        }

        .lunnaya-energy-display.is-zero {
            background: #ad001b !important;
            color: #fff !important;
            border-color: #550000 !important;
        }

        .lunnaya-energy-display.is-dark {
            background: rgba(25, 25, 25, 0.92);
            color: #ffffff;
            border: 1px solid rgba(255, 255, 255, 0.3);
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.6);
        }

        .lunnaya-energy-display.glow-high {
            box-shadow: 0 0 6px 1.5px rgba(76, 175, 80, 0.9) !important;
            border-color: #4CAF50 !important;
        }
        .lunnaya-energy-display.glow-mid {
            box-shadow: 0 0 6px 1.5px rgba(255, 179, 0, 0.9) !important;
            border-color: #FFB300 !important;
        }
        .lunnaya-energy-display.glow-low {
            box-shadow: 0 0 8px 2px rgba(244, 67, 54, 0.95) !important;
            border-color: #F44336 !important;
        }

        #puziha-widget-container {
            position: fixed;
            z-index: 999999;
            display: flex;
            align-items: flex-start;
            gap: 10px;
            pointer-events: none;
        }
        #puziha-widget-container.flip-left {
            flex-direction: row-reverse;
        }

        #puziha-modals-col {
            display: flex;
            flex-direction: column;
            gap: 8px;
            pointer-events: none;
        }

        #puziha-settings-icon {
            pointer-events: auto;
            width: 36px;
            height: 36px;
            min-width: 36px;
            background: rgba(35, 38, 28, 0.65);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            color: #ffdc33;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.45);
            cursor: grab;
            user-select: none;
            border: 1px solid rgba(255, 255, 255, 0.18);
            transition: border-color 0.2s, transform 0.1s;
        }
        #puziha-settings-icon:hover {
            border-color: rgba(255, 220, 50, 0.7);
            transform: scale(1.05);
        }
        #puziha-settings-icon:active {
            cursor: grabbing;
        }
        #puziha-settings-icon svg {
            width: 19px;
            height: 19px;
            pointer-events: none;
        }

        #puziha-settings-modal {
            pointer-events: auto;
            width: 250px;
            background: rgba(35, 38, 28, 0.75);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            color: #f0f0f0;
            border: 1px solid rgba(255, 255, 255, 0.18);
            border-radius: 10px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
            padding: 12px 14px;
            font-family: Arial, sans-serif;
            font-size: 13px;
            display: none;
        }
        .puziha-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.12);
            padding-bottom: 7px;
            margin-bottom: 10px;
        }
        .puziha-modal-header h4 {
            margin: 0;
            font-size: 13px;
            font-weight: bold;
            color: #f5f5f5;
            letter-spacing: 0.3px;
        }

        .puziha-info-link {
            font-size: 11px;
            color: #ffd700;
            cursor: pointer;
            text-decoration: underline;
            opacity: 0.85;
            user-select: none;
            transition: opacity 0.15s, color 0.15s;
        }
        .puziha-info-link:hover {
            opacity: 1;
            color: #fff;
        }

        .puziha-close-btn {
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.6);
            font-size: 18px;
            cursor: pointer;
            line-height: 1;
            padding: 0;
            transition: color 0.15s;
        }
        .puziha-close-btn:hover { color: #fff; }

        .puziha-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
        }
        .puziha-row label {
            font-size: 12px;
            color: #ddd;
            cursor: pointer;
            user-select: none;
            flex: 1;
            padding-right: 8px;
        }

        .puziha-checkbox {
            appearance: none;
            -webkit-appearance: none;
            width: 17px;
            height: 17px;
            min-width: 17px;
            background: rgba(0, 0, 0, 0.45);
            border: 1px solid rgba(255, 255, 255, 0.25);
            border-radius: 4px;
            cursor: pointer;
            outline: none;
            transition: all 0.2s ease;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }
        .puziha-checkbox:hover {
            border-color: rgba(255, 220, 50, 0.7);
        }
        .puziha-checkbox:checked {
            background-color: #4CAF50;
            border-color: #4CAF50;
        }
        .puziha-checkbox:checked::after {
            content: '';
            width: 4px;
            height: 8px;
            border: solid white;
            border-width: 0 2px 2px 0;
            transform: rotate(45deg);
            margin-top: -2px;
            display: block;
        }

        #puziha_colors_container {
            margin-top: 6px;
            padding: 8px;
            background: rgba(0, 0, 0, 0.25);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 6px;
        }
        .puziha-color-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 6px;
        }
        .puziha-color-row:last-child {
            margin-bottom: 0;
        }
        .puziha-color-row span {
            font-size: 11px;
            color: #ccc;
        }
        .puziha-color-inputs {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .puziha-color-pick {
            appearance: none;
            -webkit-appearance: none;
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 4px;
            width: 24px;
            height: 22px;
            cursor: pointer;
            background: transparent;
            padding: 0;
        }
        .puziha-color-pick::-webkit-color-swatch-wrapper { padding: 0; }
        .puziha-color-pick::-webkit-color-swatch { border: none; border-radius: 3px; }
        .puziha-color-text {
            width: 62px;
            height: 18px;
            background: rgba(0, 0, 0, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: #fff;
            border-radius: 3px;
            font-size: 11px;
            text-align: center;
            font-family: monospace;
            outline: none;
        }
        .puziha-color-text:focus {
            border-color: #ffd700;
        }

        #puziha-info-modal {
            pointer-events: auto;
            width: 250px;
            background: rgba(35, 38, 28, 0.8);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            color: #e5e5e5;
            border: 1px solid rgba(255, 255, 255, 0.18);
            border-radius: 10px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
            padding: 11px 13px;
            font-family: Arial, sans-serif;
            font-size: 11.5px;
            line-height: 1.45;
            display: none;
        }
        .puziha-info-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.12);
            padding-bottom: 5px;
            margin-bottom: 7px;
        }
        .puziha-info-header span {
            font-weight: bold;
            color: #ffd700;
            font-size: 12px;
        }
    `);

    function removeAllEnergyDisplays() {
        const displays = document.querySelectorAll('#cages .lunnaya-energy-display');
        for (let i = 0; i < Math.min(displays.length, MAX_CAGES); i++) {
            displays[i].remove();
        }
    }

    function applyCustomStyles(displayEl, percentage) {
        if (percentage === 0) {
            displayEl.style.backgroundColor = '';
            displayEl.style.color = '';
            displayEl.style.borderColor = '';
            return;
        }

        if (settings.customColors) {
            displayEl.style.backgroundColor = settings.bgColor;
            displayEl.style.color = settings.textColor;
            displayEl.style.borderColor = 'rgba(255, 255, 255, 0.25)';
        } else {
            displayEl.style.backgroundColor = '';
            displayEl.style.color = '';
            displayEl.style.borderColor = '';
        }
    }

    function updateCatEnergy(catSpan) {
        const cage = catSpan.closest('td.cage');
        if (!cage) return;

        if (!settings.showEnergy) {
            const el = cage.querySelector('.lunnaya-energy-display');
            if (el) el.remove();
            return;
        }

        const arrowEnergyTable = catSpan.querySelector('table:has(.arrow_green, .arrow_red)');
        if (!arrowEnergyTable) {
            const el = cage.querySelector('.lunnaya-energy-display');
            if (el) el.remove();
            return;
        }

        const greenArrow = arrowEnergyTable.querySelector('.arrow_green');
        const redArrow = arrowEnergyTable.querySelector('.arrow_red');
        if (!greenArrow || !redArrow) {
            const el = cage.querySelector('.lunnaya-energy-display');
            if (el) el.remove();
            return;
        }

        const greenWidth = parseFloat(greenArrow.style.width) || 0;
        const redWidth = parseFloat(redArrow.style.width) || 0;
        const totalWidth = greenWidth + redWidth;
        const percentage = totalWidth > 0 ? Math.round((greenWidth / totalWidth) * 100) : 0;

        let displayEl = cage.querySelector('.lunnaya-energy-display');
        if (!displayEl) {
            displayEl = document.createElement('div');
            displayEl.className = 'lunnaya-energy-display';
            cage.appendChild(displayEl);
        }

        displayEl.textContent = `${percentage}%`;

        applyCustomStyles(displayEl, percentage);
        displayEl.classList.toggle('is-zero', percentage === 0);
        displayEl.classList.toggle('is-dark', !settings.customColors && !!settings.darkTheme && percentage > 0);

        displayEl.classList.remove('glow-high', 'glow-mid', 'glow-low');
        if (settings.glowIndication) {
            if (percentage >= 50) {
                displayEl.classList.add('glow-high');
            } else if (percentage >= 20) {
                displayEl.classList.add('glow-mid');
            } else {
                displayEl.classList.add('glow-low');
            }
        }

        displayEl.style.display = 'block';

        if (!arrowEnergyTable.dataset.energyObserved) {
            const observer = new MutationObserver(() => {
                if (settings.showEnergy) updateCatEnergy(catSpan);
            });
            observer.observe(arrowEnergyTable, { attributes: true, subtree: true, attributeFilter: ['style'] });
            arrowEnergyTable.dataset.energyObserved = 'true';
        }
    }

    let scanScheduled = false;
    function scheduleScan() {
        if (scanScheduled) return;
        scanScheduled = true;
        requestAnimationFrame(() => {
            scanScheduled = false;

            if (!settings.showEnergy) {
                removeAllEnergyDisplays();
                return;
            }

            const displays = document.querySelectorAll('#cages .lunnaya-energy-display');
            const displaysLimit = Math.min(displays.length, MAX_CAGES);
            for (let i = 0; i < displaysLimit; i++) {
                const display = displays[i];
                const cage = display.closest('td.cage');
                const hasCat = cage && cage.querySelector('span.catWithArrow table:has(.arrow_green, .arrow_red)');
                if (!hasCat) display.remove();
            }

            const catSpans = document.querySelectorAll('#cages tr:nth-child(-n+6) td.cage:nth-child(-n+10) span.catWithArrow');
            const catsLimit = Math.min(catSpans.length, MAX_CAGES);
            for (let i = 0; i < catsLimit; i++) {
                updateCatEnergy(catSpans[i]);
            }
        });
    }

    function createDraggableUI() {
        if (document.getElementById('puziha-widget-container') || !document.body) return;

        const container = document.createElement('div');
        container.id = 'puziha-widget-container';

        const icon = document.createElement('div');
        icon.id = 'puziha-settings-icon';
        icon.title = 'Настройки энергии (зажмите, чтобы перетащить)';
        icon.innerHTML = `
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66.19-.34.05-.08.07-.12C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15C12.96 17.55 11 21 11 21z"/>
            </svg>
        `;

        const modalsCol = document.createElement('div');
        modalsCol.id = 'puziha-modals-col';

        const modal = document.createElement('div');
        modal.id = 'puziha-settings-modal';
        modal.innerHTML = `
            <div class="puziha-modal-header">
                <div style="display: flex; align-items: baseline; gap: 8px;">
                    <h4>Energy mod</h4>
                    <span class="puziha-info-link" id="puziha_info_toggle" title="Информация о моде">подробнее</span>
                </div>
                <button class="puziha-close-btn" title="Закрыть">&times;</button>
            </div>
            <div class="puziha-row">
                <label for="puziha_energy_toggle">Отображение процентов энергии:</label>
                <input type="checkbox" class="puziha-checkbox" id="puziha_energy_toggle" ${settings.showEnergy ? 'checked' : ''}>
            </div>
            <div class="puziha-row">
                <label for="puziha_glow_toggle">Свечение по уровню энергии:</label>
                <input type="checkbox" class="puziha-checkbox" id="puziha_glow_toggle" ${settings.glowIndication ? 'checked' : ''}>
            </div>
            <div class="puziha-row">
                <label for="puziha_theme_toggle">Темная тема плашки:</label>
                <input type="checkbox" class="puziha-checkbox" id="puziha_theme_toggle" ${settings.darkTheme ? 'checked' : ''}>
            </div>
            <div class="puziha-row">
                <label for="puziha_custom_toggle">Свои цвета плашки:</label>
                <input type="checkbox" class="puziha-checkbox" id="puziha_custom_toggle" ${settings.customColors ? 'checked' : ''}>
            </div>

            <div id="puziha_colors_container" style="${settings.customColors ? '' : 'display: none;'}">
                <div class="puziha-color-row">
                    <span>Цвет фона:</span>
                    <div class="puziha-color-inputs">
                        <input type="color" class="puziha-color-pick" id="puziha_bg_pick" value="${settings.bgColor}">
                        <input type="text" class="puziha-color-text" id="puziha_bg_text" value="${settings.bgColor}" maxlength="7">
                    </div>
                </div>
                <div class="puziha-color-row">
                    <span>Цвет текста:</span>
                    <div class="puziha-color-inputs">
                        <input type="color" class="puziha-color-pick" id="puziha_text_pick" value="${settings.textColor}">
                        <input type="text" class="puziha-color-text" id="puziha_text_text" value="${settings.textColor}" maxlength="7">
                    </div>
                </div>
            </div>

            <div style="font-size: 10px; color: rgba(255,255,255,0.4); text-align: right; margin-top: 8px;">
                мяу
            </div>
        `;

        const infoModal = document.createElement('div');
        infoModal.id = 'puziha-info-modal';
        infoModal.innerHTML = `
            <div class="puziha-info-header">
                <span>Справка</span>
                <button class="puziha-close-btn" id="puziha_info_close" style="font-size: 16px;">&times;</button>
            </div>
            <div style="color: #ddd;">
                Мод отображает текущие проценты энергии игрока, добавляет возможность сменить обычную плашку энергии на темную либо настроить удобные для себя кастомные цвета.<br><br>
                Индикация об уровне энергии через цветовую подсветку: 
                <span style="color: #4CAF50; font-weight: bold;">100-50%</span> зелёная, 
                <span style="color: #FFB300; font-weight: bold;">49-20%</span> оранжевая, 
                <span style="color: #F44336; font-weight: bold;">ниже 20%</span> красная, 
                на <span style="color: #ff5252; font-weight: bold;">0%</span> плашка всегда красится в красный.
            </div>
        `;

        modalsCol.appendChild(modal);
        modalsCol.appendChild(infoModal);

        container.appendChild(icon);
        container.appendChild(modalsCol);
        document.body.appendChild(container);

        function applyPosition(x, y) {
            const maxX = window.innerWidth - 45;
            const maxY = window.innerHeight - 45;
            const clampedX = Math.max(5, Math.min(maxX, x));
            const clampedY = Math.max(5, Math.min(maxY, y));

            container.style.left = `${clampedX}px`;
            container.style.top = `${clampedY}px`;

            const isRightSide = clampedX + 310 > window.innerWidth;
            container.classList.toggle('flip-left', isRightSide);
        }

        applyPosition(settings.iconPos.x, settings.iconPos.y);

        let isDragging = false;
        let startX, startY;
        let initialX, initialY;
        let moved = false;

        icon.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            isDragging = true;
            moved = false;
            startX = e.clientX;
            startY = e.clientY;
            initialX = container.offsetLeft;
            initialY = container.offsetTop;
            e.preventDefault();
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            if (Math.hypot(dx, dy) > 3) {
                moved = true;
            }

            applyPosition(initialX + dx, initialY + dy);
        });

        window.addEventListener('mouseup', () => {
            if (!isDragging) return;
            isDragging = false;

            if (moved) {
                settings.iconPos = { x: container.offsetLeft, y: container.offsetTop };
                saveSettings(settings);
            } else {
                const isOpen = modal.style.display === 'block';
                modal.style.display = isOpen ? 'none' : 'block';
                if (isOpen) {
                    infoModal.style.display = 'none';
                }
                applyPosition(container.offsetLeft, container.offsetTop);
            }
        });

        modal.querySelector('.puziha-close-btn').addEventListener('click', () => {
            modal.style.display = 'none';
            infoModal.style.display = 'none';
        });

        modal.querySelector('#puziha_info_toggle').addEventListener('click', () => {
            const isInfoOpen = infoModal.style.display === 'block';
            infoModal.style.display = isInfoOpen ? 'none' : 'block';
        });

        infoModal.querySelector('#puziha_info_close').addEventListener('click', () => {
            infoModal.style.display = 'none';
        });

        modal.querySelector('#puziha_energy_toggle').addEventListener('change', (e) => {
            settings.showEnergy = e.target.checked;
            saveSettings(settings);
            if (settings.showEnergy) {
                scheduleScan();
            } else {
                removeAllEnergyDisplays();
            }
        });

        modal.querySelector('#puziha_glow_toggle').addEventListener('change', (e) => {
            settings.glowIndication = e.target.checked;
            saveSettings(settings);
            scheduleScan();
        });

        modal.querySelector('#puziha_theme_toggle').addEventListener('change', (e) => {
            settings.darkTheme = e.target.checked;
            saveSettings(settings);
            scheduleScan();
        });

        const colorsBlock = modal.querySelector('#puziha_colors_container');
        modal.querySelector('#puziha_custom_toggle').addEventListener('change', (e) => {
            settings.customColors = e.target.checked;
            saveSettings(settings);
            colorsBlock.style.display = settings.customColors ? 'block' : 'none';
            scheduleScan();
        });

        function sanitizeHex(val) {
            let str = val.trim();
            if (!str.startsWith('#')) str = '#' + str;
            return /^#[0-9A-Fa-f]{6}$/.test(str) ? str : null;
        }

        const bgPick = modal.querySelector('#puziha_bg_pick');
        const bgText = modal.querySelector('#puziha_bg_text');
        const textPick = modal.querySelector('#puziha_text_pick');
        const textText = modal.querySelector('#puziha_text_text');

        bgPick.addEventListener('input', (e) => {
            bgText.value = e.target.value;
            settings.bgColor = e.target.value;
            saveSettings(settings);
            scheduleScan();
        });
        bgText.addEventListener('input', (e) => {
            const valid = sanitizeHex(e.target.value);
            if (valid) {
                bgPick.value = valid;
                settings.bgColor = valid;
                saveSettings(settings);
                scheduleScan();
            }
        });

        textPick.addEventListener('input', (e) => {
            textText.value = e.target.value;
            settings.textColor = e.target.value;
            saveSettings(settings);
            scheduleScan();
        });
        textText.addEventListener('input', (e) => {
            const valid = sanitizeHex(e.target.value);
            if (valid) {
                textPick.value = valid;
                settings.textColor = valid;
                saveSettings(settings);
                scheduleScan();
            }
        });
    }

    let cagesObserver = null;

    function setupCagesObserver() {
        const cages = document.getElementById('cages');
        if (!cages || cagesObserver) return;

        cagesObserver = new MutationObserver((mutations) => {
            let hasExternalChange = false;
            for (const m of mutations) {
                for (const node of m.addedNodes) {
                    if (node.nodeType === 1 && !node.classList.contains('lunnaya-energy-display')) {
                        hasExternalChange = true;
                        break;
                    }
                }
                if (hasExternalChange) break;
                for (const node of m.removedNodes) {
                    if (node.nodeType === 1 && !node.classList.contains('lunnaya-energy-display')) {
                        hasExternalChange = true;
                        break;
                    }
                }
                if (hasExternalChange) break;
            }

            if (hasExternalChange) {
                scheduleScan();
            }
        });

        cagesObserver.observe(cages, { childList: true, subtree: true });
        scheduleScan();
    }

    function tryInit() {
        createDraggableUI();
        if (document.getElementById('cages')) {
            setupCagesObserver();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', tryInit);
    } else {
        tryInit();
    }

    if (!document.getElementById('cages')) {
        const initObserver = new MutationObserver(() => {
            createDraggableUI();
            if (document.getElementById('cages')) {
                setupCagesObserver();
                initObserver.disconnect();
            }
        });
        initObserver.observe(document.documentElement, { childList: true, subtree: true });
    }
})();
