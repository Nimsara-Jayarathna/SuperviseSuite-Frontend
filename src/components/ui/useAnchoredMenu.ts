import type { RefObject } from 'react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { calculateDropdownLayout, type DropdownAlign } from '@/lib/dropdownSizing';

type AnchoredMenuLayout = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

type AnchoredMenuStyle = {
  position: 'absolute';
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  zIndex: number;
};

type UseAnchoredMenuParams = {
  anchorRef: RefObject<HTMLElement | null>;
  labels: string[];
  align?: DropdownAlign;
  offset?: number;
  matchTriggerWidth?: boolean;
  getFontSourceEl?: () => Element | null | undefined;
};

export function useAnchoredMenu({
  anchorRef,
  labels,
  align = 'auto',
  offset = 6,
  matchTriggerWidth = true,
  getFontSourceEl,
}: UseAnchoredMenuParams) {
  const menuRef = useRef<HTMLUListElement | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const getFontSourceElRef = useRef(getFontSourceEl);
  const [isOpen, setIsOpen] = useState(false);
  const [layout, setLayout] = useState<AnchoredMenuLayout | null>(null);

  useEffect(() => {
    getFontSourceElRef.current = getFontSourceEl;
  }, [getFontSourceEl]);

  const updatePosition = useCallback(() => {
    const anchorEl = anchorRef.current;
    if (!anchorEl) return;
    const triggerRect = anchorEl.getBoundingClientRect();
    const fontSourceElResolved = getFontSourceElRef.current?.() ?? anchorEl;
    setLayout(
      calculateDropdownLayout({
        triggerRect,
        labels,
        fontSourceEl: fontSourceElResolved,
        align,
        offset,
        matchTriggerWidth,
      }),
    );
  }, [align, anchorRef, labels, matchTriggerWidth, offset]);

  const scheduleUpdate = useCallback(() => {
    if (rafIdRef.current != null) return;
    rafIdRef.current = window.requestAnimationFrame(() => {
      rafIdRef.current = null;
      updatePosition();
    });
  }, [updatePosition]);

  useEffect(() => {
    return () => {
      if (rafIdRef.current != null) {
        window.cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;
    updatePosition();
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;

    const onDocMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const anchorEl = anchorRef.current;
      const menuEl = menuRef.current;
      const clickedAnchor = Boolean(anchorEl?.contains(target));
      const clickedMenu = Boolean(menuEl?.contains(target));
      if (!clickedAnchor && !clickedMenu) {
        setIsOpen(false);
      }
    };

    const onDocKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    const onResize = () => scheduleUpdate();
    const onAnyScroll = (event: Event) => {
      const target = event.target as Node | null;
      if (target && menuRef.current?.contains(target)) return;
      scheduleUpdate();
    };

    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onDocKeyDown);
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onAnyScroll, true);

    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onDocKeyDown);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onAnyScroll, true);
    };
  }, [anchorRef, isOpen, scheduleUpdate]);

  const menuStyle = useMemo<AnchoredMenuStyle | null>(() => {
    if (!layout) return null;
    return {
      position: 'absolute',
      top: layout.top,
      left: layout.left,
      width: layout.width,
      maxHeight: layout.maxHeight,
      zIndex: 9999,
    };
  }, [layout]);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((current) => !current),
    menuRef,
    menuStyle,
    updatePosition: scheduleUpdate,
  };
}
