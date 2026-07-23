"use client";

const imageTasks = new Map<string, Promise<void>>();

function preloadImage(source: string) {
  const existing = imageTasks.get(source);
  if (existing) return existing;

  const task = new Promise<void>(resolve => {
    const image = new Image();
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      image.onload = null;
      image.onerror = null;
      if (typeof image.decode === "function") {
        void image.decode().catch(() => undefined).finally(resolve);
      } else {
        resolve();
      }
    };

    image.decoding = "async";
    image.fetchPriority = "high";
    image.onload = finish;
    image.onerror = finish;
    image.src = source;
    if (image.complete) finish();
  });

  imageTasks.set(source, task);
  return task;
}

export function preloadImages(sources: readonly string[]) {
  if (typeof Image === "undefined") return Promise.resolve();
  return Promise.all(sources.map(preloadImage)).then(() => undefined);
}
