"use client";

import { useEffect } from "react";

export default function SiteHeaderCode({ html }: { html: string }) {
  useEffect(() => {
    if (!html) return;

    const container = document.createElement("div");
    container.innerHTML = html;

    const injected: Element[] = [];

    Array.from(container.childNodes).forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === "SCRIPT") {
        const original = node as HTMLScriptElement;
        const script = document.createElement("script");
        for (const attr of Array.from(original.attributes)) {
          script.setAttribute(attr.name, attr.value);
        }
        if (original.textContent) script.textContent = original.textContent;
        script.setAttribute("data-site-header-code", "");
        document.head.appendChild(script);
        injected.push(script);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const clone = (node as Element).cloneNode(true) as Element;
        clone.setAttribute("data-site-header-code", "");
        document.head.appendChild(clone);
        injected.push(clone);
      }
    });

    return () => {
      injected.forEach((el) => el.parentNode?.removeChild(el));
    };
  }, [html]);

  return null;
}
