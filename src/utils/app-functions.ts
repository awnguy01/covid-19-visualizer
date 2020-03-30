export class AppFns {
  static get isMobile() {
    return window.innerWidth <= 800 && window.innerHeight <= 600;
  }
}
