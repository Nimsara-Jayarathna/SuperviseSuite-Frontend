import type { RefObject } from 'react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { calculateDropdownLayout, type DropdownAlign } from '@/lib/dropdownSizing';

type AnchoredMenuLayout = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  placement: 'up' | 'down';
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
  onRequestClose?: () => void;
};

export function useAnchoredMenu({
  anchorRef,
  labels,
  align = 'auto',
  offset = 6,
  matchTriggerWidth = true,
  getFontSourceEl,
  onRequestClose,
}: UseAnchoredMenuParams) {
  const menuRef = useRef<HTMLUListElement | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const getFontSourceElRef = useRef(getFontSourceEl);
  const onRequestCloseRef = useRef(onRequestClose);
  const measuredMenuHeightRef = useRef<number | null>(null);
  const openAdjustmentCountRef = useRef(0);
  const [isOpen, setIsOpen] = useState(false);
  const [layout, setLayout] = useState<AnchoredMenuLayout | null>(null);

  useEffect(() => {
    getFontSourceElRef.current = getFontSourceEl;
  }, [getFontSourceEl]);

  useEffect(() => {
    onRequestCloseRef.current = onRequestClose;
  }, [onRequestClose]);

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
        menuHeight: measuredMenuHeightRef.current ?? undefined,
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

  useLayoutEffect(() => {
    if (!isOpen) return;
    if (!layout) return;
    const menuEl = menuRef.current;
    if (!menuEl) return;

    const measuredHeight = menuEl.getBoundingClientRect().height;
    if (!Number.isFinite(measuredHeight) || measuredHeight <= 0) return;

    const prevHeight = measuredMenuHeightRef.current;
    if (prevHeight != null && Math.abs(prevHeight - measuredHeight) < 1) return;

    measuredMenuHeightRef.current = measuredHeight;
    if (openAdjustmentCountRef.current >= 2) return;
    openAdjustmentCountRef.current += 1;
    scheduleUpdate();
  }, [isOpen, layout, scheduleUpdate]);

  const open = useCallback(() => {
    openAdjustmentCountRef.current = 0;
    measuredMenuHeightRef.current = null;
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    openAdjustmentCountRef.current = 0;
    measuredMenuHeightRef.current = null;
    setLayout(null);
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
      return;
    }
    open();
  }, [close, isOpen, open]);

  useEffect(() => {
    if (!isOpen) return;

    const onDocMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const anchorEl = anchorRef.current;
      const menuEl = menuRef.current;
      const clickedAnchor = Boolean(anchorEl?.contains(target));
      const clickedMenu = Boolean(menuEl?.contains(target));
      if (!clickedAnchor && !clickedMenu) {
        onRequestCloseRef.current?.();
        close();
      }
    };

    const onDocKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onRequestCloseRef.current?.();
        close();
      }
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
  }, [anchorRef, close, isOpen, scheduleUpdate]);

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
    open,
    close,
    toggle,
    menuRef,
    menuStyle,
    updatePosition: scheduleUpdate,
  };
}
