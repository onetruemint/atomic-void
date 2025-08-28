type StoreObject = Promise<string | number | null | undefined>;

export interface Persistence<T> {
  create(data: T): StoreObject;
  update(data: T): StoreObject;
  upsert(data: T): StoreObject;
  delete(data: T): StoreObject;
  get(id: number | string | null | undefined): Promise<T | null>;
}
