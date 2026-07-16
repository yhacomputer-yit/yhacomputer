import { useEffect } from "react";

export const SITE_NAME = "YHA Computer";
export const SITE_URL = "https://www.yha-edu.tech";

function upsertMeta(keyAttr, keyValue, attr, value) {
  if (!value) return;
  let el = document.head.querySelector(`meta[${keyAttr}="${keyValue}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(keyAttr, keyValue);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

function upsertLink(rel, attr, value) {
  if (!value) return;
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

function absolute(pathOrUrl) {
  if (!pathOrUrl) return SITE_URL;
  return pathOrUrl.startsWith("http") ? pathOrUrl : `${SITE_URL}${pathOrUrl}`;
}

export function useSeo({
  title,
  description,
  image,
  url,
  type = "website",
} = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    document.title = fullTitle;

    if (description) {
      upsertMeta("name", "description", "content", description);
    }
    upsertMeta("property", "og:title", "content", fullTitle);
    if (description) {
      upsertMeta("property", "og:description", "content", description);
    }
    upsertMeta("property", "og:type", "content", type);
    if (image) {
      upsertMeta("property", "og:image", "content", absolute(image));
    }
    const pageUrl = absolute(url);
    upsertMeta("property", "og:url", "content", pageUrl);
    upsertLink("canonical", "href", pageUrl);
  }, [title, description, image, url, type]);
}
