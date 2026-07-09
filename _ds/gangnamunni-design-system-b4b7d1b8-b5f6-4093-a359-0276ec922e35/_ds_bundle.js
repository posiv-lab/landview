/* @ds-bundle: {"format":4,"namespace":"GangnamunniDesignSystem_b4b7d1","components":[{"name":"Badge","sourcePath":"components/data/Badge.jsx"},{"name":"Card","sourcePath":"components/data/Card.jsx"},{"name":"CardTitle","sourcePath":"components/data/Card.jsx"},{"name":"CardMeta","sourcePath":"components/data/Card.jsx"},{"name":"CardPrice","sourcePath":"components/data/Card.jsx"},{"name":"Table","sourcePath":"components/data/Table.jsx"},{"name":"Dialog","sourcePath":"components/feedback/Dialog.jsx"},{"name":"Button","sourcePath":"components/forms/Button.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"}],"sourceHashes":{"components/data/Badge.jsx":"d8e8abbb8871","components/data/Card.jsx":"a968176859cd","components/data/Table.jsx":"7d4f321a5d44","components/feedback/Dialog.jsx":"7eaf0a1ca80a","components/forms/Button.jsx":"9c86ddd6e7b1","components/forms/Input.jsx":"196cca3804ac","components/navigation/Tabs.jsx":"348878c0ccc9","ui_kits/consumer-web/App.jsx":"1ee13a43a8dc","ui_kits/consumer-web/BookingConfirm.jsx":"1f9db9003f68","ui_kits/consumer-web/Header.jsx":"66d924f8cde6","ui_kits/consumer-web/Home.jsx":"da2c55fe58f5","ui_kits/consumer-web/HospitalDetail.jsx":"a20cc07616cb","ui_kits/consumer-web/data.js":"6c7451934169"},"inlinedExternals":[],"unexposedExports":[{"name":"categories","sourcePath":"ui_kits/consumer-web/data.js"},{"name":"columnArticles","sourcePath":"ui_kits/consumer-web/data.js"},{"name":"hospitals","sourcePath":"ui_kits/consumer-web/data.js"},{"name":"reviews","sourcePath":"ui_kits/consumer-web/data.js"}]} */

(() => {

const __ds_ns = (window.GangnamunniDesignSystem_b4b7d1 = window.GangnamunniDesignSystem_b4b7d1 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/data/Badge.jsx
try { (() => {
const VARIANTS = {
  brand: {
    background: "var(--brand-accent-raw)",
    color: "var(--text-inverse)",
    radius: "var(--radius-100)"
  },
  success: {
    background: "var(--success-tint)",
    color: "var(--success-strong)",
    radius: "var(--radius-full)"
  },
  info: {
    background: "var(--info-tint)",
    color: "var(--info-strong)",
    radius: "var(--radius-100)"
  },
  neutral: {
    background: "var(--surface-canvas)",
    color: "var(--text-heading)",
    radius: "var(--radius-full)",
    border: "1px solid var(--border-default)"
  }
};
function Badge({
  children,
  variant = "brand",
  selected = false,
  style
}) {
  const v = VARIANTS[variant] || VARIANTS.brand;
  const selectedStyle = variant === "neutral" && selected ? {
    background: "var(--brand-tint-50)",
    color: "var(--brand)",
    border: "1px solid var(--brand-subtle-border)"
  } : {};
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      fontFamily: "var(--font-sans)",
      fontWeight: variant === "neutral" ? "var(--weight-medium)" : "var(--weight-bold)",
      fontSize: variant === "brand" ? "var(--size-200)" : variant === "info" ? "var(--size-100)" : "var(--size-200)",
      padding: variant === "neutral" ? "6px 12px" : "2px 8px",
      borderRadius: v.radius,
      background: v.background,
      color: v.color,
      border: v.border || "none",
      ...selectedStyle,
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Badge.jsx", error: String((e && e.message) || e) }); }

// components/data/Card.jsx
try { (() => {
const VARIANTS = {
  clinic: {
    background: "var(--surface-canvas)",
    border: "1px solid var(--border-default)"
  },
  promo: {
    background: "var(--brand-tint-50)",
    border: "1px solid var(--brand-tint-100)"
  },
  article: {
    background: "transparent",
    border: "none",
    padding: 0
  }
};
function Card({
  children,
  variant = "clinic",
  style,
  onClick
}) {
  const v = VARIANTS[variant] || VARIANTS.clinic;
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    style: {
      borderRadius: "var(--radius-300)",
      padding: variant === "article" ? 0 : "var(--space-base)",
      boxShadow: "none",
      cursor: onClick ? "pointer" : "default",
      fontFamily: "var(--font-sans)",
      transition: "background 150ms cubic-bezier(0.4,0,0.2,1)",
      ...v,
      ...style
    }
  }, children);
}
function CardTitle({
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 6px",
      fontSize: "var(--size-500)",
      fontWeight: "var(--weight-bold)",
      color: "var(--text-heading)",
      ...style
    }
  }, children);
}
function CardMeta({
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 8px",
      fontSize: "var(--size-300)",
      color: "var(--text-caption)",
      ...style
    }
  }, children);
}
function CardPrice({
  price,
  listPrice,
  style
}) {
  return /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: "var(--size-400)",
      fontWeight: "var(--weight-bold)",
      color: "var(--text-heading)",
      ...style
    }
  }, listPrice && /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: "var(--weight-regular)",
      color: "var(--text-placeholder)",
      textDecoration: "line-through",
      marginRight: 6
    }
  }, listPrice), price);
}
Object.assign(__ds_scope, { Card, CardTitle, CardMeta, CardPrice });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Card.jsx", error: String((e && e.message) || e) }); }

