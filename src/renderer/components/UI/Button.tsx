// components/UI/Button.tsx
import type { LucideIcon } from 'lucide-react';
import React from 'react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'outline'
  | 'ghost';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  href?: string;
  target?: string;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  iconOnly?: boolean;
  className?: string;
  title?: string;
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'sm',
  children,
  onClick,
  disabled = false,
  type = 'button',
  href,
  target,
  icon: Icon,
  iconPosition = 'left',
  iconOnly = false,
  className = '',
  title,
  loading = false
}) => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium border rounded-sm focus:outline-none focus:ring-1 transition-colors";

  const sizeClasses: Record<ButtonSize, string> = {
    xs: "px-2 py-1 text-xs",
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base"
  };

  const variantClasses: Record<ButtonVariant, string> = {
    primary: "bg-[var(--accent-blue)] text-white border-[var(--accent-blue)] hover:bg-[var(--accent-blue-hover)]",
    secondary: "bg-[var(--card-secondary-bg)] text-[var(--sidebar-text)] border-[var(--border-color)] hover:bg-[var(--card-bg)]",
    success: "bg-green-600 text-white border-green-600 hover:bg-green-700",
    warning: "bg-yellow-500 text-black border-yellow-500 hover:bg-yellow-600",
    danger: "bg-red-600 text-white border-red-600 hover:bg-red-700",
    outline: "bg-transparent text-[var(--sidebar-text)] border-[var(--border-color)] hover:bg-[var(--card-secondary-bg)]",
    ghost: "bg-transparent text-[var(--sidebar-text)] border-transparent hover:bg-[var(--card-secondary-bg)]"
  };

  const classes = [
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    iconOnly && "p-2",
    loading && "opacity-70 cursor-wait",
    className
  ].filter(Boolean).join(" ");

  const content = (
    <>
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
      ) : (
        Icon && iconPosition === "left" && (
          <Icon className="mr-2" size={getIconSize(size)} />
        )
      )}

      {!iconOnly && children}

      {Icon && iconPosition === "right" && !loading && (
        <Icon className="ml-2" size={getIconSize(size)} />
      )}
    </>
  );

  function getIconSize(btnSize: ButtonSize): number {
    const sizeMap = { xs: 12, sm: 14, md: 16, lg: 18 };
    return sizeMap[btnSize];
  }

  if (href) {
    return (
      <a
        href={href}
        target={target}
        className={classes}
        title={title}
        onClick={onClick as any}
        rel={target === "_blank" ? "noopener noreferrer" : undefined}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
    >
      {content}
    </button>
  );
};

export default Button;