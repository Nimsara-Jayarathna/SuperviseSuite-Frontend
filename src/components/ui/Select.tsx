import {
  Children,
  type MouseEvent as ReactMouseEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode };

type OptionItem = {
  value: string;
  label: string;
  disabled: boolean;
};

export function Select(props: SelectProps) {
  const { children, className, disabled, onMouseDown, onKeyDown, ...rest } = props;
  const selectRef = useRef<HTMLSelectElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 0 });

  const options = useMemo<OptionItem[]>(() => {
    return Children.toArray(children)
      .filter((child): child is ReactElement => isValidElement(child) && child.type === 'option')
      .map((child) => {
        const valueProp = child.props.value;
        const labelText =
          typeof child.props.children === 'string' || typeof child.props.children === 'number'
            ? String(child.props.children)
            : String(valueProp ?? '');
        return {
          value: valueProp != null ? String(valueProp) : labelText,
          label: labelText,
          disabled: Boolean(child.props.disabled),
        };
      });
  }, [children]);

  const selectedValue = selectRef.current?.value ?? String(props.value ?? '');

  const openMenu = () => {
    if (disabled || !selectRef.current) return;
    const rect = selectRef.current.getBoundingClientRect();
    setMenuPos({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
    setIsOpen(true);
  };

  const closeMenu = () => setIsOpen(false);

  const handleMouseDown = (event: ReactMouseEvent<HTMLSelectElement>) => {
    onMouseDown?.(event);
    if (event.defaultPrevented) return;
    if (disabled) return;
    event.preventDefault();
    if (isOpen) {
      closeMenu();
      return;
    }
    openMenu();
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLSelectElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (disabled) return;

    if (event.key === 'Escape') {
      closeMenu();
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
    closeMenu();
  };

  useEffect(() => {
    if (!isOpen) return;

    const onDocMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedTrigger = selectRef.current?.contains(target);
      const clickedMenu = menuRef.current?.contains(target);
      if (!clickedTrigger && !clickedMenu) {
        closeMenu();
      }
    };

    const onDocKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu();
    };

    window.addEventListener('resize', closeMenu);
    window.addEventListener('scroll', closeMenu, true);
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onDocKeyDown);

    return () => {
      window.removeEventListener('resize', closeMenu);
      window.removeEventListener('scroll', closeMenu, true);
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onDocKeyDown);
    };
  }, [isOpen]);

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
        createPortal(
          <ul
            ref={menuRef}
            className="overflow-hidden rounded-2xl border border-border bg-white shadow-lg"
            style={{
              position: 'absolute',
              top: menuPos.top,
              left: menuPos.left,
              width: menuPos.width,
              zIndex: 9999,
            }}
            role="listbox"
          >
            {options.map((option) => {
              const isSelected = option.value === selectedValue;
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    disabled={option.disabled}
                    className={`flex w-full items-center justify-between py-2 px-4 text-left text-sm font-medium transition-colors ${
                      option.disabled
                        ? 'cursor-not-allowed text-muted-foreground opacity-50'
                        : 'cursor-pointer text-foreground hover:bg-slate-50'
                    } ${
                      isSelected ? 'bg-slate-50 font-semibold text-foreground' : 'font-medium'
                    }`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      if (!option.disabled) handleOptionSelect(option.value);
                    }}
                  >
                    <span>{option.label}</span>
                    <span className={isSelected ? 'text-amber-600' : 'text-transparent'}>✓</span>
                  </button>
                </li>
              );
            })}
          </ul>,
          document.body,
        )}
    </>
  );
}