// components/data/Table.jsx
try { (() => {
function Table({
  columns,
  rows,
  style
}) {
  return /*#__PURE__*/React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse",
      fontFamily: "var(--font-sans)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, columns.map(col => /*#__PURE__*/React.createElement("th", {
    key: col.key,
    style: {
      textAlign: col.align || "left",
      fontSize: "var(--size-300)",
      fontWeight: "var(--weight-medium)",
      color: "var(--text-caption)",
      padding: "10px 12px",
      borderBottom: "1px solid var(--border-default)"
    }
  }, col.label)))), /*#__PURE__*/React.createElement("tbody", null, rows.map((row, i) => /*#__PURE__*/React.createElement("tr", {
    key: i,
    style: {
      background: "transparent"
    }
  }, columns.map(col => /*#__PURE__*/React.createElement("td", {
    key: col.key,
    style: {
      textAlign: col.align || "left",
      fontSize: "var(--size-400)",
      fontWeight: col.numeric ? "var(--weight-bold)" : "var(--weight-regular)",
      color: "var(--text-heading)",
      padding: "12px",
      borderBottom: "1px solid var(--border-weak)"
    }
  }, row[col.key]))))));
}
Object.assign(__ds_scope, { Table });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Table.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Dialog.jsx
try { (() => {
function Dialog({
  open,
  onClose,
  title,
  children,
  footer
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: "absolute",
      inset: 0,
      background: "var(--shadow-modal-backdrop)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      background: "var(--surface-canvas)",
      borderRadius: "var(--radius-500)",
      boxShadow: "var(--shadow-modal)",
      padding: "var(--space-xl)",
      width: 360,
      maxWidth: "90%",
      fontFamily: "var(--font-sans)"
    }
  }, title && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 12px",
      fontSize: "var(--size-700)",
      fontWeight: "var(--weight-bold)",
      color: "var(--text-heading)"
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--size-400)",
      color: "var(--text-body)",
      lineHeight: 1.5
    }
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "var(--space-lg)",
      display: "flex",
      gap: 8,
      justifyContent: "flex-end"
    }
  }, footer)));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/forms/Button.jsx
