// Clase simple para centralizar la entrada de teclado.
// Mantiene un mapa de teclas y provee isDown(code) para consultas.
export default class Keyboard {
  constructor() {
    this.keys = {};
    // enlazamos los handlers al contexto de la instancia para que `this`
    // dentro de los métodos apunte correctamente a la instancia.
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  _onKeyDown(e) {
    this.keys[e.code] = true;
  }

  _onKeyUp(e) {
    this.keys[e.code] = false;
  }

  // Devuelve true si la tecla está pulsada
  isDown(code) {
    return !!this.keys[code];
  }

  // Quitar listeners cuando se deje de usar la instancia
  dispose() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
  }
}
