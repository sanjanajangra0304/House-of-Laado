export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  onClick,
  type = "button",
  ...props
}) {
  const baseStyles = "inline-flex items-center justify-center font-serif font-semibold rounded-pill transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none focus:outline-none";

  const sizeStyles = {
    sm: "px-5 py-2 text-xs",
    md: "px-8 py-3 text-sm",
    lg: "px-10 py-4 text-base"
  };

  const variantStyles = {
    primary: "bg-rose text-ivory-light hover:bg-burgundy hover:text-ivory-light shadow-sm hover:shadow-md focus-visible:outline-2 focus-visible:outline-blush focus-visible:outline-offset-2",
    secondary: "bg-transparent border-[1.5px] border-burgundy text-burgundy hover:bg-burgundy hover:text-ivory-light focus-visible:outline-2 focus-visible:outline-blush focus-visible:outline-offset-2",
    outline: "bg-transparent border-[1.5px] border-burgundy text-burgundy hover:bg-burgundy hover:text-ivory-light focus-visible:outline-2 focus-visible:outline-blush focus-visible:outline-offset-2",
    darkBand: "bg-ivory-light text-burgundy hover:bg-blush hover:text-burgundy focus-visible:outline-2 focus-visible:outline-ivory-light focus-visible:outline-offset-2",
    ghost: "text-burgundy hover:bg-blush-light hover:text-rose focus-visible:outline-2 focus-visible:outline-blush focus-visible:outline-offset-2"
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${
        variantStyles[variant] || variantStyles.primary
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
