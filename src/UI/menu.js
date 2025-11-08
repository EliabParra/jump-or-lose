class Menu extends HTMLElement {
    constructor(handlers) {
        super()
        this.handlers = handlers
        this.attachShadow({ mode: 'open' })
        this.stylesFileName = 'menu.css'
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
                    <input type="text" id="playerName" placeholder="Granjero" maxlength="15">
                </div>

                <div class="buttons">
                    <button class="btn btn-play">▶ Jugar</button>
                    <button class="btn btn-leaderboard">🏆 Tabla de Líderes</button>
                </div>

                <div class="leaderboard hidden" id="leaderboard">
                    <h2>🏆 TOP 5 GRANJEROS 🏆</h2>
                    <ul class="leaderboard-list">
                        <li class="leaderboard-item">
                            <span class="player-name">1. Lewis</span>
                            <span class="score">⭐ 9850</span>
                        </li>
                    </ul>
                </div>
            </div>

            <!-- Pantalla de Game Over -->
            <div class="game-over" id="gameOver">
                <div class="game-over-content">
                    <h1 class="game-over-title">GAME OVER</h1>
                    
                    <div class="final-score">
                        <p>Tu puntuación final:</p>
                        <div class="score-number" id="finalScore">0</div>
                    </div>

                    <div class="game-over-buttons">
                        <button class="btn btn-retry">🔄 Intentar de nuevo</button>
                        <button class="btn btn-menu">🏠 Menú Principal</button>
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
        this.$gameOver = this.shadowRoot.querySelector('#gameOver')

        this.$finalScore = this.shadowRoot.querySelector('.final-score .score-number')
    }

    #setupEvents() {
        return new Promise((resolve, reject) => {
            try {
                // eventos de los controles del menú
                this.$playerName.addEventListener('input', this.#handlePlayerNameInput.bind(this))
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
        const name = this.$playerName.value || 'Player';
        // delegar la acción al handler externo
        await this.handlers.startGame({ playerName: name });
        this.hide();
    }

    #handleLeaderboardClick(e) {
        // alternar vista de leaderboard dentro del shadow DOM
        if (!this.$leaderboard) return;
        this.$leaderboard.classList.toggle('hidden');
    }

    async #handleRetryClick(e) {
        // reiniciar partida
        const name = this.$playerName.value || 'Player';
        await this.handlers.startGame({ playerName: name, retry: true });
        this.hide();
    }

    #handleMenuClick(e) {
        // volver al menú desde Game Over
        this.show();
        this.handlers.stopGame();
    }

    #handlePlayerNameInput(e) {
        // aquí podríamos guardar localStorage u otras reacciones
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
    }

    toggle() {
        if (!this.$mainMenu) return;
        this.$mainMenu.classList.toggle('hidden');
    }

    addToBody() {
        if (!document.body.contains(this)) document.body.appendChild(this);
    }
}

customElements.define('game-menu', Menu);
export default Menu;