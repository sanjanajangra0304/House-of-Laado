export function Badge({ children, variant = "default", className = "" }) {
  const variants = {
    new: "bg-olive text-ivory-light",
    sale: "bg-rose text-ivory-light",
    preorder: "bg-olive text-ivory-light",
    soldout: "bg-burgundy text-ivory-light",
    default: "bg-blush-light text-burgundy font-medium border border-blush/60",
    outline: "border border-blush text-burgundy"
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-badge text-[11px] font-bold tracking-wide uppercase ${
        variants[variant] || variants.default
      } ${className}`}
    >
      {children}
    </span>
  );
}
