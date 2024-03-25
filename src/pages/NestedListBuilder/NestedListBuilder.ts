type KeyType = string | number | symbol;

export class NestedListBuilder {
  #dataMap: WeakMap<HTMLElement, unknown>;
  #targetKeys: string[] = [];

  constructor(targetKeys: string[] = []) {
    this.#dataMap = new WeakMap();
    this.#targetKeys = targetKeys;
  }

  get dataMap(): WeakMap<HTMLElement, unknown> {
    return this.#dataMap;
  }

  getData(element: HTMLElement): unknown | undefined {
    return this.#dataMap.get(element);
  }

  build(nodeData: unknown): HTMLUListElement {
    const ul = document.createElement("ul");
    const df = document.createDocumentFragment();

    if (Array.isArray(nodeData)) {
      nodeData.forEach((item, index) => {
        const name = item.name ? item.name : index;
        df.appendChild(this.#createListItem(String(name), item));
      });
    } else if (nodeData !== null && typeof nodeData === "object") {
      const nodeDataObj = nodeData as Record<string, unknown>;

      if (this.#targetKeys.length > 0) {
        for (const key of this.#targetKeys) {
          if (key in nodeDataObj) {
            df.appendChild(this.#createListItem(key, nodeDataObj[key]));
          }
        }
      } else {
        for (const key in nodeDataObj) {
          df.appendChild(this.#createListItem(key, nodeDataObj[key]));
        }
      }
    }

    ul.appendChild(df);

    return ul;
  }

  #createListItem(key: string, item: unknown): HTMLLIElement {
    const li = document.createElement("li");
    const keySpan = document.createElement("span");

    keySpan.textContent = key;
    li.setAttribute("data-key", key);
    li.appendChild(keySpan);

    if (item !== null && typeof item === "object") {
      this.#dataMap.set(keySpan, item);
      li.setAttribute("data-key", "parent");
      li.appendChild(this.build(item));
    } else {
      const valueSpan = document.createElement("span");
      valueSpan.textContent = String(item);
      li.appendChild(valueSpan);
    }

    return li;
  }

  filterObject(obj: Record<KeyType, unknown>, keys: KeyType[]): unknown {
    const result: Record<KeyType, unknown> = {};

    for (const key in obj) {
      const value = obj[key];

      if (keys.includes(key)) {
        if (Array.isArray(value)) {
          result[key] = this.filterArray(value as [], keys);
        } else if (value !== null && typeof value === "object") {
          result[key] = this.filterObject(
            value as Record<string, unknown>,
            keys,
          );
        } else {
          result[key] = value;
        }
      }
    }

    return result;
  }

  filterArray(arr: [], keys: KeyType[]): unknown[] {
    const result = [];

    for (const value of arr) {
      const data = this.filterObject(value, keys);

      if (data) {
        result.push(data);
      }
    }

    return result;
  }
}
