/**
 * 数字对决 Pro - 主应用入口
 * 整合所有模块，初始化游戏
 */

// 确保 DOM 加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 初始化 PWA 功能
    if (window.PWAInstallManager) PWAInstallManager.init();
    if (window.NetworkManager) NetworkManager.init();
    if (window.SWUpdateManager) SWUpdateManager.init();
    if (window.GitVersionManager) GitVersionManager.init();

    // 初始化 SVG 图标
    if (typeof Icons !== 'undefined') {
        Icons.replaceAll();
    }
    
    // 初始化主题管理器
    if (window.ThemeManager) ThemeManager.init();
    
    // 初始化音频管理器
    if (window.audioManager && typeof audioManager.init === 'function') {
        // 音频需要用户交互后初始化
        document.addEventListener('click', () => {
            audioManager.init();
        }, { once: true });
    }
    
    // 初始化音效开关
    initSoundToggle();
    
    // 初始化主题切换
    initThemeToggle();
    
    // 初始化虚拟键盘遮挡处理
    initKeyboardHandler();
});

/**
 * 初始化音效开关功能
 */
function initSoundToggle() {
    const soundToggle = document.getElementById('soundToggle');
    const soundOnIcon = document.getElementById('soundOnIcon');
    const soundOffIcon = document.getElementById('soundOffIcon');
    
    if (!soundToggle) return;
    
    // 从 localStorage 恢复音效状态
    const savedState = localStorage.getItem('soundEnabled');
    const isEnabled = savedState !== 'false'; // 默认开启
    
    // 更新 UI 状态
    updateSoundUI(isEnabled);
    if (window.audioManager) {
        window.audioManager.enabled = isEnabled;
    }

    // 点击切换
    soundToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const newState = !window.audioManager?.enabled;

        if (window.audioManager) {
            window.audioManager.enabled = newState;
            window.audioManager.toggle(newState);
        }

        // 保存状态
        localStorage.setItem('soundEnabled', newState);

        // 更新 UI
        updateSoundUI(newState);

        // 播放提示音（如果开启）
        if (newState && window.audioManager) {
            window.audioManager.playClick();
        }
    });
    
    function updateSoundUI(enabled) {
        if (soundOnIcon && soundOffIcon) {
            soundOnIcon.classList.toggle('hidden', !enabled);
            soundOffIcon.classList.toggle('hidden', enabled);
        }
        soundToggle?.setAttribute('title', enabled ? '音效已开启' : '音效已关闭');
    }
}

/**
 * 初始化主题切换功能
 */
function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    
    if (!themeToggle) return;
    
    // 点击切换主题
    themeToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.ThemeManager) {
            ThemeManager.toggle();
        }
    });
}

/**
 * 初始化虚拟键盘遮挡处理
 * 解决移动端输入时键盘遮挡输入框的问题
 * 使用事件委托处理动态创建的输入框
 */
