export type PrimitiveType = string | number | null | undefined;
export interface RecursiveType {
  [key: string]: PrimitiveType | RecursiveType | RecursiveType[];
}
export type RecursiveOrArray = RecursiveType | RecursiveType[];

export class NestedListBuilder {
  #dataMap: WeakMap<HTMLElement, RecursiveOrArray>;

  constructor() {
    this.#dataMap = new WeakMap();
  }

  get dataMap(): WeakMap<HTMLElement, RecursiveOrArray> {
    return this.#dataMap;
  }

  getData(element: HTMLElement): RecursiveOrArray | undefined {
    return this.#dataMap.get(element);
  }

  build(nodeData: RecursiveOrArray): HTMLElement {
    const ul = document.createElement("ul");

    if (Array.isArray(nodeData)) {
      nodeData.forEach((item, index) => {
        const name = item.name ? item.name : index;
        this.#createListItem(ul, `${name}`, item);
      });
    } else {
      for (const [key, item] of Object.entries(nodeData)) {
        this.#createListItem(ul, key, item);
      }
    }

    return ul;
  }

  #createListItem(
    ul: HTMLElement,
    key: string,
    item: RecursiveOrArray | PrimitiveType,
  ): void {
    const li = document.createElement("li");
    const keySpan = document.createElement("span");

    keySpan.textContent = key;
    li.setAttribute("data-key", key);
    li.appendChild(keySpan);

    if (item !== null && typeof item === "object") {
      this.#dataMap.set(keySpan, item);
      li.appendChild(this.build(item));
      li.setAttribute("data-class", "parent");
    } else {
      const valueSpan = document.createElement("span");
      valueSpan.textContent = `${item}`;
      li.appendChild(valueSpan);
    }

    ul.appendChild(li);
  }

  filterObject(obj: RecursiveType, keys: string[]): RecursiveType {
    const result: RecursiveType = {};

    for (const [key, value] of Object.entries(obj)) {
      if (keys.includes(key)) {
        if (Array.isArray(value)) {
          result[key] = this.filterArray(value, keys);
        } else if (value !== null && typeof value === "object") {
          result[key] = this.filterObject(value, keys);
        } else {
          result[key] = value;
        }
      }
    }

    return result;
  }

  filterArray(arr: RecursiveType[], keys: string[]): RecursiveType[] {
    const result: RecursiveType[] = [];

    for (const value of arr) {
      const data = this.filterObject(value, keys);

      if (data) {
        result.push(data);
      }
    }

    return result;
  }
}