try { (() => {
const VARIANTS = {
  primary: {
    background: "var(--brand)",
    color: "var(--text-inverse)",
    border: "none"
  },
  accent: {
    background: "var(--brand-accent-raw)",
    color: "var(--text-inverse)",
    border: "1px solid var(--brand-accent-raw)"
  },
  outline: {
    background: "var(--surface-canvas)",
    color: "var(--text-heading)",
    border: "1px solid var(--border-default)"
  },
  subtle: {
    background: "var(--brand-tint-50)",
    color: "var(--brand)",
    border: "1px solid var(--brand-tint-100)"
  },
  ghost: {
    background: "transparent",
    color: "var(--text-body)",
    border: "none"
  },
  danger: {
    background: "var(--danger-fg)",
    color: "var(--text-inverse)",
    border: "none"
  }
};
const SIZES = {
  sm: {
    padding: "8px 14px",
    fontSize: "var(--size-400)",
    fontWeight: "var(--weight-semibold)"
  },
  md: {
    padding: "10px 16px",
    fontSize: "var(--size-400)",
    fontWeight: "var(--weight-medium)"
  },
  lg: {
    padding: "12px 20px",
    fontSize: "var(--size-500)",
    fontWeight: "var(--weight-semibold)"
  }
};
function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  iconOnly = false,
  style,
  onClick,
  type = "button"
}) {
  const v = VARIANTS[variant] || VARIANTS.primary;
  const s = SIZES[size] || SIZES.md;
  const disabledStyle = disabled ? variant === "primary" || variant === "accent" ? {
    background: "var(--brand-disabled)",
    border: "none",
    color: "var(--text-inverse)"
  } : {
    color: "var(--text-placeholder)",
    border: v.border !== "none" ? "1px solid var(--border-weak)" : "none"
  } : {};
  const baseStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    fontFamily: "var(--font-sans)",
    borderRadius: iconOnly ? "var(--radius-full)" : "var(--radius-400)",
    cursor: disabled ? "not-allowed" : "pointer",
    boxShadow: "none",
    transition: "background 150ms cubic-bezier(0.4,0,0.2,1), border-color 150ms cubic-bezier(0.4,0,0.2,1)",
    ...v,
    ...s,
    ...(iconOnly ? {
      width: 40,
      height: 40,
      padding: 0
    } : {}),
    ...disabledStyle,
    ...style
  };
  return /*#__PURE__*/React.createElement("button", {
    type: type,
    onClick: disabled ? undefined : onClick,
    disabled: disabled,
    style: baseStyle
  }, children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Button.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function Input({
  label,
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  pill = false,
  style,
  type = "text"
}) {
  const [focused, setFocused] = React.useState(false);
  const borderColor = error ? "var(--danger-fg)" : focused ? "var(--brand)" : "var(--border-default)";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
      fontFamily: "var(--font-sans)",
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: "var(--size-300)",
      fontWeight: "var(--weight-medium)",
      color: "var(--text-body)"
    }
  }, label), /*#__PURE__*/React.createElement("input", {
    type: type,
    placeholder: placeholder,
    value: value,
    disabled: disabled,
    onChange: onChange,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    style: {
      height: 48,
      boxSizing: "border-box",
      padding: pill ? "12px 20px" : "12px 16px",
      fontSize: "var(--size-500)",
      fontFamily: "var(--font-sans)",
      color: disabled ? "var(--text-placeholder)" : "var(--text-heading)",
      background: disabled ? "var(--surface-faint)" : "var(--surface-canvas)",
      border: `1px solid ${disabled ? "var(--border-weak)" : borderColor}`,
      borderRadius: pill ? "var(--radius-full)" : "var(--radius-300)",
      outline: "none",
      boxShadow: focused && !error ? "0 0 0 2px var(--brand-tint-100)" : focused && error ? "0 0 0 2px var(--danger-tint)" : "none",
      transition: "border-color 150ms cubic-bezier(0.4,0,0.2,1), box-shadow 150ms cubic-bezier(0.4,0,0.2,1)"
    }
  }), error && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--size-300)",
      color: "var(--danger-fg)"
    }
  }, error));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
