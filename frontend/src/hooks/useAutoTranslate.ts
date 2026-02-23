import { RefObject, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { translateBatch } from '@/lib/translationService';

const EXCLUDED_TAGS = new Set(['SCRIPT', 'STYLE', 'CODE', 'PRE', 'SVG', 'TEXTAREA', 'INPUT', 'SELECT']);

const shouldTranslateText = (text: string) => {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (trimmed.length < 2) return false;
  if (/^[A-D]$/.test(trimmed)) return false;
  if (/^[0-9\s₹$%+\-.,:()/ ]+$/.test(trimmed)) return false;
  if (trimmed.includes('@')) return false;
  return true;
};

const shouldTranslateAttribute = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.length < 2) return false;
  if (/^[0-9\s₹$%+\-.,:()/]+$/.test(trimmed)) return false;
  if (trimmed.includes('@')) return false;
  return true;
};

export function useAutoTranslate(containerRef: RefObject<HTMLElement>) {
  const { language } = useLanguage();
  const originalTextMap = useRef(new Map<Node, string>());
  const translatedLangMap = useRef(new Map<Node, string>());
  const trackedNodes = useRef(new Set<Node>());
  const originalAttrMap = useRef(new Map<Element, Record<string, string>>());
  const translatedAttrLangMap = useRef(new Map<Element, string>());
  const trackedElements = useRef(new Set<Element>());
  const isTranslating = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const restoreOriginals = () => {
      trackedNodes.current.forEach((node) => {
        const original = originalTextMap.current.get(node);
        if (original !== undefined) {
          node.textContent = original;
        }
      });
      trackedElements.current.forEach((element) => {
        const originalAttrs = originalAttrMap.current.get(element);
        if (originalAttrs) {
          Object.entries(originalAttrs).forEach(([key, value]) => {
            element.setAttribute(key, value);
          });
        }
      });
      translatedLangMap.current.clear();
      translatedAttrLangMap.current.clear();
    };

    if (language === 'en') {
      restoreOriginals();
      return;
    }

    const translateDom = async () => {
      if (isTranslating.current) return;
      isTranslating.current = true;

      const textNodes: Node[] = [];
      const textValues: string[] = [];
      const attributeEntries: Array<{ element: Element; key: string; value: string }> = [];
      const attributeValues: string[] = [];

      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          if (parent.closest('[data-no-translate="true"]')) return NodeFilter.FILTER_REJECT;
          if (EXCLUDED_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
          const text = node.textContent || '';
          if (!shouldTranslateText(text)) return NodeFilter.FILTER_REJECT;
          if (translatedLangMap.current.get(node) === language) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });

      while (walker.nextNode()) {
        const node = walker.currentNode;
        const currentText = node.textContent || '';
        if (!originalTextMap.current.has(node)) {
          originalTextMap.current.set(node, currentText);
          trackedNodes.current.add(node);
        }
        textNodes.push(node);
        const original = originalTextMap.current.get(node) || currentText;
        textValues.push(original);
      }

      const elements = Array.from(container.querySelectorAll<HTMLElement>('[placeholder],[title],[aria-label]'));
      elements.forEach((element) => {
        if (element.closest('[data-no-translate="true"]')) return;
        if (['SCRIPT', 'STYLE', 'SVG'].includes(element.tagName)) return;
        const attrs = ['placeholder', 'title', 'aria-label'] as const;
        attrs.forEach((attr) => {
          const value = element.getAttribute(attr);
          if (!value || !shouldTranslateAttribute(value)) return;
          if (translatedAttrLangMap.current.get(element) === language) return;
          if (!originalAttrMap.current.has(element)) {
            originalAttrMap.current.set(element, {
              placeholder: element.getAttribute('placeholder') || '',
              title: element.getAttribute('title') || '',
              'aria-label': element.getAttribute('aria-label') || '',
            });
            trackedElements.current.add(element);
          }
          const originalAttrs = originalAttrMap.current.get(element);
          const originalValue = originalAttrs?.[attr] || value;
          attributeEntries.push({ element, key: attr, value: originalValue });
          attributeValues.push(originalValue);
        });
      });

      const uniqueTexts = Array.from(new Set([...textValues, ...attributeValues]));
      if (uniqueTexts.length === 0) {
        isTranslating.current = false;
        return;
      }

      const translations = await translateBatch(uniqueTexts, language);
      const translationMap = new Map<string, string>();
      uniqueTexts.forEach((text, index) => {
        translationMap.set(text, translations[index] || text);
      });

      textNodes.forEach((node, index) => {
        const original = textValues[index];
        const translated = translationMap.get(original) || original;
        node.textContent = translated;
        translatedLangMap.current.set(node, language);
      });

      attributeEntries.forEach((entry) => {
        const translated = translationMap.get(entry.value) || entry.value;
        entry.element.setAttribute(entry.key, translated);
        translatedAttrLangMap.current.set(entry.element, language);
      });

      isTranslating.current = false;
    };

    translateDom();
    const observer = new MutationObserver(() => {
      if (!isTranslating.current) {
        translateDom();
      }
    });
    observer.observe(container, { childList: true, subtree: true, characterData: true });

    return () => observer.disconnect();
  }, [language, containerRef]);
}
