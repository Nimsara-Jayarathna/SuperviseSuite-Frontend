import {
  Children,
  type MouseEvent as ReactMouseEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
  type RefObject,
  isValidElement,
  useMemo,
  useRef,
} from 'react';
import { createPortal } from 'react-dom';
import type { DropdownAlign } from '@/lib/dropdownSizing';
import { DropdownSurface } from '@/components/ui/DropdownSurface';
import { useAnchoredMenu } from '@/components/ui/useAnchoredMenu';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  children: ReactNode;
  menuAlign?: DropdownAlign;
  menuOffset?: number;
  menuMatchTriggerWidth?: boolean;
  menuAnchorRef?: RefObject<HTMLElement | null>;
};

type OptionItem = {
  value: string;
  label: string;
  disabled: boolean;
};

function extractNodeText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(extractNodeText).join('');
  }
  if (isValidElement(node)) {
    return extractNodeText(node.props.children);
  }
  return '';
}

export function Select(props: SelectProps) {
  const {
    children,
    className,
    disabled,
    onMouseDown,
    onKeyDown,
    menuAlign,
    menuOffset,
    menuMatchTriggerWidth,
    menuAnchorRef,
    ...rest
  } = props;
  const selectRef = useRef<HTMLSelectElement>(null);
  const anchorRef = (menuAnchorRef ?? (selectRef as unknown as RefObject<HTMLElement | null>)) as
    | RefObject<HTMLElement | null>
    | undefined;

  const options = useMemo<OptionItem[]>(() => {
    return Children.toArray(children)
      .filter((child): child is ReactElement => isValidElement(child) && child.type === 'option')
      .map((child) => {
        const valueProp = child.props.value;
        const extractedLabel = extractNodeText(child.props.children).trim();
        const labelText = extractedLabel.length > 0 ? extractedLabel : String(valueProp ?? '');
        return {
          value: valueProp != null ? String(valueProp) : labelText,
          label: labelText,
          disabled: Boolean(child.props.disabled),
        };
      });
  }, [children]);

  const selectedValue = selectRef.current?.value ?? String(props.value ?? '');
  const labels = useMemo(() => options.map((option) => option.label), [options]);

  const { isOpen, open, close, menuRef, menuStyle } = useAnchoredMenu({
    anchorRef: anchorRef ?? (selectRef as unknown as RefObject<HTMLElement | null>),
    labels,
    align: menuAlign ?? 'auto',
    offset: menuOffset ?? 6,
    matchTriggerWidth: menuMatchTriggerWidth ?? true,
    getFontSourceEl: () => selectRef.current,
  });

  const openMenu = () => {
    if (disabled) return;
    open();
  };

  const handleMouseDown = (event: ReactMouseEvent<HTMLSelectElement>) => {
    onMouseDown?.(event);
    if (event.defaultPrevented) return;
    if (disabled) return;
    event.preventDefault();
    if (isOpen) {
      close();
      return;
    }
    openMenu();
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLSelectElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (disabled) return;

    if (event.key === 'Escape') {
      close();
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openMenu();
    }
  };

  const handleOptionSelect = (nextValue: string) => {
    const el = selectRef.current;
    if (!el) return;

    el.value = nextValue;
    const changeEvent = new Event('change', { bubbles: true });
    el.dispatchEvent(changeEvent);
    close();
  };

  return (
    <>
      <select
        {...rest}
        ref={selectRef}
        disabled={disabled}
        className={className}
        onMouseDown={handleMouseDown}
        onKeyDown={handleKeyDown}
      >
        {children}
      </select>
      {isOpen &&
        menuStyle &&
        createPortal(
          <DropdownSurface ref={menuRef} style={menuStyle} role="listbox">
            {options.map((option) => {
              const isSelected = option.value === selectedValue;
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    disabled={option.disabled}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                      option.disabled
                        ? 'cursor-not-allowed text-muted-foreground opacity-50'
                        : 'cursor-pointer text-foreground hover:bg-slate-50'
                    } ${isSelected ? 'bg-slate-50 font-semibold text-foreground' : 'font-medium'}`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      if (!option.disabled) handleOptionSelect(option.value);
                    }}
                  >
                    <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap pr-3">
                      {option.label}
                    </span>
                    <span className="shrink-0">
                      <span className={isSelected ? 'text-amber-600' : 'text-transparent'}>✓</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </DropdownSurface>,
          document.body,
        )}
    </>
  );
}