function Tabs({
  items,
  value,
  onChange,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 4,
      fontFamily: "var(--font-sans)",
      ...style
    }
  }, items.map(item => {
    const active = item.key === value;
    return /*#__PURE__*/React.createElement("button", {
      key: item.key,
      onClick: () => onChange && onChange(item.key),
      style: {
        border: "none",
        background: "transparent",
        cursor: "pointer",
        padding: "8px 12px",
        fontSize: "var(--size-400)",
        fontWeight: active ? "var(--weight-bold)" : "var(--weight-regular)",
        color: active ? "var(--text-heading)" : "var(--text-caption)",
        borderRadius: "var(--radius-400)",
        transition: "color 150ms cubic-bezier(0.4,0,0.2,1), background 150ms cubic-bezier(0.4,0,0.2,1)",
        position: "relative"
      }
    }, item.label, active && /*#__PURE__*/React.createElement("span", {
      style: {
        position: "absolute",
        left: 12,
        right: 12,
        bottom: 2,
        height: 2,
        borderRadius: "var(--radius-full)",
        background: "var(--brand)"
      }
    }));
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// ui_kits/consumer-web/App.jsx
try { (() => {
function App() {
  const [screen, setScreen] = React.useState("home");
  const [hospital, setHospital] = React.useState(null);
  if (screen === "home") {
    return /*#__PURE__*/React.createElement(window.Home, {
      onOpenHospital: h => {
        setHospital(h);
        setScreen("detail");
      }
    });
  }
  if (screen === "detail") {
    return /*#__PURE__*/React.createElement(window.HospitalDetail, {
      hospital: hospital,
      onBack: () => setScreen("home"),
      onBook: () => setScreen("confirm")
    });
  }
  return /*#__PURE__*/React.createElement(window.BookingConfirm, {
    hospital: hospital,
    onDone: () => setScreen("home")
  });
}
window.App = App;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/consumer-web/App.jsx", error: String((e && e.message) || e) }); }

// ui_kits/consumer-web/BookingConfirm.jsx
try { (() => {
function BookingConfirm({
  hospital,
  onDone
}) {
  const {
    Button
  } = window.GangnamunniDesignSystem_b4b7d1;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-canvas)",
      minHeight: 480,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 40,
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 56,
      height: 56,
      borderRadius: "var(--radius-full)",
      background: "var(--success-tint)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "28",
    height: "28",
    viewBox: "0 0 24 24",
    fill: "none"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M5 13l4 4L19 7",
    stroke: "var(--success-strong)",
    strokeWidth: "2.5",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }))), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: "var(--size-700)",
      fontWeight: "var(--weight-bold)",
      color: "var(--text-heading)",
      margin: "0 0 24px"
    }
  }, "\uC608\uC57D\uC774 \uC644\uB8CC\uB410\uC5B4\uC694"), /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      maxWidth: 320,
      border: "1px solid var(--border-default)",
      borderRadius: "var(--radius-300)",
      padding: 16,
      textAlign: "left",
      marginBottom: 28
    }
  }, /*#__PURE__*/React.createElement(Row, {
    label: "\uBCD1\uC6D0",
    value: hospital.name
  }), /*#__PURE__*/React.createElement(Row, {
    label: "\uB0A0\uC9DC",
    value: "2026.07.14 (\uD654) 14:00"
  }), /*#__PURE__*/React.createElement(Row, {
    label: "\uC0C1\uB2F4 \uBE44\uC6A9",
    value: hospital.price,
    strong: true
  })), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    onClick: onDone,
    style: {
      width: "100%",
      maxWidth: 320
    }
  }, "\uC608\uC57D \uB0B4\uC5ED \uBCF4\uAE30"));
}
function Row({
  label,
  value,
  strong
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      padding: "6px 0"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--size-300)",
      color: "var(--text-caption)"
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--size-400)",
      fontWeight: strong ? "var(--weight-bold)" : "var(--weight-regular)",
      color: "var(--text-heading)"
    }
  }, value));
}
window.BookingConfirm = BookingConfirm;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/consumer-web/BookingConfirm.jsx", error: String((e && e.message) || e) }); }

// ui_kits/consumer-web/Header.jsx
try { (() => {
function Header({
  onLogoClick
}) {
  const {
    Button
  } = window.GangnamunniDesignSystem_b4b7d1;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 48,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 20px",
      borderBottom: "1px solid var(--cell-footer-bg)",
      background: "var(--surface-canvas)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: onLogoClick,
    style: {
      fontSize: "var(--size-600)",
      fontWeight: "var(--weight-bold)",
      color: "var(--brand)",
      cursor: "pointer",
      letterSpacing: 0
    }
  }, "\uAC15\uB0A8\uC5B8\uB2C8"), /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    size: "sm"
  }, "\uB85C\uADF8\uC778/\uAC00\uC785"));
}
window.Header = Header;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/consumer-web/Header.jsx", error: String((e && e.message) || e) }); }

