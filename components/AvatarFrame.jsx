"use client";

export default function AvatarFrame({
  src,
  name = "User",
  frame = null,
  size = "md",
  className = "",
  background = null,
}) {
  const sizes = {
    sm: { shell: "frame-shell-sm", avatar: "frame-avatar-sm" },
    md: { shell: "frame-shell-md", avatar: "frame-avatar-md" },
    lg: { shell: "frame-shell-lg", avatar: "frame-avatar-lg" },
  };
  const s = sizes[size] || sizes.md;
  const initial = (name || "U").charAt(0).toUpperCase();
  const style = {
    ...(frame?.gradient ? { "--frame-gradient": frame.gradient } : {}),
    ...(background ? { "--frame-bg": background } : {}),
  };

  return (
    <div
      className={`avatar-frame ${s.shell} frame-${frame?.rarity || "none"} ${className}`}
      style={style}
      aria-label={`${name} avatar`}
    >
      <span className="frame-corner frame-corner-tl" />
      <span className="frame-corner frame-corner-tr" />
      <span className="frame-corner frame-corner-bl" />
      <span className="frame-corner frame-corner-br" />
      <span className="frame-diamond frame-diamond-top" />
      <span className="frame-diamond frame-diamond-bottom" />
      <div className={`frame-avatar ${s.avatar}`}>
        {src ? (
          <img src={src} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span>{initial}</span>
        )}
      </div>
    </div>
  );
}
