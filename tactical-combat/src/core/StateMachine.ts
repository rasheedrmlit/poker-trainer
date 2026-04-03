export interface State {
  enter?(context: unknown): void;
  update?(dt: number): void;
  exit?(): void;
}

export class StateMachine {
  private states = new Map<string, State>();
  private _current: string | null = null;

  get current(): string | null {
    return this._current;
  }

  add(name: string, state: State): void {
    this.states.set(name, state);
  }

  transition(name: string, context?: unknown): void {
    if (this._current) {
      this.states.get(this._current)?.exit?.();
    }
    this._current = name;
    this.states.get(name)?.enter?.(context);
  }

  update(dt: number): void {
    if (this._current) {
      this.states.get(this._current)?.update?.(dt);
    }
  }
}