// ui_kits/consumer-web/Home.jsx
try { (() => {
function Home({
  onOpenHospital
}) {
  const {
    Button,
    Input,
    Badge,
    Card,
    CardTitle,
    CardMeta,
    CardPrice
  } = window.GangnamunniDesignSystem_b4b7d1;
  const [selectedCategory, setSelectedCategory] = React.useState(null);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-canvas)"
    }
  }, /*#__PURE__*/React.createElement(Header, {
    onLogoClick: () => {}
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "24px 20px 20px",
      background: "var(--surface-canvas)"
    }
  }, /*#__PURE__*/React.createElement(Input, {
    pill: true,
    placeholder: "\uBCD1\uC6D0, \uC2DC\uC220, \uC758\uC0AC \uAC80\uC0C9",
    style: {
      maxWidth: 480
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "0 20px 24px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 16
    }
  }, window.GNData.categories.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.key,
    onClick: () => setSelectedCategory(c.key),
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 8,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 56,
      height: 56,
      borderRadius: "var(--radius-full)",
      background: selectedCategory === c.key ? "var(--brand-tint-100)" : "var(--surface-subtle)",
      border: selectedCategory === c.key ? "1px solid var(--brand-subtle-border)" : "1px solid transparent"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--size-300)",
      color: "var(--text-heading)"
    }
  }, c.label))))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "0 20px 16px",
      display: "flex",
      gap: 8,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    variant: "neutral",
    selected: true
  }, "\uC804\uCCB4"), /*#__PURE__*/React.createElement(Badge, {
    variant: "neutral"
  }, "\uC778\uC99D \uBCD1\uC6D0"), /*#__PURE__*/React.createElement(Badge, {
    variant: "neutral"
  }, "\uAC00\uACA9 \uB0AE\uC740\uC21C"), /*#__PURE__*/React.createElement(Badge, {
    variant: "neutral"
  }, "\uAC70\uB9AC\uC21C")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "0 20px 32px"
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: "var(--size-900)",
      fontWeight: "var(--weight-bold)",
      color: "var(--text-heading)",
      margin: "0 0 16px"
    }
  }, "\uB0B4 \uC8FC\uBCC0 \uC778\uAE30 \uBCD1\uC6D0"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: 16
    }
  }, window.GNData.hospitals.map(h => /*#__PURE__*/React.createElement(Card, {
    key: h.id,
    variant: "clinic",
    onClick: () => onOpenHospital(h)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 120,
      borderRadius: "var(--radius-300)",
      background: "var(--surface-subtle)",
      marginBottom: 12
    }
  }), h.certified && /*#__PURE__*/React.createElement(Badge, {
    variant: "success",
    style: {
      marginBottom: 8
    }
  }, "\uC778\uC99D \uBCD1\uC6D0"), /*#__PURE__*/React.createElement(CardTitle, null, h.name), /*#__PURE__*/React.createElement(CardMeta, null, h.meta), /*#__PURE__*/React.createElement(CardPrice, {
    price: h.price,
    listPrice: h.listPrice
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "0 20px 40px"
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: "var(--size-900)",
      fontWeight: "var(--weight-bold)",
      color: "var(--text-heading)",
      margin: "0 0 16px"
    }
  }, "\uCE7C\uB7FC"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: 16
    }
  }, window.GNData.columnArticles.map(a => /*#__PURE__*/React.createElement("div", {
    key: a.id
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 140,
      borderRadius: "var(--radius-300)",
      background: "var(--surface-subtle)",
      marginBottom: 8
    }
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: "var(--size-500)",
      color: "var(--text-heading)",
      margin: 0,
      lineHeight: 1.4
    }
  }, a.title))))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-footer)",
      borderTop: "4px solid var(--border-footer)",
      padding: 30
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: "var(--size-400)",
      color: "var(--text-body)",
      margin: "0 0 8px"
    }
  }, "\uD68C\uC0AC\uC18C\uAC1C \xB7 PR \xB7 \uBCD1\uC6D0\uC785\uC810\uC2E0\uCCAD \xB7 \uC774\uC6A9\uC57D\uAD00 \xB7 \uC778\uC7AC\uC601\uC785 \xB7 \uC704\uCE58\uAE30\uBC18\uC11C\uBE44\uC2A4 \uC774\uC6A9\uC57D\uAD00 \xB7 \uAC1C\uC778\uC815\uBCF4\uCC98\uB9AC\uBC29\uCE68"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: "var(--size-300)",
      color: "var(--text-caption)",
      margin: 0
    }
  }, "(\uC8FC)\uD790\uB9C1\uD398\uC774\uD37C \xB7 \uC758\uB8CC\uAD11\uACE0 \uC0AC\uC804\uC2EC\uC758\uD544 \xB7 \uBCF8 \uC11C\uBE44\uC2A4\uC5D0 \uB4F1\uB85D\uB41C \uD6C4\uAE30\uB294 \uC2E4\uC81C \uC774\uC6A9\uC790 \uD6C4\uAE30\uC785\uB2C8\uB2E4.")));
}
window.Home = Home;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/consumer-web/Home.jsx", error: String((e && e.message) || e) }); }

