export default class Menu extends HTMLElement {
    constructor(handlers) {
        super()
        this.handlers = handlers
        this.attachShadow({ mode: 'open' })
        this.stylesFileName = 'menu.css'
        this.db = null
    }

    async connectedCallback() {
        await this.#render()
        await this.#setupEvents()
    }

    #getTemplate() {
        return `
            <div class="container" id="mainMenu">
                <div class="title">
                    <h1>🌟 JUNIMO JUMP 🌟</h1>
                    <p>Salta y alcanza las estrellas</p>
                </div>

                <div class="input-section">
                    <label for="playerName">Ingresa tu nombre:</label>
                    <input type="text" id="playerName" placeholder="Jugador" maxlength="15">
                </div>

                <div class="buttons">
                    <button class="btn btn-play">▶ Jugar</button>
                    <button class="btn btn-leaderboard">Tabla de Lideres</button>
                </div>

                <div class="leaderboard" id="leaderboard">
                    <h2>TOP 5 GRANJEROS</h2>
                    <ul class="leaderboard-list">

                    </ul>
                </div>
            </div>

            <!-- Pantalla de Game Over -->
            <div class="game-over hidden" id="gameOver">
                <div class="game-over-content">
                    <h1 class="game-over-title">GAME OVER</h1>
                    
                    <div class="final-score">
                        <p>Tu puntuación final:</p>
                        <div class="score-number" id="finalScore">0</div>
                        <p>Tu mejor puntuación:</p>
                        <div class="score-number" id="bestScore">0</div>
                    </div>

                    <div class="game-over-buttons">
                        <button class="btn btn-retry">Intentar de nuevo</button>
                        <button class="btn btn-menu">Menu Principal</button>
                    </div>
                </div>
            </div>
        `
    }

    async #getStyles() {
        let css = await fetch(`./src/UI/${this.stylesFileName}`).then((response) => response.text())
        return css
    }

    async #render() {
        this.shadowRoot.innerHTML = ''
        let sheet = new CSSStyleSheet()
        let css = await this.#getStyles()
        sheet.replaceSync(css)
        this.shadowRoot.adoptedStyleSheets = [sheet]
        this.shadowRoot.innerHTML += this.#getTemplate()

        // elementos
        this.$mainMenu = this.shadowRoot.querySelector('#mainMenu')
        this.$title = this.shadowRoot.querySelector('.title h1')
        this.$playerName = this.shadowRoot.querySelector('#playerName')
        this.$playBtn = this.shadowRoot.querySelector('.btn-play')
        this.$leaderboardBtn = this.shadowRoot.querySelector('.btn-leaderboard')
        this.$leaderboard = this.shadowRoot.querySelector('#leaderboard')
        this.$leaderboardList = this.shadowRoot.querySelector('.leaderboard-list')
        this.$gameOver = this.shadowRoot.querySelector('#gameOver')
        this.$finalScore = this.shadowRoot.querySelector('#finalScore')
        this.$bestScore = this.shadowRoot.querySelector('#bestScore')

        this.updateLeaderboard()
    }

    #setupEvents() {
        return new Promise((resolve, reject) => {
            try {
                // eventos de los controles del menú
                this.$playBtn.addEventListener('click', this.#handlePlayClick.bind(this))
                this.$leaderboardBtn.addEventListener('click', this.#handleLeaderboardClick.bind(this))
                // pantalla de game-over
                this.$gameOver.addEventListener('click', this.#handleGameOverClick.bind(this))
                this.$shadowRetry = this.shadowRoot.querySelector('.btn-retry');
                this.$shadowMenu = this.shadowRoot.querySelector('.btn-menu');
                if (this.$shadowRetry) this.$shadowRetry.addEventListener('click', this.#handleRetryClick.bind(this))
                if (this.$shadowMenu) this.$shadowMenu.addEventListener('click', this.#handleMenuClick.bind(this))

                resolve(this)
            } catch (error) {
                console.error(`Error en el método setupEvents: ${error}`)
                reject(error)
            }
        })
    }
    // manejadores internos
    async #handlePlayClick(e) {
        try {
            const playerName = this.$playerName.value || 'Player';
            const player = await this.db.getItemByName(playerName);
            if (!player) await this.db.addItem({ name: playerName, score: 0, bestScore: 0 })
            await this.handlers.startGame(playerName)
            this.hide()
        } catch (error) {
            console.error(`Error en el método handlePlayClick: ${error}`)
        }
    }

    #handleLeaderboardClick(e) {
        // alternar vista de leaderboard dentro del shadow DOM
        if (!this.$leaderboard) return;
        // alternar clase 'open' para animación suave (CSS controla la transición)
        this.$leaderboard.classList.toggle('open');
    }

    async #handleRetryClick(e) {
        // reiniciar partida
        const playerName = this.$playerName.value || 'Player';
        await this.handlers.startGame(playerName);
        this.hide();
    }

    #handleMenuClick(e) {
        // volver al menú desde Game Over
        this.show();
        this.handlers.stopGame();
    }

    #handleGameOverClick(e) {
        // cerrar overlay si se hace click fuera del contenido
        if (e.target === this.$gameOver) this.$gameOver.classList.add('hidden');
    }

    // API pública para que el main le pase las funciones de control de juego
    setHandlers({ startGame, stopGame } = {}) {
        if (typeof startGame === 'function') this.handlers.startGame = startGame;
        if (typeof stopGame === 'function') this.handlers.stopGame = stopGame;
    }

    // Mostrar/ocultar menú
    show() {
        if (this.$mainMenu) this.$mainMenu.classList.remove('hidden');
        if (this.$gameOver) this.$gameOver.classList.add('hidden');
    }

    hide() {
        if (this.$mainMenu) this.$mainMenu.classList.add('hidden');
        if (this.$gameOver) this.$gameOver.classList.add('hidden');
    }

    toggle() {
        if (!this.$mainMenu) return;
        this.$mainMenu.classList.toggle('hidden');
    }

    addToBody() {
        if (!document.body.contains(this)) document.body.appendChild(this);
    }

    async gameOver() {
        try {
            const player = await this.db.getItemByName(this.$playerName.value || 'Player');
            this.$finalScore.textContent = player.score;
            this.$bestScore.textContent = player.bestScore;
            await this.updateLeaderboard()
            this.$gameOver.classList.remove('hidden')
        } catch (error) {
            console.error(`Error en el método gameOver: ${error}`)
        }
    }

    async updateLeaderboard() {
        try {
            const leaderboard = await this.db.getAllItems()
            this.$leaderboardList.innerHTML = ''

            leaderboard
            .sort((a, b) => b.bestScore - a.bestScore)
            .slice(0, 5)
            .forEach(player => {
                const item = document.createElement('li')
                item.classList.add('leaderboard-item')
                item.innerHTML = `
                    <span class="player-name">${player.name}</span>
                    <span class="score">⭐ ${player.bestScore}</span>
                `
                this.$leaderboardList.appendChild(item)
            })
        } catch (error) {
            console.error(`Error en el método updateLeaderboard: ${error}`)
        }
    }
}

customElements.define('game-menu', Menu)