function initKeyboardHandler() {
    // 仅在移动端处理
    if (!/Mobi|Android/i.test(navigator.userAgent)) return;

    // 使用事件委托处理所有输入框（包括动态创建的）
    document.addEventListener('focusin', (e) => {
        if (e.target.matches('input[type="text"], input[type="number"], .digit-input')) {
            setTimeout(() => {
                e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300); // 等待键盘弹出
        }
    });

    document.addEventListener('focusout', (e) => {
        if (e.target.matches('input[type="text"], input[type="number"], .digit-input')) {
            setTimeout(() => {
                window.scrollTo(0, 0);
            }, 100);
        }
    });
    
    // 处理视口高度变化（键盘弹出/收起）
    let originalHeight = window.innerHeight;
    
    window.addEventListener('resize', () => {
        const currentHeight = window.innerHeight;
        const heightDiff = originalHeight - currentHeight;
        
        // 如果高度变化超过 150px，认为是键盘弹出
        if (heightDiff > 150) {
            document.body.classList.add('keyboard-visible');
            // 调整底部固定元素
            const fixedElements = document.querySelectorAll('.fixed-bottom, [style*="position: fixed"]');
            fixedElements.forEach(el => {
                el.style.transform = `translateY(-${heightDiff}px)`;
            });
        } else {
            document.body.classList.remove('keyboard-visible');
            const fixedElements = document.querySelectorAll('.fixed-bottom, [style*="position: fixed"]');
            fixedElements.forEach(el => {
                el.style.transform = '';
            });
        }
    });
}

/**
 * 音效使用 audio.js 中的 AudioManager
 * soundManager 已统一为 audioManager
 */

/**
 * WebSocket 客户端使用 network.js 中的 WebSocketClient
 * 不再在此处定义
 */

/**
 * 房间管理器
 */
class RoomManager {
    constructor(wsClient) {
        this.wsClient = wsClient;
        this.currentRoom = null;
        this.isHost = false;
        this.playerId = this.generatePlayerId();
        this.isReady = false;
        this.secretNumber = '';
        this.difficulty = 4; // 默认难度
        this.setupMessageHandlers();
    }

    generatePlayerId() {
        return 'player_' + Math.random().toString(36).substr(2, 9);
    }

    generateRoomCode() {
        const chars = '0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        return code;
    }

    createRoom(roomCode) {
        this.isHost = true;
        this.currentRoom = {
            code: roomCode,
            hostId: this.playerId,
            guestId: null,
            hostReady: false,
            guestReady: false
        };
        this.wsClient.send({ type: 'create_room', roomCode, playerId: this.playerId });
        return roomCode;
    }

    joinRoom(roomCode) {
        this.isHost = false;
        this.wsClient.send({ type: 'join_room', roomCode: roomCode.toUpperCase(), playerId: this.playerId });
    }

    leaveRoom() {
        if (this.currentRoom) {
            this.wsClient.send({ type: 'leave_room', roomCode: this.currentRoom.code, playerId: this.playerId });
            this.currentRoom = null;
            this.isHost = false;
            this.isReady = false;
            this.secretNumber = '';
        }
    }

    setReady(secret) {
        this.secretNumber = secret;
        this.isReady = true;
        if (this.currentRoom) {
            this.wsClient.send({ type: 'player_ready', roomCode: this.currentRoom.code, playerId: this.playerId, secret });
        }
    }

    setDifficulty(difficulty) {
        if (this.currentRoom && this.isHost) {
            this.difficulty = difficulty;
            this.wsClient.send({ type: 'set_difficulty', roomCode: this.currentRoom.code, playerId: this.playerId, difficulty });
        }
    }

    setupMessageHandlers() {
        this.wsClient.on('room_created', (data) => {
            debugLog('Room created:', data);
            this.currentRoom = data.room;
            // 恢复创建按钮状态
            const createSection = document.getElementById('createRoomSection');
            const btn = createSection ? createSection.querySelector('button') : null;
            if (btn) {
                btn.removeAttribute('disabled');
                btn.innerHTML = '创建房间';
            }
        });

        this.wsClient.on('room_joined', (data) => {
            debugLog('Room joined:', data);
            this.currentRoom = data.room;
            this.isHost = false;
            // 更新难度
            if (data.room?.difficulty) {
                this.difficulty = data.room.difficulty;
            }
            // 保存房间会话
            localStorage.setItem('npg_room_session', JSON.stringify({ roomCode: data.room.code, isHost: false, timestamp: Date.now() }));
            // 显示等待房间
            document.getElementById('displayRoomCode').textContent = data.room.code;
            document.getElementById('multiplayerLobby').classList.add('hidden');
            document.getElementById('waitingRoom').classList.remove('hidden');
            // 更新状态显示
            const statusEl = document.getElementById('waitingStatus');
            if (statusEl) {
                statusEl.textContent = '等待房主开始游戏...';
            }
            // 显示当前难度（非房主）
            this.updateDifficultyDisplay(false);
        });

        this.wsClient.on('player_joined', (data) => {
            debugLog('Player joined:', data);
            if (this.currentRoom) {
                this.currentRoom.guestId = data.playerId;
                // 更新UI状态
                this.updateReadyStatusUI();
            }
        });

        this.wsClient.on('error', (data) => {
            errorLog('Server error:', data);
            // 恢复按钮状态
            const joinSection = document.getElementById('joinRoomSection');
            const joinBtn = joinSection ? joinSection.querySelector('button') : null;
            if (joinBtn) {
                joinBtn.removeAttribute('disabled');
                joinBtn.innerHTML = '加入房间';
            }
            const createSection = document.getElementById('createRoomSection');
            const createBtn = createSection ? createSection.querySelector('button') : null;
            if (createBtn) {
                createBtn.removeAttribute('disabled');
                createBtn.innerHTML = '创建房间';
            }
            // 显示错误信息
            alert(data.message || '操作失败，请重试');
        });

        this.wsClient.on('player_left', (data) => {
            debugLog('Player left:', data);
            if (this.currentRoom) {
                this.currentRoom.guestId = null;
                this.currentRoom.guestReady = false;
            }
        });

        this.wsClient.on('player_ready', (data) => {
            debugLog('Player ready:', data);
            if (this.currentRoom) {
                const room = data.room || this.currentRoom;
                // 更新房间状态
                if (room.hostReady !== undefined) this.currentRoom.hostReady = room.hostReady;
                if (room.guestReady !== undefined) this.currentRoom.guestReady = room.guestReady;

                // 更新UI显示
                this.updateReadyStatusUI();
            }
        });

        this.wsClient.on('game_reconnect', (data) => {
            debugLog('Game reconnect:', data);
            this.currentRoom = data.room;
            this.secretNumber = data.mySecret;
            // 更新难度
            if (data.room?.difficulty) {
                this.difficulty = data.room.difficulty;
            }
            // 通知游戏恢复
            if (window.game) {
                game.handleGameReconnect(data);
            }
        });

        this.wsClient.on('difficulty_changed', (data) => {
            debugLog('Difficulty changed:', data);
            if (this.currentRoom && data.difficulty) {
                this.difficulty = data.difficulty;
                this.currentRoom.difficulty = data.difficulty;
                // 更新UI显示
                this.updateDifficultyDisplay(this.isHost);
                // 更新秘密数字输入框数量
                if (window.game) {
                    game.updateMPSecretInputs(data.difficulty);
                }
            }
        });
    }

    updateDifficultyDisplay(isHost) {
        const selectionPanel = document.getElementById('difficultySelectionPanel');
        const displayPanel = document.getElementById('currentDifficultyDisplay');
        const difficultyText = document.getElementById('currentDifficultyText');

        const difficultyNames = { 3: '简单 (3位数)', 4: '普通 (4位数)', 5: '困难 (5位数)' };

        if (isHost) {
            // 房主显示选择面板
            if (selectionPanel) selectionPanel.classList.remove('hidden');
            if (displayPanel) displayPanel.classList.add('hidden');
            // 更新选中状态
            for (let d of [3, 4, 5]) {
                const btn = document.getElementById('mpDiff' + d);
                if (btn) {
                    if (d === this.difficulty) {
                        btn.classList.add('selected');
                    } else {
                        btn.classList.remove('selected');
                    }
                }
            }
        } else {
            // 非房主显示当前难度
            if (selectionPanel) selectionPanel.classList.add('hidden');
            if (displayPanel) displayPanel.classList.remove('hidden');
            if (difficultyText) {
                difficultyText.textContent = difficultyNames[this.difficulty] || '普通 (4位数)';
            }
        }
    }

    updateReadyStatusUI() {
        if (!this.currentRoom) return;

        const statusText = document.getElementById('gameStatusText');
        const guestStatus = document.getElementById('guestStatus');
        const playerStatusText = document.getElementById('playerStatusText');
        const playerReadyStatus = document.getElementById('playerReadyStatus');

        // 更新自己的状态
        const myReady = this.isHost ? this.currentRoom.hostReady : this.currentRoom.guestReady;
        if (playerStatusText && playerReadyStatus) {
            if (myReady) {
                playerStatusText.textContent = '已准备';
                playerReadyStatus.className = 'inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 text-green-400 text-sm';
            }
        }

        // 更新对手状态（房主看guest，guest看host）
        const opponentReady = this.isHost ? this.currentRoom.guestReady : this.currentRoom.hostReady;
        if (guestStatus) {
            if (opponentReady) {
                guestStatus.className = 'inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 text-green-400 text-sm';
                guestStatus.innerHTML = '<span class="w-2 h-2 rounded-full bg-green-400"></span>已准备';
            } else if (this.currentRoom.guestId) {
                guestStatus.className = 'inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 text-blue-400 text-sm';
                guestStatus.innerHTML = '<span class="w-2 h-2 rounded-full bg-blue-400"></span>已加入，等待准备';
            }
        }

        // 更新游戏状态文本
        if (statusText) {
            if (this.currentRoom.hostReady && this.currentRoom.guestReady) {
                statusText.className = 'inline-flex items-center gap-2 px-6 py-3 rounded-full bg-green-500/20 text-green-400';
                statusText.innerHTML = '<span class="w-2 h-2 rounded-full bg-green-400"></span>双方已准备，游戏即将开始...';
            } else if (this.currentRoom.guestId) {
                const waitingWho = this.isHost ?
                    (this.currentRoom.guestReady ? '等待你准备' : '等待对手准备') :
                    (this.currentRoom.hostReady ? '等待你准备' : '等待房主准备');
                statusText.className = 'inline-flex items-center gap-2 px-6 py-3 rounded-full bg-yellow-500/20 text-yellow-400';
                statusText.innerHTML = `<span class="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>${waitingWho}...`;
            } else {
                statusText.className = 'inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-700/50 text-slate-300';
                statusText.innerHTML = '<span class="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>等待对手加入...';
            }
        }
    }

    checkBothReady() {
        // 已废弃，由 updateReadyStatusUI 替代
        // 游戏会由服务器自动开始
    }
}

/**
 * 主游戏类
 */
class NumberGamePro {
    constructor(mode = 'single') {
        this.mode = mode;
        this.digitCount = 4;
        this.wsClient = null;
        this.roomManager = null;
        this.opponentStepCount = 0;
        this.stepCount = { player: 0, opponent: 0 };
        this.aiPossibleNumbers = [];
        this.aiLastGuess = '';
        this.aiThinking = false;
        this.playerSecret = '';
        this.opponentSecret = '';
        this.myTurn = false;
        this.gameState = 'setup';
        this.currentRound = 0;
        this.playerGuessHistory = [];
        this.gameStartTime = null;

        audioManager.init();
        this.init();
        this.checkAndShowReconnectDialog();
    }

    setDifficulty(digits) {
        // 播放点击音效
        audioManager.playClick();

        this.digitCount = digits;

        // 保存难度设置
        if (window.StorageManager) {
            StorageManager.setItem('gameDifficulty', digits);
        }

        // 使用CSS类控制选中状态
        for (let d of [3, 4, 5]) {
            const btn = document.getElementById('diff' + d);
            if (btn) {
                if (d === digits) {
                    btn.classList.add('selected');
                } else {
                    btn.classList.remove('selected');
                }
            }
        }
    }

    /**
     * 恢复保存的难度设置
     */
    restoreDifficulty() {
        const savedDifficulty = StorageManager?.getItem?.('gameDifficulty', 4);
        this.digitCount = savedDifficulty;
        this.setDifficulty(savedDifficulty);
    }

    checkAndShowReconnectDialog() {
        const savedSession = this.restoreRoomSession();
        if (savedSession) {
            setTimeout(() => this.showReconnectDialog(savedSession), 500);
        }
    }

    restoreRoomSession() {
        try {
            const session = localStorage.getItem('npg_room_session');
            return session ? JSON.parse(session) : null;
        } catch (e) {
            return null;
        }
    }

    saveRoomSession(roomCode, isHost) {
        localStorage.setItem('npg_room_session', JSON.stringify({ roomCode, isHost, timestamp: Date.now() }));
    }

    clearRoomSession() {
        localStorage.removeItem('npg_room_session');
    }

    showReconnectDialog(session) {
        // 简化实现
        this.clearRoomSession();
    }

    async initMultiplayer(wsUrl) {
        this.mode = 'multiplayer';
        this.wsClient = new (window.WebSocketClient || WebSocketClient)(wsUrl);
        this.roomManager = new RoomManager(this.wsClient);

        this.wsClient.on('connected', (data) => {
            // 更新服务器版本显示
            const serverVersionEl = document.getElementById('serverVersion');
            if (serverVersionEl) {
                serverVersionEl.textContent = `服务器: v${data?.version || '2.2.1'}`;
            }
        });
        this.wsClient.on('game_start', (data) => this.handleGameStart(data));
        this.wsClient.on('turn_change', (data) => this.handleTurnChange(data));
        this.wsClient.on('guess_result', (data) => this.handleGuessResult(data));
        this.wsClient.on('game_over', (data) => this.handleGameOver(data));
        // Note: 'opponent_guess' event is not sent by server - removed to avoid unused handler

        // 重赛请求消息处理器
        this.wsClient.on('rematch_requested', (data) => {
            // 显示对手请求重赛提示，自动接受
            this.acceptRematch();
        });
        this.wsClient.on('rematch_accepted', (data) => {
            // 对手接受了重赛请求，开始新游戏
            this.resetForRematch();
        });

        // 随机匹配消息处理器
        this.wsClient.on('random_match_waiting', (data) => {
            // 显示等待匹配提示
            this.showRandomMatchWaiting();
        });
        this.wsClient.on('random_match_found', (data) => {
            // 匹配成功，进入等待房间
            this.roomManager.currentRoom = { code: data.roomCode };
            this.roomManager.isHost = data.isHost;
            // 显示等待房间UI
            this.showRandomMatchFound(data);
        });
        this.wsClient.on('random_match_timeout', (data) => {
            // 显示匹配超时提示
            this.showRandomMatchTimeout();
        });
        this.wsClient.on('random_match_cancelled', (data) => {
            // 显示取消匹配提示
            this.showRandomMatchCancelled();
        });

        // 断线重连相关消息处理器
        this.wsClient.on('turn_timeout', (data) => {
            // 回合超时处理
            this.handleTurnTimeout(data);
        });
        this.wsClient.on('opponent_reconnected', (data) => {
            // 对手重新连接
            this.handleOpponentReconnected(data);
        });
        this.wsClient.on('player_disconnected', (data) => {
            // 玩家断开连接
            this.handlePlayerDisconnected(data);
        });

        this.wsClient.onReconnectStatus = (status, attempt, max) => {
            if (status === 'reconnecting') this.showReconnectingUI(attempt, max);
            else if (status === 'success') this.hideReconnectingUI();
            else if (status === 'failed') this.showReconnectFailedUI();
        };

        // 网络状态变化回调
        this.wsClient.onNetworkQualityChange = (quality, label, color) => {
            this.updateNetworkStatus(quality, label, color);
        };

        this.wsClient.onDisconnectTimeout = (time) => {
            this.handleOpponentDisconnected(Math.floor(time / 1000));
        };

        try {
            await this.wsClient.connect();
            return true;
        } catch (error) {
            debugLog('WebSocket连接失败:', error);
            return false;
        }
    }

    showReconnectingUI(attempt, max) {
        this.hideReconnectingUI();
        const div = document.createElement('div');
        div.id = 'reconnectOverlay';
        div.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center';
        div.innerHTML = `
            <div class="glass rounded-2xl p-8 text-center">
                <div class="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <h3 class="text-xl font-bold mb-2">网络不稳定</h3>
                <p class="text-slate-400">正在尝试重连... (${attempt}/${max})</p>
            </div>
        `;
        document.body.appendChild(div);
    }

    hideReconnectingUI() {
        const el = document.getElementById('reconnectOverlay');
        if (el) el.remove();
    }

    showReconnectFailedUI() {
        this.hideReconnectingUI();
        const div = document.createElement('div');
        div.id = 'reconnectFailedOverlay';
        div.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center';
        div.innerHTML = `
            <div class="glass rounded-2xl p-8 text-center max-w-md">
                <div class="text-6xl mb-4">⚠️</div>
                <h3 class="text-xl font-bold mb-2">连接失败</h3>
                <p class="text-slate-400 mb-6">无法连接到服务器，请检查网络后重试</p>
                <button onclick="location.reload()" class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-semibold">重新加载</button>
            </div>
        `;
        document.body.appendChild(div);
    }

    init() {
        this.restoreDifficulty();
        this.updateStatsDisplay();
        this.updateDifficultyRules();
        this.setupInputAutoJump();
        this.updateVersionDisplay();
    }

    updateVersionDisplay() {
        // 更新 Git 提交显示
        const gitCommitEl = document.getElementById('gitCommit');
        if (gitCommitEl && window.GameConfig?.commitHash) {
            gitCommitEl.textContent = `提交: ${GameConfig.commitHash}`;
        }

        // 在 tencent_cloud 环境下检查服务器状态
        if (window.GameConfig?.environment === 'tencent_cloud') {
            this.checkServerHealth();
        }
    }

    async checkServerHealth() {
        const serverVersionEl = document.getElementById('serverVersion');
        if (!serverVersionEl) return;

        serverVersionEl.textContent = '服务器: 检测中...';

        try {
            const response = await fetch('/health');
            if (response.ok) {
                const data = await response.json();
                serverVersionEl.textContent = `服务器: v${data.version || '在线'}`;
            } else {
                serverVersionEl.textContent = '服务器: 离线';
            }
        } catch (e) {
            serverVersionEl.textContent = '服务器: 离线';
        }
    }

    setupInputAutoJump() {
        document.querySelectorAll('.digit-input').forEach((input, idx, inputs) => {
            input.addEventListener('input', (e) => {
                if (e.target.value.length === 1 && idx < inputs.length - 1) {
                    inputs[idx + 1].focus();
                }
            });
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && e.target.value === '' && idx > 0) {
                    inputs[idx - 1].focus();
                }
                if (e.key === 'Enter') this.handleEnterKey();
            });
        });
    }

    handleEnterKey() {
        if (this.gameState === 'setup' && document.getElementById('secretSetupPanel').style.display !== 'none') {
            this.confirmSecret();
        } else if (this.myTurn && this.gameState === 'playing') {
            this.submitGuess();
        }
    }

    validateDigit(input) {
        if (input.value.length > 1) input.value = input.value.slice(0, 1);
        if (input.value < 0) input.value = 0;
        if (input.value > 9) input.value = 9;
    }

    renderGuessInputs() {
        const container = document.getElementById('guessInputContainer');
        if (!container) return;
        container.innerHTML = '';
        for (let i = 0; i < this.digitCount; i++) {
            const input = document.createElement('input');
            input.type = 'number';
            input.id = 'g' + (i + 1);
            input.min = '0';
            input.max = '9';
            input.className = 'digit-input w-14 h-14 text-center text-2xl font-bold rounded-xl';
            input.maxLength = '1';
            input.addEventListener('input', (e) => {
                if (e.target.value.length === 1 && e.target.nextElementSibling) {
                    e.target.nextElementSibling.focus();
                }
            });
            container.appendChild(input);
        }
    }

    /**
     * 渲染秘密数字输入框
     */
    renderSecretInputs() {
        const container = document.getElementById('secretInputContainer');
        if (!container) return;
        container.innerHTML = '';
        for (let i = 0; i < this.digitCount; i++) {
            const input = document.createElement('input');
            input.type = 'number';
            input.min = '0';
            input.max = '9';
            input.className = 'digit-input w-14 h-14 text-center text-2xl font-bold rounded-xl';
            input.maxLength = '1';
            input.addEventListener('input', (e) => {
                if (e.target.value.length === 1 && e.target.nextElementSibling) {
                    e.target.nextElementSibling.focus();
                }
            });
            container.appendChild(input);
        }
    }

    updateStatsDisplay() {
        const stats = StorageManager?.getGameStats?.() || { wins: 0, losses: 0, totalGames: 0 };
        const winRate = stats.totalGames > 0 ? Math.round((stats.wins / stats.totalGames) * 100) : 0;
        const el = document.getElementById('statsDisplay');
        if (el) {
            const iconSvg = typeof Icons !== 'undefined' ? Icons.create('bar-chart-3', { class: 'w-5 h-5 inline' }) : '';
            el.innerHTML = `
                <span class="text-indigo-400 font-bold flex items-center gap-1">${iconSvg} 战绩</span>
                <span class="text-white">胜:${stats.wins} 负:${stats.losses} 胜率:${winRate}%</span>
            `;
        }
    }

    updateDifficultyRules() {
        // 更新难度规则显示
    }

    showMainMenu() {
        // 播放点击音效
        audioManager.playClick();

        this.stopTurnCountdown();
        document.getElementById('mainMenu').classList.remove('hidden');
        document.getElementById('multiplayerLobby').classList.add('hidden');
        document.getElementById('waitingRoom').classList.add('hidden');
        document.getElementById('gameScreen').classList.add('hidden');
    }

    showMultiplayerLobby() {
        // 播放点击音效
        audioManager.playClick();

        this.stopTurnCountdown();
        if (window.NetworkManager && !NetworkManager.checkOnline()) {
            this.showOfflineModal();
            return;
        }
        document.getElementById('mainMenu').classList.add('hidden');
        document.getElementById('multiplayerLobby').classList.remove('hidden');
    }

    showOfflineModal() {
        const modal = document.createElement('div');
        modal.id = 'offline-modal';
        modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center';
        modal.innerHTML = `
            <div class="glass rounded-2xl p-8 max-w-md text-center">
                <div class="text-6xl mb-4">📴</div>
                <h3 class="text-xl font-bold mb-2">需要网络连接</h3>
                <p class="text-slate-400 mb-6">联机模式需要网络连接才能进行。您可以先游玩单机模式。</p>
                <div class="flex gap-4">
                    <button onclick="document.getElementById('offline-modal').remove()" class="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-semibold">取消</button>
                    <button onclick="document.getElementById('offline-modal').remove(); game.startGame();" class="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-semibold">玩单机模式</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    startGame() {
        // 播放点击音效
        audioManager.playClick();

        document.getElementById('mainMenu').classList.add('hidden');
        document.getElementById('multiplayerLobby').classList.add('hidden');
        document.getElementById('waitingRoom').classList.add('hidden');
        document.getElementById('gameScreen').classList.remove('hidden');

        this.gameStartTime = Date.now();
        this.playerGuessHistory = [];
        this.currentRound = 0;

        // 多人模式：如果已在等待房间设置秘密数字，跳过设置面板
        const isMultiplayerReady = this.mode === 'multiplayer' && this.roomManager?.secretNumber;
        if (isMultiplayerReady) {
            this.playerSecret = this.roomManager.secretNumber;
            document.getElementById('secretSetupPanel').classList.add('hidden');
            document.getElementById('guessInputPanel').classList.remove('hidden');
            document.getElementById('displayPlayerStatus').textContent = '对战中';
            this.gameState = 'playing';

            // 多人模式UI设置
            const aiThinkingPanel = document.getElementById('aiThinkingPanel');
            if (aiThinkingPanel) aiThinkingPanel.classList.add('hidden');

            const battleInfoPanel = document.getElementById('battleInfoPanel');
            if (battleInfoPanel) battleInfoPanel.classList.remove('hidden');
        } else {
            this.renderSecretInputs();
            this.updateAIThinking('等待玩家设置秘密数字...', 'info');
        }

        this.renderGuessInputs();
        this.initAIPossibilities();
    }

    confirmSecret() {
        const inputs = document.querySelectorAll('#secretSetupPanel .digit-input');
        let secret = '';
        for (let input of inputs) {
            if (input.value === '' || input.value.length !== 1) {
                input.focus();
                return;
            }
            secret += input.value;
        }

        // 播放点击音效
        audioManager.playClick();

        this.playerSecret = secret;
        document.getElementById('secretSetupPanel').classList.add('hidden');
        document.getElementById('guessInputPanel').classList.remove('hidden');
        document.getElementById('displayPlayerStatus').textContent = '准备完成';

        this.opponentSecret = this.generateRandomNumber();
        this.gameState = 'playing';
        this.myTurn = true;
        this.updateTurnUI();
        this.updateAIThinking('已生成秘密数字，等待玩家猜测...', 'success');
    }

    submitGuess() {
        if (!this.myTurn || this.gameState !== 'playing') return;

        const inputs = [];
        for (let i = 1; i <= this.digitCount; i++) {
            inputs.push(document.getElementById('g' + i));
        }

        let guess = '';
        for (let input of inputs) {
            if (input.value === '' || input.value.length !== 1) {
                input.focus();
                return;
            }
            guess += input.value;
        }

        // 检查是否已猜测过该数字
        const alreadyGuessed = this.playerGuessHistory.some(h => h.guess === guess);
        if (alreadyGuessed) {
            this.showDuplicateGuessWarning(guess);
            this.triggerShakeAnimation(inputs);
            audioManager.playWrong();
            return;
        }

        // 播放猜测提交音效
        audioManager.playGuess();

        this.currentRound++;

        if (this.mode === 'single') {
            this.stepCount.player++;
            document.getElementById('playerStepCount').textContent = this.stepCount.player;

            const correct = this.calculateMatch(guess, this.opponentSecret);
            const hits = correct;
            const blows = this.calculateBlows(guess, this.opponentSecret);

            this.playerGuessHistory.push({ guess, hits, blows, round: this.currentRound });
            this.addToHistory('player', guess, correct);
            this.addTerminalLine(`你猜测: ${guess} -> 反馈: ${correct}/${this.digitCount}`, 'player');

            if (correct === this.digitCount) {
                this.triggerCelebrateAnimation();
                this.createConfetti();
                this.endGame('player', `你在第${this.stepCount.player}步猜中了AI的数字！`);
            } else {
                // 播放猜测结果音效
                audioManager.playGuessResult(hits, blows);
                if (navigator.vibrate) navigator.vibrate(correct > 0 ? [50, 30, 50] : [100]);
                this.triggerShakeAnimation(inputs);
                inputs.forEach(i => i.value = '');
                this.myTurn = false;
                this.updateTurnUI();
                setTimeout(() => this.aiTurn(), 1000);
            }
        } else {
            this.wsClient.send({
                type: 'submit_guess',
                roomCode: this.roomManager.currentRoom.code,
                playerId: this.roomManager.playerId,
                guess
            });
            this.stepCount.player++;
            document.getElementById('playerStepCount').textContent = this.stepCount.player;
            this.addToHistory('player', guess, '?');
            inputs.forEach(i => i.value = '');
        }
    }

    // AI 相关方法
    initAIPossibilities() {
        this.aiPossibleNumbers = [];
        const maxNum = Math.pow(10, this.digitCount);
        for (let i = 0; i < maxNum; i++) {
            this.aiPossibleNumbers.push(i.toString().padStart(this.digitCount, '0'));
        }
        document.getElementById('aiPossibilities').textContent = maxNum.toLocaleString();
        document.getElementById('aiEntropy').textContent = Math.log2(maxNum).toFixed(2);
        document.getElementById('progressBar').style.width = '0%';
        document.getElementById('searchProgress').textContent = '0%';
        document.getElementById('aiBestGuess').textContent = '----';
    }

    generateRandomNumber() {
        const maxNum = Math.pow(10, this.digitCount);
        return Math.floor(Math.random() * maxNum).toString().padStart(this.digitCount, '0');
    }

    calculateMatch(guess, target) {
        let correct = 0;
        for (let i = 0; i < this.digitCount; i++) {
            if (guess[i] === target[i]) correct++;
        }
        return correct;
    }

    calculateBlows(guess, target) {
        let blows = 0;
        for (let i = 0; i < this.digitCount; i++) {
            if (guess[i] !== target[i] && target.includes(guess[i])) blows++;
        }
        return blows;
    }

    async aiTurn() {
        if (this.gameState !== 'playing') return;

        this.aiThinking = true;
        document.getElementById('opponentIdleText').classList.add('hidden');
        document.getElementById('opponentThinkingAnim').classList.remove('hidden');
        document.getElementById('opponentStatus').textContent = '深度推理中...';

        this.addTerminalLine(`\n=== 第 ${this.stepCount.opponent + 1} 轮思考 ===`, 'header');

        const startTime = performance.now();
        let bestGuess;

        if (this.stepCount.opponent === 0) {
            // NGG-003: 使用 AI 模块的开局策略（信息熵最优）
            // 不再硬编码首次猜测，而是使用预计算的最佳开局
            const ai = new NumberGuessingAI(this.digitCount);
            bestGuess = ai.selectOpeningGuess();
            this.addTerminalLine(`初始步骤：信息熵最优开局 ${bestGuess}`, 'info');
        } else {
            const lastFeedback = this.getLastFeedback();
            const beforeCount = this.aiPossibleNumbers.length;
            
            this.aiPossibleNumbers = this.aiPossibleNumbers.filter(num =>
                this.calculateMatch(this.aiLastGuess, num) === lastFeedback
            );
            
            const afterCount = this.aiPossibleNumbers.length;
            this.addTerminalLine(`可能性空间：${beforeCount} -> ${afterCount}`, 'success');

            const entropy = Math.log2(afterCount).toFixed(2);
            document.getElementById('aiPossibilities').textContent = afterCount;
            document.getElementById('aiEntropy').textContent = entropy;

            const maxNum = Math.pow(10, this.digitCount);
            const progress = Math.min(100, Math.round((1 - afterCount / maxNum) * 100));
            document.getElementById('progressBar').style.width = progress + '%';
            document.getElementById('searchProgress').textContent = progress + '%';

            bestGuess = this.selectMinimaxGuess();
        }

        const calcTime = (performance.now() - startTime).toFixed(0);
        document.getElementById('aiCalcTime').textContent = calcTime + 'ms';

        await this.delay(1500);

        this.aiLastGuess = bestGuess;
        document.getElementById('aiBestGuess').textContent = bestGuess;

        this.stepCount.opponent++;
        document.getElementById('opponentStepCount').textContent = this.stepCount.opponent;

        this.addToHistory('opponent', bestGuess, '?');
        this.addTerminalLine(`决策：猜测 ${bestGuess}`, 'decision');

        document.getElementById('opponentThinkingAnim').classList.add('hidden');
        document.getElementById('opponentIdleText').classList.remove('hidden');

        const correct = this.calculateMatch(bestGuess, this.playerSecret);

        await this.delay(500);
        this.addTerminalLine(`接收反馈：${correct}/${this.digitCount} 位置正确`, correct === this.digitCount ? 'win' : 'info');

        const historyDiv = document.getElementById('opponentHistory');
        const firstItem = historyDiv.firstElementChild;
        if (firstItem) {
            firstItem.innerHTML = this.createHistoryItemHTML(bestGuess, correct);
        }

        if (correct === this.digitCount) {
            if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
            this.endGame('opponent', `AI在第${this.stepCount.opponent}步猜中了你的数字！`);
        } else {
            audioManager.playNotification();
            this.myTurn = true;
            this.updateTurnUI();
        }

        this.aiThinking = false;
    }

    selectMinimaxGuess() {
        const candidates = this.aiPossibleNumbers.length < 200
            ? this.aiPossibleNumbers
            : this.aiPossibleNumbers.filter((_, i) => i % Math.ceil(this.aiPossibleNumbers.length / 150) === 0);

        let bestGuess = candidates[0];
        let minMaxSize = Infinity;

        for (let i = 0; i < Math.min(candidates.length, 50); i++) {
            const guess = candidates[i];
            const distribution = new Array(this.digitCount + 1).fill(0);

            for (const possible of this.aiPossibleNumbers) {
                const match = this.calculateMatch(guess, possible);
                distribution[match]++;
            }

            const maxBucket = Math.max(...distribution);
            if (maxBucket < minMaxSize) {
                minMaxSize = maxBucket;
                bestGuess = guess;
            }
        }

        if (!this.aiPossibleNumbers.includes(bestGuess) && this.aiPossibleNumbers.length < 6) {
            bestGuess = this.aiPossibleNumbers[0];
        }

        return bestGuess;
    }

    getLastFeedback() {
        const history = document.getElementById('opponentHistory').children;
        for (let item of history) {
            const text = item.textContent;
            const match = text.match(/(\d)\/\d/);
            if (match && match[1] !== '?') return parseInt(match[1]);
        }
        return -1;
    }

    // UI 更新方法
    updateTurnUI() {
        const indicator = document.getElementById('turnIndicatorText');
        const btn = document.getElementById('submitGuessBtn');
        if (this.myTurn) {
            if (indicator) indicator.textContent = '你的回合';
            if (btn) btn.classList.remove('opacity-50');
        } else {
            if (indicator) indicator.textContent = 'AI回合';
            if (btn) btn.classList.add('opacity-50');
        }
    }

    updateAIThinking(message, type) {
        this.addTerminalLine(message, type);
    }

    addTerminalLine(text, type) {
        const terminal = document.getElementById('aiTerminal');
        if (!terminal) return;
        
        const line = document.createElement('div');
        line.className = 'terminal-line mb-1';

        const timestamp = new Date().toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        const colors = {
            header: 'text-yellow-400 font-bold',
            process: 'text-blue-400',
            success: 'text-green-400',
            decision: 'text-purple-400 font-bold',
            win: 'text-pink-400 font-bold text-lg',
            player: 'text-cyan-400',
            info: 'text-slate-400'
        };
        
        line.innerHTML = `<span class="text-slate-600">[${timestamp}]</span> <span class="${colors[type] || colors.info}">${text}</span>`;
        terminal.appendChild(line);
        terminal.scrollTop = terminal.scrollHeight;
    }

    addToHistory(side, guess, result) {
        const container = document.getElementById(side === 'player' ? 'playerHistory' : 'opponentHistory');
        if (!container) return;
        
        if (container.querySelector('.text-slate-600')) {
            container.innerHTML = '';
        }

        const item = document.createElement('div');
        item.className = 'flex items-center justify-between p-2 rounded-lg bg-slate-800/50 mb-1 animate-slide-in';
        item.innerHTML = this.createHistoryItemHTML(guess, result);
        container.insertBefore(item, container.firstChild);
    }

    createHistoryItemHTML(guess, result) {
        const color = result === this.digitCount ? 'text-green-400' : result === '?' ? 'text-slate-400' : 'text-indigo-400';
        return `<span class="mono font-bold">${guess}</span><span class="${color} text-sm">${result}/${this.digitCount}</span>`;
    }

    triggerCelebrateAnimation() {
        const screen = document.getElementById('gameScreen');
        if (screen) screen.classList.add('animate-celebrate');
        setTimeout(() => screen?.classList.remove('animate-celebrate'), 600);
    }

    triggerShakeAnimation(inputs) {
        inputs.forEach(input => input.classList.add('animate-shake'));
        setTimeout(() => inputs.forEach(input => input.classList.remove('animate-shake')), 500);
    }

    // 显示重复猜测警告
    showDuplicateGuessWarning(guess) {
        // 检查是否已存在警告，避免重复显示
        const existingWarning = document.getElementById('duplicateGuessWarning');
        if (existingWarning) {
            existingWarning.remove();
        }

        const warning = document.createElement('div');
        warning.id = 'duplicateGuessWarning';
        warning.className = 'fixed top-20 left-1/2 -translate-x-1/2 bg-amber-500/90 text-white px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-3 animate-slide-in';
        warning.innerHTML = `
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <span class="font-semibold">已猜过 <span class="text-yellow-200">${guess}</span>，请尝试其他数字</span>
        `;
        document.body.appendChild(warning);

        // 3秒后自动消失
        setTimeout(() => {
            warning.style.opacity = '0';
            warning.style.transform = 'translateX(-50%) translateY(-10px)';
            warning.style.transition = 'all 0.3s ease-out';
            setTimeout(() => warning.remove(), 300);
        }, 3000);
    }

    createConfetti() {
        const container = document.createElement('div');
        container.className = 'confetti-container';
        
        const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#22c55e'];
        
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 2 + 's';
            container.appendChild(confetti);
        }
        
        document.body.appendChild(container);
        setTimeout(() => container.remove(), 4000);
    }

    endGame(winner, message) {
        this.gameState = 'over';
        this.stopTurnCountdown();

        // 根据胜负播放对应音效
        if (winner === 'player') {
            audioManager.playWin();
        } else {
            audioManager.playLose();
        }
        
        // 更新统计
        if (window.StorageManager) {
            StorageManager.saveGameResult(winner === 'player' ? 'player' : 'opponent');
            StorageManager.addGameRecord({
                mode: this.mode,
                result: winner === 'player' ? 'win' : 'lose',
                rounds: this.stepCount.player,
                duration: Math.floor((Date.now() - (this.gameStartTime || Date.now())) / 1000)
            });
            // 更新战绩显示
            this.updateStatsDisplay();
        }

        // 显示游戏结束弹窗
        const modal = document.getElementById('gameOverModal');
        if (modal) {
            document.getElementById('gameOverTitle').textContent = winner === 'player' ? '🎉 你赢了！' : '😢 AI赢了';
            document.getElementById('gameOverMessage').textContent = message;
            document.getElementById('finalPlayerSecret').textContent = this.playerSecret || '----';
            document.getElementById('finalOpponentSecret').textContent = this.opponentSecret || '----';
            modal.style.display = 'flex';
        }
    }

    // 联机相关方法
    async createRoom() {
        // 播放点击音效
        audioManager.playClick();

        // 显示加载状态
        const createSection = document.getElementById('createRoomSection');
        const btn = createSection ? createSection.querySelector('button') : null;
        if (btn) {
            btn.setAttribute('disabled', 'true');
            btn.innerHTML = '<span class="inline-block animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></span>连接中...';
        }

        if (!this.wsClient && GameConfig) {
            try {
                debugLog('正在连接WebSocket:', GameConfig.getWsServer());
                await this.initMultiplayer(GameConfig.getWsServer());
                debugLog('WebSocket连接成功');
            } catch (e) {
                errorLog('WebSocket连接失败:', e);
                // Safari/iOS 证书问题特殊提示
                let errorMsg = '连接服务器失败，请稍后重试';
                if (e.isSafariCertIssue || /Safari|iPhone|iPad/i.test(navigator.userAgent)) {
                    errorMsg = '连接失败。Safari/iOS 可能因 SSL 证书问题拒绝连接。\n\n建议：\n1. 使用 Chrome 或 Edge 浏览器\n2. 或联系管理员配置正规 SSL 证书';
                }
                alert(errorMsg);
                if (btn) {
                    btn.removeAttribute('disabled');
                    btn.innerHTML = '创建房间';
                }
                return;
            }
        }
        if (this.roomManager) {
            const code = this.roomManager.generateRoomCode();
            debugLog('创建房间:', code);
            this.roomManager.createRoom(code);
            this.saveRoomSession(code, true);
            document.getElementById('displayRoomCode').textContent = code;
            document.getElementById('multiplayerLobby').classList.add('hidden');
            document.getElementById('waitingRoom').classList.remove('hidden');
            // 显示难度选择面板（房主）
            this.roomManager.updateDifficultyDisplay(true);
            // 初始化秘密数字输入框
            this.updateMPSecretInputs(this.roomManager.difficulty);
        }
    }

    async joinRoom() {
        const code = document.getElementById('roomCodeInput').value.toUpperCase();
        if (code.length !== 6) return;

        // 播放点击音效
        audioManager.playClick();

        // 显示加载状态
        const joinSection = document.getElementById('joinRoomSection');
        const btn = joinSection ? joinSection.querySelector('button') : null;
        if (btn) {
            btn.setAttribute('disabled', 'true');
            btn.innerHTML = '<span class="inline-block animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></span>连接中...';
        }

        if (!this.wsClient && GameConfig) {
            try {
                debugLog('正在连接WebSocket:', GameConfig.getWsServer());
                await this.initMultiplayer(GameConfig.getWsServer());
                debugLog('WebSocket连接成功');
            } catch (e) {
                errorLog('WebSocket连接失败:', e);
                // Safari/iOS 证书问题特殊提示
                let errorMsg = '连接服务器失败，请稍后重试';
                if (e.isSafariCertIssue || /Safari|iPhone|iPad/i.test(navigator.userAgent)) {
                    errorMsg = '连接失败。Safari/iOS 可能因 SSL 证书问题拒绝连接。\n\n建议：\n1. 使用 Chrome 或 Edge 浏览器\n2. 或联系管理员配置正规 SSL 证书';
                }
                alert(errorMsg);
                if (btn) {
                    btn.removeAttribute('disabled');
                    btn.innerHTML = '加入房间';
                }
                return;
            }
        }
        if (this.roomManager) {
            this.roomManager.joinRoom(code);
        }
    }

    findRandomMatch() {
        // 播放点击音效
        audioManager.playClick();

        if (!this.wsClient && GameConfig) {
            this.initMultiplayer(GameConfig.getWsServer()).then(() => {
                this.wsClient.send({ type: 'random_match', playerId: this.roomManager.playerId });
            });
        } else if (this.wsClient) {
            this.wsClient.send({ type: 'random_match', playerId: this.roomManager.playerId });
        }
    }

    showRandomMatchWaiting() {
        // 显示等待匹配的UI
        const lobby = document.getElementById('multiplayerLobby');
        if (lobby) {
            // 创建等待匹配提示
            let waitingEl = document.getElementById('randomMatchWaiting');
            if (!waitingEl) {
                waitingEl = document.createElement('div');
                waitingEl.id = 'randomMatchWaiting';
                waitingEl.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center';
                waitingEl.innerHTML = `
                    <div class="glass rounded-2xl p-8 text-center max-w-md">
                        <div class="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <h3 class="text-xl font-bold mb-2">正在寻找对手...</h3>
                        <p class="text-slate-400 mb-4">请稍候，正在为您匹配其他玩家</p>
                        <button id="cancelRandomMatchBtn" class="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-semibold transition-colors">
                            取消匹配
                        </button>
                    </div>
                `;
                document.body.appendChild(waitingEl);

                // 绑定取消按钮
                document.getElementById('cancelRandomMatchBtn').addEventListener('click', () => {
                    this.cancelRandomMatch();
                });
            }
        }
    }

    showRandomMatchFound(data) {
        // 隐藏等待匹配UI
        const waitingEl = document.getElementById('randomMatchWaiting');
        if (waitingEl) waitingEl.remove();

        // 播放匹配成功音效
        audioManager.playSuccess();

        // 更新房间码显示
        document.getElementById('displayRoomCode').textContent = data.roomCode;

        // 显示匹配成功提示
        const toast = document.createElement('div');
        toast.className = 'fixed top-20 left-1/2 -translate-x-1/2 bg-green-500/90 text-white px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-3 animate-slide-in';
        toast.innerHTML = `
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            <span class="font-semibold">匹配成功！</span>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);

        // 切换到等待房间
        document.getElementById('multiplayerLobby').classList.add('hidden');
        document.getElementById('waitingRoom').classList.remove('hidden');

        // 显示难度面板
        if (this.roomManager) {
            this.roomManager.updateDifficultyDisplay(data.isHost);
            // 更新秘密数字输入框
            this.updateMPSecretInputs(this.roomManager.difficulty);
        }

        // 更新状态显示
        const statusEl = document.getElementById('waitingStatus');
        if (statusEl) {
            statusEl.textContent = data.isHost ? '等待对手准备...' : '等待房主开始游戏...';
        }
    }

    showRandomMatchTimeout() {
        // 隐藏等待匹配UI
        const waitingEl = document.getElementById('randomMatchWaiting');
        if (waitingEl) waitingEl.remove();

        // 显示超时提示
        const toast = document.createElement('div');
        toast.className = 'fixed top-20 left-1/2 -translate-x-1/2 bg-yellow-500/90 text-white px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-3 animate-slide-in';
        toast.innerHTML = `
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <span class="font-semibold">匹配超时，暂无可用对手</span>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    showRandomMatchCancelled() {
        // 隐藏等待匹配UI
        const waitingEl = document.getElementById('randomMatchWaiting');
        if (waitingEl) waitingEl.remove();

        // 显示取消提示
        const toast = document.createElement('div');
        toast.className = 'fixed top-20 left-1/2 -translate-x-1/2 bg-slate-500/90 text-white px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-3 animate-slide-in';
        toast.innerHTML = `
            <span class="font-semibold">已取消匹配</span>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }

    cancelRandomMatch() {
        // 播放点击音效
        audioManager.playClick();

        if (this.wsClient) {
            this.wsClient.send({ type: 'cancel_random_match', playerId: this.roomManager?.playerId });
        }
        // 隐藏等待UI
        const waitingEl = document.getElementById('randomMatchWaiting');
        if (waitingEl) waitingEl.remove();
    }

    copyRoomCode() {
        // 播放点击音效
        audioManager.playClick();

        const code = document.getElementById('displayRoomCode').textContent;
        navigator.clipboard.writeText(code).then(() => {
            if (window.NetworkManager) NetworkManager.showStatusMessage('房间号已复制', 'success');
        });
    }

    setPlayerReady() {
        let secret = '';
        // 使用当前难度确定输入框数量
        const digitCount = this.roomManager?.difficulty || 4;
        for (let i = 1; i <= digitCount; i++) {
            const val = document.getElementById('mpS' + i)?.value;
            if (!val) return;
            secret += val;
        }

        // 播放点击音效
        audioManager.playClick();

        if (this.roomManager) {
            this.roomManager.setReady(secret);
            document.getElementById('playerStatusText').textContent = '已准备';
            document.getElementById('playerReadyStatus').className = 'inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 text-green-400 text-sm';
        }
    }

    /**
     * 设置多人模式难度（房主）
     */
    setMultiplayerDifficulty(digits) {
        // 播放点击音效
        audioManager.playClick();

        if (this.roomManager && this.roomManager.isHost) {
            this.roomManager.setDifficulty(digits);
            // 更新本地难度
            this.digitCount = digits;
            // 更新秘密数字输入框
            this.updateMPSecretInputs(digits);
        }
    }

    /**
     * 更新多人模式秘密数字输入框数量
     */
    updateMPSecretInputs(digitCount) {
        const container = document.getElementById('mpSecretInputContainer');
        const hint = document.getElementById('mpSecretHint');
        if (!container) return;

        container.innerHTML = '';
        for (let i = 1; i <= digitCount; i++) {
            const input = document.createElement('input');
            input.type = 'text';
            input.id = 'mpS' + i;
            input.maxLength = 1;
            input.className = 'digit-input w-14 h-14 bg-slate-900/80 border-2 border-slate-700 rounded-xl text-center text-2xl font-bold text-white focus:outline-none focus:border-indigo-500 transition-all';
            input.placeholder = '-';
            // 自动跳转到下一个输入框
            input.addEventListener('input', (e) => {
                if (e.target.value.length === 1) {
                    const nextInput = document.getElementById('mpS' + (i + 1));
                    if (nextInput) nextInput.focus();
                }
            });
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && e.target.value === '' && i > 1) {
                    const prevInput = document.getElementById('mpS' + (i - 1));
                    if (prevInput) prevInput.focus();
                }
            });
            container.appendChild(input);
        }

        // 更新提示文字
        if (hint) {
            hint.textContent = `输入${digitCount}位数字（0-9可重复），准备好后点击准备按钮`;
        }
    }

    startMultiplayerGame() {
        if (this.roomManager?.isHost && this.roomManager.currentRoom) {
            this.roomManager.wsClient.send({
                type: 'start_game',
                roomCode: this.roomManager.currentRoom.code,
                playerId: this.roomManager.playerId
            });
            this.startGame();
        }
    }

    cancelWaiting() {
        // 播放点击音效
        audioManager.playClick();

        if (this.roomManager) this.roomManager.leaveRoom();
        this.clearRoomSession();
        this.showMultiplayerLobby();
    }

    // 事件处理
    handleGameStart(data) {
        if (!data?.firstPlayer) return;
        // 设置难度
        if (data.room?.difficulty) {
            this.digitCount = data.room.difficulty;
            if (this.roomManager) {
                this.roomManager.difficulty = data.room.difficulty;
            }
        }
        this.startGame();
        // 初始化回合倒计时
        if (data.firstPlayer === this.roomManager?.playerId) {
            this.myTurn = true;
        }
        this.startTurnCountdown(60);
        this.updateTurnUI();

        // 多人模式UI设置
        if (this.mode === 'multiplayer') {
            // 显示网络状态栏
            const networkStatusBar = document.getElementById('networkStatusBar');
            if (networkStatusBar) networkStatusBar.classList.remove('hidden');

            // 显示对战信息面板
            const battleInfoPanel = document.getElementById('battleInfoPanel');
            if (battleInfoPanel) battleInfoPanel.classList.remove('hidden');

            // 隐藏AI思考面板
            const aiThinkingPanel = document.getElementById('aiThinkingPanel');
            if (aiThinkingPanel) aiThinkingPanel.classList.add('hidden');

            // 修改右侧面板标题
            const opponentPanelTitle = document.getElementById('opponentPanelTitle');
            if (opponentPanelTitle) opponentPanelTitle.textContent = '对手';
        }
    }

    handleTurnChange(data) {
        if (!data?.currentPlayer) return;
        this.myTurn = data.currentPlayer === this.roomManager?.playerId;
        this.updateTurnUI();
        // 重置回合倒计时
        this.startTurnCountdown(60);
    }

    // 回合倒计时
    startTurnCountdown(seconds) {
        // 清除之前的计时器
        if (this.turnCountdownTimer) {
            clearInterval(this.turnCountdownTimer);
        }

        let remaining = seconds;
        const totalDuration = seconds;
        const countdownEl = document.getElementById('turnCountdown');
        const barEl = document.getElementById('turnCountdownBar');
        const countdownContainer = countdownEl?.closest('.bg-slate-800\\/50');

        if (!countdownEl || !barEl) return;

        // 重置状态
        countdownEl.classList.remove('text-red-400', 'text-yellow-400', 'text-white', 'animate-pulse');
        barEl.classList.remove('bg-red-500', 'bg-yellow-500', 'bg-green-500');
        barEl.style.removeProperty('animation');
        if (countdownContainer) {
            countdownContainer.classList.remove('border-red-500/50', 'animate-pulse');
        }

        // 跟踪是否已播放警告音效
        let warningSoundPlayed = false;
        let countdownSoundPlayed = false;

        const updateDisplay = () => {
            countdownEl.textContent = remaining;
            const percentage = (remaining / totalDuration) * 100;
            barEl.style.width = percentage + '%';

            // 进度条颜色变化
            barEl.classList.remove('bg-red-500', 'bg-yellow-500', 'bg-green-500');
            if (remaining <= 10) {
                barEl.classList.add('bg-red-500');
            } else if (remaining <= 30) {
                barEl.classList.add('bg-yellow-500');
            } else {
                barEl.classList.add('bg-green-500');
            }

            // 文字颜色变化
            countdownEl.classList.remove('text-red-400', 'text-yellow-400', 'text-white', 'animate-pulse');
            if (remaining <= 10) {
                countdownEl.classList.add('text-red-400', 'animate-pulse');

                // 容器边框警告效果
                if (countdownContainer) {
                    countdownContainer.classList.add('border-red-500/50', 'animate-pulse');
                }
            } else if (remaining <= 30) {
                countdownEl.classList.add('text-yellow-400');
                if (countdownContainer) {
                    countdownContainer.classList.remove('border-red-500/50', 'animate-pulse');
                }
            } else {
                countdownEl.classList.add('text-white');
                if (countdownContainer) {
                    countdownContainer.classList.remove('border-red-500/50', 'animate-pulse');
                }
            }

            // 10秒警告：视觉闪烁效果
            if (remaining === 10 && !warningSoundPlayed) {
                warningSoundPlayed = true;
                // 播放警告音效
                if (window.audioManager) {
                    audioManager.playNotification();
                }
                // 震动提醒
                if (navigator.vibrate) {
                    navigator.vibrate([100, 50, 100]);
                }
            }

            // 5秒倒计时音效提醒
            if (remaining <= 5 && remaining > 0 && !countdownSoundPlayed) {
                // 每秒播放倒计时音效
                if (window.audioManager) {
                    audioManager.playCountdown();
                }
                // 震动提醒
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
            }

            // 标记倒计时音效已播放（用于5秒内的每秒提醒）
            if (remaining <= 5 && remaining > 0) {
                countdownSoundPlayed = false; // 重置以便下一秒播放
            }
        };

        updateDisplay();

        this.turnCountdownTimer = setInterval(() => {
            remaining--;
            updateDisplay();

            if (remaining <= 0) {
                clearInterval(this.turnCountdownTimer);
                // 最终警告
                if (window.audioManager) {
                    audioManager.playWrong();
                }
                if (navigator.vibrate) {
                    navigator.vibrate([200, 100, 200]);
                }
            }
        }, 1000);
    }

    stopTurnCountdown() {
        if (this.turnCountdownTimer) {
            clearInterval(this.turnCountdownTimer);
            this.turnCountdownTimer = null;
        }
    }

    // 更新网络状态显示
    updateNetworkStatus(quality, label, color) {
        const indicator = document.getElementById('networkIndicator');
        const status = document.getElementById('networkStatus');

        if (indicator && status) {
            // 移除所有颜色类
            indicator.classList.remove('bg-green-400', 'bg-yellow-400', 'bg-red-400');
            // 添加新颜色
            indicator.classList.add(color);
            status.textContent = label;
        }
    }

    handleGuessResult(data) {
        if (!data?.guess || data.feedback === undefined) return;

        const isMyGuess = data.playerId === this.roomManager?.playerId;
        const side = isMyGuess ? 'player' : 'opponent';

        if (!isMyGuess) {
            this.stepCount.opponent++;
            const el = document.getElementById('opponentStepCount');
            if (el) el.textContent = this.stepCount.opponent;
        }

        // 如果是玩家自己的猜测，更新已存在的历史记录（从 '?' 更新为实际反馈）
        if (isMyGuess) {
            this.updateHistoryWithResult(side, data.guess, data.feedback);
        } else {
            this.addToHistory(side, data.guess, data.feedback);
        }
    }

    /**
     * 更新历史记录中的猜测结果（用于联机模式）
     * 将 '?' 更新为实际的反馈值
     */
    updateHistoryWithResult(side, guess, result) {
        const container = document.getElementById(side === 'player' ? 'playerHistory' : 'opponentHistory');
        if (!container) return;

        // 查找第一个匹配的猜测且结果为 '?' 的记录
        const items = container.querySelectorAll('.flex.items-center');
        for (const item of items) {
            const guessSpan = item.querySelector('.mono');
            if (guessSpan && guessSpan.textContent === guess) {
                // 检查是否是 '?' 结果
                const resultSpan = item.querySelector('.text-slate-400');
                if (resultSpan) {
                    // 更新结果
                    const color = result === this.digitCount ? 'text-green-400' : 'text-indigo-400';
                    resultSpan.className = `${color} text-sm`;
                    resultSpan.textContent = `${result}/${this.digitCount}`;
                    break;
                }
            }
        }
    }

    handleGameOver(data) {
        if (!data) return;
        this.endGame(data.winner === this.roomManager?.playerId ? 'player' : 'opponent', data.message);
    }

    handleOpponentDisconnected(seconds) {
        // NPG-01: 处理对手断线超时
        console.warn(`[NPG-01] 对手断线超时: ${seconds}秒`);

        // 显示断线提示
        const modal = document.createElement('div');
        modal.id = 'disconnectTimeoutModal';
        modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center';
        modal.innerHTML = `
            <div class="glass rounded-2xl p-8 max-w-md text-center">
                <div class="text-6xl mb-4">⚠️</div>
                <h3 class="text-xl font-bold mb-2 text-yellow-400">对手连接中断</h3>
                <p class="text-slate-400 mb-2">对手已断开连接 ${seconds} 秒</p>
                <p class="text-slate-500 text-sm mb-6">等待对手重新连接中...</p>
                <div class="flex gap-4 justify-center">
                    <button id="waitReconnectBtn" class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-semibold transition-colors">
                        继续等待
                    </button>
                    <button id="claimWinBtn" class="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-semibold transition-colors">
                        判定获胜
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // 绑定按钮事件
        document.getElementById('waitReconnectBtn').addEventListener('click', () => {
            modal.remove();
            // 继续等待，不做任何操作，WebSocket 会自动重连
        });

        document.getElementById('claimWinBtn').addEventListener('click', () => {
            modal.remove();
            // 判定玩家获胜
            this.endGame('player', '对手长时间未响应，你获得胜利！');
            if (this.roomManager) {
                this.roomManager.leaveRoom();
            }
            this.clearRoomSession();
        });
    }

    /**
     * 处理回合超时
     */
    handleTurnTimeout(data) {
        this.stopTurnCountdown();
        const winner = data?.winner;
        const isWinner = winner === this.roomManager?.playerId;
        const message = isWinner ? '对手超时，你获胜！' : '你超时了，对手获胜';

        // 显示超时提示
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center';
        modal.innerHTML = `
            <div class="glass rounded-2xl p-8 max-w-md text-center">
                <div class="text-6xl mb-4">${isWinner ? '🎉' : '⏰'}</div>
                <h3 class="text-xl font-bold mb-2 ${isWinner ? 'text-green-400' : 'text-yellow-400'}">${message}</h3>
                <p class="text-slate-400 mb-6">回合超时</p>
                <button onclick="this.closest('.fixed').remove(); game.showMainMenu();" class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-semibold">返回主菜单</button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    /**
     * 处理对手重新连接
     */
    handleOpponentReconnected(data) {
        debugLog('Opponent reconnected:', data);
        // 移除断线提示
        const disconnectModal = document.getElementById('disconnectTimeoutModal');
        if (disconnectModal) disconnectModal.remove();

        // 显示重连成功提示
        const toast = document.createElement('div');
        toast.className = 'fixed top-20 left-1/2 -translate-x-1/2 bg-green-500/90 text-white px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-3 animate-slide-in';
        toast.innerHTML = `
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            <span class="font-semibold">对手已重新连接</span>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    /**
     * 处理玩家断开连接
     */
    handlePlayerDisconnected(data) {
        debugLog('Player disconnected:', data);
        // 如果是对手断开，显示等待提示
        if (data.playerId !== this.roomManager?.playerId) {
            this.handleOpponentDisconnected(0);
        }
    }

    /**
     * 处理游戏重连状态同步
     * @param {Object} data - 重连数据，包含房间信息、历史记录、回合状态等
     */
    handleGameReconnect(data) {
        debugLog('Handling game reconnect:', data);

        // 隐藏重连中的UI
        this.hideReconnectingUI();

        // 恢复玩家的秘密数字
        this.playerSecret = data.mySecret;

        // 恢复游戏状态
        this.gameState = 'playing';
        this.myTurn = data.isMyTurn;
        this.currentRound = data.turn || 0;

        // 切换到游戏界面
        document.getElementById('mainMenu').classList.add('hidden');
        document.getElementById('multiplayerLobby').classList.add('hidden');
        document.getElementById('waitingRoom').classList.add('hidden');
        document.getElementById('gameScreen').classList.remove('hidden');

        // 隐藏秘密数字设置面板，显示猜测输入面板
        document.getElementById('secretSetupPanel').classList.add('hidden');
        document.getElementById('guessInputPanel').classList.remove('hidden');

        // 渲染猜测输入框
        this.renderGuessInputs();

        // 恢复历史记录
        this.restoreGameHistory(data.history);

        // 恢复步数统计
        this.stepCount.player = data.history?.filter(h => h.playerId === this.roomManager?.playerId).length || 0;
        this.stepCount.opponent = data.history?.filter(h => h.playerId !== this.roomManager?.playerId).length || 0;

        // 更新步数显示
        const playerStepEl = document.getElementById('playerStepCount');
        const opponentStepEl = document.getElementById('opponentStepCount');
        if (playerStepEl) playerStepEl.textContent = this.stepCount.player;
        if (opponentStepEl) opponentStepEl.textContent = this.stepCount.opponent;

        // 更新回合UI
        this.updateTurnUI();

        // 恢复回合倒计时
        if (data.remainingTime) {
            this.startTurnCountdown(Math.ceil(data.remainingTime / 1000));
        } else {
            this.startTurnCountdown(60);
        }

        // 更新玩家状态显示
        const statusEl = document.getElementById('displayPlayerStatus');
        if (statusEl) {
            statusEl.textContent = '已重连';
        }

        // 多人模式UI设置
        if (this.mode === 'multiplayer') {
            // 显示网络状态栏
            const networkStatusBar = document.getElementById('networkStatusBar');
            if (networkStatusBar) networkStatusBar.classList.remove('hidden');

            // 显示对战信息面板
            const battleInfoPanel = document.getElementById('battleInfoPanel');
            if (battleInfoPanel) battleInfoPanel.classList.remove('hidden');

            // 隐藏AI思考面板
            const aiThinkingPanel = document.getElementById('aiThinkingPanel');
            if (aiThinkingPanel) aiThinkingPanel.classList.add('hidden');

            // 修改右侧面板标题
            const opponentPanelTitle = document.getElementById('opponentPanelTitle');
            if (opponentPanelTitle) opponentPanelTitle.textContent = '对手';
        }

        // 显示重连成功提示
        this.showReconnectSuccessToast();

        debugLog('Game reconnect restored successfully');
    }

    /**
     * 恢复游戏历史记录
     * @param {Array} history - 历史记录数组
     */
    restoreGameHistory(history) {
        if (!history || !Array.isArray(history)) return;

        // 清空现有历史
        const playerHistoryEl = document.getElementById('playerHistory');
        const opponentHistoryEl = document.getElementById('opponentHistory');
        if (playerHistoryEl) playerHistoryEl.innerHTML = '';
        if (opponentHistoryEl) opponentHistoryEl.innerHTML = '';

        // 重置玩家猜测历史
        this.playerGuessHistory = [];

        // 根据历史记录恢复
        history.forEach(record => {
            const isPlayer = record.playerId === this.roomManager?.playerId;
            const side = isPlayer ? 'player' : 'opponent';

            // 添加到历史记录
            this.addToHistory(side, record.guess, record.correct);

            // 恢复玩家猜测历史（用于重复检测）
            if (isPlayer) {
                this.playerGuessHistory.push({
                    guess: record.guess,
                    hits: record.correct,
                    blows: record.blows || 0,
                    round: record.turn || this.playerGuessHistory.length + 1
                });
            }
        });
    }

    /**
     * 显示重连成功提示
     */
    showReconnectSuccessToast() {
        const toast = document.createElement('div');
        toast.id = 'reconnectSuccessToast';
        toast.className = 'fixed top-20 left-1/2 -translate-x-1/2 bg-green-500/90 text-white px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-3 animate-slide-in';
        toast.innerHTML = `
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            <span class="font-semibold">已成功重连到游戏</span>
        `;
        document.body.appendChild(toast);

        // 3秒后自动消失
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(-10px)';
            toast.style.transition = 'all 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * 请求重赛
     */
    requestRematch() {
        // 播放点击音效
        audioManager.playClick();

        if (this.roomManager?.currentRoom) {
            this.wsClient.send({
                type: 'request_rematch',
                roomCode: this.roomManager.currentRoom.code,
                playerId: this.roomManager.playerId
            });
        } else {
            // 单机模式，直接重新开始
            this.resetForRematch();
        }
    }

    /**
     * 接受重赛请求
     */
    acceptRematch() {
        if (this.roomManager?.currentRoom) {
            this.wsClient.send({
                type: 'accept_rematch',
                roomCode: this.roomManager.currentRoom.code,
                playerId: this.roomManager.playerId
            });
        }
        this.resetForRematch();
    }

    /**
     * 重置游戏状态以进行重赛
     */
    resetForRematch() {
        // 隐藏游戏结束弹窗
        const modal = document.getElementById('gameOverModal');
        if (modal) {
            modal.style.display = 'none';
        }

        // 重置游戏状态
        this.gameState = 'setup';
        this.stepCount = { player: 0, opponent: 0 };
        this.currentRound = 0;
        this.playerGuessHistory = [];
        this.playerSecret = '';
        this.opponentSecret = '';
        this.myTurn = false;
        this.gameStartTime = Date.now();

        // 清空历史记录
        const playerHistoryEl = document.getElementById('playerHistory');
        const opponentHistoryEl = document.getElementById('opponentHistory');
        if (playerHistoryEl) {
            playerHistoryEl.innerHTML = '<div class="text-center text-slate-600 text-sm py-8">暂无记录</div>';
        }
        if (opponentHistoryEl) {
            opponentHistoryEl.innerHTML = '<div class="text-center text-slate-600 text-sm py-8">等待AI猜测...</div>';
        }

        // 重置步数显示
        const playerStepEl = document.getElementById('playerStepCount');
        const opponentStepEl = document.getElementById('opponentStepCount');
        if (playerStepEl) playerStepEl.textContent = '0';
        if (opponentStepEl) opponentStepEl.textContent = '0';

        // 重置AI状态
        this.aiPossibleNumbers = [];
        this.aiLastGuess = '';
        this.aiThinking = false;

        // 清空AI终端
        const terminal = document.getElementById('aiTerminal');
        if (terminal) {
            terminal.innerHTML = '<div class="text-green-400 mb-1">> 系统初始化完成</div><div class="text-slate-400 mb-1">> 等待游戏开始...</div>';
        }

        // 重置进度条
        const progressBar = document.getElementById('progressBar');
        const searchProgress = document.getElementById('searchProgress');
        const aiPossibilities = document.getElementById('aiPossibilities');
        const aiEntropy = document.getElementById('aiEntropy');
        const aiBestGuess = document.getElementById('aiBestGuess');
        if (progressBar) progressBar.style.width = '0%';
        if (searchProgress) searchProgress.textContent = '0%';
        if (aiPossibilities) aiPossibilities.textContent = '10000';
        if (aiEntropy) aiEntropy.textContent = '13.29';
        if (aiBestGuess) aiBestGuess.textContent = '----';

        // 显示秘密设置面板，隐藏猜测面板
        document.getElementById('secretSetupPanel').classList.remove('hidden');
        document.getElementById('guessInputPanel').classList.add('hidden');

        // 更新状态显示
        document.getElementById('displayPlayerStatus').textContent = '设置中...';
        document.getElementById('opponentStatus').textContent = '思考中...';

        // 重新渲染输入框
        this.renderSecretInputs();
        this.renderGuessInputs();
        this.initAIPossibilities();

        // 清空输入框
        const secretInputs = document.querySelectorAll('#secretSetupPanel .digit-input');
        secretInputs.forEach(input => input.value = '');
        const guessInputs = document.querySelectorAll('#guessInputContainer .digit-input');
        guessInputs.forEach(input => input.value = '');

        // 联机模式：返回等待房间重新设置秘密数字
        if (this.mode === 'multiplayer' && this.roomManager?.currentRoom) {
            // 重置准备状态
            this.roomManager.isReady = false;
            this.roomManager.secretNumber = '';

            // 保持难度设置
            const savedDifficulty = this.roomManager.difficulty || 4;
            this.digitCount = savedDifficulty;

            // 返回等待房间
            document.getElementById('gameScreen').classList.add('hidden');
            document.getElementById('waitingRoom').classList.remove('hidden');

            // 显示难度面板
            this.roomManager.updateDifficultyDisplay(this.roomManager.isHost);
            // 更新秘密数字输入框
            this.updateMPSecretInputs(savedDifficulty);

            // 重置准备状态UI
            const playerStatusText = document.getElementById('playerStatusText');
            const playerReadyStatus = document.getElementById('playerReadyStatus');
            if (playerStatusText) playerStatusText.textContent = '未准备';
            if (playerReadyStatus) {
                playerReadyStatus.className = 'inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/20 text-yellow-400 text-sm';
            }

            // 清空秘密数字输入
            for (let i = 1; i <= savedDifficulty; i++) {
                const input = document.getElementById('mpS' + i);
                if (input) input.value = '';
            }
        } else {
            // 单机模式：直接开始新游戏
            this.updateAIThinking('等待玩家设置秘密数字...', 'info');
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 创建全局游戏实例
let game;

document.addEventListener('DOMContentLoaded', () => {
    game = new NumberGamePro();
    window.game = game;
});

// 浏览器全局导出
if (typeof window !== 'undefined') {
    window.RoomManager = RoomManager;
    window.NumberGamePro = NumberGamePro;
}

// CommonJS 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NumberGamePro, WebSocketClient, RoomManager };
}