// ui_kits/consumer-web/HospitalDetail.jsx
try { (() => {
function HospitalDetail({
  hospital,
  onBack,
  onBook
}) {
  const {
    Button,
    Badge,
    Tabs,
    Table
  } = window.GangnamunniDesignSystem_b4b7d1;
  const [tab, setTab] = React.useState("info");
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-canvas)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 48,
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "0 20px",
      borderBottom: "1px solid var(--cell-footer-bg)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    onClick: onBack,
    style: {
      cursor: "pointer",
      fontSize: "var(--size-500)",
      color: "var(--text-heading)"
    }
  }, "\u2190"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--size-500)",
      fontWeight: "var(--weight-medium)",
      color: "var(--text-heading)"
    }
  }, "\uBCD1\uC6D0 \uC815\uBCF4")), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 220,
      background: "var(--surface-subtle)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "20px"
    }
  }, hospital.certified && /*#__PURE__*/React.createElement(Badge, {
    variant: "success",
    style: {
      marginBottom: 10
    }
  }, "\uC778\uC99D \uBCD1\uC6D0"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: "var(--size-900)",
      fontWeight: "var(--weight-bold)",
      color: "var(--text-heading)",
      margin: "0 0 6px"
    }
  }, hospital.name), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: "var(--size-400)",
      color: "var(--text-caption)",
      margin: "0 0 4px"
    }
  }, hospital.meta), /*#__PURE__*/React.createElement(Badge, {
    variant: "info",
    style: {
      marginTop: 6
    }
  }, "\uC758\uB8CC\uAD11\uACE0 \uC0AC\uC804\uC2EC\uC758\uD544"), /*#__PURE__*/React.createElement("div", {
    style: {
      margin: "20px 0"
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    items: [{
      key: "info",
      label: "병원 정보"
    }, {
      key: "price",
      label: "가격"
    }, {
      key: "reviews",
      label: `후기 ${window.GNData.reviews.length}`
    }],
    value: tab,
    onChange: setTab
  })), tab === "info" && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: "var(--size-400)",
      color: "var(--text-body)",
      lineHeight: 1.6
    }
  }, "15\uB144 \uACBD\uB825\uC758 \uC804\uBB38\uC758\uAC00 \uC9C1\uC811 \uC0C1\uB2F4\uD558\uBA70, \uC218\uC220 \uC804\uD6C4 \uC0AC\uC9C4\uC744 \uD22C\uBA85\uD558\uAC8C \uACF5\uAC1C\uD569\uB2C8\uB2E4. \uC0C1\uB2F4 \uC2E0\uCCAD \uC2DC 2\uC601\uC5C5\uC77C \uC774\uB0B4 \uB2F5\uBCC0\uB4DC\uB9BD\uB2C8\uB2E4."), tab === "price" && /*#__PURE__*/React.createElement(Table, {
    columns: [{
      key: "name",
      label: "시술명"
    }, {
      key: "price",
      label: "가격",
      align: "right",
      numeric: true
    }],
    rows: [{
      name: "코재수술 (전체)",
      price: "3,500,000원"
    }, {
      name: "코끝 성형",
      price: "1,800,000원"
    }, {
      name: "상담",
      price: "무료"
    }]
  }), tab === "reviews" && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 16
    }
  }, window.GNData.reviews.map(r => /*#__PURE__*/React.createElement("div", {
    key: r.id,
    style: {
      borderBottom: "1px solid var(--border-weak)",
      paddingBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--size-400)",
      fontWeight: "var(--weight-medium)",
      color: "var(--text-heading)"
    }
  }, r.author), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--size-300)",
      color: "var(--text-caption)"
    }
  }, r.date)), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: "var(--size-400)",
      color: "var(--text-body)",
      margin: 0,
      lineHeight: 1.5
    }
  }, r.body))))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "sticky",
      bottom: 0,
      padding: "12px 20px",
      background: "var(--surface-canvas)",
      borderTop: "1px solid var(--border-default)",
      display: "flex",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "subtle",
    style: {
      flex: 1
    }
  }, "\uAD00\uC2EC \uBCD1\uC6D0\uC5D0 \uCD94\uAC00"), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    style: {
      flex: 2
    },
    onClick: onBook
  }, "\uBCD1\uC6D0 \uC608\uC57D\uD558\uAE30")));
}
window.HospitalDetail = HospitalDetail;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/consumer-web/HospitalDetail.jsx", error: String((e && e.message) || e) }); }

