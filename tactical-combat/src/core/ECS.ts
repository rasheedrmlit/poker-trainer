let nextEntityId = 0;

export interface Component {
  type: string;
}

export class Entity {
  readonly id: number;
  private components = new Map<string, Component>();
  tag: string = '';

  constructor() {
    this.id = nextEntityId++;
  }

  add<T extends Component>(component: T): this {
    this.components.set(component.type, component);
    return this;
  }

  get<T extends Component>(type: string): T | undefined {
    return this.components.get(type) as T | undefined;
  }

  has(type: string): boolean {
    return this.components.has(type);
  }

  remove(type: string): void {
    this.components.delete(type);
  }
}

export class World {
  private entities = new Map<number, Entity>();

  create(): Entity {
    const e = new Entity();
    this.entities.set(e.id, e);
    return e;
  }

  destroy(id: number): void {
    this.entities.delete(id);
  }

  get(id: number): Entity | undefined {
    return this.entities.get(id);
  }

  query(...componentTypes: string[]): Entity[] {
    const result: Entity[] = [];
    for (const entity of this.entities.values()) {
      if (componentTypes.every(t => entity.has(t))) {
        result.push(entity);
      }
    }
    return result;
  }

  all(): Entity[] {
    return Array.from(this.entities.values());
  }

  clear(): void {
    this.entities.clear();
  }
}