// ui_kits/consumer-web/data.js
try { (() => {
const categories = [{
  key: "botox",
  label: "보톡스"
}, {
  key: "filler",
  label: "필러"
}, {
  key: "lifting",
  label: "리프팅"
}, {
  key: "liposuction",
  label: "지방성형"
}, {
  key: "rhinoplasty",
  label: "코성형"
}, {
  key: "hairloss",
  label: "모발이식"
}, {
  key: "skin",
  label: "피부시술"
}, {
  key: "eye",
  label: "눈성형"
}];
const hospitals = [{
  id: 1,
  name: "강남 라인성형외과 — 코재수술 전문",
  meta: "강남구 · 0.4km · 후기 7,300건",
  price: "350,000원",
  listPrice: "450,000원",
  certified: true
}, {
  id: 2,
  name: "서초 미소치과의원 부설 피부과",
  meta: "서초구 · 1.1km · 후기 2,180건",
  price: "180,000원",
  listPrice: null,
  certified: true
}, {
  id: 3,
  name: "압구정 클레어 클리닉",
  meta: "강남구 · 0.9km · 후기 5,940건",
  price: "620,000원",
  listPrice: "780,000원",
  certified: false
}, {
  id: 4,
  name: "신사 더힐 성형외과",
  meta: "강남구 · 1.4km · 후기 3,402건",
  price: "290,000원",
  listPrice: null,
  certified: true
}];
const reviews = [{
  id: 1,
  author: "지수***",
  rating: 5,
  body: "상담부터 시술까지 설명이 자세해서 안심하고 진행했어요. 부기도 예상보다 빨리 빠졌습니다.",
  date: "2026.06.02"
}, {
  id: 2,
  author: "민***",
  rating: 4,
  body: "가격이 명확하게 안내돼서 좋았어요. 대기 시간이 조금 길었던 점만 아쉬웠습니다.",
  date: "2026.05.21"
}, {
  id: 3,
  author: "하***",
  rating: 5,
  body: "인증 병원이라 믿고 방문했는데 후기 그대로였어요.",
  date: "2026.05.09"
}];
const columnArticles = [{
  id: 1,
  title: "종아리 보톡스 맞으면 발목 두꺼워져? 효과·부작용·용량·주기"
}, {
  id: 2,
  title: "보톡스 입문자 가이드, 효과·비용·부작용부터 국산vs수입 차이까지"
}, {
  id: 3,
  title: "탈모 정도별 추천 시술 — 초기·중기·말기 비교"
}];
Object.assign(__ds_scope, { categories, hospitals, reviews, columnArticles });
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/consumer-web/data.js", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.CardTitle = __ds_scope.CardTitle;

__ds_ns.CardMeta = __ds_scope.CardMeta;

__ds_ns.CardPrice = __ds_scope.CardPrice;

__ds_ns.Table = __ds_scope.Table;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Tabs = __ds_scope.Tabs;

})();
